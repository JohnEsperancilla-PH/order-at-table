'use client'

import { useState } from 'react'
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
import { Building2, Plus, Settings, Eye, ExternalLink, LogOut } from 'lucide-react'
import { createRestaurant } from '@/lib/actions/restaurants'
import { logout } from '@/lib/actions/auth'
import { CreateAccountModal } from '@/components/create-account-modal'
import { format } from 'date-fns'

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

interface PlatformAdminClientProps {
  initialRestaurants: Restaurant[]
}

export function PlatformAdminClient({ initialRestaurants }: PlatformAdminClientProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactNumber: '',
    openingHours: '',
  })

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
      setIsLoggingOut(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

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

      setRestaurants(prev => [newRestaurant, ...prev])
      setSuccess(`Restaurant "${newRestaurant.name}" created successfully! Slug: ${newRestaurant.slug}`)
      
      // Reset form
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
    } catch (err: any) {
      setError(err.message || 'Failed to create restaurant')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Restaurant Button */}
      <div className="flex justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold">Restaurants</h2>
          <p className="text-muted-foreground mt-1">Manage all restaurants and their staff accounts</p>
        </div>
        <div className="flex gap-2">
          <CreateAccountModal restaurants={restaurants} />
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Restaurant
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </div>

      {/* Restaurants Grid */}
      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No restaurants yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create your first restaurant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map(restaurant => (
            <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-2">{restaurant.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground/70 mt-1">
                      Slug: <code className="bg-muted px-2 py-1 rounded">{restaurant.slug}</code>
                    </CardDescription>
                  </div>
                  <Badge variant={restaurant.is_open ? 'default' : 'secondary'}>
                    {restaurant.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {restaurant.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{restaurant.description}</p>
                )}
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  {restaurant.contact_number && (
                    <div>📞 {restaurant.contact_number}</div>
                  )}
                  {restaurant.opening_hours && (
                    <div>🕐 {restaurant.opening_hours}</div>
                  )}
                </div>

                <Separator className="my-2" />

                <div className="flex gap-2 flex-wrap">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                  >
                    <Link href={`/${restaurant.slug}/cashier`}>
                      <Settings className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Cashier</span>
                      <span className="sm:hidden">Admin</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <a href={`/${restaurant.slug}/table/1`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview
                    </a>
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground/60 pt-1">
                  Created {format(new Date(restaurant.created_at), 'MMM dd, yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Restaurant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Restaurant</DialogTitle>
            <DialogDescription>
              Set up a new restaurant on the platform. A unique slug will be auto-generated from the name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
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
                placeholder="Brief description of your restaurant..."
                value={formData.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                placeholder="e.g., +1 (555) 123-4567"
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
                placeholder="e.g., Mon-Fri: 10am-10pm, Sat-Sun: 12pm-11pm"
                value={formData.openingHours}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
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
              <Button
                onClick={handleCreateRestaurant}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

