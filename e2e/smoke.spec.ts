import { test, expect } from '@playwright/test'

/**
 * Browser UI smoke tests — requires: npx playwright install chromium
 */
test.describe('public pages', () => {
  test('home loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact')
    await expect(page).toHaveURL(/\/contact/)
  })

  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('heading', { name: /platform admin/i })).toBeVisible()
  })
})
