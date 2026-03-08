'use client'

import { useState } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface Citation {
  document_id: string
  chunk_id: string
  section_title: string | null
  source_url: string | null
  document_title: string
}

interface CitationCardProps {
  citations: Citation[]
}

export default function CitationCard({ citations }: CitationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  if (!citations || citations.length === 0) return null

  // Deduplicate by document_id
  const unique = citations.filter(
    (c, i, arr) => arr.findIndex(x => x.document_id === c.document_id) === i
  )

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[0.75rem] font-medium transition-colors"
        style={{ color: colors.primary }}
      >
        <FileText className="w-3.5 h-3.5" />
        {unique.length} source{unique.length !== 1 ? 's' : ''} referenced
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {unique.map((citation, i) => (
            <div
              key={`${citation.document_id}-${i}`}
              className="flex items-start gap-2 px-3 py-2 rounded-lg text-[0.75rem]"
              style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : `${colors.primary}06`,
                border: `1px solid ${colors.border}`,
              }}
            >
              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium" style={{ color: colors.text.primary }}>
                  {citation.document_title}
                </div>
                {citation.section_title && (
                  <div style={{ color: colors.text.muted }}>
                    {citation.section_title}
                  </div>
                )}
              </div>
              {citation.source_url && (
                <a
                  href={citation.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-1 rounded hover:opacity-80"
                  style={{ color: colors.primary }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
