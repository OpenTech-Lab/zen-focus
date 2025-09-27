import { Page, expect } from '@playwright/test'

export class SettingsHelpers {
  constructor(private page: Page) {}

  async openSettings() {
    await this.page.click('[data-testid="settings-button"]')
    await this.page.waitForSelector('[data-testid="settings-dialog"]')
  }

  async closeSettings() {
    await this.page.click('[data-testid="settings-close-button"]')
    await this.page.waitForSelector('[data-testid="settings-dialog"]', { state: 'hidden' })
  }

  async changeTheme(theme: 'light' | 'dark' | 'system') {
    await this.openSettings()
    await this.page.click(`[data-testid="theme-${theme}"]`)
    await this.closeSettings()

    // Verify theme change
    if (theme === 'dark') {
      await expect(this.page.locator('html')).toHaveClass(/dark/)
    } else if (theme === 'light') {
      await expect(this.page.locator('html')).not.toHaveClass(/dark/)
    }
  }

  async changeAmbientSound(sound: 'none' | 'rain' | 'forest' | 'ocean' | 'cafe') {
    await this.openSettings()
    await this.page.selectOption('[data-testid="ambient-sound-select"]', sound)
    await this.closeSettings()

    // Verify sound setting
    await this.openSettings()
    await expect(this.page.locator('[data-testid="ambient-sound-select"]')).toHaveValue(sound)
    await this.closeSettings()
  }

  async updatePomodoroSettings(
    pomodoroMinutes: number,
    shortBreakMinutes: number,
    longBreakMinutes: number,
    longBreakInterval: number
  ) {
    await this.openSettings()

    await this.page.fill('[data-testid="pomodoro-minutes-input"]', pomodoroMinutes.toString())
    await this.page.fill('[data-testid="short-break-minutes-input"]', shortBreakMinutes.toString())
    await this.page.fill('[data-testid="long-break-minutes-input"]', longBreakMinutes.toString())
    await this.page.fill('[data-testid="long-break-interval-input"]', longBreakInterval.toString())

    await this.page.click('[data-testid="settings-save-button"]')
    await this.closeSettings()
  }

  async toggleAutoStart(type: 'breaks' | 'pomodoros', enabled: boolean) {
    await this.openSettings()

    const switchElement = this.page.locator(`[data-testid="auto-start-${type}-switch"]`)
    const isCurrentlyEnabled = await switchElement.isChecked()

    if (isCurrentlyEnabled !== enabled) {
      await switchElement.click()
    }

    await this.page.click('[data-testid="settings-save-button"]')
    await this.closeSettings()
  }

  async verifySettings(expectedSettings: {
    pomodoroMinutes?: number
    shortBreakMinutes?: number
    longBreakMinutes?: number
    longBreakInterval?: number
    autoStartBreaks?: boolean
    autoStartPomodoros?: boolean
    ambientSound?: string
  }) {
    await this.openSettings()

    if (expectedSettings.pomodoroMinutes !== undefined) {
      await expect(this.page.locator('[data-testid="pomodoro-minutes-input"]')).toHaveValue(
        expectedSettings.pomodoroMinutes.toString()
      )
    }

    if (expectedSettings.shortBreakMinutes !== undefined) {
      await expect(this.page.locator('[data-testid="short-break-minutes-input"]')).toHaveValue(
        expectedSettings.shortBreakMinutes.toString()
      )
    }

    if (expectedSettings.longBreakMinutes !== undefined) {
      await expect(this.page.locator('[data-testid="long-break-minutes-input"]')).toHaveValue(
        expectedSettings.longBreakMinutes.toString()
      )
    }

    if (expectedSettings.longBreakInterval !== undefined) {
      await expect(this.page.locator('[data-testid="long-break-interval-input"]')).toHaveValue(
        expectedSettings.longBreakInterval.toString()
      )
    }

    if (expectedSettings.autoStartBreaks !== undefined) {
      if (expectedSettings.autoStartBreaks) {
        await expect(this.page.locator('[data-testid="auto-start-breaks-switch"]')).toBeChecked()
      } else {
        await expect(this.page.locator('[data-testid="auto-start-breaks-switch"]')).not.toBeChecked()
      }
    }

    if (expectedSettings.autoStartPomodoros !== undefined) {
      if (expectedSettings.autoStartPomodoros) {
        await expect(this.page.locator('[data-testid="auto-start-pomodoros-switch"]')).toBeChecked()
      } else {
        await expect(this.page.locator('[data-testid="auto-start-pomodoros-switch"]')).not.toBeChecked()
      }
    }

    if (expectedSettings.ambientSound !== undefined) {
      await expect(this.page.locator('[data-testid="ambient-sound-select"]')).toHaveValue(
        expectedSettings.ambientSound
      )
    }

    await this.closeSettings()
  }
}