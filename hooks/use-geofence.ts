import { useState, useEffect, useCallback } from 'react'
import { getCurrentPosition } from '@/lib/geofencing'

interface UseGeofenceOptions {
  restaurantLat: number | null
  restaurantLon: number | null
  radiusMeters: number
  enabled: boolean
}

interface UseGeofenceReturn {
  status: 'inside' | 'outside' | 'unknown' | 'error' | 'loading' | 'out_of_range' | 'denied' | 'unsupported'
  distance: number | null
  retry: () => void
}

export function useGeofence({
  restaurantLat,
  restaurantLon,
  radiusMeters,
  enabled,
}: UseGeofenceOptions): UseGeofenceReturn {
  const [status, setStatus] = useState<'inside' | 'outside' | 'unknown' | 'error' | 'loading' | 'out_of_range' | 'denied' | 'unsupported'>('loading')
  const [distance, setDistance] = useState<number | null>(null)

  const checkGeofence = useCallback(async () => {
    if (!enabled || !restaurantLat || !restaurantLon) {
      setStatus('unknown')
      setDistance(null)
      return
    }

    if (!navigator.geolocation) {
      setStatus('unsupported')
      setDistance(null)
      return
    }

    setStatus('loading')
    try {
      const position = await getCurrentPosition()
      const userLat = position.coords.latitude
      const userLon = position.coords.longitude

      // Calculate distance using Haversine formula
      const R = 6371e3 // Earth's radius in meters
      const φ1 = (restaurantLat * Math.PI) / 180
      const φ2 = (userLat * Math.PI) / 180
      const Δφ = ((userLat - restaurantLat) * Math.PI) / 180
      const Δλ = ((userLon - restaurantLon) * Math.PI) / 180

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      const dist = R * c
      setDistance(dist)

      if (dist <= radiusMeters) {
        setStatus('inside')
      } else {
        setStatus('out_of_range')
      }
    } catch (error: any) {
      console.error('Geofence check failed:', error)
      if (error.code === 1) {
        setStatus('denied')
      } else {
        setStatus('error')
      }
      setDistance(null)
    }
  }, [enabled, restaurantLat, restaurantLon, radiusMeters])

  const retry = useCallback(() => {
    checkGeofence()
  }, [checkGeofence])

  useEffect(() => {
    if (enabled) {
      checkGeofence()
    }
  }, [checkGeofence])

  return { status, distance, retry }
}