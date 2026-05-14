'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const

export function LandingNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/55 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/45"
      style={{
        boxShadow:
          'inset 0 1px 0 0 rgba(255,255,255,0.85), 0 1px 0 0 rgba(15,17,22,0.04), 0 8px 24px -16px rgba(15,17,22,0.08)',
      }}
    >
      <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-5 sm:h-14 sm:px-6">
        <Link
          href="/"
          aria-label="QRder home"
          onClick={close}
          className="text-[17px] font-semibold tracking-tight sm:text-[19px]"
        >
          QRder
        </Link>

        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[13px] font-normal text-black md:flex lg:gap-9"
        >
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            onClick={close}
            className="pill-primary inline-flex h-8 items-center justify-center rounded-full px-4 text-[12px] font-medium text-white transition-all duration-200 active:scale-[0.97] sm:h-9 sm:px-5 sm:text-[13px]"
          >
            Get Started
          </Link>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
            className="pill-glass inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition-all duration-200 active:scale-[0.95] md:hidden"
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden
            >
              {open ? (
                <>
                  <path d="M3 3l10 10" />
                  <path d="M13 3L3 13" />
                </>
              ) : (
                <>
                  <path d="M2.5 5.5h11" />
                  <path d="M2.5 10.5h11" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-white/40 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 transition-[max-height,opacity] duration-300 ease-out md:hidden ${
          open ? 'max-h-80 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <nav aria-label="Mobile" className="px-5 sm:px-6">
          <ul className="divide-y divide-black/[0.06]">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="flex h-12 items-center text-[15px] font-medium tracking-tight text-black"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
