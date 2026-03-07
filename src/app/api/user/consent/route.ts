import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      // Not logged in — consent is stored client-side only
      return NextResponse.json({ ok: true })
    }

    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { type, value } = body as { type: string; value: string }

    if (!type || !value) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Store consent in user's tenant settings
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ ok: true })
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single()

    const settings = (tenant?.settings || {}) as Record<string, unknown>

    await supabase
      .from('tenants')
      .update({
        settings: {
          ...settings,
          consent: {
            ...(settings.consent as Record<string, unknown> || {}),
            [type]: {
              value,
              recorded_at: new Date().toISOString(),
              user_id: authUser.id,
            },
          },
        },
      })
      .eq('id', user.tenant_id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
