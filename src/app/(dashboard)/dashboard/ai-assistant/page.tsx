'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Bot, Plus, Trash2, MessageSquare } from 'lucide-react'
import ChatInput from '@/components/ai/ChatInput'
import ChatMessage from '@/components/ai/ChatMessage'
import { useSubscription } from '@/lib/swr'
import UpgradePrompt from '@/components/ui/UpgradePrompt'

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

interface Conversation {
  id: string
  title: string | null
  created_at: string | null
  updated_at: string | null
}

export default function AIAssistantPageWrapper() {
  const { data: subscriptionData } = useSubscription()
  const currentPlan = subscriptionData?.plan || 'free'

  if (currentPlan === 'free' || currentPlan === 'trial') {
    return (
      <UpgradePrompt
        feature="AI Assistant"
        description="Get instant answers to payroll, PAYE, and pension questions powered by AI. Upgrade to Unlimited to unlock the AI Assistant."
        icon={Bot}
      />
    )
  }

  return <AIAssistantPage />
}

function AIAssistantPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-assistant/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }

    let cancelled = false
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/ai-assistant/conversations/messages?conversation_id=${activeConversationId}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setMessages(data.map((m: { id: string; role: string; content: string; citations?: Citation[] }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            citations: m.citations || undefined,
          })))
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      }
    }

    fetchMessages()
    return () => { cancelled = true }
  }, [activeConversationId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = async (message: string) => {
    // Add user message optimistically
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setStreamingContent('')
    setStreamingCitations([])

    try {
      const res = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_id: activeConversationId || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          const limitMsg: Message = {
            id: `limit-${Date.now()}`,
            role: 'assistant',
            content: data.message || 'This conversation has reached its message limit. Please start a new chat.',
          }
          setMessages(prev => [...prev, limitMsg])
          setIsLoading(false)
          return
        }
        throw new Error(data.message || data.error || `Server error (${res.status})`)
      }

      // Get conversation ID from header
      const convId = res.headers.get('X-Conversation-Id')
      if (convId && !activeConversationId) {
        setActiveConversationId(convId)
        fetchConversations()
      }

      // Read SSE stream
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

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

      // Add complete assistant message
      if (fullText) {
        const assistantMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: fullText,
          citations,
        }
        setMessages(prev => [...prev, assistantMsg])
      } else {
        throw new Error('No response received')
      }
      setStreamingContent('')
      setStreamingCitations([])
    } catch (err) {
      console.error('Chat error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, something went wrong: ${errorMessage}. Please try again.`,
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setActiveConversationId(null)
    setMessages([])
    setStreamingContent('')
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/ai-assistant/conversations?id=${id}`, { method: 'DELETE' })
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConversationId === id) {
        handleNewChat()
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const groupConversations = () => {
    const now = new Date()
    const today: Conversation[] = []
    const yesterday: Conversation[] = []
    const older: Conversation[] = []

    for (const conv of conversations) {
      const date = new Date(conv.updated_at || conv.created_at || '')
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) today.push(conv)
      else if (diffDays === 1) yesterday.push(conv)
      else older.push(conv)
    }

    return { today, yesterday, older }
  }

  const grouped = groupConversations()

  return (
    <div className="flex h-[calc(100dvh-60px)] -mx-4 -my-6 md:-mx-8 md:-my-8">
      {/* Conversations sidebar */}
      <div
        className="hidden md:flex w-[260px] flex-col border-r flex-shrink-0"
        style={{ borderColor: colors.border, background: colors.surface }}
      >
        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[0.8rem] font-medium transition-all"
            style={{
              background: `${colors.primary}10`,
              color: colors.primary,
              border: `1px solid ${colors.primary}30`,
            }}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-[0.75rem]" style={{ color: colors.text.muted }}>
              No conversations yet
            </div>
          ) : (
            <>
              {grouped.today.length > 0 && (
                <ConversationGroup
                  label="Today"
                  items={grouped.today}
                  activeId={activeConversationId}
                  onSelect={setActiveConversationId}
                  onDelete={handleDeleteConversation}
                  colors={colors}
                  isDark={isDark}
                />
              )}
              {grouped.yesterday.length > 0 && (
                <ConversationGroup
                  label="Yesterday"
                  items={grouped.yesterday}
                  activeId={activeConversationId}
                  onSelect={setActiveConversationId}
                  onDelete={handleDeleteConversation}
                  colors={colors}
                  isDark={isDark}
                />
              )}
              {grouped.older.length > 0 && (
                <ConversationGroup
                  label="Earlier"
                  items={grouped.older}
                  activeId={activeConversationId}
                  onSelect={setActiveConversationId}
                  onDelete={handleDeleteConversation}
                  colors={colors}
                  isDark={isDark}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {messages.length === 0 && !streamingContent ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
              >
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
                Payroll AI Assistant
              </h2>
              <p className="text-[0.85rem] mb-6" style={{ color: colors.text.muted }}>
                Ask any question about UK payroll, HMRC regulations, PAYE, National Insurance,
                statutory payments, pensions, and more. Answers are sourced from official HMRC guidance.
              </p>
              <div className="grid gap-2">
                {[
                  'What are the current PAYE filing deadlines?',
                  'How do I calculate Statutory Sick Pay?',
                  'When is the next RTI submission due?',
                  'What are the NIC thresholds for this tax year?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-left px-4 py-2.5 rounded-lg text-[0.8rem] transition-all"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : `${colors.primary}04`,
                      border: `1px solid ${colors.border}`,
                      color: colors.text.secondary,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary + '40'
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : `${colors.primary}08`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : `${colors.primary}04`
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                citations={msg.citations}
              />
            ))}
            {streamingContent && (
              <ChatMessage
                role="assistant"
                content={streamingContent}
                citations={streamingCitations}
                isStreaming
              />
            )}
            {isLoading && !streamingContent && (
              <div className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : `${colors.primary}04`,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: colors.text.muted, animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: colors.text.muted, animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: colors.text.muted, animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        <div className="p-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSend} isLoading={isLoading} />
            <p className="text-center text-[0.65rem] mt-2" style={{ color: colors.text.muted }}>
              AI responses are based on HMRC guidance documents. Always verify critical information with official sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationGroup({
  label,
  items,
  activeId,
  onSelect,
  onDelete,
  colors,
  isDark,
}: {
  label: string
  items: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
}) {
  return (
    <div className="mb-3">
      <div
        className="px-2 pb-1 text-[0.65rem] font-semibold tracking-[0.08em] uppercase"
        style={{ color: colors.text.muted }}
      >
        {label}
      </div>
      {items.map((conv) => {
        const isActive = conv.id === activeId
        return (
          <div
            key={conv.id}
            className="group flex items-center gap-1 px-2 h-8 rounded-md mb-px transition-all cursor-pointer"
            style={{
              background: isActive
                ? isDark ? 'rgba(255,255,255,0.08)' : `${colors.primary}08`
                : 'transparent',
            }}
            onClick={() => onSelect(conv.id)}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.text.muted }} />
            <span
              className="flex-1 text-[0.78rem] truncate"
              style={{ color: isActive ? colors.text.primary : colors.text.secondary }}
            >
              {conv.title || 'Untitled'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(conv.id)
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
              style={{ color: colors.text.muted }}
              aria-label="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
