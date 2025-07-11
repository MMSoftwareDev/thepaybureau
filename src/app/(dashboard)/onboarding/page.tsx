'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Shield,
  CreditCard,
  Building2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OnboardingTask {
  id: number
  title: string
  description: string
  category: string
  required: boolean
  completed: boolean
}

interface OnboardingClient {
  id: string
  name: string
  email?: string
  phone?: string
  industry?: string
  employee_count?: number
  created_at: string
  client_onboarding?: {
    id: string
    tasks: OnboardingTask[]
    progress_percentage: number
    completed_at?: string
  }[]
}

export default function OnboardingPage() {
  const [clients, setClients] = useState<OnboardingClient[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
    fetchOnboardingClients()
  }, [])

  const fetchOnboardingClients = async () => {
    try {
      const response = await fetch('/api/onboarding')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching onboarding clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Legal': return <FileText className="w-4 h-4" />
      case 'Financial': return <CreditCard className="w-4 h-4" />
      case 'Compliance': return <Shield className="w-4 h-4" />
      case 'HMRC': return <Building2 className="w-4 h-4" />
      case 'Pensions': return <Users className="w-4 h-4" />
      case 'Data': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return colors.success
    if (percentage >= 50) return colors.secondary
    return colors.warning
  }

  const getStatusText = (percentage: number) => {
    if (percentage === 100) return 'Ready for Activation'
    if (percentage >= 50) return 'In Progress'
    return 'Just Started'
  }

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 rounded-xl bg-gray-200"></div>
        <div className="h-96 rounded-xl bg-gray-200"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.lightBg }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
          <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>Loading onboarding clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ 
            color: colors.text.primary 
          }}>
            Client Onboarding
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ 
            color: colors.text.secondary 
          }}>
            Manage new client setup and activation process
          </p>
        </div>
        
        <Button 
          onClick={() => router.push('/dashboard/clients/add')}
          className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 10px 25px ${colors.primary}30`
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Onboarding',
            value: clients.length,
            icon: Users,
            color: colors.primary
          },
          {
            title: 'Ready to Activate',
            value: clients.filter(c => c.client_onboarding?.[0]?.progress_percentage === 100).length,
            icon: CheckCircle2,
            color: colors.success
          },
          {
            title: 'In Progress',
            value: clients.filter(c => {
              const progress = c.client_onboarding?.[0]?.progress_percentage || 0
              return progress > 0 && progress < 100
            }).length,
            icon: Clock,
            color: colors.secondary
          },
          {
            title: 'Need Attention',
            value: clients.filter(c => (c.client_onboarding?.[0]?.progress_percentage || 0) === 0).length,
            icon: AlertCircle,
            color: colors.warning
          }
        ].map((stat, index) => (
          <Card 
            key={index}
            className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
            style={{
              backgroundColor: colors.glass.card,
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: `1px solid ${colors.borderElevated}`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                    {stat.value}
                  </p>
                </div>
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: `${stat.color}20`,
                    boxShadow: `0 8px 25px ${stat.color}30`
                  }}
                >
                  <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client List */}
      <Card 
        className="border-0 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`
        }}
      >
        <CardHeader>
          <CardTitle className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Clients in Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: colors.text.muted }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
                No clients in onboarding
              </h3>
              <p className="mb-6" style={{ color: colors.text.secondary }}>
                Add your first client to start the onboarding process
              </p>
              <Button 
                onClick={() => router.push('/dashboard/clients/add')}
                className="text-white font-semibold px-6 py-3 rounded-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Client
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => {
                const onboarding = client.client_onboarding?.[0]
                const progress = onboarding?.progress_percentage || 0
                const tasks = onboarding?.tasks || []
                const completedRequired = tasks.filter(t => t.required && t.completed).length
                const totalRequired = tasks.filter(t => t.required).length

                return (
                  <div 
                    key={client.id}
                    className="p-6 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer"
                    style={{
                      backgroundColor: colors.glass.surface,
                      borderColor: colors.borderElevated
                    }}
                    onClick={() => router.push(`/onboarding/${client.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
                            {client.name}
                          </h3>
                          <Badge 
                            className="text-white font-semibold"
                            style={{ 
                              backgroundColor: getStatusColor(progress),
                              boxShadow: `0 4px 15px ${getStatusColor(progress)}30`
                            }}
                          >
                            {getStatusText(progress)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                              Email: {client.email || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                              Employees: {client.employee_count || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                              Industry: {client.industry || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                              Required Tasks: {completedRequired}/{totalRequired}
                            </span>
                            <span className="text-sm font-bold" style={{ color: colors.text.primary }}>
                              {progress}%
                            </span>
                          </div>
                          <Progress 
                            value={progress} 
                            className="h-2"
                            style={{
                              backgroundColor: colors.glass.surfaceActive
                            }}
                          />
                        </div>
                      </div>

                      <div className="ml-6">
                        {progress === 100 ? (
                          <Button
                            className="text-white font-bold px-6 py-3 rounded-xl shadow-lg"
                            style={{
                              background: `linear-gradient(135deg, ${colors.success} 0%, #16a34a 100%)`,
                              boxShadow: `0 10px 25px ${colors.success}30`
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Activate Client
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="font-semibold px-6 py-3 rounded-xl"
                            style={{
                              borderColor: colors.borderElevated,
                              color: colors.text.secondary
                            }}
                          >
                            Continue Setup
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}