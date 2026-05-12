'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSyncedInitial } from '@/hooks/use-synced-initial'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  Trash2,
  Crown,
} from 'lucide-react'
import { createRestaurant, deleteRestaurant, toggleRestaurantFeature } from '@/lib/actions/restaurants'
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
  subscription_features: Record<string, boolean> | null
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
  const router = useRouter()
  const [restaurants, setRestaurants] = useSyncedInitial<Restaurant[]>(initialRestaurants)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [featureLoading, setFeatureLoading] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactNumber: '',
    openingHours: '',
    latitude: '',
    longitude: '',
    geofenceRadius: '150',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggleFeature = async (restaurantId: string, feature: string, enabled: boolean) => {
    const key = `${restaurantId}:${feature}`
    setFeatureLoading(key)
    try {
      await toggleRestaurantFeature(restaurantId, feature, enabled)
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === restaurantId
            ? {
                ...r,
                subscription_features: {
                  ...(r.subscription_features || {}),
                  [feature]: enabled,
                },
              }
            : r
        )
      )
      router.refresh()
    } catch {
      // revert on error — state stays in sync via re-render
    } finally {
      setFeatureLoading(null)
    }
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
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        geofence_radius_meters: formData.geofenceRadius ? Number(formData.geofenceRadius) : undefined,
      })

      setRestaurants((prev) => [newRestaurant, ...prev])
      router.refresh()
      setSuccess(`Restaurant "${newRestaurant.name}" created. Slug: ${newRestaurant.slug}`)

      setFormData({
        name: '',
        description: '',
        contactNumber: '',
        openingHours: '',
        latitude: '',
        longitude: '',
        geofenceRadius: '150',
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

  const handleConfirmDelete = async () => {
    if (!restaurantToDelete) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteRestaurant(restaurantToDelete.id)
      setRestaurants((prev) => prev.filter((r) => r.id !== restaurantToDelete.id))
      router.refresh()
      setRestaurantToDelete(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete restaurant')
    } finally {
      setIsDeleting(false)
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
                    {restaurant.subscription_features?.kitchen === true && (
                      <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
                        <Crown className="h-3 w-3" />
                        Kitchen
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{restaurant.slug}</p>
                  {restaurant.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {restaurant.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
                      <Switch
                        checked={restaurant.subscription_features?.kitchen === true}
                        disabled={featureLoading === `${restaurant.id}:kitchen`}
                        onCheckedChange={(checked) =>
                          handleToggleFeature(restaurant.id, 'kitchen', checked)
                        }
                      />
                      <Label className="cursor-pointer text-xs">Kitchen Display</Label>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground/80">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setDeleteError(null)
                      setRestaurantToDelete(restaurant)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
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
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant={restaurant.is_open ? 'default' : 'secondary'}>
                      {restaurant.is_open ? 'Open' : 'Closed'}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete restaurant"
                      onClick={() => {
                        setDeleteError(null)
                        setRestaurantToDelete(restaurant)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                <Separator />
                <div className="rounded-lg border px-3 py-2.5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscription Features</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      <Label htmlFor={`kitchen-${restaurant.id}`} className="cursor-pointer text-xs">Kitchen Display</Label>
                    </div>
                    <Switch
                      id={`kitchen-${restaurant.id}`}
                      checked={restaurant.subscription_features?.kitchen === true}
                      disabled={featureLoading === `${restaurant.id}:kitchen`}
                      onCheckedChange={(checked) =>
                        handleToggleFeature(restaurant.id, 'kitchen', checked)
                      }
                    />
                  </div>
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
          ),)}
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

      <AlertDialog
        open={!!restaurantToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setRestaurantToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete restaurant?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{' '}
              <span className="font-medium text-foreground">{restaurantToDelete?.name}</span> and all
              related data (menu, orders, tables, staff accounts). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete restaurant'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
