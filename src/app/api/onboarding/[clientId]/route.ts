// src/app/api/onboarding/[clientId]/route.ts
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant_id
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get client and onboarding data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, status')
      .eq('id', clientId)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get onboarding data for this client
    const { data: onboarding, error: onboardingError } = await supabase
      .from('client_onboarding')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (onboardingError || !onboarding) {
      return NextResponse.json({ error: 'Onboarding data not found' }, { status: 404 })
    }

    // Return combined data
    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        status: client.status
      },
      onboarding: {
        id: onboarding.id,
        status: onboarding.status,
        progress_percentage: onboarding.progress_percentage,
        tasks: onboarding.tasks,
        created_at: onboarding.created_at,
        updated_at: onboarding.updated_at
      }
    })

  } catch (error) {
    console.error('Error fetching client onboarding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant_id
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the request body
    const body = await request.json()
    const { taskId, completed } = body

    if (typeof taskId !== 'string' || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Get current onboarding data
    const { data: onboarding, error: onboardingError } = await supabase
      .from('client_onboarding')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (onboardingError || !onboarding) {
      return NextResponse.json({ error: 'Onboarding data not found' }, { status: 404 })
    }

    // Update the specific task
    const tasks = onboarding.tasks.map((task: any) => {
      if (task.id === taskId) {
        return {
          ...task,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        }
      }
      return task
    })

    // Calculate new progress percentage
    const completedTasks = tasks.filter((task: any) => task.completed && task.required)
    const totalRequiredTasks = tasks.filter((task: any) => task.required)
    const progressPercentage = Math.round((completedTasks.length / totalRequiredTasks.length) * 100)

    // Determine new status
    let newStatus = 'not_started'
    if (progressPercentage > 0 && progressPercentage < 100) {
      newStatus = 'in_progress'
    } else if (progressPercentage === 100) {
      newStatus = 'completed'
    }

    // Update onboarding record
    const { data: updatedOnboarding, error: updateError } = await supabase
      .from('client_onboarding')
      .update({
        tasks,
        progress_percentage: progressPercentage,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      onboarding: updatedOnboarding,
      progress_percentage: progressPercentage,
      status: newStatus
    })

  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// API to move client to active status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant_id
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the request body
    const body = await request.json()
    const { action } = body

    if (action === 'complete_onboarding') {
      // Check if onboarding is 100% complete
      const { data: onboarding } = await supabase
        .from('client_onboarding')
        .select('progress_percentage')
        .eq('client_id', clientId)
        .single()

      if (!onboarding || onboarding.progress_percentage !== 100) {
        return NextResponse.json({ error: 'Onboarding must be 100% complete' }, { status: 400 })
      }

      // Update client status to active
      const { data: updatedClient, error: clientError } = await supabase
        .from('clients')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .eq('tenant_id', user.tenant_id)
        .select()
        .single()

      if (clientError) {
        return NextResponse.json({ error: clientError.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Client successfully moved to active status',
        client: updatedClient
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}