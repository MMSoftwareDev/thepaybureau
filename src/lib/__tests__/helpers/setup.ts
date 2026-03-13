// Global test setup — mocks Next.js server modules
// This file runs via jest setupFiles (before test framework)

// Mock next/headers (cookies)
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: jest.fn().mockReturnValue([]),
    set: jest.fn(),
  }),
  headers: jest.fn().mockResolvedValue(new Map()),
}))

// Mock audit module — fire-and-forget in most routes
jest.mock('@/lib/audit', () => ({
  writeAuditLog: jest.fn(),
  diffChanges: jest.fn().mockReturnValue(null),
}))

// Mock badges module
jest.mock('@/lib/badges', () => ({
  updateUserStats: jest.fn().mockResolvedValue(undefined),
  checkAndAwardBadges: jest.fn().mockResolvedValue([]),
}))

// Suppress console.error in tests
console.error = () => {}
