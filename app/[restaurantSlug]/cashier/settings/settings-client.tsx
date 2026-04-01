'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Moon, Keyboard, ListChecks, Radio, RotateCcw, RefreshCw } from 'lucide-react'

const CASHIER_THEME_KEY = 'cashier-theme'
const CASHIER_KEYBOARD_MODE_KEY = 'cashier-controls-keyboard-mode'
const CASHIER_BULK_OPTIONS_KEY = 'cashier-controls-bulk-options'
const CASHIER_LIVE_MODE_KEY = 'cashier-controls-live-mode'
const CASHIER_LIVE_INTERVAL_KEY = 'cashier-controls-live-interval-seconds'

interface SettingsClientProps {
  restaurantSlug: string
}

export function SettingsClient({ restaurantSlug }: SettingsClientProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Settings</h1>
          <p className="text-muted-foreground">
            Configure cashier UI behavior for {restaurantSlug}.
          </p>
        </div>
        <Button variant="outline" onClick={handleResetDefaults} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset Defaults
        </Button>
      </div>

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
          <CardTitle>Orders Controls</CardTitle>
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
              <SelectTrigger id="live-interval" className="h-11 w-full md:w-56">
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
              className="w-full md:w-auto"
              onClick={() => window.dispatchEvent(new Event('cashier-refresh-request'))}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Orders Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
