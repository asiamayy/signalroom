import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fal } from '@fal-ai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, age, gender, job_title, additional_context } = await request.json()

  // Build a portrait prompt from persona traits
  const genderDesc = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person'
  const ageDesc = age ? `${age}-year-old` : 'adult'
  const jobDesc = job_title ? `, ${job_title}` : ''
  const contextDesc = additional_context ? `. ${additional_context}` : ''

  const prompt = `Professional headshot portrait of a ${ageDesc} ${genderDesc}${jobDesc}${contextDesc}. 
    Natural lighting, slightly smiling, confident expression, blurred neutral background, 
    high quality photography, realistic, professional LinkedIn-style photo, 
    sharp focus on face, clean background`

  try {
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'square',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
      // @ts-ignore
      credentials: process.env.FAL_API_KEY,
    }) as any

    const imageUrl = result?.images?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 })
    }

    return NextResponse.json({ url: imageUrl })
  } catch (e: any) {
    console.error('Avatar generation error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to generate avatar' }, { status: 500 })
  }
}
