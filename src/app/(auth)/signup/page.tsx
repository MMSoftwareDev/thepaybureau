'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Sparkles, Building2, Mail, Lock, User, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    adminName: ''
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [emailValidation, setEmailValidation] = useState({
    isValid: null,
    message: '',
    suggestion: ''
  })
  
  // ThePayBureau brand colors
  const colors = {
    primary: '#1a365d',
    secondary: '#2d4a63',
    accent: '#3182ce',
    success: '#38a169',
    error: '#e53e3e',
    warning: '#d69e2e'
  }

  // Real-time email validation
  const validateEmail = useCallback((email) => {
    if (!email) {
      setEmailValidation({ isValid: null, message: '', suggestion: '' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const personalDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com']
    
    if (!emailRegex.test(email)) {
      setEmailValidation({
        isValid: false,
        message: 'Please enter a valid email address',
        suggestion: ''
      })
      return
    }

    const domain = email.split('@')[1]?.toLowerCase()
    
    if (personalDomains.includes(domain)) {
      setEmailValidation({
        isValid: false,
        message: 'Business email required',
        suggestion: `Try using your company email instead of ${domain}`
      })
      return
    }

    // Auto-suggest company name from domain
    const suggestedCompany = domain?.split('.')[0]
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    setEmailValidation({
      isValid: true,
      message: 'Business email verified',
      suggestion: suggestedCompany && !formData.companyName ? `Company: ${suggestedCompany}?` : ''
    })

    // Auto-fill company name if empty
    if (suggestedCompany && !formData.companyName) {
      setFormData(prev => ({ ...prev, companyName: suggestedCompany }))
    }
  }, [formData.companyName])

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Real-time email validation
    if (field === 'email') {
      validateEmail(value)
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (emailValidation.isValid === false) {
      newErrors.email = emailValidation.message
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }
    
    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Admin name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Success! Redirect to verification page
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        setErrors({ submit: data.error || 'Registration failed. Please try again.' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`
      }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-12 h-12 text-white mr-3" />
            <h1 className="text-3xl font-bold text-white">ThePayBureau</h1>
          </div>
          <p className="text-blue-100 text-lg">Start your payroll bureau journey</p>
        </div>

        {/* Signup Card */}
        <Card 
          className="shadow-2xl backdrop-blur-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: `0 25px 50px -12px ${colors.primary}20`,
            borderRadius: '24px',
            border: `1px solid rgba(255, 255, 255, 0.2)`
          }}
        >
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold" style={{ color: colors.primary }}>
              Create Your Account
            </CardTitle>
            <p className="text-gray-600 mt-2">Get started with your free playground account</p>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Submit Error */}
              {errors.submit && (
                <div 
                  className="p-4 rounded-xl flex items-center gap-3"
                  style={{ background: `${colors.error}10`, border: `1px solid ${colors.error}30` }}
                >
                  <AlertCircle className="w-5 h-5" style={{ color: colors.error }} />
                  <span style={{ color: colors.error }} className="text-sm font-medium">
                    {errors.submit}
                  </span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-11 py-3 rounded-xl border-2 transition-all duration-200 ${
                      errors.email ? 'border-red-300' : 
                      emailValidation.isValid === true ? 'border-green-300' : 
                      emailValidation.isValid === false ? 'border-orange-300' : 'border-gray-200'
                    }`}
                    placeholder="admin@yourcompany.com"
                  />
                </div>
                
                {/* Email Validation Feedback */}
                {emailValidation.message && (
                  <div className={`flex items-center gap-2 text-sm ${
                    emailValidation.isValid ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {emailValidation.isValid ? 
                      <CheckCircle className="w-4 h-4" /> : 
                      <AlertCircle className="w-4 h-4" />
                    }
                    {emailValidation.message}
                  </div>
                )}
                
                {emailValidation.suggestion && (
                  <div className="text-xs text-gray-500 italic">
                    💡 {emailValidation.suggestion}
                  </div>
                )}
                
                {errors.email && (
                  <div className="text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={`pl-11 py-3 rounded-xl border-2 transition-all duration-200 ${
                      errors.companyName ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Your Company Ltd"
                  />
                </div>
                {errors.companyName && (
                  <div className="text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.companyName}
                  </div>
                )}
              </div>

              {/* Admin Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => handleInputChange('adminName', e.target.value)}
                    className={`pl-11 py-3 rounded-xl border-2 transition-all duration-200 ${
                      errors.adminName ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="John Smith"
                  />
                </div>
                {errors.adminName && (
                  <div className="text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.adminName}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-11 py-3 rounded-xl border-2 transition-all duration-200 ${
                      errors.password ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="8+ characters with upper, lower, number"
                  />
                </div>
                {errors.password && (
                  <div className="text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || emailValidation.isValid === false}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                  border: 'none'
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Create Account
                  </div>
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    href="/login" 
                    className="font-semibold hover:underline transition-colors duration-200"
                    style={{ color: colors.accent }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <p className="text-blue-100 text-sm mb-4">What you'll get:</p>
          <div className="flex justify-center space-x-6 text-blue-100 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Client Management
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Demo Playground
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Free Forever
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
