import { z } from 'zod'
import {
  type UserPreferences,
  type PartialUserPreferences,
  UserPreferencesSchema,
  createDefaultUserPreferences,
  validateUserPreferences,
  mergeUserPreferences,
} from '../models/user-preferences'
import { PersistenceService } from './persistence-service'
import { audioService } from './audio-service'
import { getGlobalTimerService } from './timer-service'

/**
 * Custom error classes for preference-related errors
 */
export class PreferencesServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'PREFERENCES_SERVICE_ERROR'
  ) {
    super(message)
    this.name = 'PreferencesServiceError'
  }
}

export class PreferenceValidationError extends PreferencesServiceError {
  constructor(key: string, value: unknown, validationError: Error) {
    super(
      `Invalid value for preference '${key}': ${validationError.message}`,
      'PREFERENCE_VALIDATION_ERROR'
    )
  }
}

export class PreferencesMigrationError extends PreferencesServiceError {
  constructor(message: string, cause?: Error) {
    super(`Preferences migration failed: ${message}`, 'PREFERENCES_MIGRATION_ERROR')
    this.cause = cause
  }
}

/**
 * Preference change event data
 */
export interface PreferenceChangeEvent<K extends keyof UserPreferences = keyof UserPreferences> {
  key: K
  oldValue: UserPreferences[K]
  newValue: UserPreferences[K]
  preferences: UserPreferences
}

/**
 * Preference validation error event data
 */
export interface PreferenceValidationErrorEvent {
  key: keyof UserPreferences
  value: unknown
  error: Error
}

/**
 * Preferences migration event data
 */
export interface PreferencesMigrationEvent {
  fromVersion: string
  toVersion: string
  migratedPreferences: UserPreferences
}

/**
 * Preferences reset event data
 */
export interface PreferencesResetEvent {
  previousPreferences: UserPreferences
  newPreferences: UserPreferences
}

/**
 * Preferences loaded event data
 */
export interface PreferencesLoadedEvent {
  userId: string | null
  preferences: UserPreferences
  isDefault: boolean
}

/**
 * Preferences event types and their payload structures
 */
export interface PreferencesEvents {
  preferenceChanged: PreferenceChangeEvent
  preferenceValidationError: PreferenceValidationErrorEvent
  preferencesMigrated: PreferencesMigrationEvent
  preferencesReset: PreferencesResetEvent
  preferencesLoaded: PreferencesLoadedEvent
}

/**
 * Event handler type for preferences events
 */
export type PreferencesEventHandler<K extends keyof PreferencesEvents = keyof PreferencesEvents> = (
  payload: PreferencesEvents[K]
) => void

/**
 * Preferences export data structure
 */
export interface PreferencesExportData {
  userId: string | null
  preferences: UserPreferences
  exportedAt: string
  version: string
}

/**
 * Migration function type for handling preference schema changes
 */
export type PreferencesMigrationFunction = (oldPreferences: any) => UserPreferences

/**
 * User preferences service that handles comprehensive preference management
 *
 * Features:
 * - User preferences management (get, set, update, reset to defaults)
 * - Integration with UserPreferences model for type-safe preference handling
 * - Real-time preference updates with event notifications
 * - Integration with persistence service for preference storage
 * - Integration with other services (audio service for ambient sound, timer service for default modes)
 * - Preference validation and migration for schema changes
 * - Support for both guest and authenticated user preferences
 * - Event-driven architecture for real-time preference updates
 * - Performance optimization with caching and efficient updates
 * - Comprehensive error handling for storage failures, validation errors, service integration issues
 */
export class PreferencesService {
  private static readonly CURRENT_VERSION = '1.0.0'
  private static readonly GUEST_USER_ID = 'guest'

  private persistenceService: PersistenceService
  private currentPreferences: UserPreferences
  private currentUserId: string | null = null
  private initialized = false
  private eventHandlers: Map<
    keyof PreferencesEvents,
    Set<PreferencesEventHandler<keyof PreferencesEvents>>
  > = new Map()

  // Migration functions for handling schema changes
  private migrationMap: Map<string, PreferencesMigrationFunction> = new Map()

  constructor() {
    this.persistenceService = new PersistenceService()
    this.currentPreferences = createDefaultUserPreferences()
    this.setupMigrations()
  }

