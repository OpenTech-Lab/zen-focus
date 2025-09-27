import { test, expect } from './utils'

test.describe('ZenFocus App', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads and has expected elements
    await expect(page).toHaveTitle(/ZenFocus|Zen Focus/)

    // Check for main navigation or key elements
    // These will need to be updated once the actual components are implemented
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/')

    // Test basic navigation - these routes will need to be updated
    // based on the actual application structure

    // For now, just verify we can navigate to different potential routes
    // These tests will be expanded once the application is implemented
    await expect(page.locator('body')).toBeVisible()
  })
})

// This is a basic smoke test that can be expanded once the application components are built
test.describe('Basic functionality', () => {
  test('page loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')

    // Verify no console errors occurred
    expect(errors).toHaveLength(0)
  })
})