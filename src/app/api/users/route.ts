// src/app/api/users/route.ts - List tenant users (for Assigned To dropdown)

import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('tenant_id', user.tenant_id)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 400 })
    }

    return NextResponse.json(users || [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
