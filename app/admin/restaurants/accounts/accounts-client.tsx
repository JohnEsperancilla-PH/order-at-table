'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSyncedInitial } from '@/hooks/use-synced-initial'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  UserPlus,
  Users,
  Search,
  MoreHorizontal,
  Building2,
  Mail,
  Shield,
  Trash2,
  Power,
  PowerOff,
  ArrowRight,
} from 'lucide-react'
import { createStaffAccount, deleteStaffAccount, updateStaffAccount } from '@/lib/actions/staff'
import { format } from 'date-fns'

interface Restaurant {
  id: string
  name: string
  slug: string
}

interface Account {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
  restaurant?: Restaurant | null
}

interface AccountsClientProps {
  initialRestaurants: Restaurant[]
  initialAccounts: Account[]
  preselectedRestaurantId?: string | null
}

export function AccountsClient({
  initialRestaurants,
  initialAccounts,
  preselectedRestaurantId = null,
}: AccountsClientProps) {
  const router = useRouter()
  const [accounts, setAccounts] = useSyncedInitial<Account[]>(initialAccounts)
  const [restaurants] = useSyncedInitial<Restaurant[]>(initialRestaurants)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurantFilter, setRestaurantFilter] = useState<string>(
    preselectedRestaurantId || 'all'
  )
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState<{
    restaurantId: string
    email: string
    password: string
    confirmPassword: string
    name: string
    role: 'staff' | 'manager' | 'owner'
  }>({
    restaurantId: preselectedRestaurantId || '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'staff',
  })

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        acc.email.toLowerCase().includes(query) ||
        acc.name.toLowerCase().includes(query) ||
        acc.restaurant?.name?.toLowerCase().includes(query) ||
        acc.restaurant?.slug?.toLowerCase().includes(query)

      const matchesRestaurant =
        restaurantFilter === 'all' || acc.restaurant?.id === restaurantFilter

      return matchesSearch && matchesRestaurant
    })
  }, [accounts, searchQuery, restaurantFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.restaurantId) {
      setError('Please select a restaurant')
      return
    }
    if (!formData.email) {
      setError('Please enter an email')
      return
    }
    if (!formData.name) {
      setError('Please enter a name')
      return
    }
    if (!formData.password) {
      setError('Please enter a password')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const newAccount = await createStaffAccount(
        formData.restaurantId,
        formData.email,
        formData.password,
        formData.name,
        formData.role
      )

      const restaurant = restaurants.find((r) => r.id === formData.restaurantId)
      setAccounts((prev) => [
        {
          ...newAccount,
          restaurant: restaurant || null,
        } as Account,
        ...prev,
      ])

      router.refresh()
      setSuccess('Account created successfully')
      setFormData({
        restaurantId: formData.restaurantId,
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'staff',
      })

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteStaffAccount(deleteTarget.id)
      setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      router.refresh()
      setDeleteTarget(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = async (account: Account) => {
    try {
      const updated = await updateStaffAccount(account.id, {
        is_active: !account.is_active,
      })
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, ...updated } : a))
      )
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update account')
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'owner') return 'default'
    if (role === 'manager') return 'secondary'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border bg-card p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Staff Accounts</h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage staff accounts for each restaurant.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              placeholder="Search by name, email, or restaurant"
            />
          </div>
          <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
            <SelectTrigger>
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All restaurants</SelectItem>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {accounts.length} total
          </Badge>
          <Badge variant="outline">
            {accounts.filter((a) => a.is_active).length} active
          </Badge>
        </div>
      </section>

      {/* Accounts table */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No staff accounts yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first staff account to give restaurant staff access to the cashier.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="mt-6">
              Create Account
            </Button>
          </CardContent>
        </Card>
      ) : filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No matches</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No accounts match your search or filter.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery('')
                setRestaurantFilter('all')
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto p-4 md:p-6">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {account.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    {account.restaurant ? (
                      <Link
                        href={`/${account.restaurant.slug}/cashier`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        {account.restaurant.name}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(account.role)}>
                      <Shield className="mr-1 h-3 w-3" />
                      {account.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.is_active ? 'default' : 'secondary'}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(account.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(account)}
                        >
                          {account.is_active ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(account)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Staff Account</DialogTitle>
            <DialogDescription>
              Create a new staff account and assign it to a restaurant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Restaurant *</Label>
              <Select
                value={formData.restaurantId}
                onValueChange={(v) => setFormData((p) => ({ ...p, restaurantId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="e.g., john@example.com"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v: 'staff' | 'manager' | 'owner') =>
                  setFormData((p) => ({ ...p, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.name} ({deleteTarget?.email}) from the
              platform. They will no longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
