// Client-side visual saliency — where attention objectively lands on an
// image, computed from real pixels, never from an LLM's guess about a
// screenshot. Runs in the browser (Canvas API), same as compressImageFile in
// lib/utils/image.ts, so this needs no new server-side image-decoding
// dependency (no sharp/OpenCV) and no vendor account.
//
// Algorithm: Spectral Residual (Hou & Zhang, 2007) — a well-known, simple
// saliency method. Take the image's log-amplitude spectrum, subtract a
// locally-smoothed version of itself (the "residual" is what doesn't match
// the image's own average spectral shape — i.e. what stands out), then
// invert back to the spatial domain. No training data, no model weights,
// fully deterministic.
//
// The working resolution (64x64) keeps a naive O(n^2) DFT fast enough to run
// synchronously in the browser (a few million multiply-adds, well under a
// frame budget) — no need for a real FFT library.

const GRID_SIZE = 64

interface Complex2D {
  re: Float64Array
  im: Float64Array
}

function makeDftTables(n: number): { cos: Float64Array; sin: Float64Array } {
  const cos = new Float64Array(n * n)
  const sin = new Float64Array(n * n)
  for (let k = 0; k < n; k++) {
    for (let x = 0; x < n; x++) {
      const angle = (-2 * Math.PI * k * x) / n
      cos[k * n + x] = Math.cos(angle)
      sin[k * n + x] = Math.sin(angle)
    }
  }
  return { cos, sin }
}

// 1D DFT applied to every row of an n x n complex grid (in place into out).
function dftRows(reIn: Float64Array, imIn: Float64Array, n: number, cos: Float64Array, sin: Float64Array, inverse: boolean, reOut: Float64Array, imOut: Float64Array) {
  const sign = inverse ? -1 : 1
  for (let row = 0; row < n; row++) {
    const base = row * n
    for (let k = 0; k < n; k++) {
      let sumRe = 0
      let sumIm = 0
      for (let x = 0; x < n; x++) {
        const c = cos[k * n + x]
        const s = sign * sin[k * n + x]
        const re = reIn[base + x]
        const im = imIn[base + x]
        sumRe += re * c - im * s
        sumIm += re * s + im * c
      }
      reOut[base + k] = sumRe
      imOut[base + k] = sumIm
    }
  }
}

// Full 2D DFT via two passes of the 1D transform (rows, then columns) — valid
// because the DFT is separable. `inverse` also divides by n*n at the end.
function dft2d(reIn: Float64Array, imIn: Float64Array, n: number, inverse: boolean): Complex2D {
  const { cos, sin } = makeDftTables(n)

  const reRows = new Float64Array(n * n)
  const imRows = new Float64Array(n * n)
  dftRows(reIn, imIn, n, cos, sin, inverse, reRows, imRows)

  // Transpose, apply 1D DFT again (now operating on columns), transpose back.
  const reT = new Float64Array(n * n)
  const imT = new Float64Array(n * n)
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      reT[col * n + row] = reRows[row * n + col]
      imT[col * n + row] = imRows[row * n + col]
    }
  }

  const reColsT = new Float64Array(n * n)
  const imColsT = new Float64Array(n * n)
  dftRows(reT, imT, n, cos, sin, inverse, reColsT, imColsT)

  const reOut = new Float64Array(n * n)
  const imOut = new Float64Array(n * n)
  const scale = inverse ? 1 / (n * n) : 1
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      reOut[row * n + col] = reColsT[col * n + row] * scale
      imOut[row * n + col] = imColsT[col * n + row] * scale
    }
  }

  return { re: reOut, im: imOut }
}

// Repeated box blur approximates a Gaussian blur without needing a real
// Gaussian kernel — three passes is the standard cheap approximation.
function boxBlur(grid: Float64Array, n: number, radius: number): Float64Array {
  let src = grid
  for (let pass = 0; pass < 3; pass++) {
    const out = new Float64Array(n * n)
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        let sum = 0
        let count = 0
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const r = row + dr
            const c = col + dc
            if (r < 0 || r >= n || c < 0 || c >= n) continue
            sum += src[r * n + c]
            count++
          }
        }
        out[row * n + col] = sum / count
      }
    }
    src = out
  }
  return src
}

function normalize01(grid: Float64Array): Float32Array {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] < min) min = grid[i]
    if (grid[i] > max) max = grid[i]
  }
  const range = max - min || 1
  const out = new Float32Array(grid.length)
  for (let i = 0; i < grid.length; i++) out[i] = (grid[i] - min) / range
  return out
}

