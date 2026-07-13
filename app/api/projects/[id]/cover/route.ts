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

  const prompt = `An elegant, premium minimalist editorial 2D vector graphic conceptually and dramatically abstracting the theme: ${project.name}.
The composition features a sophisticated, dramatic conceptual metaphor interpreting the project title. The style relies on sweeping vector lines, bold geometric color blocking, and a powerful asymmetric balance of shapes set against a vast background, reminiscent of a high-end conceptual magazine illustration. Depending on the theme, this interpretation might utilize solitary human silhouettes to convey scale or emotion, or it might translate technical concepts into clean, monolithic geometric structures and sharp frameworks.
Color Palette: The palette is masterfully anchored by Deep Forest Shadow—a heavy dark charcoal-green bordering on off-black. It transitions fluidly into Muted Willow Olive—a dry, mid-tone olive. Accent elements utilize Pale Khaki Mist—a altamente diluted translucent grey-green. The layout is structured against a completely flat, expansive 2D background of gallery taupe and soft stone-tinted chalky matte tones, with clean line work in Slate Charcoal Grey and Cool Pebble Grey.
Strictly Forbidden: text, typography, words, letters, labels, numbers, gibberish, logos, watermarks, UI components, data boxes, charts, grids, wireframes, graphs, mockup windows, flowers, messy botanical elements.
Strictly Forbidden: heavy 3D rendering, claymation, plastic or clay textures, glowing neon lights, dark sci-fi space backgrounds, heavy camera blur, depth of field, out-of-focus elements, realistic photo objects, photorealism.`

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
