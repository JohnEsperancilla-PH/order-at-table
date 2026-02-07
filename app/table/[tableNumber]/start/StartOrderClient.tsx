"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, User } from 'lucide-react'

interface StartOrderClientProps {
  tableId: string
  tableNumber: number
  restaurantName: string
  restaurantDescription: string | null
  restaurantCoverImage: string | null
}

export default function StartOrderClient({ tableId, tableNumber, restaurantName, restaurantDescription, restaurantCoverImage }: StartOrderClientProps) {
  const [name, setName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

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
      localStorage.setItem(key, JSON.stringify({ id: sessionId, name: name.trim() }))
      router.push(`/table/${tableNumber}/order`)
    } catch (err) {
      setError('Unable to start order. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Hero header — matches table landing page */}
      <div className="relative overflow-hidden">
        <div
          className="aspect-[16/9] w-full bg-gradient-to-br from-primary/20 to-primary/5"
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

      {/* Name entry */}
      <div className="flex-1 px-4 pb-6 -mt-4 relative z-10">
        <div className="max-w-md mx-auto">
          <div className={`bg-background border rounded-xl p-6 space-y-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">Who&apos;s ordering?</h2>
              <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
              <p className="text-sm text-muted-foreground">
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
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting || !name.trim()}
                size="lg"
                className="w-full rounded-xl h-12 text-base"
              >
                {submitting ? 'Starting...' : 'Continue'}
                {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
