import type { Metadata } from 'next'
import { FlaskConical } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AuroraCanvas } from '@/components/aurora-canvas'
import { LandingNav } from '@/components/landing-nav'
import { publicBetaReleases } from '@/lib/public-beta-releases'

export const metadata: Metadata = {
  title: 'Public Beta | QRDer',
  description:
    'Public Beta 1.0 release notes, feature highlights, and changelog for QRder tabletop QR ordering.',
}

export default function PublicBetaPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-black font-sf-pro antialiased selection:bg-black selection:text-white">
      <AuroraCanvas />
      <LandingNav />

      <main className="pb-20 sm:pb-24 md:pb-28">
        {/* Hero */}
        <section className="px-5 pt-10 sm:px-8 sm:pt-14 md:pt-20 lg:pt-24">
          <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
            <span className="reveal pill-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black sm:text-[12px]">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              Public Beta program
            </span>
            <h1
              className="reveal mt-5 text-balance font-bold tracking-[-0.04em] leading-[1.02] text-black"
              style={{ fontSize: 'clamp(2.125rem, 6.4vw, 4.5rem)' }}
            >
              Built in the open during beta.
            </h1>
            <p className="reveal mt-4 max-w-2xl text-balance text-base font-normal leading-[1.45] text-black sm:mt-5 sm:text-lg md:text-xl">
              Each version below summarizes what ships today and expands into the full changelog. New checkpoints land as iterations roll out.
            </p>
            <p className="reveal mt-6 max-w-xl text-balance text-[13px] leading-[1.5] text-black sm:text-sm">
              Found errors on the app? Report to{' '}
              <a
                href="mailto:johnleonardesperancilla@gmail.com"
                className="font-medium underline decoration-black/30 underline-offset-4 transition-colors hover:decoration-black"
              >
                johnleonardesperancilla@gmail.com
              </a>
              .
            </p>
          </div>
        </section>

        {/* Releases */}
        <section className="px-5 pt-10 sm:px-8 sm:pt-14 md:pt-16">
          <div className="mx-auto max-w-2xl">
            <Accordion type="multiple" defaultValue={['pb-1-0']} className="reveal flex flex-col gap-3">
              {publicBetaReleases.map((release) => (
                <AccordionItem
                  key={release.id}
                  value={release.id}
                  className="glass-row group rounded-2xl border-0 px-5 py-1 sm:rounded-[20px] sm:px-6"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                        <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-black sm:text-base">
                          {release.codename}
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-black sm:text-[12px]">
                          {release.versionLabel}
                        </span>
                      </div>
                      {release.badge === 'current' ? (
                        <span className="pill-primary inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                          Current
                        </span>
                      ) : null}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1">
                    <p className="text-sm leading-[1.55] text-black sm:text-[15px]">
                      {release.synopsis}
                    </p>

                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
                      Features & highlights
                    </p>
                    <div className="mt-3 grid gap-2">
                      {release.highlights.map((block) => (
                        <div
                          key={block.id}
                          className="pill-glass rounded-2xl px-4 py-3 transition-transform duration-300 ease-out hover:-translate-y-0.5"
                        >
                          <h3 className="text-sm font-semibold leading-snug text-black sm:text-[15px]">
                            {block.title}
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-black sm:text-[13px]">
                            {block.summary}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
                      Release log
                    </p>
                    <p className="mt-1 text-xs text-black sm:text-[13px]">
                      Open an entry for the dated notes — new checkpoints land as iterations ship.
                    </p>

                    <Accordion
                      type="multiple"
                      className="mt-4 flex flex-col gap-2"
                      defaultValue={release.logs.map((log) => log.id)}
                    >
                      {release.logs.map((log) => (
                        <AccordionItem
                          key={log.id}
                          value={log.id}
                          className="pill-glass rounded-2xl border-0 px-4"
                        >
                          <AccordionTrigger className="py-3 text-left text-sm font-medium text-black hover:no-underline">
                            <span className="line-clamp-2 pr-3">
                              <span className="text-black">{log.dateDisplay}</span>
                              <span className="mx-2 text-black">·</span>
                              <span className="font-semibold text-black">{log.title}</span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc space-y-1.5 pb-3 pl-5 text-black marker:text-black">
                              {log.bullets.map((point, bulletIdx) => (
                                <li
                                  key={`${log.id}-${bulletIdx}`}
                                  className="text-[13px] leading-relaxed"
                                >
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
    </div>
  )
}
