import { revalidateTag } from 'next/cache'
import { menuCatalogTag } from '@/lib/cache/menu-catalog'

/**
 * Call after any change to categories, menu items, or modifiers for this restaurant.
 * Safe to call from server actions; no-op if tag was never cached.
 */
export function revalidateMenuCatalog(restaurantId: string) {
  revalidateTag(menuCatalogTag(restaurantId), 'default')
}
