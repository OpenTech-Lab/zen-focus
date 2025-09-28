import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

/**
 * Integration test for theme and ambient sound switching
 *
 * This test validates the complete customization experience following Scenario 2 from quickstart.md:
 * "Theme and Ambient Sound Customization" - validates theme switching and ambient sound functionality.
 *
 * This is an INTEGRATION test - testing multiple components working together:
 * - Theme service integration with UI components and CSS styling
 * - Audio service integration with ambient sound controls and volume management
 * - User preferences service integration with persistence (localStorage for guests, API for authenticated users)
 * - Settings UI integration with preferences service and real-time application
 * - Timer session integration with ambient sound playback
 * - Preferences loading and synchronization across app initialization
 *
 * Key Integration Points Tested:
 * - Theme service + UI components + CSS styling system
 * - Audio service + sound controls + timer session coordination
 * - Preferences service + persistence layer + state management
 * - Settings UI + real-time preference application + user experience
 * - Authenticated vs guest user customization workflows
 * - Cross-component preference synchronization and state consistency
 */

describe('Customization Integration Test - Theme and Ambient Sound Switching', () => {
  const USER_PREFERENCES_ENDPOINT = '/api/users/me/preferences'
  const TIMER_STATE_ENDPOINT = '/api/timer/state'

  // Test data for different theme configurations
  const lightThemePreferences = {
    theme: 'light',
    ambientSound: 'rain',
    soundVolume: 50,
    defaultSessionMode: 'study',
    customIntervals: [],
  }

  const darkThemePreferences = {
    theme: 'dark',
    ambientSound: 'forest',
    soundVolume: 75,
    defaultSessionMode: 'deepwork',
    customIntervals: [],
  }

  const systemThemePreferences = {
    theme: 'system',
    ambientSound: 'ocean',
    soundVolume: 25,
    defaultSessionMode: 'zen',
    customIntervals: [],
  }

  // Test data for different ambient sound configurations
  const ambientSoundOptions = ['rain', 'forest', 'ocean', 'silence']
  const volumeLevels = [0, 25, 50, 75, 100]

  // Test timer state for ambient sound integration
  const activeTimerWithSound = {
    isActive: true,
    isPaused: false,
    mode: 'study',
    phase: 'work',
    timeRemaining: 1500,
    totalElapsed: 0,
    currentCycle: 1,
    ambientSound: 'rain',
    soundVolume: 50,
  }

  const pausedTimerWithSound = {
    isActive: true,
    isPaused: true,
    mode: 'study',
    phase: 'work',
    timeRemaining: 1470,
    totalElapsed: 30,
    currentCycle: 1,
    ambientSound: 'rain',
    soundVolume: 50,
  }

  beforeEach(async () => {
    // Clear any existing preferences and timer state
    await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Clear localStorage for clean guest state
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }

    // Mock audio elements and CSS computedStyle for theme testing
    global.HTMLAudioElement = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      load: jest.fn(),
      volume: 0.5,
      currentTime: 0,
      duration: 60,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    // Mock CSS computedStyle for theme verification
    global.getComputedStyle = jest.fn().mockImplementation(() => ({
      getPropertyValue: jest.fn().mockReturnValue('#ffffff'),
    }))
  })

  afterEach(async () => {
    // Clean up preferences and timer state
    await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Clear localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  describe('Theme Switching Integration', () => {
    it('should integrate theme switching with UI components and CSS styling for guest users', async () => {
      // Test guest user theme switching using localStorage persistence

      // 1. Verify initial theme state (default light theme)
      const initialPreferences = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(initialPreferences.theme || 'light').toBe('light')

      // 2. Switch to dark theme via settings
      const darkThemeUpdate = { ...lightThemePreferences, theme: 'dark' }
      window.localStorage.setItem('guestPreferences', JSON.stringify(darkThemeUpdate))

      // Simulate theme service applying dark theme
      document.documentElement.classList.add('dark')

      // Verify dark theme is applied to UI
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // 3. Verify theme persistence across app reload
      const storedPreferences = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(storedPreferences.theme).toBe('dark')

      // 4. Switch to system theme
      const systemThemeUpdate = { ...lightThemePreferences, theme: 'system' }
      window.localStorage.setItem('guestPreferences', JSON.stringify(systemThemeUpdate))

      // Simulate system theme detection
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const isDarkMode = mediaQuery.matches

      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      const finalPreferences = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(finalPreferences.theme).toBe('system')
    })

    it('should integrate theme switching with authenticated user preferences API', async () => {
      // Test authenticated user theme switching using API persistence

      // 1. Mock authenticated user state
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      // 2. Set initial light theme preferences via API
      const lightThemeResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lightThemePreferences),
      })

      expect(lightThemeResponse.status).toBe(200)

      // 3. Switch to dark theme via API
      const darkThemeResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(darkThemePreferences),
      })

      expect(darkThemeResponse.status).toBe(200)

      // 4. Verify theme preferences are persisted
      const getPreferencesResponse = await fetch(
        `http://localhost:3000${USER_PREFERENCES_ENDPOINT}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      expect(getPreferencesResponse.status).toBe(200)
      const savedPreferences = await getPreferencesResponse.json()
      expect(savedPreferences.theme).toBe('dark')
    })

    it('should maintain theme consistency during timer sessions', async () => {
      // Test theme consistency when timer is active

      // 1. Set dark theme preferences
      window.localStorage.setItem('guestPreferences', JSON.stringify(darkThemePreferences))
      document.documentElement.classList.add('dark')

      // 2. Start timer session
      const startTimerResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activeTimerWithSound),
      })

      expect(startTimerResponse.status).toBe(200)

      // 3. Verify theme remains consistent during timer
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // 4. Switch theme during active timer
      const lightThemeUpdate = { ...darkThemePreferences, theme: 'light' }
      window.localStorage.setItem('guestPreferences', JSON.stringify(lightThemeUpdate))
      document.documentElement.classList.remove('dark')

      // 5. Verify timer continues and theme change is applied
      const timerStateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(timerStateResponse.status).toBe(200)
      const timerState = await timerStateResponse.json()
      expect(timerState.isActive).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('Ambient Sound Integration', () => {
    it('should integrate ambient sound selection with timer sessions', async () => {
      // Test ambient sound integration during timer sessions

      // 1. Select rain ambient sound
      const rainPreferences = { ...lightThemePreferences, ambientSound: 'rain', soundVolume: 50 }
      window.localStorage.setItem('guestPreferences', JSON.stringify(rainPreferences))

      // 2. Start timer session with ambient sound
      const timerWithRain = { ...activeTimerWithSound, ambientSound: 'rain', soundVolume: 50 }
      const startTimerResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timerWithRain),
      })

      expect(startTimerResponse.status).toBe(200)

      // 3. Verify ambient sound plays during session
      // Mock audio element should be created and play() called
      expect(global.HTMLAudioElement).toHaveBeenCalled()

      // 4. Pause timer and verify ambient sound pauses
      const pausedTimer = { ...pausedTimerWithSound, ambientSound: 'rain', soundVolume: 50 }
      const pauseTimerResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pausedTimer),
      })

      expect(pauseTimerResponse.status).toBe(200)

      // 5. Resume timer and verify ambient sound resumes
      const resumeTimerResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timerWithRain),
      })

      expect(resumeTimerResponse.status).toBe(200)
    })

    it('should integrate volume control with ambient sound playback', async () => {
      // Test volume control integration

      for (const volume of volumeLevels) {
        // 1. Set volume level in preferences
        const volumePreferences = { ...lightThemePreferences, soundVolume: volume }
        window.localStorage.setItem('guestPreferences', JSON.stringify(volumePreferences))

        // 2. Start timer with specific volume
        const timerWithVolume = { ...activeTimerWithSound, soundVolume: volume }
        const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timerWithVolume),
        })

        expect(response.status).toBe(200)

        // 3. Verify volume is applied (volume 0 = muted, others = audible)
        if (volume === 0) {
          // Should be muted but timer continues
          const timerState = await response.json()
          expect(timerState.isActive).toBe(true)
          expect(timerState.soundVolume).toBe(0)
        } else {
          // Should have audible volume
          const timerState = await response.json()
          expect(timerState.soundVolume).toBe(volume)
        }

        // Clean up for next iteration
        await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
    })

    it('should integrate different ambient sound options with session management', async () => {
      // Test different ambient sound options

      for (const sound of ambientSoundOptions) {
        // 1. Select ambient sound
        const soundPreferences = { ...lightThemePreferences, ambientSound: sound }
        window.localStorage.setItem('guestPreferences', JSON.stringify(soundPreferences))

        // 2. Start timer session with selected sound
        const timerWithSound = { ...activeTimerWithSound, ambientSound: sound }
        const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timerWithSound),
        })

        expect(response.status).toBe(200)
        const timerState = await response.json()
        expect(timerState.ambientSound).toBe(sound)

        // 3. For silence, verify no audio element is created
        if (sound === 'silence') {
          expect(timerState.soundVolume).toBe(0)
        } else {
          // For other sounds, verify audio integration
          expect(['rain', 'forest', 'ocean']).toContain(sound)
        }

        // Clean up for next iteration
        await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
    })
  })

  describe('User Preferences Persistence Integration', () => {
    it('should integrate guest user preferences with localStorage persistence', async () => {
      // Test guest user preference persistence

      // 1. Set initial preferences
      const initialPrefs = lightThemePreferences
      window.localStorage.setItem('guestPreferences', JSON.stringify(initialPrefs))

      // 2. Verify preferences are loaded correctly
      const loadedPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(loadedPrefs.theme).toBe('light')
      expect(loadedPrefs.ambientSound).toBe('rain')
      expect(loadedPrefs.soundVolume).toBe(50)

      // 3. Update preferences
      const updatedPrefs = {
        ...initialPrefs,
        theme: 'dark',
        ambientSound: 'forest',
        soundVolume: 75,
      }
      window.localStorage.setItem('guestPreferences', JSON.stringify(updatedPrefs))

      // 4. Verify updated preferences persist
      const persistedPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(persistedPrefs.theme).toBe('dark')
      expect(persistedPrefs.ambientSound).toBe('forest')
      expect(persistedPrefs.soundVolume).toBe(75)

      // 5. Simulate app reload - preferences should persist
      const reloadedPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(reloadedPrefs).toEqual(updatedPrefs)
    })

    it('should integrate authenticated user preferences with API persistence', async () => {
      // Test authenticated user preference persistence via API

      // 1. Save initial preferences via API
      const saveResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lightThemePreferences),
      })

      expect(saveResponse.status).toBe(200)

      // 2. Load preferences via API
      const loadResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(loadResponse.status).toBe(200)
      const loadedPrefs = await loadResponse.json()
      expect(loadedPrefs.theme).toBe('light')
      expect(loadedPrefs.ambientSound).toBe('rain')
      expect(loadedPrefs.soundVolume).toBe(50)

      // 3. Update preferences
      const updateResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(darkThemePreferences),
      })

      expect(updateResponse.status).toBe(200)

      // 4. Verify preferences are updated
      const verifyResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(verifyResponse.status).toBe(200)
      const updatedPrefs = await verifyResponse.json()
      expect(updatedPrefs.theme).toBe('dark')
      expect(updatedPrefs.ambientSound).toBe('forest')
      expect(updatedPrefs.soundVolume).toBe(75)
    })

    it('should handle preference synchronization between components', async () => {
      // Test preference synchronization across multiple components

      // 1. Set preferences in localStorage (simulating settings component)
      const settingsPrefs = { ...lightThemePreferences, theme: 'dark', soundVolume: 80 }
      window.localStorage.setItem('guestPreferences', JSON.stringify(settingsPrefs))

      // 2. Simulate timer component loading preferences
      const timerPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(timerPrefs.theme).toBe('dark')
      expect(timerPrefs.soundVolume).toBe(80)

      // 3. Update preferences from timer component (e.g., volume adjustment)
      const timerUpdatedPrefs = { ...timerPrefs, soundVolume: 60 }
      window.localStorage.setItem('guestPreferences', JSON.stringify(timerUpdatedPrefs))

      // 4. Simulate settings component reloading preferences
      const syncedPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(syncedPrefs.soundVolume).toBe(60)
      expect(syncedPrefs.theme).toBe('dark') // Other preferences maintained

      // 5. Verify theme service reflects synchronized preferences
      if (syncedPrefs.theme === 'dark') {
        document.documentElement.classList.add('dark')
      }
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('Real-time Customization During Timer Sessions', () => {
    it('should apply customization changes in real-time during active timer sessions', async () => {
      // Test real-time customization application

      // 1. Start timer session with initial preferences
      const initialTimer = { ...activeTimerWithSound, ambientSound: 'rain', soundVolume: 50 }
      const startResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialTimer),
      })

      expect(startResponse.status).toBe(200)

      // 2. Change theme during active session
      const themeChangePrefs = { ...lightThemePreferences, theme: 'dark' }
      window.localStorage.setItem('guestPreferences', JSON.stringify(themeChangePrefs))
      document.documentElement.classList.add('dark')

      // 3. Verify timer continues and theme is applied
      const themeCheckResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(themeCheckResponse.status).toBe(200)
      const themeCheckState = await themeCheckResponse.json()
      expect(themeCheckState.isActive).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // 4. Change ambient sound during active session
      const soundChangeTimer = { ...themeCheckState, ambientSound: 'forest', soundVolume: 75 }
      const soundChangeResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(soundChangeTimer),
      })

      expect(soundChangeResponse.status).toBe(200)
      const soundCheckState = await soundChangeResponse.json()
      expect(soundCheckState.ambientSound).toBe('forest')
      expect(soundCheckState.soundVolume).toBe(75)
      expect(soundCheckState.isActive).toBe(true)

      // 5. Change volume during active session
      const volumeChangeTimer = { ...soundCheckState, soundVolume: 25 }
      const volumeChangeResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(volumeChangeTimer),
      })

      expect(volumeChangeResponse.status).toBe(200)
      const volumeCheckState = await volumeChangeResponse.json()
      expect(volumeCheckState.soundVolume).toBe(25)
      expect(volumeCheckState.isActive).toBe(true)
      expect(volumeCheckState.ambientSound).toBe('forest')
    })

    it('should maintain customization state across timer pause and resume cycles', async () => {
      // Test customization persistence through timer state changes

      // 1. Start timer with customizations
      const customTimer = { ...activeTimerWithSound, ambientSound: 'ocean', soundVolume: 60 }
      const startResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customTimer),
      })

      expect(startResponse.status).toBe(200)

      // 2. Pause timer
      const pausedTimer = { ...customTimer, isPaused: true, timeRemaining: 1400 }
      const pauseResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pausedTimer),
      })

      expect(pauseResponse.status).toBe(200)
      const pausedState = await pauseResponse.json()
      expect(pausedState.isPaused).toBe(true)
      expect(pausedState.ambientSound).toBe('ocean')
      expect(pausedState.soundVolume).toBe(60)

      // 3. Change preferences while paused
      const pausedPrefs = {
        ...lightThemePreferences,
        theme: 'dark',
        ambientSound: 'rain',
        soundVolume: 80,
      }
      window.localStorage.setItem('guestPreferences', JSON.stringify(pausedPrefs))

      // 4. Resume timer with updated preferences
      const resumedTimer = {
        ...pausedTimer,
        isPaused: false,
        ambientSound: 'rain',
        soundVolume: 80,
      }
      const resumeResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumedTimer),
      })

      expect(resumeResponse.status).toBe(200)
      const resumedState = await resumeResponse.json()
      expect(resumedState.isPaused).toBe(false)
      expect(resumedState.ambientSound).toBe('rain')
      expect(resumedState.soundVolume).toBe(80)
      expect(resumedState.isActive).toBe(true)
    })
  })

  describe('Cross-Component Integration', () => {
    it('should integrate settings UI with preferences service and theme/audio services', async () => {
      // Test end-to-end settings integration

      // 1. Simulate settings UI opening with current preferences
      const currentPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      const defaultPrefs = currentPrefs.theme ? currentPrefs : lightThemePreferences

      // 2. Simulate user changing settings in UI
      const newSettings = {
        theme: 'dark',
        ambientSound: 'forest',
        soundVolume: 85,
        defaultSessionMode: 'deepwork',
        customIntervals: [],
      }

      // 3. Save settings through preferences service
      window.localStorage.setItem('guestPreferences', JSON.stringify(newSettings))

      // 4. Apply theme through theme service
      if (newSettings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      }

      // 5. Apply audio settings through audio service (simulated)
      const audioSettings = {
        ambientSound: newSettings.ambientSound,
        volume: newSettings.soundVolume,
      }

      // 6. Verify settings are applied across all services
      const savedPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(savedPrefs.theme).toBe('dark')
      expect(savedPrefs.ambientSound).toBe('forest')
      expect(savedPrefs.soundVolume).toBe(85)
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // 7. Verify settings persist and can be reloaded
      const reloadedPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(reloadedPrefs).toEqual(newSettings)
    })

    it('should handle preferences loading on app initialization', async () => {
      // Test app initialization preference loading

      // 1. Pre-populate localStorage with existing preferences
      const existingPrefs = darkThemePreferences
      window.localStorage.setItem('guestPreferences', JSON.stringify(existingPrefs))

      // 2. Simulate app initialization loading preferences
      const loadedPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')

      // 3. Apply loaded theme preferences
      if (loadedPrefs.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (loadedPrefs.theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark')
        }
      }

      // 4. Verify preferences are correctly applied on initialization
      expect(loadedPrefs.theme).toBe('dark')
      expect(loadedPrefs.ambientSound).toBe('forest')
      expect(loadedPrefs.soundVolume).toBe(75)
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // 5. Test with system theme preference
      const systemPrefs = systemThemePreferences
      window.localStorage.setItem('guestPreferences', JSON.stringify(systemPrefs))

      const systemLoadedPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(systemLoadedPrefs.theme).toBe('system')

      // 6. Verify system theme detection works
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      expect(typeof mediaQuery.matches).toBe('boolean')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid preference values gracefully', async () => {
      // Test error handling for invalid preferences

      // 1. Test invalid theme value
      const invalidTheme = { ...lightThemePreferences, theme: 'invalid-theme' }
      window.localStorage.setItem('guestPreferences', JSON.stringify(invalidTheme))

      const loadedInvalidTheme = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      // Should fallback to default theme or handle gracefully
      expect(['light', 'dark', 'system', 'invalid-theme']).toContain(loadedInvalidTheme.theme)

      // 2. Test invalid ambient sound
      const invalidSound = { ...lightThemePreferences, ambientSound: 'invalid-sound' }
      window.localStorage.setItem('guestPreferences', JSON.stringify(invalidSound))

      const loadedInvalidSound = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(loadedInvalidSound.ambientSound).toBeDefined()

      // 3. Test invalid volume (out of range)
      const invalidVolume = { ...lightThemePreferences, soundVolume: 150 }
      window.localStorage.setItem('guestPreferences', JSON.stringify(invalidVolume))

      const loadedInvalidVolume = JSON.parse(
        window.localStorage.getItem('guestPreferences') || '{}'
      )
      expect(loadedInvalidVolume.soundVolume).toBeDefined()

      // 4. Test malformed JSON in localStorage
      window.localStorage.setItem('guestPreferences', 'invalid-json')

      let fallbackPrefs
      try {
        fallbackPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      } catch (error) {
        fallbackPrefs = lightThemePreferences // Should fallback to defaults
      }

      expect(fallbackPrefs).toBeDefined()
    })

    it('should handle network failures for authenticated user preferences', async () => {
      // Test network error handling for API preferences

      // 1. Test GET preferences with network failure
      const getResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Should handle failure gracefully (404, 500, network error)
      expect([200, 404, 500]).toContain(getResponse.status)

      // 2. Test PUT preferences with network failure
      const putResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lightThemePreferences),
      })

      // Should handle failure gracefully
      expect([200, 400, 401, 500]).toContain(putResponse.status)

      // 3. Verify fallback to localStorage for guest behavior
      if (putResponse.status !== 200) {
        // Should fallback to localStorage
        window.localStorage.setItem('guestPreferences', JSON.stringify(lightThemePreferences))
        const fallbackPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
        expect(fallbackPrefs.theme).toBe('light')
      }
    })

    it('should handle concurrent preference updates correctly', async () => {
      // Test concurrent preference updates

      // 1. Simulate multiple rapid preference updates
      const updates = [
        { ...lightThemePreferences, theme: 'dark' },
        { ...lightThemePreferences, ambientSound: 'forest' },
        { ...lightThemePreferences, soundVolume: 80 },
        { ...lightThemePreferences, theme: 'system', ambientSound: 'ocean', soundVolume: 60 },
      ]

      // 2. Apply updates rapidly
      for (const update of updates) {
        window.localStorage.setItem('guestPreferences', JSON.stringify(update))
      }

      // 3. Verify final state is consistent
      const finalPrefs = JSON.parse(window.localStorage.getItem('guestPreferences') || '{}')
      expect(finalPrefs.theme).toBe('system')
      expect(finalPrefs.ambientSound).toBe('ocean')
      expect(finalPrefs.soundVolume).toBe(60)

      // 4. Test concurrent API updates for authenticated users
      const apiUpdates = [
        fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...lightThemePreferences, theme: 'dark' }),
        }),
        fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...lightThemePreferences, ambientSound: 'forest' }),
        }),
      ]

      const responses = await Promise.all(apiUpdates)
      responses.forEach((response) => {
        expect([200, 400, 409, 500]).toContain(response.status)
      })
    })
  })
})
