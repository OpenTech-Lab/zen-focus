import {
  PreferencesService,
  PreferencesServiceError,
  type PreferenceChangeEvent,
  type PreferencesEventHandler,
  type PreferencesMigrationError,
} from './preferences-service'
import { PersistenceService } from './persistence-service'
import { audioService } from './audio-service'
import { getGlobalTimerService } from './timer-service'
import {
  type UserPreferences,
  type PartialUserPreferences,
  createDefaultUserPreferences,
  validateUserPreferences,
} from '../models/user-preferences'

// Mock dependencies
jest.mock('./persistence-service')
jest.mock('./audio-service')
jest.mock('./timer-service')

const MockedPersistenceService = PersistenceService as jest.MockedClass<typeof PersistenceService>
const mockedAudioService = audioService as jest.Mocked<typeof audioService>
const mockedGetGlobalTimerService = getGlobalTimerService as jest.MockedFunction<
  typeof getGlobalTimerService
>

describe('PreferencesService', () => {
  let preferencesService: PreferencesService
  let mockPersistenceService: jest.Mocked<PersistenceService>
  let mockTimerService: any
  let mockEventHandlers: Record<string, PreferencesEventHandler>

  const defaultPreferences = createDefaultUserPreferences()
  const testUserId = 'test-user-123'
  const guestUserId = null

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup persistence service mock
    mockPersistenceService = {
      getUserPreferences: jest.fn(),
      saveUserPreferences: jest.fn(),
      migrateData: jest.fn(),
    } as any

    MockedPersistenceService.mockImplementation(() => mockPersistenceService)

    // Setup timer service mock
    mockTimerService = {
      initializeTimer: jest.fn(),
      getSessionMode: jest.fn(),
    }
    mockedGetGlobalTimerService.mockReturnValue(mockTimerService)

    // Setup audio service mocks
    mockedAudioService.applyUserPreferences = jest.fn()
    mockedAudioService.getCurrentSound = jest.fn().mockReturnValue('silence')
    mockedAudioService.getCurrentVolume = jest.fn().mockReturnValue(50)

    // Setup event handlers
    mockEventHandlers = {
      preferenceChanged: jest.fn(),
      preferenceValidationError: jest.fn(),
      preferencesMigrated: jest.fn(),
      preferencesReset: jest.fn(),
      preferencesLoaded: jest.fn(),
    }

    preferencesService = new PreferencesService()
  })

  afterEach(() => {
    preferencesService.destroy()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with proper default state', () => {
      expect(preferencesService.isInitialized()).toBe(false)
      expect(preferencesService.getCurrentPreferences()).toEqual(defaultPreferences)
      expect(preferencesService.getCurrentUserId()).toBeNull()
    })

    it('should initialize for authenticated user', async () => {
      const userPrefs: UserPreferences = {
        ...defaultPreferences,
        theme: 'dark',
        ambientVolume: 75,
      }
      mockPersistenceService.getUserPreferences.mockResolvedValue(userPrefs)

      await preferencesService.initialize(testUserId)

      expect(mockPersistenceService.getUserPreferences).toHaveBeenCalledWith(testUserId)
      expect(preferencesService.isInitialized()).toBe(true)
      expect(preferencesService.getCurrentUserId()).toBe(testUserId)
      expect(preferencesService.getCurrentPreferences()).toEqual(userPrefs)
    })

    it('should initialize for guest user', async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)

      await preferencesService.initialize(guestUserId)

      expect(mockPersistenceService.getUserPreferences).toHaveBeenCalledWith('guest')
      expect(preferencesService.isInitialized()).toBe(true)
      expect(preferencesService.getCurrentUserId()).toBeNull()
      expect(preferencesService.getCurrentPreferences()).toEqual(defaultPreferences)
    })

    it('should use default preferences if none exist in storage', async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)

      await preferencesService.initialize(testUserId)

      expect(preferencesService.getCurrentPreferences()).toEqual(defaultPreferences)
    })

    it('should handle initialization errors gracefully', async () => {
      const storageError = new Error('Storage unavailable')
      mockPersistenceService.getUserPreferences.mockRejectedValue(storageError)

      await expect(preferencesService.initialize(testUserId)).rejects.toThrow(
        PreferencesServiceError
      )
    })

    it('should not initialize twice', async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)

      await preferencesService.initialize(testUserId)
      await preferencesService.initialize(testUserId)

      expect(mockPersistenceService.getUserPreferences).toHaveBeenCalledTimes(1)
    })
  })

  describe('Preference Management', () => {
    beforeEach(async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)
      await preferencesService.initialize(testUserId)
    })

    it('should get current preferences', () => {
      const preferences = preferencesService.getCurrentPreferences()
      expect(preferences).toEqual(defaultPreferences)
    })

    it('should update single preference', async () => {
      await preferencesService.updatePreference('theme', 'dark')

      expect(mockPersistenceService.saveUserPreferences).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining({ theme: 'dark' })
      )
      expect(preferencesService.getCurrentPreferences().theme).toBe('dark')
    })

    it('should update multiple preferences', async () => {
      const updates: PartialUserPreferences = {
        theme: 'dark',
        ambientVolume: 80,
        notifications: false,
      }

      await preferencesService.updatePreferences(updates)

      expect(mockPersistenceService.saveUserPreferences).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining(updates)
      )

      const currentPrefs = preferencesService.getCurrentPreferences()
      expect(currentPrefs.theme).toBe('dark')
      expect(currentPrefs.ambientVolume).toBe(80)
      expect(currentPrefs.notifications).toBe(false)
    })

    it('should validate preference updates', async () => {
      await expect(
        preferencesService.updatePreference('theme', 'invalid-theme' as any)
      ).rejects.toThrow(PreferencesServiceError)

      await expect(preferencesService.updatePreference('ambientVolume', -10)).rejects.toThrow(
        PreferencesServiceError
      )

      await expect(preferencesService.updatePreference('ambientVolume', 150)).rejects.toThrow(
        PreferencesServiceError
      )
    })

    it('should reset preferences to defaults', async () => {
      // First change some preferences
      await preferencesService.updatePreferences({
        theme: 'dark',
        ambientVolume: 80,
        notifications: false,
      })

      // Then reset
      await preferencesService.resetToDefaults()

      expect(mockPersistenceService.saveUserPreferences).toHaveBeenLastCalledWith(
        testUserId,
        defaultPreferences
      )
      expect(preferencesService.getCurrentPreferences()).toEqual(defaultPreferences)
    })

    it('should handle storage errors during updates', async () => {
      const storageError = new Error('Storage quota exceeded')
      mockPersistenceService.saveUserPreferences.mockRejectedValue(storageError)

      await expect(preferencesService.updatePreference('theme', 'dark')).rejects.toThrow(
        PreferencesServiceError
      )
    })

    it('should reject updates when not initialized', async () => {
      const uninitializedService = new PreferencesService()

      await expect(uninitializedService.updatePreference('theme', 'dark')).rejects.toThrow(
        PreferencesServiceError
      )
    })
  })

  describe('Service Integration', () => {
    beforeEach(async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)
      await preferencesService.initialize(testUserId)
    })

    it('should integrate with AudioService for ambient sound changes', async () => {
      await preferencesService.updatePreferences({
        ambientSound: 'rain',
        ambientVolume: 75,
      })

      expect(mockedAudioService.applyUserPreferences).toHaveBeenCalledWith({
        ambientSound: 'rain',
        ambientVolume: 75,
      })
    })

    it('should integrate with TimerService for default session mode', async () => {
      await preferencesService.updatePreference('defaultSessionMode', 'deepwork')

      // Verify that the preference was saved and is available for timer initialization
      expect(preferencesService.getCurrentPreferences().defaultSessionMode).toBe('deepwork')
    })

    it('should handle audio service integration errors gracefully', async () => {
      const audioError = new Error('Audio context not available')
      mockedAudioService.applyUserPreferences.mockRejectedValue(audioError)

      // Should still save preferences even if audio integration fails
      await preferencesService.updatePreferences({
        ambientSound: 'forest',
        ambientVolume: 60,
      })

      expect(mockPersistenceService.saveUserPreferences).toHaveBeenCalled()
      expect(preferencesService.getCurrentPreferences().ambientSound).toBe('forest')
    })

    it('should apply audio preferences when service becomes available', async () => {
      // Update preferences when audio service is not available
      mockedAudioService.applyUserPreferences.mockRejectedValue(new Error('Not initialized'))

      await preferencesService.updatePreferences({
        ambientSound: 'ocean',
        ambientVolume: 90,
      })

      // Later when audio service becomes available
      mockedAudioService.applyUserPreferences.mockResolvedValue(undefined)
      await preferencesService.applyCurrentAudioPreferences()

      expect(mockedAudioService.applyUserPreferences).toHaveBeenLastCalledWith({
        ambientSound: 'ocean',
        ambientVolume: 90,
      })
    })
  })

  describe('Event System', () => {
    beforeEach(async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)
      await preferencesService.initialize(testUserId)
    })

    it('should register and call event handlers', async () => {
      preferencesService.on('preferenceChanged', mockEventHandlers.preferenceChanged)

      await preferencesService.updatePreference('theme', 'dark')

      expect(mockEventHandlers.preferenceChanged).toHaveBeenCalledWith({
        key: 'theme',
        oldValue: 'system',
        newValue: 'dark',
        preferences: expect.objectContaining({ theme: 'dark' }),
      })
    })

    it('should unregister event handlers', async () => {
      preferencesService.on('preferenceChanged', mockEventHandlers.preferenceChanged)
      preferencesService.off('preferenceChanged', mockEventHandlers.preferenceChanged)

      await preferencesService.updatePreference('theme', 'dark')

      expect(mockEventHandlers.preferenceChanged).not.toHaveBeenCalled()
    })

    it('should emit events for preference validation errors', async () => {
      preferencesService.on(
        'preferenceValidationError',
        mockEventHandlers.preferenceValidationError
      )

      try {
        await preferencesService.updatePreference('theme', 'invalid' as any)
      } catch (error) {
        // Expected to throw
      }

      expect(mockEventHandlers.preferenceValidationError).toHaveBeenCalledWith({
        key: 'theme',
        value: 'invalid',
        error: expect.any(Error),
      })
    })

    it('should emit events for preferences reset', async () => {
      preferencesService.on('preferencesReset', mockEventHandlers.preferencesReset)

      await preferencesService.resetToDefaults()

      expect(mockEventHandlers.preferencesReset).toHaveBeenCalledWith({
        previousPreferences: expect.any(Object),
        newPreferences: defaultPreferences,
      })
    })

    it('should handle event handler errors gracefully', async () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error')
      })
      preferencesService.on('preferenceChanged', errorHandler)

      // Should not throw even if handler throws
      await expect(preferencesService.updatePreference('theme', 'dark')).resolves.toBeUndefined()
    })
  })

  describe('User Session Management', () => {
    it('should switch between user sessions', async () => {
      // Initialize for first user
      const user1Prefs: UserPreferences = { ...defaultPreferences, theme: 'dark' }
      mockPersistenceService.getUserPreferences.mockResolvedValueOnce(user1Prefs)
      await preferencesService.initialize('user1')

      expect(preferencesService.getCurrentUserId()).toBe('user1')
      expect(preferencesService.getCurrentPreferences().theme).toBe('dark')

      // Switch to second user
      const user2Prefs: UserPreferences = { ...defaultPreferences, theme: 'light' }
      mockPersistenceService.getUserPreferences.mockResolvedValueOnce(user2Prefs)
      await preferencesService.switchUser('user2')

      expect(preferencesService.getCurrentUserId()).toBe('user2')
      expect(preferencesService.getCurrentPreferences().theme).toBe('light')
    })

    it('should switch from authenticated user to guest', async () => {
      // Start with authenticated user
      mockPersistenceService.getUserPreferences.mockResolvedValueOnce(defaultPreferences)
      await preferencesService.initialize(testUserId)

      // Switch to guest
      const guestPrefs: UserPreferences = { ...defaultPreferences, ambientVolume: 25 }
      mockPersistenceService.getUserPreferences.mockResolvedValueOnce(guestPrefs)
      await preferencesService.switchUser(null)

      expect(preferencesService.getCurrentUserId()).toBeNull()
      expect(preferencesService.getCurrentPreferences().ambientVolume).toBe(25)
    })

    it('should apply preferences when switching users', async () => {
      const userPrefs: UserPreferences = {
        ...defaultPreferences,
        ambientSound: 'rain',
        ambientVolume: 70,
      }
      mockPersistenceService.getUserPreferences.mockResolvedValue(userPrefs)

      await preferencesService.switchUser(testUserId)

      expect(mockedAudioService.applyUserPreferences).toHaveBeenCalledWith({
        ambientSound: 'rain',
        ambientVolume: 70,
      })
    })
  })

  describe('Data Migration and Versioning', () => {
    it('should handle preference schema migrations', async () => {
      // Mock old format preferences
      const oldPrefs = {
        theme: 'dark',
        default_session_mode: 'study', // snake_case format
        ambient_sound: 'rain',
        ambient_volume: 60,
        notifications: true,
        auto_start_breaks: false,
      }

      // Mock migration process
      mockPersistenceService.getUserPreferences.mockResolvedValue(oldPrefs as any)
      preferencesService.on('preferencesMigrated', mockEventHandlers.preferencesMigrated)

      await preferencesService.initialize(testUserId)

      // Should handle old format gracefully
      expect(preferencesService.isInitialized()).toBe(true)
    })

    it('should validate migrated preferences', async () => {
      const invalidMigratedPrefs = {
        theme: 'invalid-theme',
        defaultSessionMode: 'study',
        ambientSound: 'rain',
        ambientVolume: 'invalid', // Invalid type
        notifications: true,
        autoStartBreaks: false,
      }

      mockPersistenceService.getUserPreferences.mockResolvedValue(invalidMigratedPrefs as any)

      await expect(preferencesService.initialize(testUserId)).rejects.toThrow(
        PreferencesServiceError
      )
    })
  })

  describe('Caching and Performance', () => {
    beforeEach(async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)
      await preferencesService.initialize(testUserId)
    })

    it('should cache preferences to avoid repeated storage reads', async () => {
      // Multiple calls to get preferences
      preferencesService.getCurrentPreferences()
      preferencesService.getCurrentPreferences()
      preferencesService.getCurrentPreferences()

      // Should only read from storage during initialization
      expect(mockPersistenceService.getUserPreferences).toHaveBeenCalledTimes(1)
    })

    it('should batch multiple rapid preference updates', async () => {
      // Rapid updates
      await Promise.all([
        preferencesService.updatePreference('theme', 'dark'),
        preferencesService.updatePreference('ambientVolume', 80),
        preferencesService.updatePreference('notifications', false),
      ])

      // Should still save all updates
      expect(mockPersistenceService.saveUserPreferences).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent preference updates gracefully', async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)
      await preferencesService.initialize(testUserId)

      // Simulate concurrent updates
      const updates = [
        preferencesService.updatePreference('theme', 'dark'),
        preferencesService.updatePreference('ambientVolume', 75),
        preferencesService.updatePreference('defaultSessionMode', 'deepwork'),
      ]

      await expect(Promise.all(updates)).resolves.toBeDefined()
    })

    it('should maintain consistency during storage failures', async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)
      await preferencesService.initialize(testUserId)

      // First update succeeds
      await preferencesService.updatePreference('theme', 'dark')
      expect(preferencesService.getCurrentPreferences().theme).toBe('dark')

      // Second update fails
      mockPersistenceService.saveUserPreferences.mockRejectedValueOnce(new Error('Storage error'))

      try {
        await preferencesService.updatePreference('ambientVolume', 80)
      } catch (error) {
        // Expected to fail
      }

      // State should remain consistent
      expect(preferencesService.getCurrentPreferences().theme).toBe('dark')
      expect(preferencesService.getCurrentPreferences().ambientVolume).toBe(50) // Should remain unchanged
    })

    it('should handle malformed preference data gracefully', async () => {
      const malformedPrefs = {
        theme: null,
        defaultSessionMode: undefined,
        ambientSound: 'rain',
        ambientVolume: '50', // String instead of number
        notifications: 'yes', // String instead of boolean
        autoStartBreaks: true,
      }

      mockPersistenceService.getUserPreferences.mockResolvedValue(malformedPrefs as any)

      await expect(preferencesService.initialize(testUserId)).rejects.toThrow(
        PreferencesServiceError
      )
    })
  })

  describe('Cleanup and Resource Management', () => {
    it('should cleanup resources on destroy', async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)
      await preferencesService.initialize(testUserId)

      // Add event listeners
      preferencesService.on('preferenceChanged', mockEventHandlers.preferenceChanged)

      preferencesService.destroy()

      expect(preferencesService.isInitialized()).toBe(false)

      // Should not call handlers after destroy
      await expect(preferencesService.updatePreference('theme', 'dark')).rejects.toThrow(
        PreferencesServiceError
      )
    })

    it('should handle destroy when not initialized', () => {
      const uninitializedService = new PreferencesService()

      expect(() => uninitializedService.destroy()).not.toThrow()
    })
  })

  describe('Utility Methods', () => {
    beforeEach(async () => {
      mockPersistenceService.getUserPreferences.mockResolvedValue(defaultPreferences)
      await preferencesService.initialize(testUserId)
    })

    it('should export preferences for backup', () => {
      const exported = preferencesService.exportPreferences()

      expect(exported).toEqual({
        userId: testUserId,
        preferences: defaultPreferences,
        exportedAt: expect.any(String),
        version: expect.any(String),
      })
    })

    it('should import preferences from backup', async () => {
      const importData = {
        userId: testUserId,
        preferences: { ...defaultPreferences, theme: 'dark' as const },
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      }

      await preferencesService.importPreferences(importData)

      expect(mockPersistenceService.saveUserPreferences).toHaveBeenCalledWith(
        testUserId,
        importData.preferences
      )
      expect(preferencesService.getCurrentPreferences().theme).toBe('dark')
    })

    it('should validate import data format', async () => {
      const invalidImportData = {
        preferences: { theme: 'invalid' },
        exportedAt: 'invalid-date',
      }

      await expect(preferencesService.importPreferences(invalidImportData as any)).rejects.toThrow(
        PreferencesServiceError
      )
    })
  })
})
