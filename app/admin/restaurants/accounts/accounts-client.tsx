'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSyncedInitial } from '@/hooks/use-synced-initial'
import { Card } from '@/components/ui/card'
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
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
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
  Crown,
  ChefHat,
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

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Shield; variant: 'default' | 'secondary' | 'outline'; className: string }> = {
  owner: { label: 'Owner', icon: Crown, variant: 'default', className: 'border-brand/30 bg-brand/10 text-brand' },
  manager: { label: 'Manager', icon: Shield, variant: 'secondary', className: '' },
  staff: { label: 'Staff', icon: Users, variant: 'outline', className: '' },
  kitchen: { label: 'Kitchen', icon: ChefHat, variant: 'outline', className: 'border-warning/40 text-warning' },
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
  const [restaurantFilter, setRestaurantFilter] = useState<string>(preselectedRestaurantId || 'all')
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState<{
    restaurantId: string
    email: string
    password: string
    confirmPassword: string
    name: string
    role: string
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

    if (!formData.restaurantId) { setError('Please select a restaurant'); return }
    if (!formData.email) { setError('Please enter an email'); return }
    if (!formData.name) { setError('Please enter a name'); return }
    if (!formData.password) { setError('Please enter a password'); return }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return }

    setIsLoading(true)
    try {
      const newAccount = await createStaffAccount(
        formData.restaurantId,
        formData.email,
        formData.password,
        formData.name,
        formData.role as any
      )

      const restaurant = restaurants.find((r) => r.id === formData.restaurantId)
      setAccounts((prev) => [
        { ...newAccount, restaurant: restaurant || null } as Account,
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
      const updated = await updateStaffAccount(account.id, { is_active: !account.is_active })
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, ...updated } : a)))
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update account')
    }
  }

  const hasActiveFilters = searchQuery.trim() !== '' || restaurantFilter !== 'all'
  const activeCount = accounts.filter((a) => a.is_active).length
  const ownerCount = accounts.filter((a) => a.role === 'owner').length
  const kitchenCount = accounts.filter((a) => a.role === 'kitchen').length

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Platform"
        title="Staff Accounts"
        description="Create and manage staff accounts for each restaurant."
      >
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <UserPlus className="h-4 w-4" />
          Create account
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-medium">
          <Users className="h-3 w-3" />
          {accounts.length} total
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 font-medium text-success">
          {activeCount} active
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 font-medium text-brand">
          <Crown className="h-3 w-3" />
          {ownerCount} owners
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 font-medium text-warning">
          <ChefHat className="h-3 w-3" />
          {kitchenCount} kitchen
        </span>
      </div>

      <Card className="overflow-hidden py-0">
        {/* Controls */}
        <div className="flex flex-col gap-2 border-b border-border/70 bg-secondary/30 px-5 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or restaurant"
              className="h-8 pl-8 text-[13px]"
            />
          </div>
          <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
            <SelectTrigger className="h-8 w-[200px] text-[12.5px]">
              <Building2 className="mr-1 h-3 w-3 text-muted-foreground" />
              <SelectValue placeholder="All restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All restaurants</SelectItem>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(''); setRestaurantFilter('all') }}
              className="h-8 px-2 text-[12px] text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        {accounts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff accounts yet"
            description="Create your first staff account to give restaurant staff access to the cashier."
            action={<Button size="sm" onClick={() => setIsCreateOpen(true)}>Create account</Button>}
          />
        ) : filteredAccounts.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches"
            description="No accounts match your search or filter."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearchQuery(''); setRestaurantFilter('all') }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12 text-right">{''}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => {
                const roleCfg = ROLE_CONFIG[account.role] || ROLE_CONFIG.staff
                const Icon = roleCfg.icon
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <span className="text-[13.5px] font-semibold tracking-tight">
                        {account.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-[13px]">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {account.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {account.restaurant ? (
                        <Link
                          href={`/${account.restaurant.slug}/cashier`}
                          className="inline-flex items-center gap-1 text-[13px] font-medium hover:text-brand"
                        >
                          {account.restaurant.name}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </Link>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1 ${roleCfg.className}`}
                      >
                        <Icon className="h-3 w-3" />
                        {roleCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {account.is_active ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-success/30 bg-success/10 text-success"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 border-border bg-muted text-muted-foreground"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground">
                      {format(new Date(account.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleActive(account)}>
                            {account.is_active ? (
                              <><PowerOff className="mr-2 h-4 w-4" /> Deactivate</>
                            ) : (
                              <><Power className="mr-2 h-4 w-4" /> Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(account)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {filteredAccounts.length > 0 && (
          <div className="border-t border-border/70 bg-secondary/30 px-5 py-2.5 text-[12px] text-muted-foreground">
            Showing <span className="num font-medium text-foreground">{filteredAccounts.length}</span>{' '}
            of <span className="num font-medium text-foreground">{accounts.length}</span>{' '}
            {accounts.length === 1 ? 'account' : 'accounts'}
          </div>
        )}
      </Card>

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
              <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            )}
            {success && (
              <Alert className="border-success/20 bg-success-muted">
                <AlertDescription className="text-success-muted-foreground">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Restaurant *</Label>
              <Select value={formData.restaurantId} onValueChange={(v) => setFormData((p) => ({ ...p, restaurantId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select restaurant" /></SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., John Doe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="e.g., john@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm *</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Re-enter" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff — Cashier only (orders, menu, categories)</SelectItem>
                  <SelectItem value="manager">Manager — Full access</SelectItem>
                  <SelectItem value="owner">Owner — Full access</SelectItem>
                  <SelectItem value="kitchen">Kitchen — Kitchen display only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isLoading} className="flex-1">
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
              This will permanently remove {deleteTarget?.name} ({deleteTarget?.email}). They will no longer be able to sign in.
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
