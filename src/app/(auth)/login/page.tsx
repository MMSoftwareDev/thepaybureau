'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Building2, CheckCircle, Loader2, ArrowRight, Shield, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ThePayBureau Brand Colors (matching your marketing page)
const colors = {
  primary: '#401D6C',      // Deep Purple
  secondary: '#EC385D',    // Vibrant Pink
  accent: '#FF8073',       // Warm Peach
  lightBg: '#F8F4FF',      // Very Light Purple
  success: '#22C55E',      // Green
  error: '#EF4444',        // Red
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
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
    console.log('Login page mounted, supabase client:', supabase)
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
    console.log('Login function started')
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
    console.log('About to try Supabase login')
    
    try {
      console.log('Attempting login with:', email)
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Supabase result:', result)
      
      if (result.error) {
        console.error('Supabase error:', result.error)
        setPasswordError('Login failed: ' + result.error.message)
      } else {
        console.log('Login successful!')
        console.log('User:', result.data.user)
        console.log('Session:', result.data.session)
        
        setLoginSuccess(true)
        
        // Wait a moment for the session to be properly set
        setTimeout(() => {
          console.log('Redirecting to dashboard...')
          router.push('/dashboard')
        }, 500)
      }
    } catch (error) {
      console.error('Catch error:', error)
      setPasswordError('An error occurred: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = (provider: string) => {
    alert(`${provider} OAuth integration coming soon!`)
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
      style={{
        background: `linear-gradient(135deg, ${colors.lightBg} 0%, #ffffff 30%, ${colors.lightBg} 100%)`
      }}
    >
      {/* Floating Background Elements */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
          transform: 'translate(-30%, 30%)',
          animationDelay: '2s'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div 
            className="mx-auto w-20 h-20 flex items-center justify-center mb-6 rounded-2xl shadow-xl"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 20px 40px ${colors.primary}30`
            }}
          >
            <Building2 className="w-10 h-10 text-white" />
          </div>
          
          {/* Title */}
          <h1 
            className="text-3xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Welcome to ThePayBureau
          </h1>
          <p className="text-gray-600 mb-6">
            Sign into your account
          </p>
          
          {/* Quick Demo Button */}
          <button
            onClick={handleQuickFill}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${colors.accent}20, ${colors.secondary}20)`,
              color: colors.secondary,
              border: `1px solid ${colors.secondary}30`
            }}
          >
            <Sparkles className="w-4 h-4" />
            Try Demo Account
          </button>
        </div>

        {/* Login Card */}
        <Card 
          className="shadow-2xl backdrop-blur-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: `0 25px 50px -12px ${colors.primary}20, 0 0 0 1px ${colors.primary}10`,
            borderRadius: '24px',
            border: `3px solid transparent`,
            backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          <CardContent className="p-10">
            {/* Success State */}
            {loginSuccess && (
              <div 
                className="mb-6 p-4 rounded-xl flex items-center gap-3"
                style={{ background: `${colors.success}10`, border: `1px solid ${colors.success}30` }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: colors.success }} />
                <span style={{ color: colors.success }} className="font-medium">
                  Login successful! Redirecting...
                </span>
              </div>
            )}

            <div className="space-y-8">
              {/* Email Field */}
              <div className="space-y-3 mt-4">
                <label 
                  htmlFor="email" 
                  className="block text-sm font-semibold"
                  style={{ color: colors.gray[700] }}
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onKeyPress={handleKeyPress}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-0 ${
                    emailError ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                  style={{
                    borderColor: emailError ? colors.error : colors.gray[200],
                    fontSize: '16px',
                    color: email ? colors.secondary : colors.gray[900]
                  }}
                  onFocus={(e) => {
                    if (!emailError) {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                    }
                  }}
                  onBlur={(e) => {
                    if (!emailError) {
                      e.target.style.borderColor = colors.gray[200]
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
                />
                {emailError && (
                  <p className="mt-2 text-sm" style={{ color: colors.error }}>{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold"
                  style={{ color: colors.gray[700] }}
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:ring-0 ${
                      passwordError ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    style={{
                      borderColor: passwordError ? colors.error : colors.gray[200],
                      fontSize: '16px',
                      color: password || showPassword ? colors.secondary : colors.gray[900]
                    }}
                    onFocus={(e) => {
                      if (!passwordError) {
                        e.target.style.borderColor = colors.primary
                        e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                      }
                    }}
                    onBlur={(e) => {
                      if (!passwordError) {
                        e.target.style.borderColor = colors.gray[200]
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
                    style={{ color: colors.gray[400] }}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm" style={{ color: colors.error }}>{passwordError}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div 
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      rememberMe ? 'border-transparent' : ''
                    }`}
                    style={{
                      backgroundColor: rememberMe ? colors.primary : 'transparent',
                      borderColor: rememberMe ? colors.primary : colors.gray[300]
                    }}
                  >
                    {rememberMe && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="ml-2 text-sm" style={{ color: colors.gray[600] }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm font-bold transition-colors duration-200"
                  style={{ color: colors.primary, fontSize: '0.9rem' }}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleLogin}
                  disabled={loading || loginSuccess}
                  className="w-full text-white font-bold py-6 px-12 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none shadow-lg hover:shadow-xl text-xl"
                  style={{
                    background: loginSuccess 
                      ? `linear-gradient(135deg, ${colors.success} 0%, #16a34a 100%)`
                      : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    boxShadow: `0 10px 25px -5px ${loginSuccess ? colors.success : colors.primary}40`,
                    minHeight: '44px'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      Signing in...
                    </div>
                  ) : loginSuccess ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Success!
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="mt-8 mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: colors.gray[200] }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span 
                    className="px-4 bg-white"
                    style={{ color: colors.gray[500] }}
                  >
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('Google')}
                disabled={true}
                className="w-full flex items-center justify-center px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 opacity-50 cursor-not-allowed"
                style={{
                  borderColor: colors.gray[200],
                  backgroundColor: colors.gray[50],
                  color: colors.gray[500]
                }}
              >
                <svg className="w-5 h-5 mr-3 opacity-50" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google (Coming soon)
              </button>
              
              <button
                type="button"
                onClick={() => handleOAuthLogin('Microsoft')}
                disabled={true}
                className="w-full flex items-center justify-center px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 opacity-50 cursor-not-allowed"
                style={{
                  borderColor: colors.gray[200],
                  backgroundColor: colors.gray[50],
                  color: colors.gray[500]
                }}
              >
                <svg className="w-5 h-5 mr-3 opacity-50" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                  <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
                Continue with Microsoft (Coming soon)
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p style={{ color: colors.gray[600] }}>
            Need access?{' '}
            <button 
              className="font-semibold transition-colors duration-200" 
              style={{ color: colors.primary }}
              disabled={loading}
            >
              Request demo
            </button>
          </p>
          
          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: colors.gray[500] }}>
            <Building2 className="w-3 h-3" style={{ color: colors.success }} />
            <span>Bureau-Built Technology</span>
          </div>
        </div>
      </div>
    </div>
  )
}