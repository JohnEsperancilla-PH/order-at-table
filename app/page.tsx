import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Headphones,
  MessageCircle,
  Play,
  QrCode,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: QrCode,
    title: 'Instant QR ordering',
    description:
      'Guests scan and order in seconds—no app installs or sign-ups required.',
  },
  {
    icon: Zap,
    title: 'Faster table turns',
    description:
      'Streamlined ordering flows help your team cover more covers at peak.',
  },
  {
    icon: BarChart3,
    title: 'Operations insight',
    description:
      'See order patterns, rush windows, and menu performance at a glance.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first UX',
    description:
      'Touch-friendly menus and sheets designed for real phones in real dining rooms.',
  },
  {
    icon: Shield,
    title: 'Stable, secure stack',
    description:
      'Built on modern infra with encryption in transit and sane access patterns.',
  },
  {
    icon: Sparkles,
    title: 'Flexible menus',
    description:
      'Categories, modifiers, and live availability so the floor matches the kitchen.',
  },
]

const demoSteps = [
  {
    title: 'Scan',
    body: 'Any phone camera opens your menu—no downloads.',
  },
  {
    title: 'Browse & tailor',
    body: 'Photos, descriptions, modifiers, and special instructions.',
  },
  {
    title: 'Send to the pass',
    body: 'Orders route to staff with clarity for prep and service.',
  },
] as const

const testimonials = [
  {
    quote:
      'QRDer transformed our rush-hour flow. We plate more covers with the same crew.',
    initials: 'MJ',
    name: 'Maria Johnson',
    place: 'Downtown Bistro',
  },
  {
    quote:
      'Setup was quick. Within a week guests were ordering without hunting for a server.',
    initials: 'DL',
    name: 'David Lee',
    place: 'Fusion Kitchen',
  },
  {
    quote:
      'Regulars love how simple it is—we still backstop anyone who wants a human.',
    initials: 'ST',
    name: 'Sarah Thompson',
    place: 'Family Diner',
  },
] as const

const benefitPoints = [
  {
    icon: DollarSign,
    title: 'Grow check & turns',
    body: 'Less friction at the table frees staff to sell and stage the next course.',
  },
  {
    icon: Clock,
    title: 'Recover service time',
    body: 'Fewer round trips for order-taking mean calmer dining rooms.',
  },
  {
    icon: Award,
    title: 'Modern guest experience',
    body: 'Contactless ordering that still feels like hospitality, not a kiosk.',
  },
  {
    icon: Globe,
    title: 'Reach more diners',
    body: 'Menus that read well on any device and any network your guests actually use.',
  },
] as const

const faqItems = [
  {
    q: 'How fast can we go live?',
    a: 'Most teams upload a menu, tune tables, and print QR codes within a single afternoon. We help you sanity-check the flow before you flip the switch.',
  },
  {
    q: 'Do guests need an app?',
    a: 'No. QRDer opens in the browser from the camera scan—fast on iOS and Android.',
  },
  {
    q: 'What if someone prefers a server?',
    a: 'Staff can still take orders the traditional way. QRDer augments service; it does not replace empathy.',
  },
  {
    q: 'How do payments work?',
    a: 'You keep your existing settlement flow. QRDer focuses on crisp ordering and routing to the kitchen or counter.',
  },
  {
    q: 'Can menus change during service?',
    a: 'Yes. 86 items, adjust modifiers, and push specials from the cashier tools when the kitchen says so.',
  },
  {
    q: 'Where do we get help?',
    a: 'Reach out via contact, book a walkthrough, and follow the public beta log for what ships next.',
  },
] as const

