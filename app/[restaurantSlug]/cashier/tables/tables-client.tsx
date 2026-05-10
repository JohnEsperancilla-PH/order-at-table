'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSyncedInitial } from '@/hooks/use-synced-initial'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Plus, Edit, Trash2, QrCode, Copy, Check, TableProperties } from 'lucide-react'
import { createTable, updateTable, deleteTable } from '@/lib/actions/tables'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TablesManagementClientProps {
  initialTables: any[]
  restaurantSlug: string
  restaurantId: string
}

export function TablesManagementClient({
  initialTables,
  restaurantSlug,
  restaurantId,
}: TablesManagementClientProps) {
  const [tables] = useSyncedInitial(initialTables)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [tableNumber, setTableNumber] = useState('')
  const [capacity, setCapacity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTableId, setDeleteTableId] = useState<string | null>(null)
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const router = useRouter()

  const handleOpenCreateDialog = () => {
    setSelectedTable(null)
    setTableNumber('')
    setCapacity('')
    setError(null)
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (table: any) => {
    setSelectedTable(table)
    setTableNumber(table.table_number)
    setCapacity(table.capacity?.toString() || '')
    setError(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!tableNumber.trim()) {
      setError('Table number is required')
      return
    }

    let capacityNum: number | undefined
    if (capacity.trim()) {
      capacityNum = parseInt(capacity, 10)
      if (Number.isNaN(capacityNum) || capacityNum < 1) {
        setError('Capacity must be a whole number of at least 1')
        return
      }
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (selectedTable) {
        // Update existing table
        await updateTable(selectedTable.id, {
          table_number: tableNumber.trim(),
          capacity: capacityNum,
        })
      } else {
        // Create new table
        await createTable(restaurantId, tableNumber.trim(), capacityNum)
      }
      router.refresh()
      setNotice(selectedTable ? 'Table updated successfully.' : 'Table added successfully.')
      setTimeout(() => setNotice(null), 5000)
      setIsDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save table')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTableId) return

    try {
      await deleteTable(deleteTableId)
      router.refresh()
      setNotice('Table removed.')
      setTimeout(() => setNotice(null), 5000)
      setIsDeleteDialogOpen(false)
      setDeleteTableId(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete table')
      setIsDeleteDialogOpen(false)
    }
  }

  const generateQRUrl = (tableNumber: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/${restaurantSlug}/table/${tableNumber}/order`
  }

  const handleCopyLink = async (table: any) => {
    const url = generateQRUrl(table.table_number)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedTableId(table.id)
      setTimeout(() => setCopiedTableId(null), 2000)
    } catch (copyError) {
      console.error('Failed to copy link:', copyError)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-muted-foreground">
            Create and manage restaurant tables
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Table
        </Button>
      </div>

      {notice && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">{notice}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
          <CardDescription>
            Manage all restaurant tables. Use the table number in the QR code URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <TableProperties className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm">No tables yet</p>
              <Button size="sm" variant="outline" onClick={handleOpenCreateDialog}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create your first table
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tables.map((table) => (
                <Card key={table.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <CardContent className="flex min-h-[140px] flex-col gap-2.5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Table</p>
                        <p className="text-2xl font-bold">{table.table_number}</p>
                      </div>
                      <Badge variant={table.is_active ? 'default' : 'secondary'}>
                        {table.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Capacity: {table.capacity || '—'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-muted/50 rounded-md px-2 py-1 w-fit">
                      /{restaurantSlug}/table/{table.table_number}/order
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleCopyLink(table)}
                      >
                        {copiedTableId === table.id ? (
                          <><Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />Copied!</>
                        ) : (
                          <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy Link</>
                        )}
                      </Button>
                      <div className="ml-auto flex gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label={`Edit table ${table.table_number}`}
                          onClick={() => handleOpenEditDialog(table)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Delete table ${table.table_number}`}
                          onClick={() => {
                            setDeleteTableId(table.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTable ? 'Edit Table' : 'Create New Table'}
            </DialogTitle>
            <DialogDescription>
              {selectedTable
                ? 'Update table information'
                : 'Add a new table to your restaurant'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="table-number">Table Number *</Label>
              <Input
                id="table-number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g., 1, 2, A1, etc."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity (Optional)</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Number of seats"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !tableNumber.trim()}
                className="flex-1"
              >
                {isSubmitting
                  ? 'Saving...'
                  : selectedTable
                    ? 'Update'
                    : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              table. Make sure there are no active orders for this table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

