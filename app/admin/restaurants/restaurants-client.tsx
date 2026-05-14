'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSyncedInitial } from '@/hooks/use-synced-initial'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Building2,
  Plus,
  Settings,
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

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  })

  const generatedSlug = formData.name.trim() ? slugify(formData.name) : ''

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
      })

      setRestaurants((prev) => [newRestaurant, ...prev])
      router.refresh()
      setSuccess(`Restaurant "${newRestaurant.name}" created — /${newRestaurant.slug}`)

      setFormData({ name: '', description: '', contactNumber: '', openingHours: '' })
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="Platform"
        title="Restaurants"
        description="Manage restaurants, staff access, and cashier entry points."
      >
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4" />
          New restaurant
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-medium text-foreground">
          <Building2 className="h-3 w-3" />
          {restaurants.length} total
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 font-medium text-success">
          <CircleCheck className="h-3 w-3" />
          {openCount} open
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 font-medium text-warning">
          <Clock3 className="h-3 w-3" />
          {closedCount} closed
        </span>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
            placeholder="Search by name or slug"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: 'all' | 'open' | 'closed') => setStatusFilter(v)}>
          <SelectTrigger className="h-9 w-[160px]">
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open only</SelectItem>
            <SelectItem value="closed">Closed only</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-0.5 rounded-md border bg-secondary/40 p-0.5">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('grid')}
            className="h-7 w-7"
            aria-label="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('list')}
            className="h-7 w-7"
            aria-label="List view"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Building2}
              title="No restaurants yet"
              description="Create your first restaurant to get started."
              action={
                <Button onClick={() => setIsCreateDialogOpen(true)}>Create Restaurant</Button>
              }
            />
          </CardContent>
        </Card>
      ) : filteredRestaurants.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Search}
              title="No matches"
              description="No restaurants match your search or filter."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden py-0">
          <div className="divide-y divide-border/70">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="data-row flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold tracking-tight">{restaurant.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        restaurant.is_open
                          ? 'border-success/30 bg-success/10 text-success'
                          : 'border-border bg-muted text-muted-foreground'
                      }
                    >
                      {restaurant.is_open ? 'Open' : 'Closed'}
                    </Badge>
                    {restaurant.subscription_features?.kitchen === true && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-warning/40 bg-warning/10 text-warning"
                      >
                        <Crown className="h-3 w-3" />
                        Kitchen
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{restaurant.slug}</p>
                  {restaurant.description && (
                    <p className="mt-1 line-clamp-1 text-[13px] text-muted-foreground">
                      {restaurant.description}
                    </p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border/80 bg-background px-2.5 py-1.5">
                    <Switch
                      checked={restaurant.subscription_features?.kitchen === true}
                      disabled={featureLoading === `${restaurant.id}:kitchen`}
                      onCheckedChange={(checked) =>
                        handleToggleFeature(restaurant.id, 'kitchen', checked)
                      }
                    />
                    <Label className="cursor-pointer text-[12px] font-medium">Kitchen Display</Label>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${restaurant.slug}/cashier`}>
                      <Settings className="h-3.5 w-3.5" />
                      Cashier
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/restaurants/accounts?restaurant=${restaurant.id}`}>
                      Accounts
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setDeleteError(null)
                      setRestaurantToDelete(restaurant)
                    }}
                    aria-label={`Delete ${restaurant.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="stat-card flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-[15px] tracking-tight">{restaurant.name}</CardTitle>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      /{restaurant.slug}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      restaurant.is_open
                        ? 'shrink-0 border-success/30 bg-success/10 text-success'
                        : 'shrink-0 border-border bg-muted text-muted-foreground'
                    }
                  >
                    {restaurant.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                {restaurant.description && (
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                    {restaurant.description}
                  </p>
                )}
                <div className="flex items-center justify-between rounded-md border border-border/80 bg-background px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5 text-warning" />
                    <Label
                      htmlFor={`kitchen-${restaurant.id}`}
                      className="cursor-pointer text-[12px] font-medium"
                    >
                      Kitchen Display
                    </Label>
                  </div>
                  <Switch
                    id={`kitchen-${restaurant.id}`}
                    checked={restaurant.subscription_features?.kitchen === true}
                    disabled={featureLoading === `${restaurant.id}:kitchen`}
                    onCheckedChange={(checked) => handleToggleFeature(restaurant.id, 'kitchen', checked)}
                  />
                </div>
                <div className="mt-auto space-y-1.5">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/${restaurant.slug}/cashier`}>
                      <Settings className="h-3.5 w-3.5" />
                      Cashier Console
                    </Link>
                  </Button>
                  <div className="flex gap-1.5">
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link href={`/admin/restaurants/accounts?restaurant=${restaurant.id}`}>
                        Accounts
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setDeleteError(null)
                        setRestaurantToDelete(restaurant)
                      }}
                      aria-label={`Delete ${restaurant.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
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
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-success/20 bg-success-muted">
                <AlertDescription className="text-success-muted-foreground">{success}</AlertDescription>
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
              {generatedSlug && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Slug:</span>
                  <code className="text-xs font-mono font-semibold">{generatedSlug}</code>
                </div>
              )}
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
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="openingHours">Hours</Label>
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
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting} className="flex-1">
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
          if (!open) { setRestaurantToDelete(null); setDeleteError(null) }
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
