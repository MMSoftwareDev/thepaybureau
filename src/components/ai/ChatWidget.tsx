'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Bot, X, Maximize2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ChatInput from '@/components/ai/ChatInput'
import ChatMessage from '@/components/ai/ChatMessage'

interface Citation {
  document_id: string
  chunk_id: string
  section_title: string | null
  source_url: string | null
  document_title: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = async (message: string) => {
    const userMsg: Message = { id: `temp-${Date.now()}`, role: 'user', content: message }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setStreamingContent('')
    setStreamingCitations([])

    try {
      const res = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || `Server error (${res.status})`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No body')

      const decoder = new TextDecoder()
      let fullText = ''
      let citations: Citation[] = []
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete last line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.type === 'text') {
                fullText += parsed.content
                setStreamingContent(fullText)
              } else if (parsed.type === 'citations') {
                citations = parsed.citations
                setStreamingCitations(citations)
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message || 'AI failed to respond')
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                continue // Skip malformed JSON
              }
              throw e
            }
          }
        }
      }

      if (!fullText) throw new Error('No response received')
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: 'assistant', content: fullText, citations }])
      setStreamingContent('')
      setStreamingCitations([])
    } catch (err) {
      console.error('ChatWidget error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: `Something went wrong: ${errorMessage}. Please try again.` }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          }}
        >
          <Bot className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              borderColor: 'transparent',
            }}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <span className="text-[0.85rem] font-semibold text-white">Payroll AI</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/dashboard/ai-assistant')
                }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Open full view"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && !streamingContent && (
              <div className="text-center py-8">
                <Bot className="w-10 h-10 mx-auto mb-2" style={{ color: colors.text.muted }} />
                <p className="text-[0.8rem]" style={{ color: colors.text.muted }}>
                  Ask a quick payroll question
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} citations={msg.citations} />
            ))}
            {streamingContent && (
              <ChatMessage role="assistant" content={streamingContent} citations={streamingCitations} isStreaming />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: colors.border }}>
            <ChatInput onSend={handleSend} isLoading={isLoading} placeholder="Quick question..." />
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
