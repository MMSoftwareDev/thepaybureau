import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get clients in onboarding status with their onboarding progress
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        client_onboarding (
          id,
          tasks,
          progress_percentage,
          completed_at
        )
      `)
      .eq('tenant_id', user.tenant_id)
      .eq('status', 'onboarding')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(clients || [])
  } catch (error) {
    console.error('Error fetching onboarding clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, taskId, completed } = body

    // Update the specific task in the client's onboarding
    const { data: onboarding, error: fetchError } = await supabase
      .from('client_onboarding')
      .select('tasks')
      .eq('client_id', clientId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    // Update the specific task
    const tasks = onboarding.tasks.map((task: any) => 
      task.id === taskId ? { ...task, completed } : task
    )

    // Calculate progress percentage
    const completedTasks = tasks.filter((task: any) => task.completed && task.required)
    const requiredTasks = tasks.filter((task: any) => task.required)
    const progressPercentage = Math.round((completedTasks.length / requiredTasks.length) * 100)

    // Update the onboarding record
    const { data, error } = await supabase
      .from('client_onboarding')
      .update({
        tasks,
        progress_percentage: progressPercentage,
        completed_at: progressPercentage === 100 ? new Date().toISOString() : null
      })
      .eq('client_id', clientId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating onboarding task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}