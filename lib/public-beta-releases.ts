/** Curated changelog and feature summaries for QRDer public beta pages. */

export type PublicBetaHighlight = {
  id: string
  title: string
  summary: string
}

export type PublicBetaLogEntry = {
  id: string
  dateDisplay: string
  title: string
  bullets: string[]
}

export type PublicBetaRelease = {
  id: string
  versionLabel: string
  badge?: 'current'
  synopsis: string
  highlights: PublicBetaHighlight[]
  logs: PublicBetaLogEntry[]
}

export const publicBetaReleases: PublicBetaRelease[] = [
  {
    id: 'pb-1-0',
    versionLabel: 'Public Beta 1.0',
    badge: 'current',
    synopsis:
      'First public-facing beta of QRDer: restaurants can run tabletop QR ordering alongside a cashier back office—menu structures, modifiers, carts, and order flow end to end.',
    highlights: [
      {
        id: 'guest',
        title: 'Guest ordering experience',
        summary:
          'Table-scoped menu with accordion categories, modifiers and special instructions, cart with clear pricing, confirmations, and a compact hero banner tuned for phones.',
      },
      {
        id: 'cashier-menu',
        title: 'Cashier menu & modifiers',
        summary:
          'Category-organized menus, per-item modifiers, preset libraries, batch tooling for imports and defaults, availability toggles, and edit flows suited to everyday service.',
      },
      {
        id: 'cashier-rest',
        title: 'Operations & cashier surface',
        summary:
          'Dashboards and supporting screens for managing tables, categories, counters, profits, and core settings—all scoped to each restaurant slug.',
      },
      {
        id: 'foundation',
        title: 'Platform foundation',
        summary:
          'Supabase-backed data model, staged migrations for menu evolution, and REST-style API routes plus health endpoints suitable for cron and probes.',
      },
    ],
    logs: [
      {
        id: 'pb-2026-05-10',
        dateDisplay: 'May 10, 2026',
        title: 'Public Beta 1.0 launch checkpoint',
        bullets: [
          'Promoted QRDer beta messaging and guest-visible “learn more” entry point from the tabletop order shell.',
          'Tightened guest surface layout: condensed hero imagery, clearer cart cues, toast placement, and accordion menu cards aligned with cashier patterns.',
          'Shipped cashier-side modifier presets, batch-aware defaults, and streamlined item dialogs aligned with accordion menu management.',
          'Documented migrations for menu item modifiers and preset storage to keep environments reproducible.',
        ],
      },
      {
        id: 'pb-2026-05-02',
        dateDisplay: 'May 2, 2026',
        title: 'Guest UX & cart polish pass',
        bullets: [
          'Refined line-item pricing beside primary actions so guests see totals before opening the sheet.',
          'Moved in-cart badges inside thumbnails to survive rounded clips and shadows.',
          'Improved stacked “added to cart” feedback on narrow viewports.',
        ],
      },
      {
        id: 'pb-2026-04-22',
        dateDisplay: 'April 22, 2026',
        title: 'Cashier modifier depth',
        bullets: [
          'Expanded cashier menu accordion to carry modifiers with clearer availability and preset wiring.',
          'Added guardrails around service-role access aligned with hardened API surfaces.',
          'Prep work for importer-friendly modifier presets surfaced in-management UI.',
        ],
      },
      {
        id: 'pb-2026-04-08',
        dateDisplay: 'April 8, 2026',
        title: 'Order flow hardening',
        bullets: [
          'Strengthened tabletop order submissions with clearer error surfacing.',
          'Aligned confirmation routes and loading skeletons across table and order entrypoints.',
          'Continuous improvements to cashier login and slug-scoped routing.',
        ],
      },
    ],
  },
]
