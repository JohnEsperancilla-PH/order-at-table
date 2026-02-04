'use client'

import { useState } from 'react'
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
import { Plus, Edit, Trash2, QrCode } from 'lucide-react'
import { createTable, updateTable, deleteTable } from '@/lib/actions/tables'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TablesManagementClientProps {
  initialTables: any[]
  restaurantId: string
}

export function TablesManagementClient({
  initialTables,
  restaurantId,
}: TablesManagementClientProps) {
  const [tables, setTables] = useState(initialTables)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [tableNumber, setTableNumber] = useState('')
  const [capacity, setCapacity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTableId, setDeleteTableId] = useState<string | null>(null)
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

    setIsSubmitting(true)
    setError(null)

    try {
      if (selectedTable) {
        // Update existing table
        await updateTable(selectedTable.id, {
          table_number: tableNumber.trim(),
          capacity: capacity ? parseInt(capacity) : undefined,
        })
      } else {
        // Create new table
        await createTable(
          restaurantId,
          tableNumber.trim(),
          capacity ? parseInt(capacity) : undefined
        )
      }
      router.refresh()
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
      setIsDeleteDialogOpen(false)
      setDeleteTableId(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete table')
      setIsDeleteDialogOpen(false)
    }
  }

  const generateQRUrl = (tableNumber: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/table/${tableNumber}/order`
  }

  const handleCopyLink = async (tableNumber: string) => {
    const url = generateQRUrl(tableNumber)
    try {
      await navigator.clipboard.writeText(url)
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
            <div className="text-center py-8 text-muted-foreground">
              No tables found. Create your first table.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {tables.map((table) => (
                <Card key={table.id} className="overflow-hidden">
                  <CardContent className="flex min-h-[160px] flex-col gap-3 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Table</p>
                        <p className="text-2xl font-semibold">{table.table_number}</p>
                      </div>
                      <Badge variant={table.is_active ? 'default' : 'secondary'}>
                        {table.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Capacity: {table.capacity || 'N/A'}
                    </div>
                    <Badge variant="outline" className="w-fit font-mono text-xs">
                      /table/{table.table_number}/order
                    </Badge>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(table.table_number)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Edit table ${table.table_number}`}
                        onClick={() => handleOpenEditDialog(table)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        aria-label={`Delete table ${table.table_number}`}
                        onClick={() => {
                          setDeleteTableId(table.id)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

