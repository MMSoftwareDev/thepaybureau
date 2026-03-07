import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { writeAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`delete-account:${ip}`, { limit: 3, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Verify user exists and get tenant info
    const { data: user } = await supabase
      .from('users')
      .select('id, tenant_id, email, role')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if this is the only admin — prevent orphaning the tenant
    const { data: tenantAdmins } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('role', 'admin')
      .neq('id', user.id)

    const isOnlyAdmin = user.role === 'admin' && (!tenantAdmins || tenantAdmins.length === 0)

    // Audit log the deletion before removing data
    await writeAuditLog({
      tenantId: user.tenant_id,
      userId: user.id,
      userEmail: user.email,
      action: 'DELETE',
      resourceType: 'user',
      resourceId: user.id,
      resourceName: `Account deletion requested by ${user.email}`,
      request,
    })

    if (isOnlyAdmin) {
      // Only admin — delete entire tenant and all associated data
      // Database CASCADE constraints handle: clients, payroll_runs, checklist_items, etc.
      await supabase.from('tenants').delete().eq('id', user.tenant_id)
    }

    // Delete user profile (triggers CASCADE on user-linked data)
    await supabase.from('users').delete().eq('id', user.id)

    // Delete auth user (removes from Supabase Auth)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUser.id)
    if (authDeleteError) {
      console.error('Auth user deletion failed:', authDeleteError)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
