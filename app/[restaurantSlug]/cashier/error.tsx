'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CashierError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const slug = params?.restaurantSlug as string

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{error.message || 'An unexpected error occurred.'}</AlertDescription>
      </Alert>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        {slug && (
          <Button asChild variant="secondary">
            <Link href={`/${slug}/cashier`}>Back to cashier</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