  /**
   * Initialize the preferences service for a user
   * @param userId - User ID (null for guest user)
   */
  async initialize(userId: string | null): Promise<void> {
    if (this.initialized && this.currentUserId === userId) {
      return // Already initialized for this user
    }

    try {
      this.currentUserId = userId
      const storageUserId = userId || PreferencesService.GUEST_USER_ID

      // Load preferences from storage
      const storedPreferences = await this.persistenceService.getUserPreferences(storageUserId)

      // Validate and migrate if necessary
      const validatedPreferences = await this.validateAndMigratePreferences(storedPreferences)

      this.currentPreferences = validatedPreferences
      this.initialized = true

      // Apply preferences to integrated services
      await this.applyPreferencesToServices()

      // Emit loaded event
      this.emit('preferencesLoaded', {
        userId,
        preferences: this.currentPreferences,
        isDefault: this.arePreferencesDefault(validatedPreferences),
      })
    } catch (error) {
      this.initialized = false
      throw new PreferencesServiceError(
        `Failed to initialize preferences service for user ${userId || 'guest'}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'INITIALIZATION_FAILED'
      )
    }
  }

  /**
   * Switch to a different user
   * @param userId - New user ID (null for guest)
   */
  async switchUser(userId: string | null): Promise<void> {
    if (this.currentUserId === userId) {
      return // Already using this user
    }

    // Save current preferences before switching (if initialized)
    if (this.initialized) {
      await this.saveCurrentPreferences()
    }

    // Reinitialize for new user
    this.initialized = false
    await this.initialize(userId)
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  /**
   * Get current preferences (immutable copy)
   */
  getCurrentPreferences(): Readonly<UserPreferences> {
    return { ...this.currentPreferences }
  }

  /**
   * Update a single preference
   * @param key - Preference key
   * @param value - New value
   */
  async updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> {
    if (!this.initialized) {
      throw new PreferencesServiceError('Preferences service not initialized', 'NOT_INITIALIZED')
    }

    const oldValue = this.currentPreferences[key]

    try {
      // Validate the new value
      this.validatePreferenceValue(key, value)

      // Update local preferences
      const updatedPreferences = {
        ...this.currentPreferences,
        [key]: value,
      }

      // Save to storage
      await this.savePreferences(updatedPreferences)

      // Update current state
      this.currentPreferences = updatedPreferences

      // Apply to integrated services
      await this.applyPreferencesToServices()

      // Emit change event
      this.emit('preferenceChanged', {
        key,
        oldValue,
        newValue: value,
        preferences: this.currentPreferences,
      })
    } catch (error) {
      // Emit validation error event
      this.emit('preferenceValidationError', {
        key,
        value,
        error: error instanceof Error ? error : new Error('Unknown validation error'),
      })

      if (error instanceof PreferencesServiceError) {
        throw error
      }

      throw new PreferencesServiceError(
        `Failed to update preference '${String(key)}': ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'UPDATE_FAILED'
      )
    }
  }

  /**
   * Update multiple preferences at once
   * @param updates - Partial preferences object with updates
   */
  async updatePreferences(updates: PartialUserPreferences): Promise<void> {
    if (!this.initialized) {
      throw new PreferencesServiceError('Preferences service not initialized', 'NOT_INITIALIZED')
    }

    const previousPreferences = { ...this.currentPreferences }

    try {
      // Validate all updates first
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          this.validatePreferenceValue(key as keyof UserPreferences, value)
        }
      }

      // Create updated preferences
      const updatedPreferences = mergeUserPreferences({
        ...this.currentPreferences,
        ...updates,
      })

      // Save to storage
      await this.savePreferences(updatedPreferences)

      // Update current state
      this.currentPreferences = updatedPreferences

      // Apply to integrated services
      await this.applyPreferencesToServices()