// "Jet"-style colormap: blue (low) -> cyan -> green -> yellow -> red (high).
function saliencyToColor(v: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, v))
  if (t < 0.25) return [0, Math.round(255 * (t / 0.25)), 255]
  if (t < 0.5) return [0, 255, Math.round(255 * (1 - (t - 0.25) / 0.25))]
  if (t < 0.75) return [Math.round(255 * ((t - 0.5) / 0.25)), 255, 0]
  return [255, Math.round(255 * (1 - (t - 0.75) / 0.25)), 0]
}

export interface SaliencyResult {
  grid: Float32Array // GRID_SIZE * GRID_SIZE, row-major, normalized 0-1
  size: number
  heatmapDataUrl: string // small colorized RGBA PNG — stretch via CSS for display
}

// Computes the saliency map for an already-loaded <img> element (e.g. the
// same preview image used elsewhere after compressImageFile). Synchronous —
// no network, no worker needed at this resolution.
export function computeSaliency(imgEl: HTMLImageElement): SaliencyResult {
  const n = GRID_SIZE

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = n
  srcCanvas.height = n
  const srcCtx = srcCanvas.getContext('2d')
  if (!srcCtx) throw new Error('Could not process image')
  srcCtx.drawImage(imgEl, 0, 0, n, n)
  const { data } = srcCtx.getImageData(0, 0, n, n)

  const gray = new Float64Array(n * n)
  for (let i = 0; i < n * n; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }

  const zeros = new Float64Array(n * n)
  const forward = dft2d(gray, zeros, n, false)

  const logAmplitude = new Float64Array(n * n)
  const phase = new Float64Array(n * n)
  for (let i = 0; i < n * n; i++) {
    const magnitude = Math.sqrt(forward.re[i] * forward.re[i] + forward.im[i] * forward.im[i])
    logAmplitude[i] = Math.log(magnitude + 1e-8)
    phase[i] = Math.atan2(forward.im[i], forward.re[i])
  }

  const smoothed = boxBlur(logAmplitude, n, 1)
  const residual = new Float64Array(n * n)
  for (let i = 0; i < n * n; i++) residual[i] = logAmplitude[i] - smoothed[i]

  const newRe = new Float64Array(n * n)
  const newIm = new Float64Array(n * n)
  for (let i = 0; i < n * n; i++) {
    const mag = Math.exp(residual[i])
    newRe[i] = mag * Math.cos(phase[i])
    newIm[i] = mag * Math.sin(phase[i])
  }

  const inverse = dft2d(newRe, newIm, n, true)
  const rawSaliency = new Float64Array(n * n)
  for (let i = 0; i < n * n; i++) {
    rawSaliency[i] = inverse.re[i] * inverse.re[i] + inverse.im[i] * inverse.im[i]
  }

  const smoothedSaliency = boxBlur(rawSaliency, n, 2)
  const grid = normalize01(smoothedSaliency)

  const heatCanvas = document.createElement('canvas')
  heatCanvas.width = n
  heatCanvas.height = n
  const heatCtx = heatCanvas.getContext('2d')
  if (!heatCtx) throw new Error('Could not render heatmap')
  const heatImageData = heatCtx.createImageData(n, n)
  for (let i = 0; i < n * n; i++) {
    const [r, g, b] = saliencyToColor(grid[i])
    heatImageData.data[i * 4] = r
    heatImageData.data[i * 4 + 1] = g
    heatImageData.data[i * 4 + 2] = b
    heatImageData.data[i * 4 + 3] = Math.round(140 * grid[i]) // more salient = more opaque
  }
  heatCtx.putImageData(heatImageData, 0, 0)

  return { grid, size: n, heatmapDataUrl: heatCanvas.toDataURL('image/png') }
}

export interface ZoneBox {
  label: string
  x0: number
  y0: number
  x1: number
  y1: number
}

// Sums the saliency mass falling inside each zone's normalized bounding box
// and expresses it as a share of the total — this is the only place the CV
// data and Claude's zone identification actually combine.
export function zoneAttentionPercentages(saliency: SaliencyResult, zones: ZoneBox[]): { label: string; pct: number }[] {
  const { grid, size } = saliency
  let total = 0
  for (let i = 0; i < grid.length; i++) total += grid[i]
  if (total <= 0) return zones.map(z => ({ label: z.label, pct: 0 }))

  return zones.map(zone => {
    let sum = 0
    for (let row = 0; row < size; row++) {
      const cy = (row + 0.5) / size
      if (cy < zone.y0 || cy > zone.y1) continue
      for (let col = 0; col < size; col++) {
        const cx = (col + 0.5) / size
        if (cx < zone.x0 || cx > zone.x1) continue
        sum += grid[row * size + col]
      }
    }
    return { label: zone.label, pct: Math.round((sum / total) * 100) }
  })
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = dataUrl
  })
}
