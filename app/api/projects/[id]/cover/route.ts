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

The composition features a sophisticated, asymmetric balance of clean geometric structures, sweeping vector lines, and smooth, understated gradients set against a vast background. Reminiscent of a high-end print magazine or a contemporary gallery exhibition poster.

Color Palette: Masterfully dominated by a rich, deep estate forest green, set against an elegant, clean background of warm editorial cream and text-weight raw linen, with delicate accents of muted silver-sage green and crisp charcoal black. The design utilizes your precise brand tones with high-end editorial contrast.

Strictly Forbidden: text, typography, words, letters, labels, numbers, logos, watermarks, UI components, charts, grids, wireframes, graphs, mockup windows.
Strictly Forbidden: humans, faces, hands, animals, literal photographic objects, photorealism, busy patterns, crowded layouts.`

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
