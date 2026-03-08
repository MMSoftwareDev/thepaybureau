'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, isLoading, placeholder = 'Ask a payroll question...' }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }, [input])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="flex items-end gap-2 p-3 rounded-xl border"
      style={{
        background: colors.surface,
        borderColor: colors.border,
      }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        className="flex-1 resize-none bg-transparent outline-none text-[0.875rem] leading-relaxed placeholder:opacity-50"
        style={{ color: colors.text.primary }}
      />
      <button
        onClick={handleSubmit}
        disabled={!input.trim() || isLoading}
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-30"
        style={{
          background: input.trim() && !isLoading ? colors.primary : 'transparent',
          color: input.trim() && !isLoading ? '#fff' : colors.text.muted,
        }}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
