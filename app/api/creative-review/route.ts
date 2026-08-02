import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectCreativeZones, buildCreativePanelSystemPrompt, parseCreativePanelResponses } from '@/lib/anthropic/creative-review-engine'
import { zoneAttentionPercentages } from '@/lib/vision/saliency'
import { logError } from '@/lib/logger'
import Anthropic from '@anthropic-ai/sdk'
import { PLAN_LIMITS } from '@/types'
import type { Plan, CreativeZone, CreativePersonaReaction, CreativeReviewResult } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const BUCKET = 'creative-review-assets'
const MIN_PERSONAS = 2
const MAX_PERSONAS = 6

// Same history-list pattern as every other run type.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('project_id')

  let query = supabase.from('creative_review_runs').select('*').order('created_at', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    persona_ids, image, imageMediaType, heatmap_image, saliency_grid, grid_width, grid_height,
    intended_focus, project_id, workspace_id,
  } = await request.json()

  let planCheckUserId = user.id
  if (workspace_id) {
    const { data: workspace } = await supabase.from('workspaces').select('owner_id').eq('id', workspace_id).single()
    if (workspace) planCheckUserId = workspace.owner_id
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', planCheckUserId)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan
  // Reuses the same gate as Audience Panel — this is a similarly premium,
  // multi-persona joint-call feature, not worth a new plan-limits field yet.
  if (!PLAN_LIMITS[plan].audience_panel) {
    return NextResponse.json({ error: 'Upgrade to Signal or Broadcast to use Creative Testing' }, { status: 403 })
  }

  if (!persona_ids || persona_ids.length < MIN_PERSONAS) {
    return NextResponse.json({ error: `Select at least ${MIN_PERSONAS} personas` }, { status: 400 })
  }
  if (persona_ids.length > MAX_PERSONAS) {
    return NextResponse.json({ error: `Select up to ${MAX_PERSONAS} personas` }, { status: 400 })
  }
  if (!image) {
    return NextResponse.json({ error: 'Upload an image to review' }, { status: 400 })
  }
  if (!Array.isArray(saliency_grid) || saliency_grid.length === 0 || !grid_width || !grid_height) {
    return NextResponse.json({ error: 'Missing attention data — try re-uploading the image' }, { status: 400 })
  }

  try {
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .in('id', persona_ids)

    if (personasError || !personas?.length) {
      return NextResponse.json({ error: 'Personas not found' }, { status: 404 })
    }

    // Step 1 — what's actually in the image (Claude, vision, no personas involved yet).
    const detectedZones = await detectCreativeZones(image, imageMediaType ?? 'image/jpeg')

    // Step 2 — combine Claude's zone boxes with the REAL, independently-computed
    // saliency grid (never seen or influenced by any LLM) into attention percentages.
    const percentages = zoneAttentionPercentages(
      { grid: new Float32Array(saliency_grid), gridWidth: grid_width, gridHeight: grid_height, heatmapDataUrl: '' },
      detectedZones
    )
    const zones: CreativeZone[] = detectedZones.map((z, i) => ({ ...z, attention_pct: percentages[i]?.pct ?? 0 }))

    // Step 3 — the persona panel reacts, grounded in that measured data.
    const panelSystem = buildCreativePanelSystemPrompt(personas, { zones, intendedFocus: intended_focus ?? '' })

    const generation = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: Math.min(8000, 700 + personas.length * 380),
      temperature: 1,
      system: panelSystem,
      messages: [{ role: 'user', content: buildUserMessageContentForPanel(image, imageMediaType) }],
    })

    const rawPanel = generation.content[0].type === 'text' ? generation.content[0].text : ''
    const parsed = parseCreativePanelResponses(rawPanel, personas)

    const reactions: CreativePersonaReaction[] = personas.map((persona) => {
      const base = {
        persona_id: persona.id,
        persona_name: persona.name,
        avatar_initials: persona.avatar_initials,
        avatar_color: persona.avatar_color,
        avatar_url: persona.avatar_url,
        job_title: persona.traits?.job_title ?? '',
      }
      const cell = parsed.get(persona.id)
      if (!cell) {
        return { ...base, notices: [], reaction: null, most_believable_claim: null, most_confusing_element: null, likely_trigger: null, engagement_percentage: null, suggested_adjustment: null, error: 'No response generated' }
      }
      return { ...base, ...cell, error: null }
    })

    const result: CreativeReviewResult = {
      zones,
      intended_focus: intended_focus ?? '',
      reactions,
      total_personas: reactions.length,
      completed_in_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
    }

    let runId: string | null = null
    if (project_id) {
      const timestamp = Date.now()
      const imagePath = `${user.id}/${timestamp}-asset.jpg`
      const heatmapPath = heatmap_image ? `${user.id}/${timestamp}-heatmap.png` : null

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(imagePath, Buffer.from(image, 'base64'), { contentType: imageMediaType ?? 'image/jpeg' })

      if (uploadError) {
        logError('creative_review_runs.upload', uploadError, { userId: user.id, projectId: project_id })
      } else {
        if (heatmapPath && heatmap_image) {
          const heatmapBase64 = heatmap_image.includes(',') ? heatmap_image.split(',')[1] : heatmap_image
          await supabase.storage.from(BUCKET).upload(heatmapPath, Buffer.from(heatmapBase64, 'base64'), { contentType: 'image/png' })
        }

        const { data: run, error: insertError } = await supabase
          .from('creative_review_runs')
          .insert({
            user_id: user.id,
            project_id,
            workspace_id: workspace_id ?? null,
            intended_focus: intended_focus ?? '',
            persona_ids,
            image_storage_path: imagePath,
            heatmap_storage_path: heatmapPath,
            result,
          })
          .select('id')
          .single()

        if (insertError) {
          logError('creative_review_runs.insert', insertError, { userId: user.id, projectId: project_id })
          await supabase.storage.from(BUCKET).remove([imagePath, ...(heatmapPath ? [heatmapPath] : [])])
        } else if (run) {
          runId = run.id
        }
      }
    }

    return NextResponse.json({ data: result, run_id: runId })
  } catch (e: any) {
    console.error('[creative-review] request failed:', e)
    return NextResponse.json({ error: 'The review failed to complete. Please try again.' }, { status: 500 })
  }
}

function buildUserMessageContentForPanel(imageBase64: string, imageMediaType: string | undefined) {
  const safeMediaType = imageMediaType && ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(imageMediaType) ? imageMediaType : 'image/jpeg'
  return [
    {
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: safeMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: imageBase64 },
    },
    {
      type: 'text' as const,
      text: 'React to this asset as the panel described in your instructions.',
    },
  ]
}
