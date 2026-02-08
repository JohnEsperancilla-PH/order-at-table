import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getAllRestaurants } from '@/lib/actions/restaurants'
import { getSession } from '@/lib/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, Plus, Settings } from 'lucide-react'
import { PlatformAdminClient } from './admin-client'

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  const restaurants = await getAllRestaurants()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Platform Admin</h1>
          <p className="text-muted-foreground">Manage restaurants, staff accounts, and platform settings</p>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{restaurants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{restaurants.filter(r => r.is_open).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Closed Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{restaurants.filter(r => !r.is_open).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Client Component */}
        <PlatformAdminClient initialRestaurants={restaurants} />
      </div>
    </div>
  )
}
