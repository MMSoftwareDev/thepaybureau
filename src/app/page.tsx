'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Building2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // User is logged in, redirect to dashboard
          router.push('/dashboard')
        } else {
          // User not logged in, redirect to login
          router.push('/login')
        }
      } catch (error) {
        // If there's any error, just go to login
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F8F4FF 0%, #ffffff 30%, #F8F4FF 100%)' }}>
      <div className="text-center">
        {/* ThePayBureau Logo */}
        <div 
          className="mx-auto w-20 h-20 flex items-center justify-center mb-6 rounded-2xl shadow-xl"
          style={{ 
            background: 'linear-gradient(135deg, #401D6C, #EC385D)',
            boxShadow: '0 20px 40px rgba(64, 29, 108, 0.3)'
          }}
        >
          <Building2 className="w-10 h-10 text-white" />
        </div>
        
        {/* Loading Animation */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#401D6C' }}></div>
        
        {/* Loading Text */}
        <p className="text-lg font-semibold" style={{ color: '#401D6C' }}>
          Welcome to ThePayBureau
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Redirecting you to the secure login...
        </p>
      </div>
    </div>
  )
}
