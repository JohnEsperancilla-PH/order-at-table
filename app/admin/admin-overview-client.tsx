'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  CircleCheck,
  Clock3,
  Crown,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface Restaurant {
  id: string
  name: string
  slug: string
  is_open?: boolean
  subscription_features?: Record<string, boolean> | null
  created_at?: string
}

interface Account {
  id: string
  is_active: boolean
  restaurants?:
    | { id: string }
    | { id: string }[]
    | null
}

type StatusFilter = 'all' | 'open' | 'closed' | 'kitchen'
type SortKey = 'name' | 'newest' | 'staff' | 'status'

interface AdminOverviewClientProps {
  restaurants: Restaurant[]
  accounts: Account[]
}

export function AdminOverviewClient({
  restaurants,
  accounts,
}: AdminOverviewClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [isPending, startTransition] = useTransition()

  const staffCountById = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of accounts) {
      const rid = Array.isArray(a.restaurants)
        ? a.restaurants[0]?.id
        : a.restaurants?.id
      if (!rid) continue
      map.set(rid, (map.get(rid) || 0) + 1)
    }
    return map
  }, [accounts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = restaurants.filter((r) => {
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)

      const matchesStatus =
        status === 'all' ||
        (status === 'open' && r.is_open) ||
        (status === 'closed' && !r.is_open) ||
        (status === 'kitchen' && r.subscription_features?.kitchen === true)

      return matchesQuery && matchesStatus
    })

    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'newest':
          return (
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
          )
        case 'staff':
          return (staffCountById.get(b.id) ?? 0) - (staffCountById.get(a.id) ?? 0)
        case 'status':
          if (a.is_open === b.is_open) return a.name.localeCompare(b.name)
          return a.is_open ? -1 : 1
      }
    })
    return rows
  }, [restaurants, query, status, sort, staffCountById])

  const handleRefresh = () => {
    startTransition(() => router.refresh())
  }

  const hasActiveFilters = query.trim() !== '' || status !== 'all'

  return (
    <Card className="overflow-hidden py-0">
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <p className="section-eyebrow">All restaurants</p>
          <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight">
            <span className="num">{filtered.length}</span>
            <span className="ml-1 text-muted-foreground">
              of {restaurants.length}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-8 px-2.5"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" asChild className="h-8">
            <Link href="/admin/restaurants">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New restaurant</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 border-b border-border/70 bg-secondary/30 px-5 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or slug"
            className="h-8 pl-8 pr-8 text-[13px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Select value={status} onValueChange={(v: StatusFilter) => setStatus(v)}>
            <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="kitchen">Kitchen enabled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
            <SelectTrigger className="h-8 w-[150px] text-[12.5px]">
              <ArrowUpDown className="mr-1 h-3 w-3 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="newest">Sort: Newest</SelectItem>
              <SelectItem value="staff">Sort: Staff count</SelectItem>
              <SelectItem value="status">Sort: Status</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setStatus('all')
              }}
              className="h-8 px-2 text-[12px] text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? Search : Building2}
          title={hasActiveFilters ? 'No matches' : 'No restaurants yet'}
          description={
            hasActiveFilters
              ? 'No restaurants match your search or filter.'
              : 'Create your first restaurant from the Restaurants page.'
          }
          action={
            hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/admin/restaurants">Create restaurant</Link>
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Staff</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((restaurant) => {
              const staffCount = staffCountById.get(restaurant.id) ?? 0
              const hasKitchen = restaurant.subscription_features?.kitchen === true
              return (
                <TableRow key={restaurant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-semibold tracking-tight">
                          {restaurant.name}
                        </p>
                        <p className="truncate font-mono text-[11.5px] text-muted-foreground">
                          /{restaurant.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {restaurant.is_open ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-success/30 bg-success/10 text-success"
                      >
                        <CircleCheck className="h-3 w-3" />
                        Open
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-border bg-muted text-muted-foreground"
                      >
                        <Clock3 className="h-3 w-3" />
                        Closed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {staffCount > 0 ? (
                      <span className="num inline-flex items-center gap-1 text-[13px] font-medium">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {staffCount}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasKitchen ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-warning/40 bg-warning/10 text-warning"
                      >
                        <Crown className="h-3 w-3" />
                        Kitchen
                      </Badge>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">
                    {restaurant.created_at ? (
                      <span title={format(new Date(restaurant.created_at), 'PPP')}>
                        {formatDistanceToNow(new Date(restaurant.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="outline" size="sm" className="h-7">
                        <Link href={`/${restaurant.slug}/cashier`}>
                          Cashier
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Open guest table view"
                      >
                        <a
                          href={`/${restaurant.slug}/table/1`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-secondary/30 px-5 py-2.5 text-[12px] text-muted-foreground">
          <span>
            Showing <span className="num font-medium text-foreground">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'restaurant' : 'restaurants'}
          </span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" asChild>
            <Link href="/admin/restaurants">
              Manage all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}
    </Card>
  )
}
