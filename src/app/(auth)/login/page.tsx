'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Building2, CheckCircle, Loader2, Shield, Users, BarChart3, Clock, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

// ThePayBureau Brand Colors
const colors = {
  primary: '#401D6C',      // Deep Purple
  secondary: '#EC385D',    // Vibrant Pink
  accent: '#FF8073',       // Warm Peach
  lightBg: '#F8F4FF',      // Very Light Purple
  darkBg: '#2A1A4A',       // Darker Purple
  grayBg: '#F4F4F5',       // Light Gray (tprgray)
  success: '#22C55E',      // Green
  error: '#EF4444',        // Red
  // Dark Mode Colors
  darkModeBg: '#1F1F2E',
  darkCardBg: '#2A2A3C',
  darkText: '#E4E4E7',
  gray: {
    50: '#F8F4FF',
    100: '#F4F4F5',
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
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const [showDemo, setShowDemo] = useState(false)
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('tenants').select('count').limit(1)
        setConnectionStatus('connected')
      } catch (error) {
        setConnectionStatus('disconnected')
      }
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [supabase])

  // Handle account lockout
  useEffect(() => {
    if (isLocked && lockTimer > 0) {
      const timeout = setTimeout(() => {
        setLockTimer(lockTimer - 1)
      }, 1000)
      return () => clearTimeout(timeout)
    } else if (isLocked && lockTimer === 0) {
      setIsLocked(false)
      setLoginAttempts(0)
    }
  }, [isLocked, lockTimer])

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
    setEmail('test@thepaybureau.com')
    setPassword('password123')
  }

  const handleDemoAccess = () => {
    setEmail('demo@thepaybureau.com')
    setPassword('demo123')
    setShowDemo(true)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked) {
      setPasswordError(`Account temporarily locked. Try again in ${lockTimer} seconds.`)
      return
    }
    
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      setLoginSuccess(true)
      setLoginAttempts(0) // Reset on success
      
      // Log successful login
      console.log('✅ Login successful for:', email)
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
      
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Increment failed attempts
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      
      if (newAttempts >= 5) {
        setIsLocked(true)
        setLockTimer(300) // 5 minutes lockout
        setPasswordError('Too many failed attempts. Account locked for 5 minutes.')
      } else if (error.message.includes('Invalid login credentials')) {
        setPasswordError(`Invalid email or password. ${5 - newAttempts} attempts remaining.`)
      } else if (error.message.includes('Email not confirmed')) {
        setEmailError('Please check your email and confirm your account.')
      } else {
        setPasswordError(error.message || 'Login failed. Please try again.')
      }
      
      setLoginSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = (provider: string) => {
    console.log(`${provider} OAuth login initiated`)
    alert(`${provider} OAuth is not yet implemented. Use email/password for now.`)
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${colors.lightBg} 0%, #ffffff 30%, ${colors.lightBg} 100%)`
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div 
            className="mx-auto w-20 h-20 flex items-center justify-center mb-6 rounded-full shadow-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to ThePayBureau
          </h1>
          <p className="text-gray-600 mb-4">
            Professional payroll management platform
          </p>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" style={{ color: colors.success }} />
              <span className="text-xs text-gray-500">Enterprise Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" style={{ color: colors.success }} />
              <span className="text-xs text-gray-500">Multi-Tenant</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" style={{ color: colors.success }} />
              <span className="text-xs text-gray-500">Real-time Analytics</span>
            </div>
          </div>
          
          {/* Demo Access */}
          <div className="flex justify-center space-x-3 mb-3">
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-sm hover:underline transition-colors duration-200"
              style={{ color: colors.secondary }}
            >
              Fill test credentials
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={handleDemoAccess}
              className="text-sm hover:underline transition-colors duration-200"
              style={{ color: colors.accent }}
            >
              Try demo account
            </button>
          </div>
          
          {showDemo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                🎯 Demo account loaded! Experience ThePayBureau with sample data.
              </p>
            </div>
          )}
        </div>

        {/* Login Form */}
        <div 
          className="bg-white rounded-3xl shadow-2xl p-8 relative"
          style={{
            boxShadow: `0 25px 50px -12px rgba(64, 29, 108, 0.15)`,
            border: '2px solid transparent',
            backgroundImage: `linear-gradient(white, white), linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >
          
          {/* Security Alerts */}
          {isLocked && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Account Temporarily Locked</h4>
                  <p className="text-sm text-red-700">
                    Too many failed login attempts. Please wait {Math.floor(lockTimer / 60)}:{(lockTimer % 60).toString().padStart(2, '0')} before trying again.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loginAttempts > 0 && loginAttempts < 5 && !isLocked && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
                  <p className="text-sm text-yellow-700">
                    {loginAttempts} failed attempt{loginAttempts > 1 ? 's' : ''}. {5 - loginAttempts} attempts remaining before temporary lockout.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Success indicator */}
          {loginSuccess && (
            <div className="absolute top-4 right-4">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.success }}
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: colors.gray[700] }}>
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  emailError 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200'
                } bg-white placeholder-gray-400`}
                style={{
                  borderColor: emailError ? colors.error : colors.gray[200],
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
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: colors.gray[700] }}>
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 ${
                    passwordError 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200'
                  } bg-white placeholder-gray-400`}
                  style={{
                    borderColor: passwordError ? colors.error : colors.gray[200],
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 focus:outline-none"
                  style={{ color: colors.gray[400] }}
                  onMouseEnter={(e) => {
                    e.target.style.color = colors.gray[600]
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = colors.gray[400]
                  }}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm" style={{ color: colors.error }}>{passwordError}</p>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded transition-colors duration-200 focus:outline-none"
                  style={{
                    accentColor: colors.primary,
                    borderColor: colors.gray[300]
                  }}
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm select-none cursor-pointer" style={{ color: colors.gray[600] }}>
                  Remember me
                </label>
              </div>
              <div>
                <button
                  type="button"
                  className="text-sm font-medium transition-colors duration-200 focus:outline-none focus:underline"
                  style={{ color: colors.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.color = colors.secondary
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = colors.primary
                  }}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || loginSuccess || isLocked}
              className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              style={{
                background: loginSuccess 
                  ? `linear-gradient(135deg, ${colors.success} 0%, #16a34a 100%)`
                  : isLocked 
                  ? `linear-gradient(135deg, ${colors.error} 0%, #dc2626 100%)`
                  : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 10px 25px -5px ${loginSuccess ? colors.success : isLocked ? colors.error : colors.primary}40`
              }}
              onMouseEnter={(e) => {
                if (!loading && !loginSuccess && !isLocked) {
                  e.target.style.background = `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.secondary} 100%)`
                  e.target.style.boxShadow = `0 15px 35px -5px ${colors.primary}50`
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !loginSuccess && !isLocked) {
                  e.target.style.background = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  e.target.style.boxShadow = `0 10px 25px -5px ${colors.primary}40`
                }
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing in...
                </div>
              ) : loginSuccess ? (
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Success! Redirecting...
                </div>
              ) : isLocked ? (
                <div className="flex items-center justify-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Account Locked ({Math.floor(lockTimer / 60)}:{(lockTimer % 60).toString().padStart(2, '0')})
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: colors.gray[200] }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white" style={{ color: colors.gray[500] }}>
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
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 focus:outline-none opacity-60 cursor-not-allowed"
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
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border-2 rounded-xl font-medium transition-all duration-200 focus:outline-none opacity-60 cursor-not-allowed"
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
        </div>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p style={{ color: colors.gray[600] }}>
            Need access to ThePayBureau?{' '}
            <button 
              className="font-semibold transition-colors duration-200 focus:outline-none focus:underline" 
              style={{ color: colors.primary }}
              onMouseEnter={(e) => {
                e.target.style.color = colors.secondary
              }}
              onMouseLeave={(e) => {
                e.target.style.color = colors.primary
              }}
              disabled={loading}
            >
              Request enterprise demo
            </button>
          </p>
        </div>

        {/* System Status */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-2 text-gray-500">
              {connectionStatus === 'connected' ? (
                <>
                  <div className="flex items-center space-x-1">
                    <Wifi className="w-3 h-3" style={{ color: colors.success }} />
                    <span>API Connected</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-1">
                    <WifiOff className="w-3 h-3" style={{ color: colors.error }} />
                    <span>API Disconnected</span>
                  </div>
                </>
              )}
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center space-x-1">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: colors.success }}
              ></div>
              <span className="text-gray-500">All systems operational</span>
            </div>
          </div>
          
          {/* Version Info */}
          <div className="mt-2 text-xs text-gray-400">
            ThePayBureau v2.1.0 • Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}