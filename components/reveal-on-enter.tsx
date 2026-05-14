'use client'

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

/**
 * Wraps a container and toggles a `data-in-view` attribute the first time
 * any portion of it enters the viewport. Use in concert with the
 * `.reveal-stagger` CSS utility to cascade direct children with a smooth
 * time-based animation (rather than a scroll-driven one, which can feel
 * abrupt for grids of large elements).
 */
export function RevealOnEnter({
  children,
  className = '',
  staggerMs = 120,
  rootMargin = '0px 0px -8% 0px',
  threshold = 0.08,
  as: Tag = 'div',
  style,
  ...rest
}: {
  children: ReactNode
  className?: string
  staggerMs?: number
  rootMargin?: string
  threshold?: number
  as?: 'div' | 'section' | 'ul'
  style?: CSSProperties
} & Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            obs.disconnect()
            break
          }
        }
      },
      { rootMargin, threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin, threshold])

  const Component = Tag as 'div'

  return (
    <Component
      ref={ref}
      className={className}
      data-in-view={inView ? 'true' : 'false'}
      style={{ ['--reveal-stagger' as string]: `${staggerMs}ms`, ...style }}
      {...rest}
    >
      {children}
    </Component>
  )
}
