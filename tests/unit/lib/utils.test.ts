import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from '@/lib/utils'

describe('cn', () => {
  it('merges tailwind classes and resolves conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe('text-sm font-bold')
  })
})

describe('formatCurrency', () => {
  it('formats amounts in PHP for en-PH', () => {
    const s = formatCurrency(1234.5, 'PHP', 'en-PH')
    expect(s).toMatch(/1,234\.50/)
    // Currency code may be narrow symbol (₱) or "PHP" depending on ICU
    expect(s).toMatch(/₱|PHP/)
  })
})
