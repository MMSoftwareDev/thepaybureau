'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { ArrowLeft, Building2, Save, UserPlus } from 'lucide-react'

interface SimpleClientForm {
  name: string
  email: string
  phone: string
  industry: string
  employee_count: string
  address: {
    street: string
    city: string
    postcode: string
    country: string
  }
  notes: string
}

export default function AddClientPage() {
  const [formData, setFormData] = useState<SimpleClientForm>({
    name: '',
    email: '',
    phone: '',
    industry: '',
    employee_count: '',
    address: {
      street: '',
      city: '',
      postcode: '',
      country: 'United Kingdom'
    },
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateFormData = (updates: Partial<SimpleClientForm>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateAddress = (updates: Partial<SimpleClientForm['address']>) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, ...updates }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employee_count: parseInt(formData.employee_count) || 0,
          status: 'onboarding' // Automatically set to onboarding
        })
      })

      if (response.ok) {
        alert('Client added successfully! They have been added to the onboarding queue.')
        router.push('/onboarding') // Redirect to onboarding page
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to create client'}`)
      }
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Error creating client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 rounded-xl bg-gray-200"></div>
        <div className="h-96 rounded-xl bg-gray-200"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold transition-colors duration-300" style={{ 
            color: colors.text.primary 
          }}>
            Add New Client
          </h1>
          <p className="text-base md:text-lg transition-colors duration-300 mt-2" style={{ 
            color: colors.text.secondary 
          }}>
            Add basic client information. They will be automatically added to the onboarding queue.
          </p>
        </div>
        
        <Button 
          variant="outline"
          onClick={() => router.push('/dashboard/clients')}
          className="rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg self-start sm:self-auto"
          style={{
            borderColor: colors.borderElevated,
            color: colors.text.secondary,
            backgroundColor: colors.glass.surface,
            backdropFilter: 'blur(10px)'
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      {/* Main Form Card */}
      <Card 
        className="border-0 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark 
            ? `0 15px 35px ${colors.shadow.medium}` 
            : `0 10px 25px ${colors.shadow.light}`
        }}
      >
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center text-xl md:text-2xl font-bold transition-colors duration-300" style={{ 
            color: colors.text.primary 
          }}>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 8px 25px ${colors.primary}30`
              }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
            Client Information
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold transition-colors duration-300" style={{ 
                color: colors.text.primary 
              }}>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="font-semibold" style={{ color: colors.text.primary }}>
                    Company Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    placeholder="ABC Company Ltd"
                    required
                    className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                    style={{
                      background: colors.glass.surface,
                      color: colors.text.primary,
                      border: `1px solid ${colors.borderElevated}`
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="font-semibold" style={{ color: colors.text.primary }}>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    placeholder="contact@company.com"
                    className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                    style={{
                      background: colors.glass.surface,
                      color: colors.text.primary,
                      border: `1px solid ${colors.borderElevated}`
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone" className="font-semibold" style={{ color: colors.text.primary }}>
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    placeholder="+44 20 1234 5678"
                    className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                    style={{
                      background: colors.glass.surface,
                      color: colors.text.primary,
                      border: `1px solid ${colors.borderElevated}`
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="industry" className="font-semibold" style={{ color: colors.text.primary }}>
                    Industry
                  </Label>
                  <Select value={formData.industry} onValueChange={(value) => updateFormData({ industry: value })}>
                    <SelectTrigger 
                      className="mt-2 rounded-xl border-0 shadow-lg"
                      style={{
                        background: colors.glass.surface,
                        color: colors.text.primary,
                        border: `1px solid ${colors.borderElevated}`
                      }}
                    >
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="max-w-sm">
                <Label htmlFor="employee_count" className="font-semibold" style={{ color: colors.text.primary }}>
                  Number of Employees
                </Label>
                <Input
                  id="employee_count"
                  type="number"
                  value={formData.employee_count}
                  onChange={(e) => updateFormData({ employee_count: e.target.value })}
                  placeholder="25"
                  className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                  style={{
                    background: colors.glass.surface,
                    color: colors.text.primary,
                    border: `1px solid ${colors.borderElevated}`
                  }}
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold transition-colors duration-300" style={{ 
                color: colors.text.primary 
              }}>
                Company Address
              </h3>
              
              <div>
                <Label htmlFor="street" className="font-semibold" style={{ color: colors.text.primary }}>
                  Street Address
                </Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => updateAddress({ street: e.target.value })}
                  placeholder="123 Business Street"
                  className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                  style={{
                    background: colors.glass.surface,
                    color: colors.text.primary,
                    border: `1px solid ${colors.borderElevated}`
                  }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="city" className="font-semibold" style={{ color: colors.text.primary }}>
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => updateAddress({ city: e.target.value })}
                    placeholder="London"
                    className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                    style={{
                      background: colors.glass.surface,
                      color: colors.text.primary,
                      border: `1px solid ${colors.borderElevated}`
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="postcode" className="font-semibold" style={{ color: colors.text.primary }}>
                    Postcode
                  </Label>
                  <Input
                    id="postcode"
                    value={formData.address.postcode}
                    onChange={(e) => updateAddress({ postcode: e.target.value })}
                    placeholder="SW1A 1AA"
                    className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                    style={{
                      background: colors.glass.surface,
                      color: colors.text.primary,
                      border: `1px solid ${colors.borderElevated}`
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="country" className="font-semibold" style={{ color: colors.text.primary }}>
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.address.country}
                    onChange={(e) => updateAddress({ country: e.target.value })}
                    className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                    style={{
                      background: colors.glass.surface,
                      color: colors.text.primary,
                      border: `1px solid ${colors.borderElevated}`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <Label htmlFor="notes" className="font-semibold" style={{ color: colors.text.primary }}>
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                placeholder="Any additional information about this client..."
                rows={4}
                className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300 resize-none"
                style={{
                  background: colors.glass.surface,
                  color: colors.text.primary,
                  border: `1px solid ${colors.borderElevated}`
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t" style={{ borderColor: colors.borderElevated }}>
              <div className="text-sm transition-colors duration-300" style={{ color: colors.text.muted }}>
                * Required fields. Client will be added to onboarding queue with 0% progress.
              </div>
              
              <Button 
                type="submit" 
                disabled={loading || !formData.name}
                className="w-full sm:w-auto text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  boxShadow: `0 10px 25px ${colors.primary}30`
                }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Client...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Client to Onboarding
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}