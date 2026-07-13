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

  const prompt = `An elegant, minimalist 2D corporate tech illustration conceptually abstracting the theme: ${project.name}.

The design is clean, flat, and professional, perfectly suited for a high-end SaaS application card. The composition relies on clean negative space and flat vector elements, varying naturally based on the project theme. The execution is strictly 2D with clean lines, avoiding heavy 3D rendering, realistic textures, or thick organic shading.

Color Palette: The dominant background is a clean, light gallery taupe or soft off-white to maintain a bright, premium aesthetic. Accent shapes, flat vectors, and fine lines utilize a sophisticated corporate mix of Muted Willow Olive, Deep Forest Shadow, and Slate Charcoal Grey.

Strictly Forbidden: claymation, heavy 3D rendering, plastic or clay textures, glowing neon lights, dark sci-fi space backgrounds, heavy camera blur, depth of field, out-of-focus elements, text, typography, UI windows.`

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
