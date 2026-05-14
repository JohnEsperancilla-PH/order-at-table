'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { AuroraCanvas } from '@/components/aurora-canvas'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 text-black font-sf-pro antialiased sm:px-8">
      <AuroraCanvas />
      <div className="glass-surface relative w-full max-w-md overflow-hidden rounded-[28px] p-8 text-center sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1/3 left-1/2 h-[320px] w-[480px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, oklch(0.88 0.14 35 / 0.5) 0%, transparent 65%)',
          }}
        />
        <div className="pill-glass relative mx-auto grid h-14 w-14 place-items-center rounded-full">
          <AlertCircle className="h-6 w-6 text-black" strokeWidth={1.75} />
        </div>
        <h2
          className="relative mt-5 font-bold tracking-[-0.025em] leading-[1.1] text-black"
          style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)' }}
        >
          Something went wrong
        </h2>
        <p className="relative mt-3 text-balance text-sm font-normal leading-[1.5] text-black sm:text-base">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="pill-primary relative mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 text-[14px] font-medium text-white transition-all duration-200 active:scale-[0.97] sm:text-[15px]"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
