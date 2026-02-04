import Link from 'next/link'
import { getTableByNumber } from '@/lib/actions/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Instagram, Facebook, Twitter } from 'lucide-react'

export default async function TableWelcomePage({
  params,
}: {
  params: Promise<{ tableNumber: string }>
}) {
  const { tableNumber } = await params

  const table = await getTableByNumber(tableNumber)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to {table.restaurants.name}</CardTitle>
            <CardDescription>
              You’re seated at Table {table.table_number}. When you’re ready, tap below to start your order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button asChild size="lg" className="w-full">
              <Link href={`/table/${table.table_number}/order`}>Start Order</Link>
            </Button>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Follow us</p>
              <div className="flex items-center justify-center gap-3">
                <Button asChild variant="outline" size="icon" aria-label="Instagram">
                  <Link href="https://instagram.com" target="_blank" rel="noreferrer">
                    <Instagram className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="icon" aria-label="Facebook">
                  <Link href="https://facebook.com" target="_blank" rel="noreferrer">
                    <Facebook className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="icon" aria-label="Twitter">
                  <Link href="https://x.com" target="_blank" rel="noreferrer">
                    <Twitter className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
