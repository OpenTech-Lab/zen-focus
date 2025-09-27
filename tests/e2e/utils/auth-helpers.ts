import { Page } from '@playwright/test'

export class AuthHelpers {
  constructor(private page: Page) {}

  async loginAsTestUser(email = 'test@example.com', password = 'TestPassword123!') {
    await this.page.goto('/login')
    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    await this.page.click('[data-testid="login-button"]')

    // Wait for successful login (redirect to dashboard or timer page)
    await this.page.waitForURL(/\/(dashboard|timer)/)
  }

  async registerTestUser(
    email = 'test@example.com',
    password = 'TestPassword123!',
    confirmPassword = 'TestPassword123!'
  ) {
    await this.page.goto('/register')
    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    await this.page.fill('[data-testid="confirm-password-input"]', confirmPassword)
    await this.page.click('[data-testid="register-button"]')

    // Wait for successful registration
    await this.page.waitForURL(/\/verify-email|\/dashboard/)
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]')
    await this.page.click('[data-testid="logout-button"]')

    // Wait for redirect to login page
    await this.page.waitForURL('/login')
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      // Check if user menu is visible (indicates logged in state)
      await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 1000 })
      return true
    } catch {
      return false
    }
  }
}