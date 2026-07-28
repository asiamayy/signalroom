import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Plan } from '@/types'

const BUCKET = 'brand-assets'
const MAX_BYTES = 2 * 1024 * 1024 // 2MB — a logo, not a photo
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

async function requireAgency(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', userId).single()
  return (profile?.plan as Plan | undefined) === 'agency'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // White-label branding is a Broadcast-only feature, same gate as the
  // isWhiteLabel check on the public report page.
  if (!(await requireAgency(supabase, user.id))) {
    return NextResponse.json({ error: 'White-label branding requires the Broadcast plan.' }, { status: 403 })
  }

  const formData = await request.formData()
  const logo = formData.get('logo')
  const color = formData.get('color')

  const updates: { brand_logo_url?: string; brand_color?: string } = {}

  if (typeof color === 'string' && color.length > 0) {
    if (!HEX_COLOR.test(color)) {
      return NextResponse.json({ error: 'Color must be a hex value like #1A2B3C.' }, { status: 400 })
    }
    updates.brand_color = color
  }

  if (logo instanceof File) {
    if (!ALLOWED_TYPES.includes(logo.type)) {
      return NextResponse.json({ error: 'Logo must be a PNG, JPEG, WebP, or SVG image.' }, { status: 400 })
    }
    if (logo.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Logo must be under 2MB.' }, { status: 400 })
    }

    const ext = logo.type.split('/')[1].replace('svg+xml', 'svg')
    const storagePath = `${user.id}/logo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, logo, { contentType: logo.type })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    updates.brand_logo_url = publicUrl.publicUrl
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No logo or color provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('brand_logo_url, brand_color')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// Palette/favorites are saved-swatches convenience only — the report itself
// always uses the single brand_color column above, unchanged. The client
// computes the resulting array (append a new custom color, evict the oldest
// once at the 8/4 cap, toggle favorite membership) and this just validates
// and persists whatever array it sends.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await requireAgency(supabase, user.id))) {
    return NextResponse.json({ error: 'White-label branding requires the Broadcast plan.' }, { status: 403 })
  }

  const body = await request.json()
  const updates: { brand_palette?: string[]; brand_favorites?: string[] } = {}

  const isHexArray = (value: unknown, max: number) =>
    Array.isArray(value) && value.length <= max && value.every(c => typeof c === 'string' && HEX_COLOR.test(c))

  if (body.palette !== undefined) {
    if (!isHexArray(body.palette, 8)) {
      return NextResponse.json({ error: 'Palette must be an array of up to 8 hex colors.' }, { status: 400 })
    }
    updates.brand_palette = body.palette
  }

  if (body.favorites !== undefined) {
    if (!isHexArray(body.favorites, 4)) {
      return NextResponse.json({ error: 'Favorites must be an array of up to 4 hex colors.' }, { status: 400 })
    }
    updates.brand_favorites = body.favorites
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No palette or favorites provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('brand_palette, brand_favorites')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { field } = await request.json()
  if (field !== 'logo' && field !== 'color') {
    return NextResponse.json({ error: 'field must be "logo" or "color"' }, { status: 400 })
  }

  const updates = field === 'logo' ? { brand_logo_url: null } : { brand_color: null }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
