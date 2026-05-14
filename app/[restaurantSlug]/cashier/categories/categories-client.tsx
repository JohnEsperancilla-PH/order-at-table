'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSyncedInitial } from '@/hooks/use-synced-initial'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Plus, Edit, Trash2, Tags } from 'lucide-react'
import { MenuCategory } from '@/lib/types'
import {
  createMenuCategory,
  deleteMenuCategory,
  toggleMenuCategoryActive,
  updateMenuCategory,
} from '@/lib/actions/menu'

interface CategoriesManagementClientProps {
  initialCategories: MenuCategory[]
  restaurantSlug: string
  restaurantId: string
}

export function CategoriesManagementClient({
  initialCategories,
  restaurantSlug,
  restaurantId,
}: CategoriesManagementClientProps) {
  const router = useRouter()
  const [categories, setCategories] = useSyncedInitial(initialCategories)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [categorySaving, setCategorySaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleOpenCategoryDialog = (category?: MenuCategory) => {
    setEditingCategory(category || null)
    setCategoryName(category?.name || '')
    setCategoryDescription(category?.description || '')
    setCategoryError(null)
    setIsCategoryDialogOpen(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setCategoryError('Category name is required')
      return
    }

    setCategorySaving(true)
    setCategoryError(null)
    try {
      if (editingCategory) {
        const updated = await updateMenuCategory(
          editingCategory.id,
          {
            name: categoryName.trim(),
            description: categoryDescription.trim() || null,
          },
          restaurantSlug
        )
        setCategories(prev => prev.map(item => (item.id === updated.id ? updated : item)))
        setNotice('Category updated.')
      } else {
        const created = await createMenuCategory(
          restaurantId,
          categoryName.trim(),
          categoryDescription.trim() || null,
          restaurantSlug
        )
        setCategories(prev => [...prev, created])
        setNotice('Category created.')
      }
      router.refresh()
      setTimeout(() => setNotice(null), 5000)
      setIsCategoryDialogOpen(false)
    } catch (error: any) {
      setCategoryError(error.message || 'Failed to save category')
    } finally {
      setCategorySaving(false)
    }
  }

  const handleToggleCategory = async (categoryId: string, isActive: boolean) => {
    try {
      const updated = await toggleMenuCategoryActive(categoryId, isActive, restaurantSlug)
      setCategories(prev => prev.map(item => (item.id === updated.id ? updated : item)))
      setCategoryError(null)
      setNotice(isActive ? 'Category is now active.' : 'Category hidden from menu.')
      setTimeout(() => setNotice(null), 4000)
      router.refresh()
    } catch (error: any) {
      setCategoryError(error.message || 'Failed to update category')
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return

    try {
      await deleteMenuCategory(deleteCategoryId, restaurantSlug)
      setCategories(prev => prev.filter(item => item.id !== deleteCategoryId))
      router.refresh()
      setNotice('Category deleted.')
      setTimeout(() => setNotice(null), 5000)
      setIsDeleteDialogOpen(false)
      setDeleteCategoryId(null)
    } catch (error: any) {
      setCategoryError(error.message || 'Failed to delete category')
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage menu categories used on the customer menu
          </p>
        </div>
        <Button onClick={() => handleOpenCategoryDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {notice && (
        <Alert className="border-success/20 bg-success-muted">
          <AlertDescription className="text-success-muted-foreground">{notice}</AlertDescription>
        </Alert>
      )}

      {categoryError && (
        <Alert variant="destructive">
          <AlertDescription>{categoryError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>
            Toggle availability or edit category details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Tags className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm">No categories yet</p>
              <Button size="sm" variant="outline" onClick={() => handleOpenCategoryDialog()}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add your first category
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {categories.map(category => (
                <AccordionItem key={category.id} value={`category-${category.id}`}>
                  <AccordionTrigger className="text-base">
                    <div className="flex items-center gap-2">
                      <span>{category.name}</span>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className={`flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors ${category.is_active ? 'hover:bg-muted/30' : 'opacity-60 bg-muted/20'}`}>
                      <div className="flex-1">
                        {category.description ? (
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">No description</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`category-switch-${category.id}`} className="sr-only">
                          Toggle category
                        </Label>
                        <Switch
                          id={`category-switch-${category.id}`}
                          checked={category.is_active}
                          onCheckedChange={(value) => handleToggleCategory(category.id, value)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label={`Edit category ${category.name}`}
                          onClick={() => handleOpenCategoryDialog(category)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Delete category ${category.name}`}
                          onClick={() => {
                            setDeleteCategoryId(category.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update category details.'
                : 'Create a new menu category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {categoryError && (
              <Alert variant="destructive">
                <AlertDescription>{categoryError}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="e.g., Starters"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description (optional)</Label>
              <Textarea
                id="category-description"
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
                placeholder="Short description"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCategory}
                className="flex-1"
                disabled={categorySaving || !categoryName.trim()}
              >
                {categorySaving ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Categories with menu items cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
