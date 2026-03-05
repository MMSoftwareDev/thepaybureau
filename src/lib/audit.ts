// src/lib/audit.ts — Audit log helper
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { NextRequest } from 'next/server'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

interface AuditLogEntry {
  tenantId: string
  userId: string
  userEmail: string
  action: AuditAction
  resourceType: string
  resourceId?: string | null
  resourceName?: string | null
  changes?: Record<string, { from: unknown; to: unknown }> | null
  request?: NextRequest
}

/**
 * Compute a diff of changed fields between two objects.
 * Only includes fields that actually changed.
 */
export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> | null {
  const diff: Record<string, { from: unknown; to: unknown }> = {}

  for (const key of Object.keys(after)) {
    const oldVal = before[key]
    const newVal = after[key]

    // Skip internal/meta fields
    if (['updated_at', 'created_at'].includes(key)) continue

    // Compare as JSON strings to handle objects/arrays
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { from: oldVal ?? null, to: newVal ?? null }
    }
  }

  return Object.keys(diff).length > 0 ? diff : null
}

/**
 * Write an audit log entry. Fire-and-forget — errors are logged but
 * never block the main request.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServerSupabaseClient()

    const ip = entry.request?.headers.get('x-forwarded-for')
      ?? entry.request?.headers.get('x-real-ip')
      ?? null
    const ua = entry.request?.headers.get('user-agent') ?? null

    const { error } = await supabase.from('audit_logs').insert({
      tenant_id: entry.tenantId,
      user_id: entry.userId,
      user_email: entry.userEmail,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      resource_name: entry.resourceName ?? null,
      changes: entry.changes as Record<string, unknown> | null,
      ip_address: ip,
      user_agent: ua,
    })

    if (error) {
      console.error('Audit log write failed:', error)
    }
  } catch (err) {
    console.error('Audit log error:', err)
  }
}