      // Emit change events for each updated preference
      for (const [key, newValue] of Object.entries(updates)) {
        if (
          newValue !== undefined &&
          newValue !== previousPreferences[key as keyof UserPreferences]
        ) {
          this.emit('preferenceChanged', {
            key: key as keyof UserPreferences,
            oldValue: previousPreferences[key as keyof UserPreferences],
            newValue,
            preferences: this.currentPreferences,
          } as PreferenceChangeEvent)
        }
      }
    } catch (error) {
      throw new PreferencesServiceError(
        `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BULK_UPDATE_FAILED'
      )
    }
  }

  /**
   * Reset preferences to default values
   */
  async resetToDefaults(): Promise<void> {
    if (!this.initialized) {
      throw new PreferencesServiceError('Preferences service not initialized', 'NOT_INITIALIZED')
    }

    const previousPreferences = { ...this.currentPreferences }
    const defaultPreferences = createDefaultUserPreferences()

    try {
      // Save default preferences
      await this.savePreferences(defaultPreferences)

      // Update current state
      this.currentPreferences = defaultPreferences

      // Apply to integrated services
      await this.applyPreferencesToServices()

      // Emit reset event
      this.emit('preferencesReset', {
        previousPreferences,
        newPreferences: defaultPreferences,
      })
    } catch (error) {
      throw new PreferencesServiceError(
        `Failed to reset preferences to defaults: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'RESET_FAILED'
      )
    }
  }

  /**
   * Apply current audio preferences to audio service
   */
  async applyCurrentAudioPreferences(): Promise<void> {
    if (!this.initialized) {
      return
    }

    try {
      await audioService.applyUserPreferences({
        ambientSound: this.currentPreferences.ambientSound,
        ambientVolume: this.currentPreferences.ambientVolume,
      })
    } catch (error) {
      // Log but don't throw - audio service might not be available
      console.warn('Failed to apply audio preferences:', error)
    }
  }

  /**
   * Export preferences for backup or transfer
   */
  exportPreferences(): PreferencesExportData {
    return {
      userId: this.currentUserId,
      preferences: { ...this.currentPreferences },
      exportedAt: new Date().toISOString(),
      version: PreferencesService.CURRENT_VERSION,
    }
  }

  /**
   * Import preferences from backup or transfer
   * @param data - Exported preferences data
   */
  async importPreferences(data: PreferencesExportData): Promise<void> {
    if (!this.initialized) {
      throw new PreferencesServiceError('Preferences service not initialized', 'NOT_INITIALIZED')
    }

    try {
      // Validate import data structure
      if (!data.preferences || !data.version) {
        throw new Error('Invalid import data structure')
      }

      // Validate preferences data
      const validationResult = validateUserPreferences(data.preferences)
      if (!validationResult.success) {
        throw new Error(`Invalid preferences data: ${validationResult.error.message}`)
      }

      // Update preferences
      await this.updatePreferences(data.preferences)
    } catch (error) {
      throw new PreferencesServiceError(
        `Failed to import preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'IMPORT_FAILED'
      )
    }
  }

  /**
   * Register event handler
   */
  on<K extends keyof PreferencesEvents>(event: K, handler: PreferencesEventHandler<K>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as PreferencesEventHandler<keyof PreferencesEvents>)
  }

  /**
   * Unregister event handler
   */
  off<K extends keyof PreferencesEvents>(event: K, handler: PreferencesEventHandler<K>): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler as PreferencesEventHandler<keyof PreferencesEvents>)
    }
  }

  /**
   * Clean up resources and stop service
   */
  destroy(): void {
    this.eventHandlers.clear()
    this.initialized = false
    this.currentUserId = null
    this.currentPreferences = createDefaultUserPreferences()
  }

  /**
   * Private method to emit events to registered handlers
   */
  private emit<K extends keyof PreferencesEvents>(event: K, payload: PreferencesEvents[K]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          ;(handler as PreferencesEventHandler<K>)(payload)
        } catch (error) {
          console.error(`Error in preferences event handler for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Private method to validate a single preference value
   */
  private validatePreferenceValue<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    // Create a partial preferences object for validation
    const testPreferences = {
      ...createDefaultUserPreferences(),
      [key]: value,
    }

    const validationResult = validateUserPreferences(testPreferences)
    if (!validationResult.success) {
      throw new PreferenceValidationError(String(key), value, validationResult.error)
    }
  }

  /**
   * Private method to validate and migrate preferences if necessary
   */
  private async validateAndMigratePreferences(
    preferences: UserPreferences
  ): Promise<UserPreferences> {
    // First try to validate as-is
    const validationResult = validateUserPreferences(preferences)
    if (validationResult.success) {
      return validationResult.data
    }

    // If validation fails, try migration
    try {
      const migratedPreferences = await this.migratePreferences(preferences)

      // Validate migrated preferences
      const migratedValidation = validateUserPreferences(migratedPreferences)
      if (!migratedValidation.success) {
        throw new PreferencesMigrationError(
          `Migrated preferences failed validation: ${migratedValidation.error.message}`
        )
      }

      return migratedValidation.data
    } catch (error) {
      // Check if this is severely malformed data that can't be migrated
      if (error instanceof PreferencesMigrationError) {
        throw error
      }

      // For other errors during migration, try defaults as last resort
      const defaultPreferences = createDefaultUserPreferences()
      console.warn('Failed to migrate preferences, using defaults:', error)
      return defaultPreferences
    }
  }

  /**
   * Private method to migrate preferences from older versions
   */
  private async migratePreferences(oldPreferences: any): Promise<UserPreferences> {
    // Check if the data is too malformed to migrate
    if (!oldPreferences || typeof oldPreferences !== 'object') {
      throw new PreferencesMigrationError('Preferences data is not a valid object')
    }

    // Check for severely invalid data that can't be migrated
    const hasValidStructure = this.hasValidPreferencesStructure(oldPreferences)
    if (!hasValidStructure) {
      throw new PreferencesMigrationError('Preferences data structure is too malformed to migrate')
    }

    let migratedPreferences = { ...oldPreferences }

    // Handle snake_case to camelCase migration
    if (oldPreferences.default_session_mode) {
      migratedPreferences.defaultSessionMode = oldPreferences.default_session_mode
      delete migratedPreferences.default_session_mode
    }

    if (oldPreferences.ambient_sound) {
      migratedPreferences.ambientSound = oldPreferences.ambient_sound
      delete migratedPreferences.ambient_sound
    }

    if (oldPreferences.ambient_volume) {
      migratedPreferences.ambientVolume = oldPreferences.ambient_volume
      delete migratedPreferences.ambient_volume
    }

    if (oldPreferences.auto_start_breaks) {
      migratedPreferences.autoStartBreaks = oldPreferences.auto_start_breaks
      delete migratedPreferences.auto_start_breaks
    }

    // Merge with defaults to ensure all required fields are present
    migratedPreferences = mergeUserPreferences(migratedPreferences)

    // Emit migration event
    this.emit('preferencesMigrated', {
      fromVersion: 'unknown',
      toVersion: PreferencesService.CURRENT_VERSION,
      migratedPreferences,
    })

    return migratedPreferences
  }

  /**
   * Private method to setup migration functions
   */
  private setupMigrations(): void {
    // Migration functions would be registered here for different versions
    // For example:
    // this.migrationMap.set('0.9.0', this.migrateFromV09ToV10.bind(this))
  }

  /**
   * Private method to save preferences to storage
   */
  private async savePreferences(preferences: UserPreferences): Promise<void> {
    const userId = this.currentUserId || PreferencesService.GUEST_USER_ID
    await this.persistenceService.saveUserPreferences(userId, preferences)
  }

  /**
   * Private method to save current preferences
   */
  private async saveCurrentPreferences(): Promise<void> {
    if (this.initialized) {
      await this.savePreferences(this.currentPreferences)
    }
  }

  /**
   * Private method to apply preferences to integrated services
   */
  private async applyPreferencesToServices(): Promise<void> {
    // Apply audio preferences
    try {
      await audioService.applyUserPreferences({
        ambientSound: this.currentPreferences.ambientSound,
        ambientVolume: this.currentPreferences.ambientVolume,
      })
    } catch (error) {
      // Log but don't throw - audio service might not be available
      console.warn('Failed to apply preferences to audio service:', error)
    }

    // Timer service integration would be handled by the timer service itself
    // when it needs the default session mode, it can call getCurrentPreferences()
  }

  /**
   * Private method to check if preferences are default values
   */
  private arePreferencesDefault(preferences: UserPreferences): boolean {
    const defaults = createDefaultUserPreferences()
    return JSON.stringify(preferences) === JSON.stringify(defaults)
  }

  /**
   * Private method to check if preferences data has a valid structure for migration
   */
  private hasValidPreferencesStructure(data: any): boolean {
    // Check for critical null/undefined values that can't be migrated
    if (data.theme === null) {
      return false
    }

    // Check if we have either camelCase or snake_case versions of required fields
    const hasSessionMode =
      data.defaultSessionMode !== undefined || data.default_session_mode !== undefined
    if (!hasSessionMode) {
      return false
    }

    // Check for type mismatches that can't be easily converted
    const ambientVolume = data.ambientVolume ?? data.ambient_volume
    if (typeof ambientVolume === 'string' && isNaN(Number(ambientVolume))) {
      return false
    }

    const notifications = data.notifications
    if (
      typeof notifications === 'string' &&
      notifications !== 'true' &&
      notifications !== 'false'
    ) {
      return false
    }

    return true
  }
}

/**
 * Create a new preferences service instance
 */
export function createPreferencesService(): PreferencesService {
  return new PreferencesService()
}

/**
 * Global preferences service singleton
 */
let globalPreferencesService: PreferencesService | null = null

/**
 * Get global preferences service instance (singleton)
 */
export function getGlobalPreferencesService(): PreferencesService {
  if (!globalPreferencesService) {
    globalPreferencesService = new PreferencesService()
  }
  return globalPreferencesService
}

/**
 * Destroy global preferences service instance
 */
export function destroyGlobalPreferencesService(): void {
  if (globalPreferencesService) {
    globalPreferencesService.destroy()
    globalPreferencesService = null
  }
}

// Export singleton instance for easy use across the application
export const preferencesService = new PreferencesService()
