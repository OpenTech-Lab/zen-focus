// Re-export all test utilities for easy importing
export { AuthHelpers } from './auth-helpers'
export { TimerHelpers } from './timer-helpers'
export { SettingsHelpers } from './settings-helpers'
export * from './test-data'

// Common test fixtures
import { test as base } from '@playwright/test'
import { AuthHelpers } from './auth-helpers'
import { TimerHelpers } from './timer-helpers'
import { SettingsHelpers } from './settings-helpers'

// Extend Playwright's base test with our helper classes
export const test = base.extend<{
  authHelpers: AuthHelpers
  timerHelpers: TimerHelpers
  settingsHelpers: SettingsHelpers
}>({
  authHelpers: async ({ page }, use) => {
    await use(new AuthHelpers(page))
  },
  timerHelpers: async ({ page }, use) => {
    await use(new TimerHelpers(page))
  },
  settingsHelpers: async ({ page }, use) => {
    await use(new SettingsHelpers(page))
  },
})

export { expect } from '@playwright/test'
