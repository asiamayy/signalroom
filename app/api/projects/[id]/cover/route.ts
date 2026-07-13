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

  const prompt = `An elegant, premium minimalist editorial 2D vector graphic conceptually abstracting the theme: ${project.name}.
The composition features a sophisticated, asymmetric balance of completely flat geometric structures, sweeping 2D vector lines, and subtle flat color blocking set against a vast background. Reminiscent of a high-end flat vector print magazine layout or a contemporary digital gallery poster.
Color Palette: The palette is masterfully anchored by a heavy dark charcoal-green color bordering on off-black. It transitions into a dry, muted earthy mid-tone green color. Accent elements are rendered in a highly diluted, translucent warm grey-tinted cream color. The entire layout is structured against a completely flat, expansive 2D background of muted gallery taupe and soft stone-tinted chalky matte tones, with sharp line work in Slate Charcoal Grey and Cool Pebble Grey for crisp editorial contrast.
Strictly Forbidden: text, typography, words, letters, labels, numbers, logos, watermarks, UI components, charts, grids, wireframes, graphs, mockup windows.
Strictly Forbidden: humans, human silhouettes, faces, hands, animals, plants, leaves, trees, grass, flowers, stems, petals, botanical elements, feathers, branches, foliage, furniture, vases, literal photographic objects, photorealism, busy patterns, crowded layouts.
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
