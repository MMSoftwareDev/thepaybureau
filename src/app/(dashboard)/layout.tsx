import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardWrapper from '@/components/layout/DashboardWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      redirect('/login')
    }

    return (
      <DashboardWrapper user={session.user}>
        {children}
      </DashboardWrapper>
    )
  } catch (error) {
    console.error('Auth error:', error)
    redirect('/login')
  }
}