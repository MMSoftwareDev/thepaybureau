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
  Camera,
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

  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

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
        setAvatarUrl(userRecord.avatar_url || null)
        setTenantId(userRecord.tenant_id || '')
        const tenant = userRecord.tenants as { settings: TenantSettings | null } | null
        const settings = (tenant?.settings || {}) as TenantSettings
        setTenantSettings(settings)
        setChecklistItems(settings.default_checklist || DEFAULT_CHECKLIST)
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

  const showMessage = (setter: (msg: string) => void, message: string, duration = 3000) => {
    setter(message)
    setTimeout(() => setter(''), duration)
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    setSavingProfile(true)
    try {
      const { error } = await supabase.from('users').update({ name: userName }).eq('id', userId)
      if (error) throw error
      showMessage(setProfileMessage, 'Profile saved!')
    } catch (err) {
      console.error('Error saving profile:', err)
      showMessage(setProfileMessage, 'Error saving profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      showMessage(setProfileMessage, 'Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage(setProfileMessage, 'Image must be under 2MB.')
      return
    }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Save URL to user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      showMessage(setProfileMessage, 'Profile photo updated!')
    } catch (err) {
      console.error('Error uploading avatar:', err)
      showMessage(setProfileMessage, 'Error uploading photo. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const updateChecklistItem = (index: number, name: string) =>
    setChecklistItems((prev) => prev.map((item, i) => (i === index ? { ...item, name } : item)))
  const removeChecklistItem = (index: number) =>
    setChecklistItems((prev) => prev.filter((_, i) => i !== index))
  const addChecklistItem = () =>
    setChecklistItems((prev) => [...prev, { name: '', sort_order: prev.length }])

  const handleSaveChecklist = async () => {
    if (!tenantId) return
    setSavingChecklist(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          settings: {
            ...tenantSettings,
            default_checklist: checklistItems.map((item, idx) => ({ name: item.name, sort_order: idx })),
          },
        })
        .eq('id', tenantId)
      if (error) throw error
      showMessage(setChecklistMessage, 'Defaults saved!')
    } catch (err) {
      console.error('Error saving checklist defaults:', err)
      showMessage(setChecklistMessage, 'Error saving defaults. Please try again.')
    } finally {
      setSavingChecklist(false)
    }
  }

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  }

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
    color: colors.text.primary,
    border: `1px solid ${colors.border}`,
  }

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
        <div className="h-14 rounded-2xl" style={{ background: colors.border }} />
        <div className="h-52 rounded-2xl" style={{ background: colors.border }} />
        <div className="h-52 rounded-2xl" style={{ background: colors.border }} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
          Settings
        </h1>
        <p className="text-[0.82rem] mt-0.5" style={{ color: colors.text.muted }}>
          Manage your profile, defaults, and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-bold" style={{ color: colors.text.primary }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
              <User className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
            </div>
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                >
                  {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: 'rgba(0,0,0,0.5)' }}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <div>
              <p className="text-[0.85rem] font-semibold" style={{ color: colors.text.primary }}>
                Profile photo
              </p>
              <p className="text-[0.75rem]" style={{ color: colors.text.muted }}>
                Click the image to upload. Max 2MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="profile-name" className="text-[0.78rem] font-semibold uppercase tracking-[0.04em]" style={{ color: colors.text.muted }}>
                Name
              </Label>
              <Input
                id="profile-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5 h-10 rounded-xl border-0 text-[0.88rem] font-medium"
                style={inputStyle}
              />
            </div>
            <div>
              <Label htmlFor="profile-email" className="text-[0.78rem] font-semibold uppercase tracking-[0.04em]" style={{ color: colors.text.muted }}>
                Email
              </Label>
              <Input
                id="profile-email"
                value={userEmail}
                readOnly
                className="mt-1.5 h-10 rounded-xl border-0 text-[0.88rem] font-medium opacity-60 cursor-not-allowed"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="text-white font-semibold py-2 px-5 rounded-xl border-0 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, var(--login-purple), var(--login-pink))',
                boxShadow: '0 8px 24px rgba(64, 29, 108, 0.25)',
              }}
            >
              {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
            </Button>
            {profileMessage && (
              <span className="text-[0.82rem] font-semibold" style={{ color: profileMessage.includes('Error') ? colors.error : colors.success }}>
                {profileMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Default Checklist */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-bold" style={{ color: colors.text.primary }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
              <ListChecks className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
            </div>
            Default Checklist Template
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-[0.82rem] mb-5" style={{ color: colors.text.secondary }}>
            Define the default checklist steps that are pre-populated when creating a new client.
          </p>
          <div className="space-y-2.5">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <span className="text-[0.75rem] font-bold w-7 text-center flex-shrink-0" style={{ color: colors.text.muted }}>
                  {index + 1}
                </span>
                <Input
                  value={item.name}
                  onChange={(e) => updateChecklistItem(index, e.target.value)}
                  placeholder="Step name"
                  className="flex-1 h-9 rounded-lg border-0 text-[0.85rem] font-medium"
                  style={inputStyle}
                />
                <button
                  onClick={() => removeChecklistItem(index)}
                  className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  style={{ color: colors.error }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            onClick={addChecklistItem}
            variant="outline"
            size="sm"
            className="mt-3 rounded-lg font-semibold text-[0.82rem]"
            style={{ borderColor: colors.border, color: colors.text.secondary }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Step
          </Button>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: colors.border }}>
            <Button
              onClick={handleSaveChecklist}
              disabled={savingChecklist}
              className="text-white font-semibold py-2 px-5 rounded-xl border-0 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, var(--login-purple), var(--login-pink))',
                boxShadow: '0 8px 24px rgba(64, 29, 108, 0.25)',
              }}
            >
              {savingChecklist ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Defaults</>}
            </Button>
            {checklistMessage && (
              <span className="text-[0.82rem] font-semibold" style={{ color: checklistMessage.includes('Error') ? colors.error : colors.success }}>
                {checklistMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-bold" style={{ color: colors.text.primary }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
              {isDark ? <Moon className="w-[18px] h-[18px]" style={{ color: colors.primary }} /> : <Sun className="w-[18px] h-[18px]" style={{ color: colors.primary }} />}
            </div>
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.88rem] font-semibold" style={{ color: colors.text.primary }}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-[0.78rem] mt-0.5" style={{ color: colors.text.muted }}>
                Switch between light and dark appearance.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-14 h-8 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isDark ? colors.primary : colors.border,
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
                style={{
                  left: isDark ? '28px' : '4px',
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                }}
              >
                {isDark ? <Moon className="w-3.5 h-3.5" style={{ color: colors.primary }} /> : <Sun className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-0" style={cardStyle}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
              <Info className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="text-[0.88rem] font-bold" style={{ color: colors.text.primary }}>
                ThePayBureau Pro v2.1
              </p>
              <p className="text-[0.78rem]" style={{ color: colors.text.muted }}>
                Payroll bureau management made simple.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
