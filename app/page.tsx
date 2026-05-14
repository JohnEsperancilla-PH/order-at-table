import Image from 'next/image'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { AuroraCanvas } from '@/components/aurora-canvas'
import { LandingNav } from '@/components/landing-nav'
import { RevealOnEnter } from '@/components/reveal-on-enter'

const assets = {
  phoneGroup: '/assets/phone%20group%20mockup.svg',
  ipad: '/assets/ipad%20mockup%201.svg',
  laptop: '/assets/laptop%20mockup%201.svg',
} as const

const steps = [
  {
    number: '1',
    title: 'Set up your menu',
    description:
      'Import your menu, generate QR codes for each table, and brand the guest experience — guided by our team end-to-end.',
  },
  {
    number: '2',
    title: 'Guests scan & order',
    description:
      'No apps to download. Guests open their phone camera, scan, and order directly from a fast, branded web menu.',
  },
  {
    number: '3',
    title: 'Serve & get paid',
    description:
      'Orders appear instantly at the counter. Confirm payment, fire to the kitchen, and keep tables moving — all in one flow.',
  },
] as const

const features = [
  {
    eyebrow: '01',
    title: 'Counter Control',
    description:
      'Manage live orders, confirm payments instantly, and keep every table moving — designed for speed and clarity during peak hours.',
    image: assets.ipad,
    width: 885,
    height: 685,
    alt: 'QRder cashier counter control on iPad',
  },
  {
    eyebrow: '02',
    title: 'Manager Control',
    description:
      'Instantly update what customers see — enable items, manage categories, adjust pricing, and keep your menu accurate in real time.',
    image: assets.laptop,
    width: 1616,
    height: 868,
    alt: 'QRder manager menu tools on a laptop',
  },
  {
    eyebrow: '03',
    title: 'Order At Your Table',
    description:
      'Inspired by fast-food kiosks. Guests scan the QR code at their table and order from their phone — no apps, no waiting.',
    image: assets.phoneGroup,
    width: 1300,
    height: 742,
    alt: 'QRder phone menu view, table order flow, and order confirmation',
  },
] as const

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-black font-sf-pro antialiased selection:bg-black selection:text-white">
      <AuroraCanvas />
      <LandingNav />

      <main>
        {/* Hero — natural flow on mobile; viewport-fit & bottom-flush from sm+ */}
        <section
          aria-labelledby="hero-title"
          className="relative flex flex-col px-5 pt-8 pb-12 sm:min-h-[calc(100svh-3.5rem)] sm:px-8 sm:pt-0 sm:pb-0"
        >
          <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center sm:my-auto sm:py-8 md:py-10">
            <Link
              href="/public-beta"
              className="fade-up pill-glass pill-shine group mb-5 inline-flex items-center gap-2 rounded-full py-1.5 pl-3 pr-2.5 text-[11px] font-medium text-black transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97] sm:mb-6 sm:text-[12px]"
            >
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              <span>Public Beta 1.1 — Halo-Halo</span>
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-full bg-black text-white transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 1.5L6.5 5 3 8.5" />
                </svg>
              </span>
            </Link>

            <h1
              id="hero-title"
              className="fade-up headline-shimmer text-balance font-bold tracking-[-0.04em] leading-[1.02]"
              style={{ fontSize: 'clamp(2.125rem, 6.4vw, 4.5rem)' }}
            >
              <span className="block">Order Smarter,</span>
              <span className="block">with QRder.</span>
            </h1>

            <p
              className="fade-up fade-up-delay mt-3 max-w-xl text-balance text-sm font-normal leading-[1.45] text-black sm:mt-4 sm:text-base md:text-lg"
            >
              A modern point-of-sale, kitchen display, and guest ordering platform — designed to make every service feel effortless.
            </p>

            <div className="fade-up fade-up-delay mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-6">
              <Link
                href="/contact"
                className="pill-primary breathe-glow inline-flex h-10 items-center justify-center rounded-full px-5 text-[14px] font-medium text-white transition-all duration-200 active:scale-[0.97] sm:h-11 sm:px-6 sm:text-[15px]"
              >
                Book a Demo
              </Link>
              <Link
                href="#features"
                className="pill-glass group inline-flex h-10 items-center justify-center rounded-full px-5 text-[14px] font-medium text-black transition-all duration-200 active:scale-[0.97] sm:h-11 sm:px-6 sm:text-[15px]"
              >
                See features
                <span aria-hidden className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>

          {/* Phone trio — breathing space on mobile, flush to hero bottom from sm+ */}
          <div className="reveal mx-auto mt-8 w-full max-w-[640px] sm:mt-0 lg:max-w-[720px]">
            <Image
              src={assets.phoneGroup}
              alt="QRder guest ordering, table selection, and order confirmation on iPhone"
              width={1300}
              height={742}
              className="block h-auto w-full"
              sizes="(min-width: 1024px) 720px, (min-width: 640px) 640px, 100vw"
              priority
            />
          </div>
        </section>

        {/* Features intro */}
        <section
          id="features"
          aria-labelledby="features-title"
          className="px-5 pt-16 sm:px-8 sm:pt-20 md:pt-24 lg:pt-28"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2
              id="features-title"
              className="reveal headline-shimmer text-balance font-bold tracking-[-0.035em] leading-[1.04]"
              style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)' }}
            >
              Powerful Features
            </h2>
            <p
              className="reveal mt-3 text-balance text-base font-medium text-black sm:mt-4 sm:text-lg md:text-xl"
            >
              Everything you need.{' '}
              <span className="italic font-normal text-black">Nothing you don&apos;t.</span>
            </p>
          </div>
        </section>

        {/* Feature cards — 3 same-sized cards in a grid */}
        <section
          id="order"
          aria-label="Product features"
          className="px-5 pt-10 sm:px-8 sm:pt-12 md:pt-14"
        >
          <RevealOnEnter
            className="mx-auto grid max-w-[1180px] gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6"
            staggerMs={140}
          >
            {features.map((f) => (
              <article
                key={f.title}
                className="feature-card reveal-stagger flex h-full flex-col overflow-hidden rounded-[24px] p-4 sm:rounded-[28px] sm:p-5"
              >
                <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-[18px] p-4 sm:h-52 sm:rounded-[22px] sm:p-5 lg:h-56 lg:p-6">
                  <div
                    aria-hidden
                    className="feature-card__glow absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(ellipse 80% 70% at 50% 40%, oklch(0.92 0.1 35 / 0.5) 0%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
                    }}
                  />
                  <Image
                    src={f.image}
                    alt={f.alt}
                    width={f.width}
                    height={f.height}
                    className="feature-card__image relative h-auto max-h-full w-auto max-w-full"
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 90vw, 100vw"
                  />
                </div>

                <div className="mt-4 flex flex-col px-1 pb-1 sm:mt-5 sm:px-2 sm:pb-2">
                  <span className="feature-card__eyebrow text-[11px] font-medium uppercase tracking-[0.18em] text-black sm:text-[12px]">
                    {f.eyebrow}
                  </span>
                  <h3
                    className="mt-1.5 font-bold tracking-[-0.02em] leading-[1.15] text-black"
                    style={{ fontSize: 'clamp(1.25rem, 1.8vw, 1.5rem)' }}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[14px] font-normal leading-[1.5] text-black sm:mt-3 sm:text-[15px]">
                    {f.description}
                  </p>
                </div>
              </article>
            ))}
          </RevealOnEnter>
        </section>

        {/* How it works — 3 step glass cards */}
        <section
          id="how-it-works"
          aria-labelledby="how-title"
          className="px-5 pt-16 sm:px-8 sm:pt-20 md:pt-24 lg:pt-28"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2
              id="how-title"
              className="reveal headline-shimmer text-balance font-bold tracking-[-0.035em] leading-[1.04]"
              style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)' }}
            >
              Get started in three steps.
            </h2>
            <p className="reveal mt-3 max-w-xl text-balance text-base font-medium text-black sm:mt-4 sm:text-lg md:text-xl">
              From sign-up to your first order in under a day.
            </p>
          </div>

          <RevealOnEnter
            className="mx-auto mt-10 grid max-w-[1180px] gap-4 sm:mt-12 sm:gap-5 md:mt-14 lg:grid-cols-3 lg:gap-6"
            staggerMs={140}
          >
            {steps.map((step) => (
              <article
                key={step.number}
                className="feature-card reveal-stagger flex h-full flex-col rounded-[24px] p-6 sm:rounded-[28px] sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-12 w-12 place-items-center rounded-full font-bold leading-none text-black sm:h-14 sm:w-14"
                    style={{
                      fontSize: 'clamp(1.5rem, 2vw, 1.875rem)',
                      background:
                        'radial-gradient(circle at 30% 30%, oklch(0.94 0.1 35 / 0.6) 0%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 100%)',
                      boxShadow:
                        'inset 0 1px 0 0 rgba(255,255,255,0.9), inset 0 -1px 0 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    {step.number}
                  </span>
                  <span className="feature-card__eyebrow text-[11px] font-medium uppercase tracking-[0.18em] text-black sm:text-[12px]">
                    Step {step.number}
                  </span>
                </div>

                <h3
                  className="mt-5 font-bold tracking-[-0.02em] leading-[1.15] text-black sm:mt-6"
                  style={{ fontSize: 'clamp(1.25rem, 1.8vw, 1.5rem)' }}
                >
                  {step.title}
                </h3>
                <p className="mt-2 text-[14px] font-normal leading-[1.5] text-black sm:mt-3 sm:text-[15px]">
                  {step.description}
                </p>
              </article>
            ))}
          </RevealOnEnter>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          aria-labelledby="faq-title"
          className="px-5 pt-16 pb-16 sm:px-8 sm:pt-20 sm:pb-20 md:pt-24 md:pb-24 lg:pt-28 lg:pb-28"
        >
          <div className="mx-auto max-w-3xl">
            <h3
              id="faq-title"
              className="reveal headline-shimmer text-center font-bold tracking-[-0.025em] leading-[1.06]"
              style={{ fontSize: 'clamp(1.875rem, 4.6vw, 3.25rem)' }}
            >
              Frequently Asked
            </h3>
            <div className="reveal mt-10 flex flex-col gap-3 sm:mt-12 md:mt-14">
              {[
                {
                  q: 'How long does setup take?',
                  a: 'Most restaurants are fully onboarded in under a day. Our team handles the menu import, QR generation, and staff walkthrough end-to-end.',
                },
                {
                  q: 'Do guests need to download an app?',
                  a: 'No. Guests simply scan the QR code at their table and order from a fast, mobile-optimized web experience.',
                },
                {
                  q: 'Can I update my menu in real time?',
                  a: 'Yes. Toggle availability, edit prices, and reorder categories instantly — changes appear on every device within seconds.',
                },
                {
                  q: 'Does it work on my existing devices?',
                  a: 'QRder runs on any modern iPad, iPhone, Android phone, Mac, or Windows PC. No specialized hardware required.',
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="glass-row group rounded-2xl px-5 py-4 transition-colors sm:rounded-[20px] sm:px-6 sm:py-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-base font-medium tracking-tight text-black sm:text-lg">
                    {item.q}
                    <span
                      aria-hidden
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-black/15 bg-white/60 text-black backdrop-blur-md transition-transform duration-300 group-open:rotate-45"
                    >
                      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M6 1.5v9M1.5 6h9" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-prose text-sm leading-[1.6] text-black sm:text-base">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/40 bg-white/40 px-5 py-10 backdrop-blur-xl backdrop-saturate-150 sm:px-8 md:py-14">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              QRder
            </Link>
            <p className="mt-2 text-sm leading-[1.5] text-black">
              Scan. Order. Savor. Built for modern restaurants.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-black sm:grid-cols-3 sm:gap-x-14"
          >
            <Link href="/">Home</Link>
            <Link href="#features">Features</Link>
            <Link href="#order">Order</Link>
            <Link href="#faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/public-beta">Public Beta</Link>
          </nav>
        </div>
        <div className="mx-auto mt-10 flex max-w-[1180px] flex-col items-center justify-between gap-2 border-t border-black/[0.06] pt-6 text-xs text-black sm:flex-row">
          <p>© {new Date().getFullYear()} QRder. All rights reserved.</p>
          <p>Designed for restaurants worldwide.</p>
        </div>
      </footer>
    </div>
  )
}
