'use client'

import { useEffect, useState, useTransition, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { updateRestaurant } from '@/lib/actions/restaurants'
import { uploadRestaurantCoverImage } from '@/lib/actions/storage'
import {
  Moon,
  Keyboard,
  ListChecks,
  Radio,
  RotateCcw,
  RefreshCw,
  Store,
  ImageIcon,
  Clock,
  Phone,
  Calculator,
  Loader2,
} from 'lucide-react'

const ImageConstructor = globalThis.Image

const CASHIER_THEME_KEY = 'cashier-theme'
const CASHIER_KEYBOARD_MODE_KEY = 'cashier-controls-keyboard-mode'
const CASHIER_BULK_OPTIONS_KEY = 'cashier-controls-bulk-options'
const CASHIER_LIVE_MODE_KEY = 'cashier-controls-live-mode'
const CASHIER_LIVE_INTERVAL_KEY = 'cashier-controls-live-interval-seconds'

interface SettingsClientProps {
  restaurant: {
    id: string
    name: string
    description?: string | null
    cover_image_url?: string | null
    is_open?: boolean
    opening_hours?: string | null
    contact_number?: string | null
    service_charge_rate?: number | null
    tax_rate?: number | null
    tax_mode?: 'inclusive' | 'exclusive' | null
    kitchen_cutoff_time?: string | null
  }
  restaurantSlug: string
}

export function SettingsClient({ restaurant: initialRestaurant, restaurantSlug }: SettingsClientProps) {
  const router = useRouter()

  // ---- Restaurant form state ----
  const [name, setName] = useState(initialRestaurant.name)
  const [description, setDescription] = useState(initialRestaurant.description || '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialRestaurant.cover_image_url || '')
  const [coverPreview, setCoverPreview] = useState<string | null>(initialRestaurant.cover_image_url || null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isOpen, setIsOpen] = useState(initialRestaurant.is_open ?? true)
  const [openingHours, setOpeningHours] = useState(initialRestaurant.opening_hours || '')
  const [contactNumber, setContactNumber] = useState(initialRestaurant.contact_number || '')
  const [serviceChargeRate, setServiceChargeRate] = useState(String(initialRestaurant.service_charge_rate ?? 0))
  const [taxRate, setTaxRate] = useState(String(initialRestaurant.tax_rate ?? 0))
  const [taxMode, setTaxMode] = useState<'inclusive' | 'exclusive'>(
    initialRestaurant.tax_mode === 'inclusive' ? 'inclusive' : 'exclusive'
  )
  const [kitchenCutoffTime, setKitchenCutoffTime] = useState(initialRestaurant.kitchen_cutoff_time || '')
  const [restaurantError, setRestaurantError] = useState<string | null>(null)
  const [restaurantSuccess, setRestaurantSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    setName(initialRestaurant.name)
    setDescription(initialRestaurant.description || '')
    setCoverImageUrl(initialRestaurant.cover_image_url || '')
    setCoverPreview(initialRestaurant.cover_image_url || null)
    setCoverFile(null)
    setIsOpen(initialRestaurant.is_open ?? true)
    setOpeningHours(initialRestaurant.opening_hours || '')
    setContactNumber(initialRestaurant.contact_number || '')
    setServiceChargeRate(String(initialRestaurant.service_charge_rate ?? 0))
    setTaxRate(String(initialRestaurant.tax_rate ?? 0))
    setTaxMode(initialRestaurant.tax_mode === 'inclusive' ? 'inclusive' : 'exclusive')
    setKitchenCutoffTime(initialRestaurant.kitchen_cutoff_time || '')
  }, [initialRestaurant])

  // ---- UI preferences state ----
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState(false)
  const [bulkOptions, setBulkOptions] = useState(true)
  const [liveMode, setLiveMode] = useState(true)
  const [liveIntervalSeconds, setLiveIntervalSeconds] = useState('5')

  useEffect(() => {
    const theme = localStorage.getItem(CASHIER_THEME_KEY)
    const keyboard = localStorage.getItem(CASHIER_KEYBOARD_MODE_KEY)
    const bulk = localStorage.getItem(CASHIER_BULK_OPTIONS_KEY)
    const live = localStorage.getItem(CASHIER_LIVE_MODE_KEY)
    const interval = localStorage.getItem(CASHIER_LIVE_INTERVAL_KEY)
    const dark = theme ? theme === 'dark' : document.documentElement.classList.contains('dark')
    setIsDarkMode(dark)
    setKeyboardMode(keyboard === 'true')
    setBulkOptions(bulk !== 'false')
    setLiveMode(live !== 'false')
    if (interval && ['5', '10', '15', '30'].includes(interval)) {
      setLiveIntervalSeconds(interval)
    }
  }, [])

  const broadcastSettings = (next: {
    keyboardMode?: boolean
    bulkOptions?: boolean
    liveMode?: boolean
    liveIntervalSeconds?: number
  }) => {
    window.dispatchEvent(new CustomEvent('cashier-controls-update', { detail: next }))
  }

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked)
    document.documentElement.classList.toggle('dark', checked)
    localStorage.setItem(CASHIER_THEME_KEY, checked ? 'dark' : 'light')
    window.dispatchEvent(new Event('cashier-theme-update'))
  }

  const handleResetDefaults = () => {
    setIsDarkMode(false)
    setKeyboardMode(false)
    setBulkOptions(true)
    setLiveMode(true)
    setLiveIntervalSeconds('5')
    document.documentElement.classList.remove('dark')
    localStorage.setItem(CASHIER_THEME_KEY, 'light')
    localStorage.setItem(CASHIER_KEYBOARD_MODE_KEY, 'false')
    localStorage.setItem(CASHIER_BULK_OPTIONS_KEY, 'true')
    localStorage.setItem(CASHIER_LIVE_MODE_KEY, 'true')
    localStorage.setItem(CASHIER_LIVE_INTERVAL_KEY, '5')
    broadcastSettings({
      keyboardMode: false,
      bulkOptions: true,
      liveMode: true,
      liveIntervalSeconds: 5,
    })
    window.dispatchEvent(new Event('cashier-theme-update'))
  }

  // ---- Restaurant form handlers ----
  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setRestaurantSuccess(null)
    setRestaurantError(null)
  }

  const compressImage = async (file: File) => {
    const image = new ImageConstructor()
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
    if (!blob) throw new Error('Failed to compress image')
    return new File([blob], `${file.name.split('.')[0]}.webp`, { type: 'image/webp' })
  }

  async function compressAndUploadCover(file: File): Promise<string> {
    const compressed = await compressImage(file)
    const formData = new FormData()
    formData.append('file', compressed)
    return uploadRestaurantCoverImage(restaurantSlug, formData)
  }

  const uploadCoverImage = async () => {
    if (!coverFile) return
    setRestaurantError(null)
    setRestaurantSuccess(null)
    setIsUploadingImage(true)
    try {
      const url = await compressAndUploadCover(coverFile)
      setCoverImageUrl(url)
      setCoverPreview(url)
      setCoverFile(null)
      setRestaurantSuccess('Image uploaded. Click Save to apply.')
    } catch (err: any) {
      setRestaurantError(err.message || 'Failed to upload cover image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSaveRestaurant = () => {
    setRestaurantError(null)
    setRestaurantSuccess(null)
    startTransition(async () => {
      try {
        let coverUrlForSave = coverImageUrl
        if (coverFile) {
          setIsUploadingImage(true)
          try {
            coverUrlForSave = await compressAndUploadCover(coverFile)
            setCoverImageUrl(coverUrlForSave)
            setCoverPreview(coverUrlForSave)
            setCoverFile(null)
          } finally {
            setIsUploadingImage(false)
          }
        }
        await updateRestaurant(initialRestaurant.id, {
          name: name.trim() || initialRestaurant.name,
          description: description.trim() || null,
          cover_image_url: coverUrlForSave.trim() || null,
          is_open: isOpen,
          opening_hours: openingHours.trim() || null,
          contact_number: contactNumber.trim() || null,
          service_charge_rate: Number(serviceChargeRate || 0),
          tax_rate: Number(taxRate || 0),
          tax_mode: taxMode,
          kitchen_cutoff_time: kitchenCutoffTime || null,
        })
        setRestaurantSuccess('Restaurant details updated')
        router.refresh()
      } catch (err: any) {
        setRestaurantError(err.message || 'Failed to update restaurant')
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage restaurant details and cashier preferences.">
        <Button variant="outline" onClick={handleResetDefaults} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset UI Defaults
        </Button>
      </PageHeader>

      {/* Restaurant Details */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Store className="h-4 w-4" /> Restaurant Details
          </CardTitle>
          <CardDescription>Update the restaurant name, description, and cover image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {restaurantError && (
            <Alert variant="destructive">
              <AlertDescription>{restaurantError}</AlertDescription>
            </Alert>
          )}
          {restaurantSuccess && (
            <Alert className="border-success/20 bg-success-muted">
              <AlertDescription className="text-success-muted-foreground">{restaurantSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">Name</Label>
              <Input
                id="restaurant-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
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
                  onChange={(event) => setCoverImageUrl(event.target.value)}
                  placeholder="https://.../cover.jpg"
                />
                <Button
                  variant="outline"
                  onClick={uploadCoverImage}
                  disabled={!coverFile || isUploadingImage}
                >
                  {isUploadingImage ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurant-description">Description</Label>
            <Textarea
              id="restaurant-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
                onChange={(event) => setOpeningHours(event.target.value)}
                placeholder="e.g., Mon-Sat 8AM - 10PM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-number">Contact Number</Label>
              <Input
                id="contact-number"
                value={contactNumber}
                onChange={(event) => setContactNumber(event.target.value)}
                placeholder="e.g., +63 912 345 6789"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Business Rules</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-charge-rate">Service Charge (%)</Label>
                <Input
                  id="service-charge-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={serviceChargeRate}
                  onChange={(event) => setServiceChargeRate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-mode">Tax Mode</Label>
                <Select
                  value={taxMode}
                  onValueChange={(v) => setTaxMode(v as 'inclusive' | 'exclusive')}
                >
                  <SelectTrigger id="tax-mode" className="h-10 w-full">
                    <SelectValue placeholder="Select tax mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                    <SelectItem value="inclusive">Inclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kitchen-cutoff">Kitchen Cutoff Time</Label>
                <Input
                  id="kitchen-cutoff"
                  type="time"
                  value={kitchenCutoffTime}
                  onChange={(event) => setKitchenCutoffTime(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Open / Closed</p>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch
                id="restaurant-open"
                checked={isOpen}
                onCheckedChange={(checked) => {
                  setIsOpen(checked)
                  setRestaurantSuccess(null)
                  setRestaurantError(null)
                }}
              />
              <Label htmlFor="restaurant-open" className="cursor-pointer font-medium">
                {isOpen ? (
                  <span className="text-success">Open for orders</span>
                ) : (
                  <span className="text-destructive">Closed</span>
                )}
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Live Preview</p>
            <div className="overflow-hidden rounded-xl border shadow-sm max-w-xs">
              <div
                className="aspect-[21/9] w-full bg-gradient-to-br from-muted to-muted/50 relative"
                style={
                  coverPreview || coverImageUrl
                    ? {
                        backgroundImage: `url(${coverPreview || coverImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
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
            <Button
              onClick={handleSaveRestaurant}
              disabled={isPending || isUploadingImage}
              className="min-w-[140px]"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cashier UI Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <Moon className="h-4 w-4" /> Appearance
            </CardTitle>
            <CardDescription>Theme preference for cashier pages on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Use darker colors for low-light usage.</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders Console Controls</CardTitle>
            <CardDescription>Manage interactions on the Orders cashier page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium inline-flex items-center gap-2">
                  <Keyboard className="h-4 w-4" /> Keyboard Mode
                </p>
                <p className="text-sm text-muted-foreground">Enable shortcuts for faster cashier actions.</p>
              </div>
              <Switch
                checked={keyboardMode}
                onCheckedChange={(checked) => {
                  setKeyboardMode(checked)
                  localStorage.setItem(CASHIER_KEYBOARD_MODE_KEY, String(checked))
                  broadcastSettings({ keyboardMode: checked })
                }}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium inline-flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Bulk Options
                </p>
                <p className="text-sm text-muted-foreground">Show or hide bulk action controls in Orders.</p>
              </div>
              <Switch
                checked={bulkOptions}
                onCheckedChange={(checked) => {
                  setBulkOptions(checked)
                  localStorage.setItem(CASHIER_BULK_OPTIONS_KEY, String(checked))
                  broadcastSettings({ bulkOptions: checked })
                }}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium inline-flex items-center gap-2">
                  <Radio className="h-4 w-4" /> Live Refresh
                </p>
                <p className="text-sm text-muted-foreground">Auto-refresh incoming orders list.</p>
              </div>
              <Switch
                checked={liveMode}
                onCheckedChange={(checked) => {
                  setLiveMode(checked)
                  localStorage.setItem(CASHIER_LIVE_MODE_KEY, String(checked))
                  broadcastSettings({ liveMode: checked })
                }}
              />
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <Label htmlFor="live-interval">Live Refresh Interval</Label>
              <Select
                value={liveIntervalSeconds}
                onValueChange={(value) => {
                  setLiveIntervalSeconds(value)
                  localStorage.setItem(CASHIER_LIVE_INTERVAL_KEY, value)
                  broadcastSettings({ liveIntervalSeconds: Number(value) })
                }}
              >
                <SelectTrigger id="live-interval" className="h-11 w-full">
                  <SelectValue placeholder="Choose interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Every 5 seconds</SelectItem>
                  <SelectItem value="10">Every 10 seconds</SelectItem>
                  <SelectItem value="15">Every 15 seconds</SelectItem>
                  <SelectItem value="30">Every 30 seconds</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">Applies to this browser/device</Badge>
            </div>

            <div className="rounded-lg border p-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.dispatchEvent(new Event('cashier-refresh-request'))}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Orders Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
