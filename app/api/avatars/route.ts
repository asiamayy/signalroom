import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { name, age, gender, job_title, additional_context } = await request.json()

  const genderDesc = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person'
  const ageDesc = age ? `${age}-year-old` : 'adult'
  const jobDesc = job_title ? `, ${job_title}` : ''
  const contextDesc = additional_context ? `. ${additional_context}` : ''

  const prompt = `Professional headshot portrait of a ${ageDesc} ${genderDesc}${jobDesc}${contextDesc}. Natural lighting, slightly smiling, confident expression, blurred neutral background, high quality photography, realistic, professional LinkedIn-style photo, sharp focus on face, clean background`

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Fal error:', err)
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
    }

    const result = await response.json()
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
