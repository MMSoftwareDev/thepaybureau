// src/config/version.ts
// Central version configuration for ThePayBureau
// Update APP_VERSION when releasing a new version.

export const APP_VERSION = {
  /** Numeric version — bump this to advance through stages */
  number: 1,

  /** Human-readable version string */
  label: 'v1.0',
} as const

/**
 * Version stages:
 *   1  → Alpha   (early development, expect bugs)
 *   2  → Beta    (feature-complete, testing phase)
 *   3+ → Live    (production-ready)
 */
export type VersionStage = 'Alpha' | 'Beta' | 'Live'

export function getVersionStage(version: number): VersionStage {
  if (version <= 1) return 'Alpha'
  if (version === 2) return 'Beta'
  return 'Live'
}

/** Colour tokens per stage (Tailwind-compatible hex values) */
export function getVersionStageColor(stage: VersionStage) {
  switch (stage) {
    case 'Alpha':
      return { bg: '#F59E0B', text: '#FFFFFF' } // amber
    case 'Beta':
      return { bg: '#3B82F6', text: '#FFFFFF' } // blue
    case 'Live':
      return { bg: '#10B981', text: '#FFFFFF' } // emerald
  }
}

export const CURRENT_STAGE = getVersionStage(APP_VERSION.number)
export const CURRENT_STAGE_COLOR = getVersionStageColor(CURRENT_STAGE)
