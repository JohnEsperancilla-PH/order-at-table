"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, User, Lock, ArrowLeft, Loader2 } from 'lucide-react'
import { validateTablePin } from '@/lib/actions/tables'
import { cn } from '@/lib/utils'

interface StartOrderClientProps {
  tableId: string
  tableNumber: number
  restaurantSlug: string
  restaurantName: string
  restaurantDescription: string | null
  restaurantCoverImage: string | null
  requiresPin: boolean
}

export default function StartOrderClient({ tableId, tableNumber, restaurantSlug, restaurantName, restaurantDescription, restaurantCoverImage, requiresPin }: StartOrderClientProps) {
  const [pin, setPin] = useState('')
  const [pinValidated, setPinValidated] = useState(!requiresPin)
  const [pinError, setPinError] = useState<string | null>(null)
  const [validatingPin, setValidatingPin] = useState(false)
  const pinAutoTriedRef = useRef<string>('')

  const [name, setName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const verifyPinDigits = useCallback(
    async (digits: string) => {
      const trimmed = digits.trim()
      if (trimmed.length !== 4 || !/^\d{4}$/.test(trimmed)) {
        setPinError('Please enter a valid 4-digit PIN')
        return
      }
      setValidatingPin(true)
      setPinError(null)
      try {
        const valid = await validateTablePin(tableId, trimmed)
        if (valid) {
          setPinValidated(true)
        } else {
          setPinError('Incorrect PIN. Please try again.')
          setPin('')
          pinAutoTriedRef.current = ''
        }
      } catch {
        setPinError('Unable to verify PIN. Please try again.')
        pinAutoTriedRef.current = ''
      } finally {
        setValidatingPin(false)
      }
    },
    [tableId],
  )

  const handlePinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    await verifyPinDigits(pin)
  }

  useEffect(() => {
    if (!requiresPin || pinValidated || validatingPin) return
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return
    if (pinAutoTriedRef.current === pin) return
    pinAutoTriedRef.current = pin
    void verifyPinDigits(pin)
  }, [pin, pinValidated, requiresPin, validatingPin, verifyPinDigits])

  const saveSessionAndContinue = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    setSubmitting(true)
    try {
      const sessionId = typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2)
      const key = `order_session_${tableId}`
      const expiresAt = Date.now() + 30 * 60 * 1000
      localStorage.setItem(key, JSON.stringify({ id: sessionId, name: name.trim(), expiresAt }))
      router.push(`/${restaurantSlug}/table/${tableNumber}/order`)
    } catch (err) {
      setError('Unable to start order. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const welcomeHref = `/${restaurantSlug}/table/${tableNumber}`

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/20 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-md md:max-w-4xl">
      <div className="relative overflow-hidden">
        <div
          className="h-[clamp(110px,22dvh,180px)] w-full bg-gradient-to-br from-brand/20 to-brand/5"
          style={restaurantCoverImage ? {
            backgroundImage: `url(${restaurantCoverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
            {restaurantName}
          </h1>
          {restaurantDescription && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2">{restaurantDescription}</p>
          )}
        </div>
      </div>

      <div className="relative z-10 -mt-4 flex-1 px-4 pt-5 sm:px-5 sm:pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] md:px-6 md:pt-8">
        <div className="max-w-md mx-auto space-y-3 md:max-w-2xl">
          <Button variant="ghost" size="sm" className="-ml-2 h-10 gap-1.5 px-2 text-muted-foreground hover:text-foreground" asChild>
            <Link href={welcomeHref}>
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back to table
            </Link>
          </Button>

          {requiresPin ? (
            <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Steps">
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                  !pinValidated ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                1 Verify
              </span>
              <span className="text-muted-foreground/40 text-xs" aria-hidden>
                —
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                  pinValidated ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                2 Your name
              </span>
            </div>
          ) : (
            <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your details
            </p>
          )}

          <div className={`bg-background border rounded-xl p-5 sm:p-6 shadow-sm space-y-6 motion-safe:transition-[opacity,transform] motion-safe:duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {!pinValidated ? (
              <>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">Table PIN Required</h2>
                  <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Enter the 4-digit PIN shown on your table.
                  </p>
                </div>

                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setPin(next)
                        if (pinError) setPinError(null)
                        if (next.length < 4) pinAutoTriedRef.current = ''
                      }}
                      placeholder="Enter 4-digit PIN"
                      autoComplete="one-time-code"
                      className="h-12 pl-10 text-base tracking-normal"
                    />
                  </div>

                  {pinError && (
                    <Alert variant="destructive"><AlertDescription>{pinError}</AlertDescription></Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={validatingPin || pin.length !== 4}
                    size="lg"
                    className="w-full rounded-xl h-12 text-base touch-manipulation"
                  >
                    {validatingPin ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">Who&apos;s ordering?</h2>
                  <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Enter your name so we know who this order belongs to.
                  </p>
                </div>

                <form onSubmit={saveSessionAndContinue} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (error) setError(null)
                      }}
                      placeholder="Your name"
                      className="pl-10 h-12 text-base"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    size="lg"
                    className="w-full rounded-xl h-12 text-base touch-manipulation"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting…
                      </>
                    ) : (
                      <>
                        Continue to menu
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}