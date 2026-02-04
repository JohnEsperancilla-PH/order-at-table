import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { QrCode, ShoppingCart, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Order at Table</h1>
          <p className="text-xl text-muted-foreground">
            QR-based ordering system for restaurants
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <QrCode className="w-8 h-8 mb-2" />
              <CardTitle>Customer Order</CardTitle>
              <CardDescription>
                Scan QR code at your table to place an order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access your table&apos;s order page via the QR code provided at your table.
                The URL format is: /table/[tableNumber]/order
              </p>
              <Button asChild variant="outline">
                <Link href="/admin">Admin Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-8 h-8 mb-2" />
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                Manage orders and verify confirmation codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access the admin dashboard to view orders, verify codes, and manage menu items.
              </p>
              <Button asChild>
                <Link href="/admin">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Tech Stack:</strong> Next.js (App Router), shadcn/ui, Tailwind CSS, Supabase
            </p>
            <p>
              <strong>Features:</strong> QR-based ordering, discount codes, order management, menu availability control
            </p>
            <p>
              <strong>Payment:</strong> Cash payment at counter (no online payment)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
