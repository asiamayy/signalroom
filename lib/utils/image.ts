// Client-side image downscale/compress before it goes into a request body.
//
// Vercel serverless functions have a hard ~4.5MB request body limit that
// isn't configurable — and a modern phone photo, once base64-encoded (+33%
// overhead), can approach or exceed that on its own. Every image-upload
// surface in the app (interview chat, Compare, Audience Panel, Concept Test)
// was sending the raw file straight through, which worked for small images
// but failed silently at the platform level for large ones — the request
// never even reaches our route handler, so no server-side try/catch can
// catch it; it just shows up as a generic "Something went wrong."
//
// This resizes to a reasonable max dimension and re-encodes as JPEG, backing
// off quality if needed, so a single image lands well under 1MB — safe even
// when Concept Test attaches up to 4 of them in one request.

export interface CompressedImage {
  base64: string // no "data:" prefix
  dataUrl: string // for <img> preview
  mediaType: string
}

const MAX_DIMENSION = 1400
const TARGET_BYTES = 700_000 // ~700KB per image keeps a 4-image request well under the 4.5MB platform cap
const QUALITY_STEPS = [0.82, 0.65, 0.5, 0.35]

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image file')) }
    img.src = url
  })
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL('image/jpeg', quality)
}

// Downscales any image to fit within MAX_DIMENSION and re-encodes as JPEG,
// stepping quality down until it's under TARGET_BYTES (or the last step).
export async function compressImageFile(file: File): Promise<CompressedImage> {
  const img = await loadImage(file)

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image')
  ctx.drawImage(img, 0, 0, width, height)

  let dataUrl = canvasToDataUrl(canvas, QUALITY_STEPS[0])
  for (let i = 1; i < QUALITY_STEPS.length && dataUrl.length * 0.75 > TARGET_BYTES; i++) {
    dataUrl = canvasToDataUrl(canvas, QUALITY_STEPS[i])
  }

  return {
    dataUrl,
    base64: dataUrl.split(',')[1],
    mediaType: 'image/jpeg',
  }
}
