'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Crown, Lock } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  description: string
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

export default function UpgradePrompt({ feature, description, icon: Icon = Lock }: UpgradePromptProps) {
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card
        className="border-0 max-w-md w-full"
        style={{
          backgroundColor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <CardContent className="p-8 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: `${colors.primary}12` }}
          >
            <Icon className="w-7 h-7" style={{ color: colors.primary }} />
          </div>

          <h2
            className="text-lg font-bold mb-2"
            style={{ color: colors.text.primary }}
          >
            {feature} is a Pro feature
          </h2>

          <p
            className="text-[0.82rem] leading-relaxed mb-6"
            style={{ color: colors.text.muted }}
          >
            {description}
          </p>

          <Button
            onClick={() => router.push('/dashboard/subscription')}
            className="w-full rounded-lg font-semibold py-5 text-white border-0"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 4px 15px ${colors.primary}30`,
            }}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Unlimited
          </Button>

          <p
            className="text-xs mt-3"
            style={{ color: colors.text.muted }}
          >
            Starting at £9/month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
