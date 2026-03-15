import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeAuditLog } from '@/lib/audit'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { getStripe } from '@/lib/stripe'

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`delete-account:${ip}`, { limit: 5, windowSeconds: 3600 })
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = deleteAccountSchema.parse(body)

    if (data.confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id, email, name')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log the deletion before removing the account
    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'DELETE',
      resourceType: 'user_account',
      resourceId: authUser.id,
      resourceName: authUser.email,
      changes: { account: { from: 'active', to: 'deleted' } },
      request,
    })

    // Clean up Stripe customer if exists
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single()

    const stripeCustomerId = (tenant?.settings as Record<string, unknown>)?.stripe_customer_id as string | undefined
    if (stripeCustomerId) {
      try {
        await getStripe().customers.del(stripeCustomerId)
      } catch (stripeErr) {
        console.error('Failed to delete Stripe customer (non-fatal):', stripeErr)
      }
    }

    // Remove avatar files from storage
    const { data: avatarFiles } = await supabase.storage
      .from('avatars')
      .list(authUser.id)
    if (avatarFiles?.length) {
      await supabase.storage
        .from('avatars')
        .remove(avatarFiles.map((f) => `${authUser.id}/${f.name}`))
    }

    // Delete user from auth (cascades to users table and all related data)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id)

    if (deleteError) {
      console.error('Error deleting user account:', deleteError)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid confirmation text' }, { status: 400 })
    }
    console.error('Unexpected error in DELETE /api/account/delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
