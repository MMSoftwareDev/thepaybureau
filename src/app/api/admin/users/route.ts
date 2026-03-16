import { getAuthUser, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

function isAdmin(email: string | undefined): boolean {
  return !!email && PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser || !isAdmin(authUser.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, title, avatar_url, is_active, created_at, tenant_id')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  // Fetch tenant names for display
  const tenantIds = [...new Set((users || []).map(u => u.tenant_id).filter(Boolean))]
  const tenantsMap: Record<string, string> = {}
  if (tenantIds.length > 0) {
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name')
      .in('id', tenantIds)

    for (const t of tenants || []) {
      tenantsMap[t.id] = t.name
    }
  }

  const enriched = (users || []).map(u => ({
    ...u,
    tenant_name: u.tenant_id ? tenantsMap[u.tenant_id] || 'Unknown' : null,
  }))

  return NextResponse.json({ users: enriched })
}
