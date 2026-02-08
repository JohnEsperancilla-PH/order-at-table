'use client'

import { useState, useTransition, useEffect, type ChangeEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { updateRestaurant } from '@/lib/actions/restaurants'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

interface DashboardClientProps {
  initialRestaurant: {
    id: string
    name: string
    description?: string | null
    cover_image_url?: string | null
    is_open?: boolean
    opening_hours?: string | null
    contact_number?: string | null
  }
  restaurantSlug: string
}

export function DashboardClient({ initialRestaurant, restaurantSlug }: DashboardClientProps) {
  const [name, setName] = useState(initialRestaurant.name)
  const [description, setDescription] = useState(initialRestaurant.description || '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialRestaurant.cover_image_url || '')
  const [coverPreview, setCoverPreview] = useState<string | null>(initialRestaurant.cover_image_url || null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isOpen, setIsOpen] = useState(initialRestaurant.is_open ?? true)
  const [openingHours, setOpeningHours] = useState(initialRestaurant.opening_hours || '')
  const [contactNumber, setContactNumber] = useState(initialRestaurant.contact_number || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(!!data.user)
    }
    checkAuth()
  }, [supabase.auth])

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setSuccess(null)
    setError(null)
  }

  const compressImage = async (file: File) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = objectUrl
    })

    const maxWidth = 1600
    const scale = Math.min(1, maxWidth / loaded.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(loaded.width * scale)
    canvas.height = Math.round(loaded.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      URL.revokeObjectURL(objectUrl)
      throw new Error('Failed to prepare image upload')
    }
    ctx.drawImage(loaded, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.8)
    )

    URL.revokeObjectURL(objectUrl)

    if (!blob) {
      throw new Error('Failed to compress image')
    }

    return new File([blob], `${file.name.split('.')[0]}.webp`, { type: 'image/webp' })
  }

  const uploadCoverImage = async () => {
    if (!coverFile) return
    if (isAuthenticated === false) {
      setError('You are not authenticated. Please log in.')
      return
    }
    setError(null)
    setSuccess(null)
    setIsUploadingImage(true)
    try {
      const compressed = await compressImage(coverFile)
      const safeName = (name || 'restaurant').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'restaurant'
      const filePath = `${restaurantSlug}/cover-${Date.now()}-${safeName}.webp`

      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, compressed, {
          cacheControl: '3600',
          upsert: false,
          contentType: compressed.type,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase.storage.from('restaurant-images').getPublicUrl(filePath)
      setCoverImageUrl(data.publicUrl)
      setSuccess('Image uploaded. Click Save to apply.')
    } catch (err: any) {
      setError(err.message || 'Failed to upload cover image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSave = () => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        if (coverFile) {
          await uploadCoverImage()
        }
        await updateRestaurant(initialRestaurant.id, {
          name: name.trim() || initialRestaurant.name,
          description: description.trim() || null,
          cover_image_url: coverImageUrl.trim() || null,
          is_open: isOpen,
          opening_hours: openingHours.trim() || null,
          contact_number: contactNumber.trim() || null,
        })
        setSuccess('Restaurant details updated')
      } catch (err: any) {
        setError(err.message || 'Failed to update restaurant')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage restaurant identity and cover image.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              id="restaurant-open"
              checked={isOpen}
              onCheckedChange={(checked) => {
                setIsOpen(checked)
                setSuccess(null)
                setError(null)
              }}
            />
            <Label htmlFor="restaurant-open" className="cursor-pointer font-medium">
              {isOpen ? (
                <span className="text-green-600 dark:text-green-400">Open</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">Closed</span>
              )}
            </Label>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Details</CardTitle>
          <CardDescription>Update the restaurant name, description, and cover image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">Name</Label>
              <Input
                id="restaurant-name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Restaurant name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-image">Cover Image</Label>
              <Input
                id="cover-image"
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
              />
              <div className="flex gap-2">
                <Input
                  value={coverImageUrl}
                  onChange={event => setCoverImageUrl(event.target.value)}
                  placeholder="https://.../cover.jpg"
                />
                <Button
                  variant="outline"
                  onClick={uploadCoverImage}
                  disabled={!coverFile || isUploadingImage}
                >
                  {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurant-description">Description</Label>
            <Textarea
              id="restaurant-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Optional short description"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opening-hours">Opening Hours</Label>
              <Input
                id="opening-hours"
                value={openingHours}
                onChange={event => setOpeningHours(event.target.value)}
                placeholder="e.g., Mon-Sat 8AM - 10PM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-number">Contact Number</Label>
              <Input
                id="contact-number"
                value={contactNumber}
                onChange={event => setContactNumber(event.target.value)}
                placeholder="e.g., +63 912 345 6789"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Live Preview</p>
            <div className="overflow-hidden rounded-xl border shadow-sm max-w-sm">
              <div
                className="aspect-[21/9] w-full bg-gradient-to-br from-muted to-muted/50 relative"
                style={coverPreview || coverImageUrl ? { backgroundImage: `url(${coverPreview || coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="font-bold text-sm drop-shadow">{name || 'Restaurant name'}</p>
                  <p className="text-[11px] text-white/70">Table 1</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isPending || isUploadingImage} className="min-w-[140px]">
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
