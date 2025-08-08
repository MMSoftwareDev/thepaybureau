// src/app/(auth)/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Eye, EyeOff, Building2, CheckCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Brand Colors
const colors = {
  primary: '#5B3A8E',
  primaryDark: '#472D70',
  accent: '#E94B6D',
  
  success: '#10B981',
  error: '#EF4444',
  
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray900: '#18181B',
  
  background: '#FAFBFC',
  surface: '#FFFFFF',
  border: '#E5E7EB'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError && validateEmail(value)) {
      setEmailError('')
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (passwordError && value.length >= 6) {
      setPasswordError('')
    }
  }

  const handleQuickFill = () => {
    setEmail('demo@thepaybureau.com')
    setPassword('demo123')
    setEmailError('')
    setPasswordError('')
  }

  const handleLogin = async () => {
    setEmailError('')
    setPasswordError('')
    
    let hasErrors = false
    
    if (!email) {
      setEmailError('Email is required')
      hasErrors = true
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      hasErrors = true
    }
    
    if (!password) {
      setPasswordError('Password is required')
      hasErrors = true
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      hasErrors = true
    }
    
    if (hasErrors) return
    
    setLoading(true)
    
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (result.error) {
        setPasswordError('Invalid email or password')
      } else {
        setLoginSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    } catch (error) {
      setPasswordError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  if (!mounted) return null

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {/* Subtle gradient overlay for visual interest */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(ellipse at top, ${colors.primary}10, transparent), 
                       radial-gradient(ellipse at bottom, ${colors.accent}10, transparent)`
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div 
            className="mx-auto w-16 h-16 flex items-center justify-center mb-6 rounded-2xl"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
              boxShadow: '0 10px 25px rgba(91, 58, 142, 0.2)'
            }}
          >
            <Building2 className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.gray900 }}>
            Welcome back
          </h1>
          <p className="text-base" style={{ color: colors.gray500 }}>
            Sign in to your ThePayBureau account
          </p>
        </div>

        {/* Main Card */}
        <div 
          className="rounded-2xl p-8 shadow-sm"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`
          }}
        >
          {/* Demo Account Button */}
          <button
            onClick={handleQuickFill}
            className="w-full mb-6 py-2 px-4 rounded-lg text-sm font-medium transition-all hover:shadow-md flex items-center justify-center gap-2"
            style={{
              backgroundColor: `${colors.accent}10`,
              color: colors.accent,
              border: `1px solid ${colors.accent}30`
            }}
          >
            <Sparkles className="w-4 h-4" />
            Use Demo Account
          </button>

          {/* Success Message */}
          {loginSuccess && (
            <div 
              className="mb-6 p-3 rounded-lg flex items-center gap-2"
              style={{ 
                backgroundColor: `${colors.success}10`,
                color: colors.success
              }}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Login successful! Redirecting...</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2"
                style={{ color: colors.gray700 }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: colors.gray50,
                  border: `1px solid ${emailError ? colors.error : colors.border}`,
                  color: colors.gray900
                }}
                onFocus={(e) => {
                  if (!emailError) {
                    e.target.style.borderColor = colors.primary
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`
                  }
                }}
                onBlur={(e) => {
                  if (!emailError) {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }
                }}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
              />
              {emailError && (
                <p className="mt-1 text-xs" style={{ color: colors.error }}>{emailError}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2"
                style={{ color: colors.gray700 }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all"
                  style={{
                    backgroundColor: colors.gray50,
                    border: `1px solid ${passwordError ? colors.error : colors.border}`,
                    color: colors.gray900
                  }}
                  onFocus={(e) => {
                    if (!passwordError) {
                      e.target.style.borderColor = colors.accent
                      e.target.style.boxShadow = `0 0 0 3px ${colors.accent}15`
                    }
                  }}
                  onBlur={(e) => {
                    if (!passwordError) {
                      e.target.style.borderColor = colors.border
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: colors.gray400 }}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs" style={{ color: colors.error }}>{passwordError}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ 
                    accentColor: colors.accent
                  }}
                  disabled={loading}
                />
                <span className="ml-2 text-sm" style={{ color: colors.gray600 }}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium transition-colors hover:text-pink-700"
                style={{ color: colors.accent }}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={loading || loginSuccess}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: loginSuccess 
                  ? colors.success
                  : `linear-gradient(135deg, ${colors.accent}, #D62D52)`,
                boxShadow: loading ? 'none' : '0 4px 12px rgba(233, 75, 109, 0.25)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Signing in...
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Success!
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: `1px solid ${colors.border}` }}></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3" style={{ backgroundColor: colors.surface, color: colors.gray500 }}>
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={true}
              className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: colors.gray50,
                border: `1px solid ${colors.border}`,
                color: colors.gray400
              }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            
            <button
              type="button"
              disabled={true}
              className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: colors.gray50,
                border: `1px solid ${colors.border}`,
                color: colors.gray400
              }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Microsoft
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: colors.gray600 }}>
            Don't have an account?{' '}
            <button 
              className="font-semibold transition-colors hover:text-pink-700" 
              style={{ color: colors.accent }}
              disabled={loading}
            >
              Request demo
            </button>
          </p>
          
          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: colors.gray500 }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }}></div>
            <span>Secure bureau-grade encryption</span>
          </div>
        </div>
      </div>
    </div>
  )
}
