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

  // The word "cover" (as in "cover art"/"magazine cover") is what was
  // biasing the model toward adding a title/masthead — real covers almost
  // always carry typography. "Editorial illustration" alone doesn't carry
  // that same expectation, so it's back in for the refined/sophisticated
  // quality without the front-cover framing. Project name is still never
  // quoted, since a quoted string reads as "render this text."
  const prompt = `Sophisticated abstract editorial illustration, purely decorative and non-literal, inspired by the concept of ${project.name}. Refined geometric and organic shapes, curated dark green and cream color palette, elegant gradients, gallery-quality fine art composition, premium publication-style artwork. Absolutely no text, no letters, no numbers, no words, no typography, no writing, no logos, no watermarks, no signage, no people anywhere in the image.`

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
