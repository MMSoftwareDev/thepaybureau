// src/app/api/admin/analytics/route.ts
// Cross-tenant analytics for platform owner — bypasses RLS via service role key
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { subDays, format, startOfDay } from 'date-fns'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// Platform admin emails — loaded from env variable (comma-separated)
const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 5 requests per 15 minutes (expensive cross-tenant query)
    const limiter = await rateLimit(`admin-analytics:${getClientIp(request)}`, { limit: 5, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const authUser = await getAuthUser()
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!PLATFORM_ADMIN_EMAILS.includes(authUser.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createServerSupabaseClient()

    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const sevenDaysAgo = subDays(now, 7)

    // ── All users (from auth-linked public.users table) ──
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at, tenant_id')
      .order('created_at', { ascending: false })

    // ── All tenants ──
    const { data: allTenants } = await supabase
      .from('tenants')
      .select('id, name, plan, mode, created_at')
      .order('created_at', { ascending: false })

    // ── All clients ──
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, tenant_id, name, status, pay_frequency, employee_count, created_at')
      .order('created_at', { ascending: false })

    // ── All payroll runs ──
    const { data: allRuns } = await supabase
      .from('payroll_runs')
      .select('id, tenant_id, status, pay_date, created_at')
      .order('created_at', { ascending: false })

    // ── Auth users for last_sign_in_at (service role can read auth.users) ──
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })

    const users = allUsers ?? []
    const tenants = allTenants ?? []
    const clients = allClients ?? []
    const runs = allRuns ?? []
    const authUsersList = authUsers?.users ?? []

    // Build a map of auth user data (last_sign_in_at)
    const authMap = new Map(authUsersList.map(u => [u.id, u]))

    // ── Summary stats ──
    const totalUsers = users.length
    const totalTenants = tenants.length
    const totalClients = clients.length
    const totalPayrollRuns = runs.length

    // Active users (signed in within last 7 / 30 days)
    const activeUsers7d = authUsersList.filter(u =>
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo
    ).length

    const activeUsers30d = authUsersList.filter(u =>
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo
    ).length

    // Signups in last 30 days
    const newUsers30d = users.filter(u =>
      new Date(u.created_at) >= thirtyDaysAgo
    ).length

    // Clients added in last 30 days
    const newClients30d = clients.filter(c =>
      new Date(c.created_at) >= thirtyDaysAgo
    ).length

    // ── Signup trend (daily, last 90 days) ──
    const signupTrend: { date: string; signups: number }[] = []
    for (let i = 89; i >= 0; i--) {
      const day = startOfDay(subDays(now, i))
      const dayStr = format(day, 'yyyy-MM-dd')
      const count = users.filter(u => format(new Date(u.created_at), 'yyyy-MM-dd') === dayStr).length
      signupTrend.push({ date: dayStr, signups: count })
    }

    // ── Clients added trend (daily, last 90 days) ──
    const clientTrend: { date: string; clients: number }[] = []
    for (let i = 89; i >= 0; i--) {
      const day = startOfDay(subDays(now, i))
      const dayStr = format(day, 'yyyy-MM-dd')
      const count = clients.filter(c => format(new Date(c.created_at), 'yyyy-MM-dd') === dayStr).length
      clientTrend.push({ date: dayStr, clients: count })
    }

    // ── Login activity trend (daily, last 30 days) ──
    const loginTrend: { date: string; logins: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const day = startOfDay(subDays(now, i))
      const dayStr = format(day, 'yyyy-MM-dd')
      const count = authUsersList.filter(u =>
        u.last_sign_in_at && format(new Date(u.last_sign_in_at), 'yyyy-MM-dd') === dayStr
      ).length
      loginTrend.push({ date: dayStr, logins: count })
    }

    // ── Tenant breakdown ──
    const tenantBreakdown = tenants.map(t => {
      const tenantUsers = users.filter(u => u.tenant_id === t.id)
      const tenantClients = clients.filter(c => c.tenant_id === t.id)
      const tenantRuns = runs.filter(r => r.tenant_id === t.id)
      const tenantAuthUsers = tenantUsers.map(u => authMap.get(u.id)).filter(Boolean)
      const lastLogin = tenantAuthUsers
        .map(u => u?.last_sign_in_at)
        .filter(Boolean)
        .sort()
        .reverse()[0] ?? null

      return {
        id: t.id,
        name: t.name,
        plan: t.plan,
        mode: t.mode,
        created_at: t.created_at,
        userCount: tenantUsers.length,
        clientCount: tenantClients.length,
        payrollRunCount: tenantRuns.length,
        totalEmployees: tenantClients.reduce((sum, c) => sum + (c.employee_count ?? 0), 0),
        lastLogin,
      }
    })

    // ── Recent signups (last 10) ──
    const recentSignups = users.slice(0, 10).map(u => {
      const au = authMap.get(u.id)
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        created_at: u.created_at,
        last_sign_in_at: au?.last_sign_in_at ?? null,
        tenant_id: u.tenant_id,
        tenantName: tenants.find(t => t.id === u.tenant_id)?.name ?? 'Unknown',
      }
    })

    // ── Plan distribution ──
    const planDistribution: Record<string, number> = {}
    tenants.forEach(t => {
      const plan = t.plan || 'unknown'
      planDistribution[plan] = (planDistribution[plan] || 0) + 1
    })

    return NextResponse.json({
      summary: {
        totalUsers,
        totalTenants,
        totalClients,
        totalPayrollRuns,
        activeUsers7d,
        activeUsers30d,
        newUsers30d,
        newClients30d,
      },
      signupTrend,
      clientTrend,
      loginTrend,
      tenantBreakdown,
      recentSignups,
      planDistribution,
    })
  } catch (err) {
    console.error('Admin analytics error:', err)
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    )
  }
}
