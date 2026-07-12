import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HOME_COLORS } from '@/lib/home-theme'

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

  // "Illustration" / "artwork" framing kept pulling the model toward generic
  // flat-corporate-illustration-with-people (a very strong prior for
  // business-related prompts, strong enough that a single "no people" buried
  // in a sentence didn't override it). Reframed entirely as a technical
  // diagram / network graph instead — modeled on the actual node-and-line
  // motif already used on the marketing site — since that genre carries no
  // expectation of figures at all. Constraints are now a blunt "strictly
  // forbidden" list rather than embedded in flowing prose, since diffusion
  // models honor short imperative lists more reliably than long sentences.
  // Project name is still never quoted (a quoted string reads as "render
  // this text").
  // Named colors ("dark green and cream") left too much room for the model
  // to pick its own shade. Pinning to the app's actual hex values keeps
  // generated covers visually consistent with the rest of the product
  // instead of a plausible-but-off-brand green.
  const prompt = `Abstract minimal line diagram in the style of a network graph or data visualization, sparse and geometric, inspired by the concept of ${project.name}. Thin connecting lines between a few small circular nodes, one or two soft overlapping geometric shapes, generous empty negative space, flat vector style, no shading, no depth, no photorealism. Use exactly this color palette: deep forest green ${HOME_COLORS.primary}, muted sage green ${HOME_COLORS.primaryContainer}, pale mint ${HOME_COLORS.primaryFixed}, warm cream ${HOME_COLORS.surface}, soft gray-green ${HOME_COLORS.outlineVariant}. No other colors. This is a technical diagram, not an illustration or artwork.

Strictly forbidden: text, letters, numbers, words, typography, logos, watermarks, signage.
Strictly forbidden: people, human figures, faces, hands, body parts, animals, characters.
Strictly forbidden: realistic or literal depictions of objects, scenes, or environments.`

  try {
    // flux/dev instead of flux/schnell — schnell is the fast/cheap
    // distilled model and is noticeably worse at honoring "no text"
    // instructions. dev costs more ($0.025/MP vs $0.003/MP, still a
    // fraction of a cent per image) but follows prompts far more reliably.
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
      console.error('Fal error:', err)
      return NextResponse.json({ error: 'Cover generation failed' }, { status: 500 })
    }

    const result = await response.json()
    const imageUrl = result?.images?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 })
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
