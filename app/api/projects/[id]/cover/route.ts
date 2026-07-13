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

  // The prior "technical diagram" framing was deliberately sparse (a
  // couple of thin lines and one shape on empty white) to dodge earlier
  // failure modes (masthead text from "cover art" framing, generic people
  // from "illustration" framing). That sparseness reads as broken/empty at
  // card thumbnail size. This version keeps the same two hard bans (no
  // text, no people) but asks for a genuinely fuller, richer composition,
  // and describes the brand palette in plain color language instead of
  // hex — hex codes aren't something these models parse reliably and
  // previously caused the output to degenerate into flat color blocks.
  const prompt = `Abstract geometric editorial artwork inspired by the concept of ${project.name}. A rich, confident composition of bold overlapping organic and geometric shapes filling the frame, layered depth, soft gradients, subtle paper-like texture — sophisticated modern-art aesthetic reminiscent of premium print design and gallery posters. Color palette: deep forest green, warm editorial cream and clay, muted sage green, charcoal — a cohesive, elegant, editorial color story with real contrast and visual weight, not a flat empty layout. Flat illustration style, no photorealism, no 3D rendering.

Strictly forbidden: text, letters, numbers, words, typography, logos, watermarks, signage, UI elements, charts, screens.
Strictly forbidden: people, human figures, faces, hands, body parts, animals, characters.
Strictly forbidden: photorealistic scenes, literal objects, stock-photo imagery.`

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