function SectionIntro({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'center' | 'left'
}) {
  const aligned = align === 'left'
  return (
    <div
      className={`mb-12 md:mb-16 ${aligned ? 'mx-0 max-w-xl text-left' : 'mx-auto max-w-2xl text-center'}`}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-pretty text-base text-muted-foreground md:text-lg">{description}</p> : null}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            QR<span className="text-primary">Der</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2" aria-label="Primary">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="#demo">How it works</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/public-beta">Public beta</Link>
            </Button>
            <Button size="sm" className="ml-1" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-transparent to-transparent"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 md:pb-28 md:pt-20">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <Badge
                variant="secondary"
                className="mb-6 border border-border/60 bg-muted/50 px-3 py-1 font-medium text-foreground/90"
              >
                Tabletop ordering, rethought
              </Badge>
              <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
                QR<span className="text-primary">Der</span>
              </h1>
              <p className="mt-4 text-lg font-medium text-muted-foreground md:text-xl">Scan. Order. Savor.</p>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                A calmer way to run service: guests order from their phones, your team stays focused on food and hospitality.
              </p>

              <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                <Button size="lg" className="h-12 rounded-xl px-8 text-base shadow-sm" asChild>
                  <Link href="/contact">
                    Start a conversation <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-xl border-border/80 px-8 text-base" asChild>
                  <Link href="#demo">
                    <Play className="mr-2 h-4 w-4" /> See the flow
                  </Link>
                </Button>
              </div>

              <div className="mt-14 grid w-full max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/60 sm:max-w-2xl">
                {[
                  { value: '35%', label: 'Faster pacing' },
                  { value: '50%', label: 'Less wait friction' },
                  { value: '98%', label: 'Guest satisfaction*' },
                ].map(stat => (
                  <div key={stat.label} className="bg-card/90 px-3 py-5 text-center backdrop-blur-sm sm:py-6">
                    <div className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{stat.value}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">*Illustrative benchmarks from early pilots.</p>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-b border-border/40 bg-muted/25">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
            <p className="text-center text-sm text-muted-foreground sm:text-left">Built for venues that want throughput without losing warmth.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Fast', 'Simple', 'Flexible'].map(word => (
                <span
                  key={word}
                  className="rounded-full border border-border/70 bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-b border-border/40 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Product"
              title="Everything in one flow"
              description="From the guest menu to cashier tools—fewer handoffs, clearer tickets, happier rooms."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {features.map(({ icon: Icon, title, description }) => (
                <Card
                  key={title}
                  className="group border-border/60 bg-card/40 shadow-none transition-all duration-200 hover:border-primary/25 hover:bg-card hover:shadow-md"
                >
                  <CardHeader className="gap-3 pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary/12">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg font-semibold leading-snug">{title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">{description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Demo / how it works */}
        <section id="demo" className="scroll-mt-20 bg-muted/15 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Walkthrough"
              title="How QRDer feels on the floor"
              description="Three beats your staff already know—just with less running back and forth."
            />

            <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
              <ol className="space-y-6 lg:col-span-6">
                {demoSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                      aria-hidden
                    >
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
                <li>
                  <Button className="mt-2 rounded-xl" asChild>
                    <Link href="/contact">
                      Plan a live look <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </li>
              </ol>

              <div className="lg:col-span-6">
                <Card className="h-full border-border/70 bg-gradient-to-br from-card via-card to-muted/30 shadow-sm">
                  <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:p-10">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                      <QrCode className="h-8 w-8" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Preview the guest path</h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        We walk you through a branded table link, sample menu, and handoff to your team.
                      </p>
                    </div>
                    <Button variant="outline" className="rounded-xl border-border/80" asChild>
                      <Link href="/contact">
                        <Play className="mr-2 h-4 w-4" /> Book a short demo
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-b border-border/40 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <SectionIntro
              eyebrow="Voices"
              title="Operators who want both speed and care"
              description="Early partners stress-testing QRDer in real dining rooms."
            />

            <div className="grid gap-4 md:grid-cols-3 md:gap-5">
              {testimonials.map(t => (
                <Card key={t.name} className="border-border/60 bg-card/50 shadow-none">
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div className="flex gap-0.5 text-amber-500/90">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                      ))}
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.place}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits + offer */}
        <section className="bg-muted/15 px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div>
              <SectionIntro
                eyebrow="Outcomes"
                title="Built for busy services"
                description="Every screen is tuned for small rooms, loud floors, and menus that change mid-shift."
                align="left"
              />
              <ul className="mt-8 space-y-6">
                {benefitPoints.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border/80">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="border-border/70 shadow-md lg:sticky lg:top-24">
              <CardHeader className="space-y-2 pb-2 text-center sm:text-left">
                <Badge variant="secondary" className="mx-auto w-fit sm:mx-0">
                  Launch offer
                </Badge>
                <CardTitle className="text-2xl font-semibold">Start on your terms</CardTitle>
                <CardDescription className="text-base">No pressure onboarding—we align on what &ldquo;live&rdquo; means for you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="rounded-2xl bg-muted/50 py-6 text-center">
                  <div className="text-4xl font-semibold tabular-nums">$0</div>
                  <p className="mt-1 text-sm text-muted-foreground">To explore the pilot path</p>
                </div>
                <ul className="space-y-3 text-sm">
                  {['Guided menu import', 'QR templates for tables', 'Cashier training pass', 'Direct product feedback line'].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Separator className="bg-border/60" />
                <div className="flex flex-col gap-2">
                  <Button size="lg" className="h-11 rounded-xl" asChild>
                    <Link href="/contact">Talk with us</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-11 rounded-xl border-border/80" asChild>
                    <Link href="/contact">
                      <Headphones className="mr-2 h-4 w-4" /> Book a call
                    </Link>
                  </Button>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">Cards optional for trials • We keep contracts human-readable</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <SectionIntro title="Answers, short and useful" description="Everything we hear on introductory calls—collected here." />

            <Accordion type="single" collapsible className="w-full divide-y divide-border/60 rounded-2xl border border-border/70 px-4">
              {faqItems.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`} className="border-0">
                  <AccordionTrigger className="py-4 text-left text-base font-medium hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-border/40 bg-gradient-to-b from-muted/40 to-muted/20 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Ready when you are</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Share your menu stack and service style—we will show how QRDer maps to how you actually run tonight&apos;s seating.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-12 rounded-xl px-8" asChild>
                <Link href="/contact">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-xl border-border/80 px-8" asChild>
                <Link href="/public-beta">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Read the beta log
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="h-12 px-8 text-muted-foreground" asChild>
                <Link href="/contact">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Questions first
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
