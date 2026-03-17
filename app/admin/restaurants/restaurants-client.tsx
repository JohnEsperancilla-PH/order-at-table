'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Plus,
  Settings,
  ExternalLink,
  Search,
  SlidersHorizontal,
  CircleCheck,
  Clock3,
  ArrowRight,
  LayoutGrid,
  List,
} from 'lucide-react'
import { createRestaurant } from '@/lib/actions/restaurants'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null
  is_open: boolean
  opening_hours: string | null
  contact_number: string | null
  created_at: string
  updated_at: string
}

interface RestaurantsClientProps {
  initialRestaurants: Restaurant[]
  firstTableByRestaurantId?: Record<string, string>
}

export function RestaurantsClient({
  initialRestaurants,
  firstTableByRestaurantId = {},
}: RestaurantsClientProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactNumber: '',
    openingHours: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.slug.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && restaurant.is_open) ||
        (statusFilter === 'closed' && !restaurant.is_open)

      return matchesSearch && matchesStatus
    })
  }, [restaurants, searchQuery, statusFilter])

  const handleCreateRestaurant = async () => {
    setError(null)
    setSuccess(null)

    if (!formData.name.trim()) {
      setError('Restaurant name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const newRestaurant = await createRestaurant(formData.name.trim(), {
        description: formData.description.trim() || undefined,
        contact_number: formData.contactNumber.trim() || undefined,
        opening_hours: formData.openingHours.trim() || undefined,
      })

      setRestaurants((prev) => [newRestaurant, ...prev])
      setSuccess(`Restaurant "${newRestaurant.name}" created. Slug: ${newRestaurant.slug}`)

      setFormData({
        name: '',
        description: '',
        contactNumber: '',
        openingHours: '',
      })

      setTimeout(() => {
        setIsCreateDialogOpen(false)
        setSuccess(null)
      }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create restaurant')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openCount = restaurants.filter((r) => r.is_open).length
  const closedCount = restaurants.length - openCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border bg-card p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Restaurants</h1>
            <p className="mt-1 text-muted-foreground">
              Manage restaurants, staff access, and cashier entry points.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New Restaurant
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              placeholder="Search by name or slug"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v: 'all' | 'open' | 'closed') => setStatusFilter(v)}
          >
            <SelectTrigger>
              <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open only</SelectItem>
              <SelectItem value="closed">Closed only</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {restaurants.length} total
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
            <CircleCheck className="h-3.5 w-3.5" />
            {openCount} open
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400">
            <Clock3 className="h-3.5 w-3.5" />
            {closedCount} closed
          </Badge>
        </div>
      </section>

      {/* Content */}
      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No restaurants yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first restaurant to get started.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-6">
              Create Restaurant
            </Button>
          </CardContent>
        </Card>
      ) : filteredRestaurants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No matches</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No restaurants match your search or filter.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <div className="divide-y">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-muted/30 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{restaurant.name}</h3>
                    <Badge variant={restaurant.is_open ? 'default' : 'secondary'}>
                      {restaurant.is_open ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{restaurant.slug}</p>
                  {restaurant.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {restaurant.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    Created {format(new Date(restaurant.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`/${restaurant.slug}/cashier`}>
                      <Settings className="h-3.5 w-3.5" />
                      Cashier
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a
                      href={`/${restaurant.slug}/table/${firstTableByRestaurantId[restaurant.id] || '1'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </a>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="gap-1.5">
                    <Link href={`/admin/restaurants/accounts?restaurant=${restaurant.id}`}>
                      Accounts <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
            <Card
              key={restaurant.id}
              className="flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="line-clamp-2 text-base">{restaurant.name}</CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs">
                      {restaurant.slug}
                    </CardDescription>
                  </div>
                  <Badge variant={restaurant.is_open ? 'default' : 'secondary'} className="shrink-0">
                    {restaurant.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                {restaurant.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {restaurant.description}
                  </p>
                )}
                <div className="space-y-0.5 text-xs text-muted-foreground">
                  {restaurant.contact_number && <div>Contact: {restaurant.contact_number}</div>}
                  {restaurant.opening_hours && <div>Hours: {restaurant.opening_hours}</div>}
                </div>
                <Separator className="my-1" />
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Link href={`/${restaurant.slug}/cashier`}>
                      <Settings className="h-3.5 w-3.5" />
                      Cashier
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                    <a
                      href={`/${restaurant.slug}/table/${firstTableByRestaurantId[restaurant.id] || '1'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </a>
                  </Button>
                </div>
                <Button asChild variant="ghost" size="sm" className="w-full gap-1.5 text-muted-foreground">
                  <Link href={`/admin/restaurants/accounts?restaurant=${restaurant.id}`}>
                    Manage accounts <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground/60">
                  Created {format(new Date(restaurant.created_at), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Restaurant</DialogTitle>
            <DialogDescription>
              A unique slug will be auto-generated from the name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., The Pizza Place"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description..."
                value={formData.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact</Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingHours">Opening Hours</Label>
                <Input
                  id="openingHours"
                  name="openingHours"
                  placeholder="Mon–Fri 10am–10pm"
                  value={formData.openingHours}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateRestaurant} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
