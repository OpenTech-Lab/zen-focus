import { uploadData, downloadData, remove, list } from 'aws-amplify/storage'

// Types for storage operations
export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  onProgress?: (progress: { transferredBytes: number; totalBytes?: number }) => void
}

export interface StorageItem {
  key: string
  size?: number
  lastModified?: Date
  eTag?: string
}

// Storage service for handling S3 operations (ambient sounds, user data exports)
export class StorageService {
  /**
   * Upload a file to S3
   */
  static async uploadFile(
    key: string,
    file: File | Blob,
    options: UploadOptions = {}
  ) {
    try {
      const result = await uploadData({
        key,
        data: file,
        options: {
          contentType: options.contentType,
          metadata: options.metadata,
          onProgress: options.onProgress,
        },
      }).result

      return {
        success: true,
        key: result.key,
      }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Download a file from S3
   */
  static async downloadFile(key: string) {
    try {
      const result = await downloadData({
        key,
      }).result

      return {
        success: true,
        data: result.body,
        metadata: result.metadata,
      }
    } catch (error) {
      console.error('Download error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      }
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string) {
    try {
      await remove({
        key,
      })

      return {
        success: true,
      }
    } catch (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }
    }
  }

  /**
   * List files in S3 with optional prefix
   */
  static async listFiles(prefix: string = '', pageSize: number = 1000) {
    try {
      const result = await list({
        prefix,
        options: {
          pageSize,
        },
      })

      const items: StorageItem[] = result.items.map((item) => ({
        key: item.key,
        size: item.size,
        lastModified: item.lastModified,
        eTag: item.eTag,
      }))

      return {
        success: true,
        items,
        nextToken: result.nextToken,
      }
    } catch (error) {
      console.error('List files error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'List files failed',
      }
    }
  }

  /**
   * Get a signed URL for direct access (for ambient sounds)
   */
  static async getFileUrl(key: string, expiresIn: number = 3600) {
    try {
      const result = await downloadData({
        key,
      }).result

      // Convert the result body to a blob for local URL creation
      const blob = await result.body.blob()

      return {
        success: true,
        url: URL.createObjectURL(blob),
      }
    } catch (error) {
      console.error('Get file URL error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get URL failed',
      }
    }
  }

  /**
   * Upload ambient sound file (admin function)
   */
  static async uploadAmbientSound(
    soundId: string,
    file: File,
    metadata: Record<string, string> = {}
  ) {
    const key = `ambient-sounds/${soundId}.mp3`

    return this.uploadFile(key, file, {
      contentType: 'audio/mpeg',
      metadata: {
        ...metadata,
        type: 'ambient-sound',
        soundId,
      },
    })
  }

  /**
   * Download ambient sound file
   */
  static async downloadAmbientSound(soundId: string) {
    const key = `ambient-sounds/${soundId}.mp3`
    return this.downloadFile(key)
  }

  /**
   * Export user session data
   */
  static async exportUserSessions(userId: string, sessions: any[]) {
    const timestamp = new Date().toISOString().split('T')[0]
    const key = `exports/${userId}/sessions_${timestamp}.json`

    const data = new Blob([JSON.stringify(sessions, null, 2)], {
      type: 'application/json',
    })

    return this.uploadFile(key, data, {
      contentType: 'application/json',
      metadata: {
        type: 'session-export',
        userId,
        exportDate: timestamp,
      },
    })
  }

  /**
   * List available ambient sounds
   */
  static async listAmbientSounds() {
    return this.listFiles('ambient-sounds/')
  }

  /**
   * List user exports
   */
  static async listUserExports(userId: string) {
    return this.listFiles(`exports/${userId}/`)
  }
}

// Local storage utilities for guest users and offline functionality
export class LocalStorageService {
  private static readonly KEYS = {
    GUEST_USER: 'zenfocus_guest_user',
    GUEST_SESSIONS: 'zenfocus_guest_sessions',
    USER_PREFERENCES: 'zenfocus_user_preferences',
    TIMER_STATE: 'zenfocus_timer_state',
    AMBIENT_CACHE: 'zenfocus_ambient_cache',
  } as const

  /**
   * Store data in localStorage with error handling
   */
  static setItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('LocalStorage setItem error:', error)
      return false
    }
  }

  /**
   * Get data from localStorage with error handling
   */
  static getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('LocalStorage getItem error:', error)
      return defaultValue
    }
  }

  /**
   * Remove item from localStorage
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('LocalStorage removeItem error:', error)
      return false
    }
  }

  /**
   * Clear all ZenFocus data from localStorage
   */
  static clearAll(): boolean {
    try {
      Object.values(this.KEYS).forEach((key) => {
        localStorage.removeItem(key)
      })
      return true
    } catch (error) {
      console.error('LocalStorage clearAll error:', error)
      return false
    }
  }

  // Specific methods for ZenFocus data
  static saveGuestUser(user: any) {
    return this.setItem(this.KEYS.GUEST_USER, user)
  }

  static getGuestUser() {
    return this.getItem(this.KEYS.GUEST_USER)
  }

  static saveGuestSessions(sessions: any[]) {
    return this.setItem(this.KEYS.GUEST_SESSIONS, sessions)
  }

  static getGuestSessions(): any[] {
    return this.getItem(this.KEYS.GUEST_SESSIONS, []) || []
  }

  static saveUserPreferences(preferences: any) {
    return this.setItem(this.KEYS.USER_PREFERENCES, preferences)
  }

  static getUserPreferences() {
    return this.getItem(this.KEYS.USER_PREFERENCES)
  }

  static saveTimerState(state: any) {
    return this.setItem(this.KEYS.TIMER_STATE, state)
  }

  static getTimerState() {
    return this.getItem(this.KEYS.TIMER_STATE)
  }

  static saveAmbientCache(cache: any) {
    return this.setItem(this.KEYS.AMBIENT_CACHE, cache)
  }

  static getAmbientCache() {
    return this.getItem(this.KEYS.AMBIENT_CACHE, {})
  }
}