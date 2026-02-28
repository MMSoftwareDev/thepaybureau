'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { createClientSupabaseClient } from '@/lib/supabase'
import {
  User,
  ListChecks,
  Sun,
  Moon,
  Info,
  Save,
  Plus,
  X,
  Loader2,
} from 'lucide-react'

interface ChecklistDefault {
  name: string
  sort_order: number
}

interface TenantSettings {
  default_checklist?: ChecklistDefault[]
  [key: string]: unknown
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  // Profile state
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  // Checklist defaults state
  const [checklistItems, setChecklistItems] = useState<ChecklistDefault[]>([])
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({})
  const [savingChecklist, setSavingChecklist] = useState(false)
  const [checklistMessage, setChecklistMessage] = useState('')

  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)

  const supabase = createClientSupabaseClient()

  const DEFAULT_CHECKLIST: ChecklistDefault[] = [
    { name: 'Receive payroll changes', sort_order: 0 },
    { name: 'Process payroll', sort_order: 1 },
    { name: 'Review & approve', sort_order: 2 },
    { name: 'Send payslips', sort_order: 3 },
    { name: 'Submit RTI to HMRC', sort_order: 4 },
    { name: 'BACS payment', sort_order: 5 },
    { name: 'Pension submission', sort_order: 6 },
  ]

  // Fetch user data and tenant settings
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: userRecord } = await supabase
        .from('users')
        .select('*, tenants(settings)')
        .eq('id', authUser.id)
        .single()

      if (userRecord) {
        setUserId(userRecord.id)
        setUserName(userRecord.name || '')
        setUserEmail(userRecord.email || '')
        setTenantId(userRecord.tenant_id || '')

        const tenant = userRecord.tenants as { settings: TenantSettings | null } | null
        const settings = (tenant?.settings || {}) as TenantSettings
        setTenantSettings(settings)

        const defaults = settings.default_checklist || DEFAULT_CHECKLIST
        setChecklistItems(defaults)
      }
    } catch (err) {
      console.error('Error fetching settings data:', err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [fetchData])

  // Show a temporary success/error message
  const showMessage = (
    setter: (msg: string) => void,
    message: string,
    duration = 3000
  ) => {
    setter(message)
    setTimeout(() => setter(''), duration)
  }

  // Save profile name
  const handleSaveProfile = async () => {
    if (!userId) return
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: userName })
        .eq('id', userId)

      if (error) throw error
      showMessage(setProfileMessage, 'Profile saved!')
    } catch (err) {
      console.error('Error saving profile:', err)
      showMessage(setProfileMessage, 'Error saving profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Checklist item handlers
  const updateChecklistItem = (index: number, name: string) => {
    setChecklistItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, name } : item))
    )
  }

  const removeChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index))
  }

  const addChecklistItem = () => {
    setChecklistItems(prev => [
      ...prev,
      { name: '', sort_order: prev.length },
    ])
  }

  // Save checklist defaults
  const handleSaveChecklist = async () => {
    if (!tenantId) return
    setSavingChecklist(true)
    try {
      const currentSettings = tenantSettings || {}
      const { error } = await supabase
        .from('tenants')
        .update({
          settings: {
            ...currentSettings,
            default_checklist: checklistItems.map((item, idx) => ({
              name: item.name,
              sort_order: idx,
            })),
          },
        })
        .eq('id', tenantId)

      if (error) throw error
      showMessage(setChecklistMessage, 'Defaults saved!')
    } catch (err) {
      console.error('Error saving checklist defaults:', err)
      showMessage(
        setChecklistMessage,
        'Error saving defaults. Please try again.'
      )
    } finally {
      setSavingChecklist(false)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 rounded-xl bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: isDark
                ? `0 25px 50px ${colors.shadow.heavy}`
                : `0 20px 40px ${colors.primary}30`,
            }}
          >
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <p
            className="text-xl font-semibold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            Loading settings...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-3xl md:text-4xl font-bold transition-colors duration-300"
          style={{ color: colors.text.primary }}
        >
          Settings
        </h1>
        <p
          className="text-base md:text-lg transition-colors duration-300 mt-2"
          style={{ color: colors.text.secondary }}
        >
          Manage your profile, defaults, and preferences.
        </p>
      </div>

      {/* Section 1: Profile */}
      <Card
        className="border-0 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark
            ? `0 15px 35px ${colors.shadow.medium}`
            : `0 10px 25px ${colors.shadow.light}`,
        }}
      >
        <CardHeader className="pb-6">
          <CardTitle
            className="flex items-center text-xl md:text-2xl font-bold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 8px 25px ${colors.primary}30`,
              }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
            Profile
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="profile-name"
                  className="font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  Name
                </Label>
                <Input
                  id="profile-name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300"
                  style={{
                    background: colors.glass.surface,
                    color: colors.text.primary,
                    border: `1px solid ${colors.borderElevated}`,
                  }}
                />
              </div>

              <div>
                <Label
                  htmlFor="profile-email"
                  className="font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  Email
                </Label>
                <Input
                  id="profile-email"
                  value={userEmail}
                  readOnly
                  className="mt-2 rounded-xl border-0 shadow-lg transition-all duration-300 opacity-70 cursor-not-allowed"
                  style={{
                    background: colors.glass.surface,
                    color: colors.text.secondary,
                    border: `1px solid ${colors.borderElevated}`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] border-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  boxShadow: `0 10px 25px ${colors.primary}30`,
                }}
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>

              {profileMessage && (
                <span
                  className="text-sm font-semibold transition-opacity duration-300"
                  style={{
                    color: profileMessage.includes('Error')
                      ? colors.error
                      : colors.success,
                  }}
                >
                  {profileMessage}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Default Checklist Template */}
      <Card
        className="border-0 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark
            ? `0 15px 35px ${colors.shadow.medium}`
            : `0 10px 25px ${colors.shadow.light}`,
        }}
      >
        <CardHeader className="pb-6">
          <CardTitle
            className="flex items-center text-xl md:text-2xl font-bold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 8px 25px ${colors.primary}30`,
              }}
            >
              <ListChecks className="w-6 h-6 text-white" />
            </div>
            Default Checklist Template
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <p
            className="text-sm mb-6 transition-colors duration-300"
            style={{ color: colors.text.secondary }}
          >
            Define the default checklist steps that are pre-populated when
            creating a new client.
          </p>

          <div className="space-y-3">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span
                  className="text-sm font-bold w-8 text-center flex-shrink-0"
                  style={{ color: colors.text.muted }}
                >
                  {index + 1}
                </span>
                <Input
                  value={item.name}
                  onChange={(e) => updateChecklistItem(index, e.target.value)}
                  placeholder="Step name"
                  className="flex-1 rounded-xl border-0 shadow-lg transition-all duration-300"
                  style={{
                    background: colors.glass.surface,
                    color: colors.text.primary,
                    border: `1px solid ${colors.borderElevated}`,
                  }}
                />
                <button
                  onClick={() => removeChecklistItem(index)}
                  className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: `${colors.error}15`,
                    color: colors.error,
                    border: `1px solid ${colors.error}30`,
                  }}
                  title="Remove step"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button
              onClick={addChecklistItem}
              variant="outline"
              className="rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-md"
              style={{
                borderColor: colors.borderElevated,
                color: colors.text.secondary,
                backgroundColor: colors.glass.surface,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-6 mt-6 border-t" style={{ borderColor: colors.borderElevated }}>
            <Button
              onClick={handleSaveChecklist}
              disabled={savingChecklist}
              className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] border-0"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 10px 25px ${colors.primary}30`,
              }}
            >
              {savingChecklist ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Defaults
                </>
              )}
            </Button>

            {checklistMessage && (
              <span
                className="text-sm font-semibold transition-opacity duration-300"
                style={{
                  color: checklistMessage.includes('Error')
                    ? colors.error
                    : colors.success,
                }}
              >
                {checklistMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Theme */}
      <Card
        className="border-0 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark
            ? `0 15px 35px ${colors.shadow.medium}`
            : `0 10px 25px ${colors.shadow.light}`,
        }}
      >
        <CardHeader className="pb-6">
          <CardTitle
            className="flex items-center text-xl md:text-2xl font-bold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 8px 25px ${colors.primary}30`,
              }}
            >
              {isDark ? (
                <Moon className="w-6 h-6 text-white" />
              ) : (
                <Sun className="w-6 h-6 text-white" />
              )}
            </div>
            Theme
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-base font-semibold transition-colors duration-300"
                style={{ color: colors.text.primary }}
              >
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p
                className="text-sm transition-colors duration-300 mt-1"
                style={{ color: colors.text.secondary }}
              >
                Switch between light and dark appearance.
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className="relative w-16 h-9 rounded-full transition-all duration-300 shadow-lg"
              style={{
                backgroundColor: isDark ? colors.primary : colors.border,
                boxShadow: isDark
                  ? `0 4px 15px ${colors.primary}40`
                  : `0 4px 15px ${colors.shadow.light}`,
              }}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <div
                className="absolute top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
                style={{
                  left: isDark ? '32px' : '4px',
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                }}
              >
                {isDark ? (
                  <Moon className="w-4 h-4" style={{ color: colors.primary }} />
                ) : (
                  <Sun className="w-4 h-4" style={{ color: '#F59E0B' }} />
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: About */}
      <Card
        className="border-0 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark
            ? `0 15px 35px ${colors.shadow.medium}`
            : `0 10px 25px ${colors.shadow.light}`,
        }}
      >
        <CardHeader className="pb-6">
          <CardTitle
            className="flex items-center text-xl md:text-2xl font-bold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 8px 25px ${colors.primary}30`,
              }}
            >
              <Info className="w-6 h-6 text-white" />
            </div>
            About
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <p
            className="text-base font-semibold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            ThePayBureau Pro v1.0
          </p>
          <p
            className="text-sm transition-colors duration-300 mt-1"
            style={{ color: colors.text.secondary }}
          >
            Payroll bureau management made simple.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
