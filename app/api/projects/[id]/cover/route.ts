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

  const prompt = `Abstract editorial cover art representing a market research project called "${project.name}". Minimalist geometric and organic shapes, sophisticated dark green and cream color palette, subtle gradient, high-end editorial magazine aesthetic, no text, no logos, no people, clean composition, professional business illustration style.`

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_4_3',
        num_inference_steps: 4,
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
