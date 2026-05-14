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
  /** Apple-style codename — Filipino dishes in this product line. */
  codename: string
  badge?: 'current'
  synopsis: string
  highlights: PublicBetaHighlight[]
  logs: PublicBetaLogEntry[]
}

export const publicBetaReleases: PublicBetaRelease[] = [
  {
    id: 'pb-1-1',
    versionLabel: 'Public Beta 1.1',
    codename: 'Halo-Halo',
    badge: 'current',
    synopsis:
      'A wide design refresh: an Apple-flavored landing experience, a dedicated Manager portal alongside the cashier surface, hardened staff-role guardrails, and the foundation for location-aware restaurant geofencing.',
    highlights: [
      {
        id: 'landing',
        title: 'All-new landing experience',
        summary:
          'Aurora gradient canvas, glassmorphic feature cards, fluid typography that scales from phones to ultrawide displays, and a floating frosted navigation — built around a single shared design language.',
      },
      {
        id: 'manager',
        title: 'Manager portal',
        summary:
          'A new role-scoped surface for restaurant owners — dashboard, menu, tables, categories, profits, and settings — separated from the day-to-day cashier flow.',
      },
      {
        id: 'staff-roles',
        title: 'Staff role guardrails',
        summary:
          'Hardened role constraints at the database layer so manager-only screens, cashier actions, and admin tooling stay properly scoped.',
      },
      {
        id: 'geofencing',
        title: 'Restaurant geofencing groundwork',
        summary:
          'Foundational schema for tying tabletop ordering to a restaurant geofence — prep work for location-aware QR scans and on-premises verification.',
      },
      {
        id: 'design-system',
        title: 'Unified design system',
        summary:
          'Shared aurora canvas, glass surface tokens, a pill button hierarchy (primary / glass / light), and scroll-driven reveal animations applied across landing, contact, beta, and error surfaces.',
      },
    ],
    logs: [
      {
        id: 'pb-2026-05-14',
        dateDisplay: 'May 14, 2026',
        title: 'Public Beta 1.1 “Halo-Halo” checkpoint',
        bullets: [
          'Rolled out the new Apple-style landing page with aurora canvas, glassmorphic feature cards, hero phone mockup grouping, and floating frosted navigation.',
          'Aligned /contact, /public-beta, and the error/loading surfaces with the same design language — solid-black typography, glass cards, pill buttons, and consistent fluid scaling.',
          'Added a Public Beta access pill above the homepage hero and a footer link for changelog discoverability.',
          'Replaced the legacy bottom CTA with a “How it works” 3-step glass-card section that bridges Features and FAQ.',
        ],
      },
      {
        id: 'pb-2026-05-12',
        dateDisplay: 'May 12, 2026',
        title: 'Design language consolidation',
        bullets: [
          'Introduced glass-surface, glass-row, feature-card, and pill button tokens for the entire public surface.',
          'Added gradient-edge highlights, inset specular hairlines, and multi-stop drop shadows for a true macOS Tahoe-flavored glass effect.',
          'Removed every semi-transparent gray on the public pages — solid black for all body copy.',
        ],
      },
      {
        id: 'pb-2026-05-08',
        dateDisplay: 'May 8, 2026',
        title: 'Manager portal scaffolding',
        bullets: [
          'New /[restaurantSlug]/manager route group: dashboard, menu, categories, tables, profits, settings, and login screens.',
          'Database constraint for staff role values to keep manager / cashier separation enforced at the data layer.',
          'Shared admin-layout refactor for cross-surface header and sidebar consistency between admin and manager.',
        ],
      },
      {
        id: 'pb-2026-04-28',
        dateDisplay: 'April 28, 2026',
        title: 'Restaurant geofencing foundation',
        bullets: [
          'Initial schema for storing restaurant geofences alongside slugs — center coordinates and radius.',
          'Reserved hooks in middleware for future location-checked QR scan validation.',
        ],
      },
    ],
  },
  {
    id: 'pb-1-0',
    versionLabel: 'Public Beta 1.0',
    codename: 'Adobo',
    synopsis:
      'First public-facing beta of QRDer: restaurants can run tabletop QR ordering alongside a cashier back office — menu structures, modifiers, carts, and order flow end to end.',
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
          'Dashboards and supporting screens for managing tables, categories, counters, profits, and core settings — all scoped to each restaurant slug.',
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
        title: 'Public Beta 1.0 “Adobo” launch checkpoint',
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
