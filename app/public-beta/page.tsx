import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FlaskConical } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { publicBetaReleases } from '@/lib/public-beta-releases'

export const metadata: Metadata = {
  title: 'Public Beta | QRDer',
  description:
    'Public Beta 1.0 release notes, feature highlights, and changelog for QRder tabletop QR ordering.',
}

export default function PublicBetaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              QR<span className="text-primary">Der</span>
            </div>
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 md:pt-14">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1.5 font-semibold">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            Public Beta program
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            QRDer builds in the open during beta.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground md:text-lg">
            Each version below summarizes what ships today and expands into the full changelog. Layout mirrors the bordered
            menu rows used in cashier screens so teams can skim details quickly.
          </p>
        </div>

        <Accordion type="multiple" defaultValue={['pb-1-0']} className="w-full">
          {publicBetaReleases.map(release => (
            <AccordionItem key={release.id} value={release.id}>
              <AccordionTrigger className="text-base">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{release.versionLabel}</span>
                  {release.badge === 'current' ? (
                    <Badge variant="default" className="shrink-0 text-[10px] uppercase tracking-wide">
                      Current
                    </Badge>
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{release.synopsis}</p>

                <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Features & highlights
                </p>
                <div className="mt-3 space-y-2">
                  {release.highlights.map(block => (
                    <div
                      key={block.id}
                      className="flex flex-col gap-1 rounded-lg border border-border/80 bg-card/60 p-3 transition-colors hover:bg-muted/30"
                    >
                      <h3 className="font-semibold leading-snug">{block.title}</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">{block.summary}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Release log</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Open an entry for the dated notes—we will keep posting new checkpoints as iterations land.
                </p>

                <Accordion
                  type="multiple"
                  className="mt-4 w-full rounded-xl border bg-muted/10"
                  defaultValue={release.logs.map(log => log.id)}
                >
                  {release.logs.map(log => (
                    <AccordionItem key={log.id} value={log.id}>
                      <AccordionTrigger className="px-4 py-3 text-left text-sm hover:no-underline">
                        <span className="line-clamp-2 pr-3">
                          <span className="text-muted-foreground">{log.dateDisplay}</span>
                          <span className="mx-2 text-muted-foreground/60">·</span>
                          <span className="font-semibold text-foreground">{log.title}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4">
                        <ul className="list-disc space-y-1.5 pb-4 pl-4 text-muted-foreground">
                          {log.bullets.map((point, bulletIdx) => (
                            <li
                              key={`${log.id}-${bulletIdx}`}
                              className="text-[13px] leading-relaxed marker:text-muted-foreground/70"
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
    </div>
  )
}
