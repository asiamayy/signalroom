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

  const prompt = `An elegant, premium minimalist editorial graphic conceptually abstracting the theme: ${project.name}.
The composition features a sophisticated, asymmetric balance of clean geometric structures, sweeping vector lines, and smooth, understated gradients set against a vast background. Reminiscent of a high-end print magazine layout or a contemporary gallery exhibition poster.
Color Palette & Texture: The palette is masterfully anchored by Deep Forest Shadow—a heavy botanical green with strong charcoal undertones bordering on off-black. It transitions fluidly into Muted Willow Olive—a dry, earthy mid-tone olive reminiscent of dried sage leaves and weathered river stones. Accent elements are rendered in Pale Khaki Mist—a highly diluted, translucent grey-green tint resembling warm alabaster. The entire layout is structured against a clean, expansive background of muted gallery taupe and soft stone-tinted chalky plaster, with sharp line work in Slate Charcoal Grey and Cool Pebble Grey for crisp editorial contrast.
Strictly Forbidden: text, typography, words, letters, labels, numbers, logos, watermarks, UI components, charts, grids, wireframes, graphs, mockup windows.
Strictly Forbidden: humans, faces, hands, animals, literal photographic objects, photorealism, busy patterns, crowded layouts.
Strictly Forbidden: claymation, heavy 3D rendering, plastic or clay textures, glowing neon lights, dark sci-fi space backgrounds, heavy camera blur, depth of field, out-of-focus elements.`

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
