'use client'

import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Bot, User } from 'lucide-react'
import CitationCard from '@/components/ai/CitationCard'

interface Citation {
  document_id: string
  chunk_id: string
  section_title: string | null
  source_url: string | null
  document_title: string
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  isStreaming?: boolean
}

export default function ChatMessage({ role, content, citations, isStreaming }: ChatMessageProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
        style={{
          background: isAssistant
            ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
            : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4 text-white" />
        ) : (
          <User className="w-4 h-4" style={{ color: colors.text.muted }} />
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[85%] ${isAssistant ? '' : 'flex flex-col items-end'}`}>
        <div
          className="rounded-xl px-4 py-3 text-[0.85rem] leading-relaxed"
          style={{
            background: isAssistant
              ? isDark ? 'rgba(255,255,255,0.04)' : `${colors.primary}04`
              : isDark ? `${colors.primary}20` : `${colors.primary}10`,
            color: colors.text.primary,
            border: `1px solid ${isAssistant ? colors.border : `${colors.primary}20`}`,
          }}
        >
          {/* Render markdown-like content */}
          <div className="whitespace-pre-wrap break-words">
            {content}
            {isStreaming && (
              <span
                className="inline-block w-1.5 h-4 ml-0.5 rounded-sm animate-pulse"
                style={{ background: colors.primary }}
              />
            )}
          </div>
        </div>

        {/* Citations */}
        {isAssistant && citations && citations.length > 0 && (
          <CitationCard citations={citations} />
        )}
      </div>
    </div>
  )
}
