// src/app/(dashboard)/onboarding/[clientId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Building2,
  Shield,
  CreditCard,
  FileText,
  Users,
  Calendar,
  CheckSquare,
  Loader2
} from 'lucide-react'

interface OnboardingTask {
  id: string
  name: string
  description: string
  category: string
  required: boolean
  completed: boolean
  completed_at?: string
  order_index: number
}

interface ClientOnboardingData {
  client: {
    id: string
    name: string
    status: string
  }
  onboarding: {
    id: string
    status: string
    progress_percentage: number
    tasks: OnboardingTask[]
    created_at: string
    updated_at: string
  }
}

// Category icons and colors
const categoryConfig = {
  'Legal': { icon: FileText, color: '#401D6C' },
  'Financial': { icon: CreditCard, color: '#EC385D' },
  'Compliance': { icon: Shield, color: '#22C55E' },
  'HMRC': { icon: Building2, color: '#F59E0B' },
  'Data': { icon: Users, color: '#3B82F6' },
  'Pensions': { icon: Calendar, color: '#8B5CF6' }
}

export default function ClientOnboardingPage() {
  const { clientId } = useParams()
  const router = useRouter()
  const [data, setData] = useState<ClientOnboardingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
    if (clientId) {
      fetchOnboardingData()
    }
  }, [clientId])

  const fetchOnboardingData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/onboarding/${clientId}`)
      
      if (response.ok) {
        const responseData = await response.json()
        setData(responseData)
      } else {
        console.error('Failed to fetch onboarding data')
        // Could redirect back to onboarding list if client not found
        if (response.status === 404) {
          router.push('/onboarding')
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!data) return
    
    setUpdating(taskId)
    
    try {
      const response = await fetch(`/api/onboarding/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          completed
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update local state with new progress
        setData(prevData => {
          if (!prevData) return null
          
          return {
            ...prevData,
            onboarding: {
              ...prevData.onboarding,
              progress_percentage: result.progress_percentage,
              status: result.status,
              tasks: prevData.onboarding.tasks.map(task => 
                task.id === taskId 
                  ? { ...task, completed, completed_at: completed ? new Date().toISOString() : undefined }
                  : task
              )
            }
          }
        })
      } else {
        alert('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Error updating task')
    } finally {
      setUpdating(null)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!data || data.onboarding.progress_percentage !== 100) return
    
    setCompleting(true)
    
    try {
      const response = await fetch(`/api/onboarding/${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete_onboarding'
        }),
      })

      if (response.ok) {
        alert('Client successfully moved to active status!')
        router.push('/onboarding')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Error completing onboarding')
    } finally {
      setCompleting(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    const config = categoryConfig[category as keyof typeof categoryConfig]
    if (!config) return FileText
    return config.icon
  }

  const getCategoryColor = (category: string) => {
    const config = categoryConfig[category as keyof typeof categoryConfig]
    if (!config) return colors.primary
    return config.color
  }

  // Group tasks by category
  const groupedTasks = data?.onboarding.tasks.reduce((groups, task) => {
    const category = task.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(task)
    return groups
  }, {} as Record<string, OnboardingTask[]>) || {}

  // Sort tasks within each category by order_index
  Object.keys(groupedTasks).forEach(category => {
    groupedTasks[category].sort((a, b) => a.order_index - b.order_index)
  })

  // Prevent hydration mismatch
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
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-300" 
        style={{ backgroundColor: colors.lightBg }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
          <p className="text-xl font-semibold transition-colors duration-300" style={{ color: colors.text.primary }}>
            Loading client onboarding...
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-300" 
        style={{ backgroundColor: colors.lightBg }}
      >
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Not Found</h3>
            <p className="text-gray-600 mb-4">The client onboarding data could not be found.</p>
            <Button onClick={() => router.push('/onboarding')}>
              Back to Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline"
            onClick={() => router.push('/onboarding')}
            className="rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            style={{
              borderColor: colors.borderElevated,
              color: colors.text.secondary,
              backgroundColor: colors.glass.surface,
              backdropFilter: 'blur(10px)'
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Onboarding
          </Button>
          
          <div>
            <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ 
              color: colors.text.primary 
            }}>
              {data.client.name}
            </h1>
            <p className="text-lg transition-colors duration-300" style={{ 
              color: colors.text.secondary 
            }}>
              Client Onboarding Progress
            </p>
          </div>
        </div>

        {data.onboarding.progress_percentage === 100 && (
          <Button 
            onClick={handleCompleteOnboarding}
            disabled={completing}
            className="px-6 py-3 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-xl"
            style={{ 
              background: `linear-gradient(135deg, ${colors.success} 0%, #16a34a 100%)`,
              boxShadow: `0 10px 25px ${colors.success}30`
            }}
          >
            {completing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Moving to Active...
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 mr-2" />
                Move to Active Client
              </>
            )}
          </Button>
        )}
      </div>

      {/* Progress Overview */}
      <Card 
        className="border-0 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`
        }}
      >
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold transition-colors duration-300" style={{ 
                color: colors.text.primary 
              }}>
                Onboarding Progress
              </h3>
              <p className="text-sm font-medium transition-colors duration-300" style={{ 
                color: colors.text.muted 
              }}>
                Complete all required tasks to activate this client
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold transition-colors duration-300" style={{ 
                color: colors.primary 
              }}>
                {data.onboarding.progress_percentage}%
              </div>
              <Badge 
                className="text-white font-bold px-3 py-1 shadow-lg mt-2"
                style={{
                  backgroundColor: 
                    data.onboarding.progress_percentage === 100 ? colors.success :
                    data.onboarding.progress_percentage > 0 ? colors.secondary :
                    colors.primary,
                  boxShadow: `0 4px 15px ${
                    data.onboarding.progress_percentage === 100 ? colors.success :
                    data.onboarding.progress_percentage > 0 ? colors.secondary :
                    colors.primary
                  }40`
                }}
              >
                {data.onboarding.status === 'completed' ? 'Ready to Activate' :
                 data.onboarding.status === 'in_progress' ? 'In Progress' :
                 'Not Started'}
              </Badge>
            </div>
          </div>
          
          <Progress 
            value={data.onboarding.progress_percentage} 
            className="h-4 rounded-full"
            style={{
              backgroundColor: colors.glass.surfaceActive
            }}
          />
        </CardContent>
      </Card>

      {/* Task Categories */}
      <div className="space-y-6">
        {Object.keys(groupedTasks).map((category) => {
          const tasks = groupedTasks[category]
          const categoryIcon = getCategoryIcon(category)
          const categoryColor = getCategoryColor(category)
          const completedTasks = tasks.filter(task => task.completed)
          const categoryProgress = Math.round((completedTasks.length / tasks.length) * 100)

          return (
            <Card 
              key={category}
              className="border-0 shadow-xl"
              style={{
                backgroundColor: colors.glass.card,
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: `1px solid ${colors.borderElevated}`
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ 
                        backgroundColor: `${categoryColor}20`,
                        border: `2px solid ${categoryColor}30`
                      }}
                    >
                      {React.createElement(categoryIcon, { 
                        className: "w-6 h-6", 
                        style: { color: categoryColor } 
                      })}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold transition-colors duration-300" style={{ 
                        color: colors.text.primary 
                      }}>
                        {category}
                      </CardTitle>
                      <p className="text-sm font-medium transition-colors duration-300" style={{ 
                        color: colors.text.muted 
                      }}>
                        {completedTasks.length} of {tasks.length} tasks completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: categoryColor }}>
                      {categoryProgress}%
                    </div>
                    <Progress 
                      value={categoryProgress} 
                      className="h-2 w-24 mt-2"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.01] group cursor-pointer"
                      style={{ 
                        backgroundColor: task.completed ? `${colors.success}10` : colors.glass.surfaceHover,
                        border: `1px solid ${task.completed ? colors.success : colors.borderElevated}20`
                      }}
                      onClick={() => handleTaskToggle(task.id, !task.completed)}
                    >
                      <div className="flex-shrink-0">
                        {updating === task.id ? (
                          <Loader2 className="w-6 h-6 animate-spin" style={{ color: categoryColor }} />
                        ) : task.completed ? (
                          <CheckCircle2 className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" style={{ color: colors.success }} />
                        ) : (
                          <Circle className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" style={{ color: colors.text.muted }} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold transition-colors duration-300 ${
                            task.completed ? 'line-through' : ''
                          }`} style={{ 
                            color: task.completed ? colors.text.muted : colors.text.primary 
                          }}>
                            {task.name}
                            {task.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </h4>
                          {task.completed && task.completed_at && (
                            <div className="flex items-center text-xs font-medium" style={{ color: colors.success }}>
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(task.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <p className="text-sm transition-colors duration-300" style={{ 
                          color: colors.text.muted 
                        }}>
                          {task.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}