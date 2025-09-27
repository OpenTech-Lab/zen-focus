import { Page, expect } from '@playwright/test'

export class TimerHelpers {
  constructor(private page: Page) {}

  async startTimer(mode: 'pomodoro' | 'short-break' | 'long-break' = 'pomodoro') {
    // Navigate to timer page if not already there
    if (!this.page.url().includes('/timer')) {
      await this.page.goto('/timer')
    }

    // Select the desired mode
    await this.page.click(`[data-testid="session-mode-${mode}"]`)

    // Start the timer
    await this.page.click('[data-testid="timer-start-button"]')

    // Verify timer is running
    await expect(this.page.locator('[data-testid="timer-status"]')).toContainText('Running')
  }

  async pauseTimer() {
    await this.page.click('[data-testid="timer-pause-button"]')

    // Verify timer is paused
    await expect(this.page.locator('[data-testid="timer-status"]')).toContainText('Paused')
  }

  async resumeTimer() {
    await this.page.click('[data-testid="timer-resume-button"]')

    // Verify timer is running
    await expect(this.page.locator('[data-testid="timer-status"]')).toContainText('Running')
  }

  async resetTimer() {
    await this.page.click('[data-testid="timer-reset-button"]')

    // Verify timer is reset
    await expect(this.page.locator('[data-testid="timer-status"]')).toContainText('Ready')
  }

  async getTimeRemaining(): Promise<string> {
    return await this.page.locator('[data-testid="timer-display"]').textContent() || '00:00'
  }

  async waitForTimerCompletion() {
    // Wait for timer completion notification or status change
    await this.page.waitForSelector('[data-testid="timer-completed"]', { timeout: 30000 })
  }

  async selectSessionMode(mode: 'pomodoro' | 'short-break' | 'long-break' | 'custom') {
    await this.page.click(`[data-testid="session-mode-${mode}"]`)

    // Verify mode is selected
    await expect(this.page.locator(`[data-testid="session-mode-${mode}"]`)).toHaveClass(/active|selected/)
  }

  async setCustomDuration(minutes: number) {
    await this.selectSessionMode('custom')
    await this.page.fill('[data-testid="custom-duration-input"]', minutes.toString())
  }

  async verifyTimerDisplay(expectedTime: string) {
    await expect(this.page.locator('[data-testid="timer-display"]')).toContainText(expectedTime)
  }
}