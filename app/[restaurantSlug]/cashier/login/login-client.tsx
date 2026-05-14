'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loginStaffAccount } from '@/lib/actions/staff'
import { LogIn, Loader2 } from 'lucide-react'

interface AdminLoginClientProps {
  restaurantSlug: string
  redirectTo?: string
}

export function AdminLoginClient({ restaurantSlug, redirectTo }: AdminLoginClientProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const account = await loginStaffAccount(restaurantSlug, email, password)
      
      // Store account info in session storage and set cookie for middleware
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`staff_account_${restaurantSlug}`, JSON.stringify(account))
        // Set cookie so middleware allows access to cashier routes
        document.cookie = `staff_session_${restaurantSlug}=${account.id}; path=/; max-age=86400`
        document.cookie = `staff_role_${restaurantSlug}=${account.role}; path=/; max-age=86400`
      }

      router.replace(redirectTo || `/${restaurantSlug}/cashier`)
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm">
            <LogIn className="h-5 w-5" />
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight">Staff Sign In</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Enter your credentials to access the dashboard
          </p>
        </div>

        <Card className="overflow-hidden py-0">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4 py-2">
                <AlertDescription className="text-[13px]">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                  className="h-10"
                />
              </div>

              <Button type="submit" className="h-10 w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          Restaurant: <span className="font-mono">{restaurantSlug}</span>
        </p>
      </div>
    </div>
  )
}
