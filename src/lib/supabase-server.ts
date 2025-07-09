import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

export const ensureUserExists = async () => {
  const supabase = createServerSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No session')

  // Check if user exists in our users table
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // If user doesn't exist, create them
  if (!user) {
    // Create a default tenant for this user
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Default Bureau',
        plan: 'starter'
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    // Create the user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        tenant_id: tenant.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
        role: 'admin'
      })
      .select()
      .single()

    if (userError) throw userError
    user = newUser
  }

  return user
}