'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
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
  Lock,
  Eye,
  EyeOff,
  Star,
  Trash2,
  Copy,
} from 'lucide-react'

interface ChecklistDefault {
  name: string
  sort_order: number
}

interface ChecklistTemplate {
  id: string
  name: string
  is_default: boolean
  steps: ChecklistDefault[]
}

interface TenantSettings {
  default_checklist?: ChecklistDefault[]
  checklist_templates?: ChecklistTemplate[]
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

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [, setTenantSettings] = useState<TenantSettings>({})
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

        // Load named templates, or migrate legacy default_checklist
        if (settings.checklist_templates?.length) {
          setTemplates(settings.checklist_templates)
          const defaultTpl = settings.checklist_templates.find((t) => t.is_default)
          setActiveTemplateId(defaultTpl?.id ?? settings.checklist_templates[0]?.id ?? '')
        } else {
          const steps = settings.default_checklist || DEFAULT_CHECKLIST
          const migrated: ChecklistTemplate = {
            id: crypto.randomUUID(),
            name: 'Default',
            is_default: true,
            steps,
          }
          setTemplates([migrated])
          setActiveTemplateId(migrated.id)
        }
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
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', name: userName }),
      })
      if (!res.ok) throw new Error('Failed to save')
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
      // Always use a fixed filename so re-uploads overwrite the old file
      const filePath = `${userId}/avatar`

      // Remove any existing avatars (old extension-based + new fixed name)
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId)
      if (existingFiles?.length) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map((f) => `${userId}/${f.name}`))
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL with cache-busting param
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`

      // Save URL to user record (via API for audit logging)
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_avatar', avatar_url: urlWithCacheBust }),
      })
      if (!res.ok) throw new Error('Failed to update avatar record')

      setAvatarUrl(urlWithCacheBust)
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: urlWithCacheBust }))
      showMessage(setProfileMessage, 'Profile photo updated!')
    } catch (err) {
      console.error('Error uploading avatar:', err)
      showMessage(setProfileMessage, 'Error uploading photo. Please try again.')
    } finally {
      setUploadingAvatar(false)
      // Reset the input so the same file can be re-selected
      e.target.value = ''
    }
  }

  const handleAvatarRemove = async () => {
    if (!userId) return
    setUploadingAvatar(true)
    try {
      // Remove all files in user's avatar folder
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId)
      if (existingFiles?.length) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map((f) => `${userId}/${f.name}`))
      }

      // Update user record via API for audit logging
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_avatar', avatar_url: null }),
      })
      if (!res.ok) throw new Error('Failed to update avatar record')

      setAvatarUrl(null)
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: null }))
      showMessage(setProfileMessage, 'Profile photo removed.')
    } catch (err) {
      console.error('Error removing avatar:', err)
      showMessage(setProfileMessage, 'Error removing photo. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setConfirmError('')

    let hasErrors = false

    if (!newPassword) {
      setPasswordError('Password is required')
      hasErrors = true
    } else if (newPassword.length < 8) {
      setPasswordError('Must be at least 8 characters')
      hasErrors = true
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password')
      hasErrors = true
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match')
      hasErrors = true
    }

    if (hasErrors) return

    setSavingPassword(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', password: newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update password')
      }
      setNewPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      showMessage(setPasswordMessage, 'Password updated successfully!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating password. Please try again.'
      setPasswordError(message)
    } finally {
      setSavingPassword(false)
    }
  }

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0]

  const updateTemplateStep = (index: number, name: string) =>
    setTemplates((prev) => prev.map((t) =>
      t.id === activeTemplateId
        ? { ...t, steps: t.steps.map((s, i) => (i === index ? { ...s, name } : s)) }
        : t
    ))

  const removeTemplateStep = (index: number) =>
    setTemplates((prev) => prev.map((t) =>
      t.id === activeTemplateId
        ? { ...t, steps: t.steps.filter((_, i) => i !== index) }
        : t
    ))

  const addTemplateStep = () =>
    setTemplates((prev) => prev.map((t) =>
      t.id === activeTemplateId
        ? { ...t, steps: [...t.steps, { name: '', sort_order: t.steps.length }] }
        : t
    ))

  const updateTemplateName = (name: string) =>
    setTemplates((prev) => prev.map((t) =>
      t.id === activeTemplateId ? { ...t, name } : t
    ))

  const addTemplate = () => {
    const newTemplate: ChecklistTemplate = {
      id: crypto.randomUUID(),
      name: 'New Template',
      is_default: false,
      steps: [{ name: '', sort_order: 0 }],
    }
    setTemplates((prev) => [...prev, newTemplate])
    setActiveTemplateId(newTemplate.id)
  }

  const duplicateTemplate = () => {
    if (!activeTemplate) return
    const dup: ChecklistTemplate = {
      id: crypto.randomUUID(),
      name: `${activeTemplate.name} (Copy)`,
      is_default: false,
      steps: activeTemplate.steps.map((s) => ({ ...s })),
    }
    setTemplates((prev) => [...prev, dup])
    setActiveTemplateId(dup.id)
  }

  const deleteTemplate = () => {
    if (templates.length <= 1) return
    const wasDefault = activeTemplate?.is_default
    const remaining = templates.filter((t) => t.id !== activeTemplateId)
    if (remaining.length === 0) return
    if (wasDefault) {
      remaining[0].is_default = true
    }
    setTemplates(remaining)
    setActiveTemplateId(remaining[0].id)
  }

  const setAsDefault = () =>
    setTemplates((prev) => prev.map((t) => ({
      ...t,
      is_default: t.id === activeTemplateId,
    })))

  const handleSaveChecklist = async () => {
    if (!tenantId) return
    setSavingChecklist(true)
    try {
      const normalized = templates.map((t) => ({
        ...t,
        steps: t.steps.map((s, idx) => ({ name: s.name, sort_order: idx })),
      }))
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_checklist_templates',
          templates: normalized,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      showMessage(setChecklistMessage, 'Templates saved!')
    } catch (err) {
      console.error('Error saving checklist templates:', err)
      showMessage(setChecklistMessage, 'Error saving templates. Please try again.')
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
        <div className="h-14 rounded-lg" style={{ background: colors.border }} />
        <div className="h-72 rounded-lg" style={{ background: colors.border }} />
        <div className="h-72 rounded-lg" style={{ background: colors.border }} />
        <div className="h-96 rounded-lg" style={{ background: colors.border }} />
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
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="rounded-xl object-cover"
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
                Hover to change. Max 2MB.
              </p>
              {avatarUrl && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={uploadingAvatar}
                  className="text-[0.75rem] font-medium mt-1 transition-colors duration-150"
                  style={{ color: colors.error }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                >
                  Remove photo
                </button>
              )}
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
                className="mt-1.5 h-10 rounded-lg border-0 text-[0.88rem] font-medium"
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
                className="mt-1.5 h-10 rounded-lg border-0 text-[0.88rem] font-medium opacity-60 cursor-not-allowed"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="text-white font-semibold py-2 px-5 rounded-lg border-0"
              style={{
                background: 'linear-gradient(135deg, var(--login-purple), var(--login-pink))',
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

      {/* Change Password */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-bold" style={{ color: colors.text.primary }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
              <Lock className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
            </div>
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-[0.82rem] mb-5" style={{ color: colors.text.secondary }}>
            Update your password. Must be at least 8 characters.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="new-password" className="text-[0.78rem] font-semibold uppercase tracking-[0.04em]" style={{ color: colors.text.muted }}>
                New password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={savingPassword}
                  className="h-10 rounded-lg border-0 text-[0.88rem] font-medium pr-10"
                  style={{
                    ...inputStyle,
                    ...(passwordError ? { borderColor: colors.error } : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
                  style={{ color: colors.text.muted }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[0.78rem] font-medium mt-1" style={{ color: colors.error }}>
                  {passwordError}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-[0.78rem] font-semibold uppercase tracking-[0.04em]" style={{ color: colors.text.muted }}>
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmError) setConfirmError('')
                }}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={savingPassword}
                className="mt-1.5 h-10 rounded-lg border-0 text-[0.88rem] font-medium"
                style={{
                  ...inputStyle,
                  ...(confirmError ? { borderColor: colors.error } : {}),
                }}
              />
              {confirmError && (
                <p className="text-[0.78rem] font-medium mt-1" style={{ color: colors.error }}>
                  {confirmError}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="text-white font-semibold py-2 px-5 rounded-lg border-0"
              style={{
                background: 'linear-gradient(135deg, var(--login-purple), var(--login-pink))',
              }}
            >
              {savingPassword ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Updating...</> : <><Lock className="w-4 h-4 mr-2" />Update Password</>}
            </Button>
            {passwordMessage && (
              <span className="text-[0.82rem] font-semibold" style={{ color: passwordMessage.includes('Error') ? colors.error : colors.success }}>
                {passwordMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Templates */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-bold" style={{ color: colors.text.primary }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
              <ListChecks className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
            </div>
            Checklist Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-[0.82rem] mb-4" style={{ color: colors.text.secondary }}>
            Create named checklist templates to choose from when onboarding clients.
          </p>

          {/* Template tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplateId(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.82rem] font-semibold transition-all"
                style={{
                  background: t.id === activeTemplateId
                    ? `${colors.primary}18`
                    : colors.lightBg,
                  color: t.id === activeTemplateId ? colors.primary : colors.text.secondary,
                  border: `1px solid ${t.id === activeTemplateId ? colors.primary : colors.border}`,
                }}
              >
                {t.is_default && <Star className="w-3 h-3" />}
                {t.name || 'Untitled'}
              </button>
            ))}
            <button
              onClick={addTemplate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.82rem] font-semibold transition-colors"
              style={{ color: colors.text.muted, border: `1px dashed ${colors.border}` }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {/* Active template editor */}
          {activeTemplate && (
            <div className="space-y-4">
              {/* Template name + actions */}
              <div className="flex items-center gap-2.5">
                <Input
                  value={activeTemplate.name}
                  onChange={(e) => updateTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="flex-1 h-9 rounded-lg border-0 text-[0.85rem] font-semibold"
                  style={inputStyle}
                />
                <button
                  onClick={setAsDefault}
                  className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[0.78rem] font-semibold transition-colors whitespace-nowrap"
                  style={{
                    color: activeTemplate.is_default ? colors.primary : colors.text.muted,
                    background: activeTemplate.is_default ? `${colors.primary}12` : 'transparent',
                  }}
                  title={activeTemplate.is_default ? 'This is the default template' : 'Set as default'}
                >
                  <Star className="w-3.5 h-3.5" />
                  {activeTemplate.is_default ? 'Default' : 'Set default'}
                </button>
                <button
                  onClick={duplicateTemplate}
                  className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: colors.text.muted }}
                  title="Duplicate template"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {templates.length > 1 && (
                  <button
                    onClick={deleteTemplate}
                    className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                    style={{ color: colors.error }}
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Steps */}
              <div className="space-y-2.5">
                {activeTemplate.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <span className="text-[0.75rem] font-bold w-7 text-center flex-shrink-0" style={{ color: colors.text.muted }}>
                      {index + 1}
                    </span>
                    <Input
                      value={step.name}
                      onChange={(e) => updateTemplateStep(index, e.target.value)}
                      placeholder="Step name"
                      className="flex-1 h-9 rounded-lg border-0 text-[0.85rem] font-medium"
                      style={inputStyle}
                    />
                    <button
                      onClick={() => removeTemplateStep(index)}
                      className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                      style={{ color: colors.error }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                onClick={addTemplateStep}
                variant="outline"
                size="sm"
                className="rounded-lg font-semibold text-[0.82rem]"
                style={{ borderColor: colors.border, color: colors.text.secondary }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Step
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: colors.border }}>
            <Button
              onClick={handleSaveChecklist}
              disabled={savingChecklist}
              className="text-white font-semibold py-2 px-5 rounded-lg border-0"
              style={{
                background: 'linear-gradient(135deg, var(--login-purple), var(--login-pink))',
              }}
            >
              {savingChecklist ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Templates</>}
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
