// Unmock @/lib/audit so we test the real implementation
jest.unmock('@/lib/audit')
import { diffChanges } from '@/lib/audit'

describe('diffChanges', () => {
  it('returns null when nothing changed', () => {
    const before = { name: 'Alice', age: 30 }
    const after = { name: 'Alice', age: 30 }
    expect(diffChanges(before, after)).toBeNull()
  })

  it('detects changed fields', () => {
    const before = { name: 'Alice', age: 30 }
    const after = { name: 'Bob', age: 30 }
    const diff = diffChanges(before, after)
    expect(diff).toEqual({
      name: { from: 'Alice', to: 'Bob' },
    })
  })

  it('detects multiple changed fields', () => {
    const before = { name: 'Alice', age: 30, role: 'admin' }
    const after = { name: 'Bob', age: 31, role: 'admin' }
    const diff = diffChanges(before, after)
    expect(diff).toEqual({
      name: { from: 'Alice', to: 'Bob' },
      age: { from: 30, to: 31 },
    })
  })

  it('skips created_at and updated_at', () => {
    const before = { name: 'Alice', updated_at: '2024-01-01', created_at: '2024-01-01' }
    const after = { name: 'Alice', updated_at: '2024-12-01', created_at: '2024-01-01' }
    expect(diffChanges(before, after)).toBeNull()
  })

  it('handles new fields as additions', () => {
    const before = { name: 'Alice' }
    const after = { name: 'Alice', email: 'alice@test.com' }
    const diff = diffChanges(before, after)
    expect(diff).toEqual({
      email: { from: null, to: 'alice@test.com' },
    })
  })

  it('handles nested objects/arrays', () => {
    const before = { items: [1, 2, 3] }
    const after = { items: [1, 2, 4] }
    const diff = diffChanges(before, after)
    expect(diff).toEqual({
      items: { from: [1, 2, 3], to: [1, 2, 4] },
    })
  })
})
