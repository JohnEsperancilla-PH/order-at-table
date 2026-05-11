'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Moon, Keyboard, ListChecks, Radio, RotateCcw, RefreshCw, MapPin, Navigation, Save } from 'lucide-react'
import { Restaurant } from '@/lib/types'
import { updateRestaurant } from '@/lib/actions/restaurants'
import { getCurrentPosition } from '@/lib/geofencing'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const CASHIER_THEME_KEY = 'cashier-theme'
const CASHIER_KEYBOARD_MODE_KEY = 'cashier-controls-keyboard-mode'
const CASHIER_BULK_OPTIONS_KEY = 'cashier-controls-bulk-options'
const CASHIER_LIVE_MODE_KEY = 'cashier-controls-live-mode'
const CASHIER_LIVE_INTERVAL_KEY = 'cashier-controls-live-interval-seconds'

interface SettingsClientProps {
  restaurant: Restaurant
  restaurantSlug: string
}

export function SettingsClient({ restaurant, restaurantSlug }: SettingsClientProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState(false)
  const [bulkOptions, setBulkOptions] = useState(true)
  const [liveMode, setLiveMode] = useState(true)
  const [liveIntervalSeconds, setLiveIntervalSeconds] = useState('5')

  // Location State
  const [lat, setLat] = useState(restaurant.latitude?.toString() || '')
  const [lon, setLon] = useState(restaurant.longitude?.toString() || '')
  const [radius, setRadius] = useState(restaurant.geofence_radius_meters?.toString() || '150')
  const [geofenceEnabled, setGeofenceEnabled] = useState(restaurant.geofence_enabled ?? false)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)

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

  const handleUpdateLocation = async () => {
    setIsUpdatingLocation(true)
    try {
      await updateRestaurant(restaurant.id, {
        latitude: lat ? Number(lat) : null,
        longitude: lon ? Number(lon) : null,
        geofence_radius_meters: radius ? Number(radius) : 150,
        geofence_enabled: geofenceEnabled,
      })
      toast.success('Restaurant location settings updated')
    } catch (error: any) {
      console.error('Failed to update location:', error)
      toast.error(error.message || 'Failed to update location')
    } finally {
      setIsUpdatingLocation(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    setIsFetchingLocation(true)
    try {
      const position = await getCurrentPosition()
      setLat(position.coords.latitude.toString())
      setLon(position.coords.longitude.toString())
      toast.success('Location detected!')
    } catch (error: any) {
      console.error('Failed to get location:', error)
      toast.error('Could not get your location. Please check browser permissions.')
    } finally {
      setIsFetchingLocation(false)
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure cashier UI and restaurant business rules.
          </p>
        </div>
        <Button variant="outline" onClick={handleResetDefaults} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset UI Defaults
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Restaurant Location
              </CardTitle>
              <CardDescription>
                Restrict ordering to customers physically present at the restaurant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3 bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50">
                <div>
                  <p className="font-medium">Enable Vicinity Ordering</p>
                  <p className="text-sm text-muted-foreground">Force location check before ordering.</p>
                </div>
                <Switch 
                  checked={geofenceEnabled} 
                  onCheckedChange={setGeofenceEnabled} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input 
                    id="lat" 
                    type="number" 
                    step="0.00000001"
                    value={lat} 
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="10.7202"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lon">Longitude</Label>
                  <Input 
                    id="lon" 
                    type="number" 
                    step="0.00000001"
                    value={lon} 
                    onChange={(e) => setLon(e.target.value)}
                    placeholder="122.9463"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="radius">Geofence Radius (meters)</Label>
                <Input 
                  id="radius" 
                  type="number" 
                  value={radius} 
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="150"
                />
                <p className="text-xs text-muted-foreground">
                  Customers must be within this distance to place orders. Recommended: 150m.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={handleUseCurrentLocation}
                  disabled={isFetchingLocation}
                >
                  <Navigation className={`mr-2 h-4 w-4 ${isFetchingLocation ? 'animate-spin' : ''}`} />
                  Set to My Current Location
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleUpdateLocation}
                  disabled={isUpdatingLocation}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdatingLocation ? 'Saving...' : 'Save Location'}
                </Button>
              </div>
            </CardContent>
          </Card>

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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders Console Controls</CardTitle>
              <CardDescription>Manage interactions used on the Orders cashier page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium inline-flex items-center gap-2"><Keyboard className="h-4 w-4" /> Keyboard Mode</p>
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
                  <p className="font-medium inline-flex items-center gap-2"><ListChecks className="h-4 w-4" /> Bulk Options</p>
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
                  <p className="font-medium inline-flex items-center gap-2"><Radio className="h-4 w-4" /> Live Refresh</p>
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
    </div>
  )
}
