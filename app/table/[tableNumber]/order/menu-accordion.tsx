'use client'

import { useMemo, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { MenuCategory, MenuItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface MenuAccordionProps {
  categories: MenuCategory[]
  menuItems: MenuItem[]
  onAddToCart: (item: MenuItem) => void
}

export function MenuAccordion({ categories, menuItems, onAddToCart }: MenuAccordionProps) {
  const [openCategory, setOpenCategory] = useState<string | undefined>(categories[0]?.id)

  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>()
    categories.forEach(category => {
      grouped.set(category.id, [])
    })
    menuItems.forEach(item => {
      if (!grouped.has(item.category_id)) {
        grouped.set(item.category_id, [])
      }
      grouped.get(item.category_id)?.push(item)
    })
    return grouped
  }, [categories, menuItems])

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No categories available yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={openCategory}
      onValueChange={setOpenCategory}
      className="w-full"
    >
      {categories.map(category => {
        const items = itemsByCategory.get(category.id) || []

        return (
          <AccordionItem key={category.id} value={category.id}>
            <AccordionTrigger className="text-base">
              <div className="flex items-center gap-2">
                <span>{category.name}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {items.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No items in this category.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map(item => (
                    <Card
                      key={item.id}
                      className={`overflow-hidden ${item.is_available ? '' : 'opacity-60'}`}
                    >
                      {item.image_url && (
                        <div className="w-full overflow-hidden bg-muted">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-48 w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3 pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            {item.description && (
                              <CardDescription className="mt-1">
                                {item.description}
                              </CardDescription>
                            )}
                          </div>
                          <Badge
                            variant={item.is_available ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">
                            {formatCurrency(item.price)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => onAddToCart(item)}
                            disabled={!item.is_available}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {item.is_available ? 'Add' : 'Unavailable'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
