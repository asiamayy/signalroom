import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const prompt = `An elegant, premium minimalist corporate 2D vector graphic conceptually abstracting the theme: ${project.name}.
The composition features a sophisticated, completely flat 2D layout composed of large, smooth overlapping curved shapes and clean, minimalist geometric color blocks. The design uses an abundance of clean, empty negative space to maintain a premium digital layout. The execution is strictly a flat 2D graphic, entirely devoid of perspective, depth, texture, horizons, sky, land, or environmental elements.
Color Palette: The palette is masterfully anchored by a heavy dark charcoal-green color bordering on off-black. It transitions cleanly into a dry, muted earthy mid-tone olive green color. Accent elements are rendered in a highly diluted, translucent pale mint-grey tint. The entire layout is structured against a completely flat, monochromatic, expansive 2D background of cool minimalist light grey and muted grey-white tones, with clean line work in dark charcoal grey for crisp contrast.
Strictly Forbidden: text, typography, words, letters, labels, numbers, gibberish, logos, watermarks, UI components, mockups, data boxes, charts, grids, wireframes, graphs, mockup windows, circuit lines, data lines, HUD elements.
Strictly Forbidden: mountains, hills, terrain, horizons, scenery, nature, water, rivers, forests, trees, landscapes, moss, stone texture, DNA strands, waves, plants, leaves, animals, humans.
Strictly Forbidden: 3D rendering, claymation, paper-cut style, shadows, realistic textures, physical objects, depth of field, blur, out-of-focus elements, sci-fi glowing effects.`

  async function callFal() {
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_4_3',
        num_inference_steps: 28,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Fal error (${response.status}): ${err}`)
    }

    const result = await response.json()
    const imageUrl = result?.images?.[0]?.url
    if (!imageUrl) throw new Error('No image returned from Fal')
    return imageUrl as string
  }

  try {
    // A single transient failure (timeout, momentary fal.ai error) used to
    // permanently leave a project with no cover — retry once before giving up.
    let imageUrl: string
    try {
      imageUrl = await callFal()
    } catch (firstError) {
      console.error('Cover generation failed, retrying once:', firstError)
      imageUrl = await callFal()
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ cover_image_url: imageUrl })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (e: any) {
    console.error('Cover generation error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to generate cover' }, { status: 500 })
  }
}
