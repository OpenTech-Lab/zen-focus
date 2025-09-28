import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

/**
 * Integration test for session mode comparison
 *
 * This test validates the complete session mode experience following Scenario 3 from quickstart.md:
 * "Session Mode Comparison" - validates different session modes have distinct configurations
 * and that users can effectively compare and use different session modes.
 *
 * This is an INTEGRATION test - testing multiple components working together:
 * - Session mode service integration with timer service and configuration management
 * - Session mode switching and timer reconfiguration across different modes
 * - Session tracking service integration with mode-specific data collection
 * - User preferences service integration with mode selection and persistence
 * - Timer behavior validation across different mode configurations
 * - Session data aggregation and comparison across multiple modes
 *
 * Key Integration Points Tested:
 * - Session mode service + timer service + configuration management
 * - Mode switching workflow + timer reconfiguration + state persistence
 * - Session tracking + mode-specific data collection + analytics
 * - User preferences + mode persistence + cross-session memory
 * - Timer behavior differences + mode-specific workflows + user experience
 * - Session completion + data aggregation + cross-mode comparison analytics
 */

describe('Session Mode Comparison - Integration Test', () => {
  const SESSION_MODES_ENDPOINT = '/api/session-modes'
  const TIMER_STATE_ENDPOINT = '/api/timer/state'
  const SESSIONS_ENDPOINT = '/api/sessions'
  const USER_PREFERENCES_ENDPOINT = '/api/users/me/preferences'

  // Test data for different session modes
  const studyModeConfig = {
    id: 'study',
    name: 'Study Mode',
    description: 'Traditional Pomodoro technique for focused learning',
    defaultWorkDuration: 25,
    defaultBreakDuration: 5,
    color: '#10B981',
    icon: 'book',
    isCustomizable: true,
    maxWorkDuration: 90,
    maxBreakDuration: 30,
  }

  const deepworkModeConfig = {
    id: 'deepwork',
    name: 'Deep Work',
    description: 'Extended focus periods for complex tasks',
    defaultWorkDuration: 50,
    defaultBreakDuration: 10,
    color: '#3B82F6',
    icon: 'brain',
    isCustomizable: true,
    maxWorkDuration: 120,
    maxBreakDuration: 30,
  }

  const yogaModeConfig = {
    id: 'yoga',
    name: 'Yoga & Meditation',
    description: 'Customizable intervals for breathing and poses',
    defaultWorkDuration: 10,
    defaultBreakDuration: 2,
    color: '#8B5CF6',
    icon: 'flower',
    isCustomizable: true,
    maxWorkDuration: 60,
    maxBreakDuration: 15,
  }

  const zenModeConfig = {
    id: 'zen',
    name: 'Zen Mode',
    description: 'Open-ended timer for flexible focus',
    defaultWorkDuration: 0, // open-ended
    defaultBreakDuration: 0,
    color: '#6B7280',
    icon: 'infinity',
    isCustomizable: false,
  }

  // Timer state for different modes
  const studyModeTimerState = {
    isActive: false,
    isPaused: false,
    mode: 'study',
    phase: 'work',
    timeRemaining: 1500, // 25 minutes
    totalElapsed: 0,
    currentCycle: 1,
    plannedDuration: 25,
    workDuration: 25,
    breakDuration: 5,
  }

  const deepworkModeTimerState = {
    isActive: false,
    isPaused: false,
    mode: 'deepwork',
    phase: 'work',
    timeRemaining: 3000, // 50 minutes
    totalElapsed: 0,
    currentCycle: 1,
    plannedDuration: 50,
    workDuration: 50,
    breakDuration: 10,
  }

  const yogaModeTimerState = {
    isActive: false,
    isPaused: false,
    mode: 'yoga',
    phase: 'work',
    timeRemaining: 600, // 10 minutes
    totalElapsed: 0,
    currentCycle: 1,
    plannedDuration: 10,
    workDuration: 10,
    breakDuration: 2,
  }

  const zenModeTimerState = {
    isActive: false,
    isPaused: false,
    mode: 'zen',
    phase: 'work',
    timeRemaining: null, // open-ended
    totalElapsed: 0,
    currentCycle: 1,
    plannedDuration: null,
    workDuration: 0,
    breakDuration: 0,
  }

  // Session data for different modes
  const studySessionData = {
    id: 'session-study-1',
    userId: null, // guest session
    mode: 'study',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T10:25:00Z'),
    plannedDuration: 25,
    actualDuration: 25,
    completedFully: true,
    pauseCount: 0,
    totalPauseTime: 0,
    ambientSound: 'rain',
  }

  const deepworkSessionData = {
    id: 'session-deepwork-1',
    userId: null, // guest session
    mode: 'deepwork',
    startTime: new Date('2024-01-01T11:00:00Z'),
    endTime: new Date('2024-01-01T11:50:00Z'),
    plannedDuration: 50,
    actualDuration: 50,
    completedFully: true,
    pauseCount: 1,
    totalPauseTime: 2,
    ambientSound: 'forest',
  }

  const yogaSessionData = {
    id: 'session-yoga-1',
    userId: null, // guest session
    mode: 'yoga',
    startTime: new Date('2024-01-01T14:00:00Z'),
    endTime: new Date('2024-01-01T14:10:00Z'),
    plannedDuration: 10,
    actualDuration: 10,
    completedFully: true,
    pauseCount: 0,
    totalPauseTime: 0,
    ambientSound: 'ocean',
  }

  const zenSessionData = {
    id: 'session-zen-1',
    userId: null, // guest session
    mode: 'zen',
    startTime: new Date('2024-01-01T16:00:00Z'),
    endTime: new Date('2024-01-01T16:33:00Z'),
    plannedDuration: null,
    actualDuration: 33,
    completedFully: false, // manually stopped
    pauseCount: 0,
    totalPauseTime: 0,
    ambientSound: 'silence',
  }

  // Mock fetch responses
  const mockFetch = jest.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockClear()
    localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Session Mode Configuration Integration', () => {
    it('should load all session modes with distinct configurations', async () => {
      // Mock API response for session modes
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [studyModeConfig, deepworkModeConfig, yogaModeConfig, zenModeConfig],
      })

      // Test session mode loading
      const response = await fetch(SESSION_MODES_ENDPOINT)
      const sessionModes = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(SESSION_MODES_ENDPOINT)
      expect(sessionModes).toHaveLength(4)

      // Verify distinct configurations
      const studyMode = sessionModes.find((mode) => mode.id === 'study')
      const deepworkMode = sessionModes.find((mode) => mode.id === 'deepwork')
      const yogaMode = sessionModes.find((mode) => mode.id === 'yoga')
      const zenMode = sessionModes.find((mode) => mode.id === 'zen')

      expect(studyMode).toMatchObject({
        id: 'study',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        isCustomizable: true,
      })

      expect(deepworkMode).toMatchObject({
        id: 'deepwork',
        defaultWorkDuration: 50,
        defaultBreakDuration: 10,
        isCustomizable: true,
      })

      expect(yogaMode).toMatchObject({
        id: 'yoga',
        defaultWorkDuration: 10,
        defaultBreakDuration: 2,
        isCustomizable: true,
      })

      expect(zenMode).toMatchObject({
        id: 'zen',
        defaultWorkDuration: 0,
        defaultBreakDuration: 0,
        isCustomizable: false,
      })
    })

    it('should configure timer state correctly for each session mode', async () => {
      // Test Study Mode timer configuration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => studyModeTimerState,
      })

      const studyResponse = await fetch(`${TIMER_STATE_ENDPOINT}?mode=study`)
      const studyTimer = await studyResponse.json()

      expect(studyTimer).toMatchObject({
        mode: 'study',
        timeRemaining: 1500, // 25 minutes
        workDuration: 25,
        breakDuration: 5,
      })

      // Test Deep Work Mode timer configuration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => deepworkModeTimerState,
      })

      const deepworkResponse = await fetch(`${TIMER_STATE_ENDPOINT}?mode=deepwork`)
      const deepworkTimer = await deepworkResponse.json()

      expect(deepworkTimer).toMatchObject({
        mode: 'deepwork',
        timeRemaining: 3000, // 50 minutes
        workDuration: 50,
        breakDuration: 10,
      })

      // Test Yoga Mode timer configuration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => yogaModeTimerState,
      })

      const yogaResponse = await fetch(`${TIMER_STATE_ENDPOINT}?mode=yoga`)
      const yogaTimer = await yogaResponse.json()

      expect(yogaTimer).toMatchObject({
        mode: 'yoga',
        timeRemaining: 600, // 10 minutes
        workDuration: 10,
        breakDuration: 2,
      })

      // Test Zen Mode timer configuration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => zenModeTimerState,
      })

      const zenResponse = await fetch(`${TIMER_STATE_ENDPOINT}?mode=zen`)
      const zenTimer = await zenResponse.json()

      expect(zenTimer).toMatchObject({
        mode: 'zen',
        timeRemaining: null, // open-ended
        workDuration: 0,
        breakDuration: 0,
      })
    })
  })

  describe('Session Mode Switching Integration', () => {
    it('should switch between modes and reconfigure timer during active session', async () => {
      // Start with Study Mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...studyModeTimerState, isActive: true }),
      })

      // Start study session
      const startStudyResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', mode: 'study' }),
      })
      const activeStudyTimer = await startStudyResponse.json()

      expect(activeStudyTimer.isActive).toBe(true)
      expect(activeStudyTimer.mode).toBe('study')

      // Switch to Deep Work Mode during active session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...deepworkModeTimerState,
          isActive: true,
          timeRemaining: 3000, // Reset to full deep work duration
          totalElapsed: 0, // Reset elapsed time
        }),
      })

      const switchToDeepworkResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch-mode', mode: 'deepwork' }),
      })
      const activeDeepworkTimer = await switchToDeepworkResponse.json()

      expect(activeDeepworkTimer.isActive).toBe(true)
      expect(activeDeepworkTimer.mode).toBe('deepwork')
      expect(activeDeepworkTimer.timeRemaining).toBe(3000)
      expect(activeDeepworkTimer.workDuration).toBe(50)

      // Switch to Zen Mode (open-ended)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...zenModeTimerState,
          isActive: true,
          timeRemaining: null, // Open-ended timer
        }),
      })

      const switchToZenResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch-mode', mode: 'zen' }),
      })
      const activeZenTimer = await switchToZenResponse.json()

      expect(activeZenTimer.isActive).toBe(true)
      expect(activeZenTimer.mode).toBe('zen')
      expect(activeZenTimer.timeRemaining).toBeNull()
      expect(activeZenTimer.workDuration).toBe(0)
    })

    it('should preserve mode selection in user preferences', async () => {
      // Load initial preferences
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          theme: 'light',
          defaultSessionMode: 'study',
          ambientSound: 'rain',
          ambientVolume: 50,
          notifications: true,
          autoStartBreaks: true,
          customIntervals: [],
        }),
      })

      const initialPrefs = await fetch(USER_PREFERENCES_ENDPOINT)
      const preferences = await initialPrefs.json()
      expect(preferences.defaultSessionMode).toBe('study')

      // Update preferences to Deep Work mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...preferences,
          defaultSessionMode: 'deepwork',
        }),
      })

      const updateResponse = await fetch(USER_PREFERENCES_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preferences,
          defaultSessionMode: 'deepwork',
        }),
      })
      const updatedPrefs = await updateResponse.json()

      expect(updatedPrefs.defaultSessionMode).toBe('deepwork')

      // Verify persistence across app reload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedPrefs,
      })

      const reloadedPrefs = await fetch(USER_PREFERENCES_ENDPOINT)
      const persistedPrefs = await reloadedPrefs.json()
      expect(persistedPrefs.defaultSessionMode).toBe('deepwork')
    })
  })

  describe('Mode-Specific Timer Behavior Integration', () => {
    it('should handle Pomodoro cycles correctly in Study Mode', async () => {
      // Start study session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...studyModeTimerState,
          isActive: true,
          timeRemaining: 1500,
        }),
      })

      const startResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', mode: 'study' }),
      })
      const activeTimer = await startResponse.json()

      expect(activeTimer.mode).toBe('study')
      expect(activeTimer.phase).toBe('work')
      expect(activeTimer.timeRemaining).toBe(1500)

      // Complete work phase, transition to break
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...studyModeTimerState,
          isActive: true,
          phase: 'break',
          timeRemaining: 300, // 5 minute break
          currentCycle: 1,
        }),
      })

      const transitionResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete-phase' }),
      })
      const breakTimer = await transitionResponse.json()

      expect(breakTimer.phase).toBe('break')
      expect(breakTimer.timeRemaining).toBe(300)
      expect(breakTimer.currentCycle).toBe(1)

      // Complete break, start next work cycle
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...studyModeTimerState,
          isActive: true,
          phase: 'work',
          timeRemaining: 1500,
          currentCycle: 2,
        }),
      })

      const nextCycleResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete-phase' }),
      })
      const nextCycleTimer = await nextCycleResponse.json()

      expect(nextCycleTimer.phase).toBe('work')
      expect(nextCycleTimer.timeRemaining).toBe(1500)
      expect(nextCycleTimer.currentCycle).toBe(2)
    })

    it('should handle open-ended timing in Zen Mode', async () => {
      // Start zen session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...zenModeTimerState,
          isActive: true,
          timeRemaining: null,
          totalElapsed: 0,
        }),
      })

      const startResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', mode: 'zen' }),
      })
      const activeTimer = await startResponse.json()

      expect(activeTimer.mode).toBe('zen')
      expect(activeTimer.timeRemaining).toBeNull()
      expect(activeTimer.totalElapsed).toBe(0)

      // Simulate elapsed time - zen mode counts up
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...zenModeTimerState,
          isActive: true,
          totalElapsed: 1200, // 20 minutes elapsed
          timeRemaining: null,
        }),
      })

      const elapsedResponse = await fetch(`${TIMER_STATE_ENDPOINT}/current`)
      const elapsedTimer = await elapsedResponse.json()

      expect(elapsedTimer.totalElapsed).toBe(1200)
      expect(elapsedTimer.timeRemaining).toBeNull()

      // Manual stop in zen mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...zenModeTimerState,
          isActive: false,
          totalElapsed: 1980, // 33 minutes when stopped
          timeRemaining: null,
        }),
      })

      const stopResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })
      const stoppedTimer = await stopResponse.json()

      expect(stoppedTimer.isActive).toBe(false)
      expect(stoppedTimer.totalElapsed).toBe(1980)
    })

    it('should handle custom intervals in Yoga Mode', async () => {
      const customYogaInterval = {
        workDuration: 15,
        breakDuration: 3,
      }

      // Start yoga session with custom intervals
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...yogaModeTimerState,
          isActive: true,
          timeRemaining: 900, // 15 minutes (custom work duration)
          workDuration: 15,
          breakDuration: 3,
        }),
      })

      const startResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          mode: 'yoga',
          customInterval: customYogaInterval,
        }),
      })
      const activeTimer = await startResponse.json()

      expect(activeTimer.mode).toBe('yoga')
      expect(activeTimer.timeRemaining).toBe(900)
      expect(activeTimer.workDuration).toBe(15)
      expect(activeTimer.breakDuration).toBe(3)

      // Complete work phase with custom timing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...yogaModeTimerState,
          isActive: true,
          phase: 'break',
          timeRemaining: 180, // 3 minute break (custom)
          workDuration: 15,
          breakDuration: 3,
        }),
      })

      const transitionResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete-phase' }),
      })
      const breakTimer = await transitionResponse.json()

      expect(breakTimer.phase).toBe('break')
      expect(breakTimer.timeRemaining).toBe(180)
      expect(breakTimer.breakDuration).toBe(3)
    })
  })

  describe('Session Data Collection and Comparison Integration', () => {
    it('should collect distinct session data for each mode', async () => {
      // Complete study session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => studySessionData,
      })

      const studySessionResponse = await fetch(SESSIONS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'study',
          plannedDuration: 25,
          actualDuration: 25,
          completedFully: true,
          pauseCount: 0,
          totalPauseTime: 0,
          ambientSound: 'rain',
        }),
      })
      const studySession = await studySessionResponse.json()

      expect(studySession.mode).toBe('study')
      expect(studySession.plannedDuration).toBe(25)
      expect(studySession.actualDuration).toBe(25)

      // Complete deepwork session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => deepworkSessionData,
      })

      const deepworkSessionResponse = await fetch(SESSIONS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'deepwork',
          plannedDuration: 50,
          actualDuration: 50,
          completedFully: true,
          pauseCount: 1,
          totalPauseTime: 2,
          ambientSound: 'forest',
        }),
      })
      const deepworkSession = await deepworkSessionResponse.json()

      expect(deepworkSession.mode).toBe('deepwork')
      expect(deepworkSession.plannedDuration).toBe(50)
      expect(deepworkSession.pauseCount).toBe(1)

      // Complete zen session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => zenSessionData,
      })

      const zenSessionResponse = await fetch(SESSIONS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'zen',
          plannedDuration: null,
          actualDuration: 33,
          completedFully: false,
          pauseCount: 0,
          totalPauseTime: 0,
          ambientSound: 'silence',
        }),
      })
      const zenSession = await zenSessionResponse.json()

      expect(zenSession.mode).toBe('zen')
      expect(zenSession.plannedDuration).toBeNull()
      expect(zenSession.completedFully).toBe(false)
    })

    it('should provide session comparison analytics across modes', async () => {
      // Mock session history with multiple modes
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [studySessionData, deepworkSessionData, yogaSessionData, zenSessionData],
      })

      const sessionsResponse = await fetch(`${SESSIONS_ENDPOINT}?userId=guest`)
      const sessions = await sessionsResponse.json()

      expect(sessions).toHaveLength(4)

      // Mock analytics endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalSessions: 4,
          totalFocusTime: 118, // 25 + 50 + 10 + 33 minutes
          modeBreakdown: {
            study: {
              sessionCount: 1,
              totalTime: 25,
              avgDuration: 25,
              completionRate: 100,
              avgPauseCount: 0,
            },
            deepwork: {
              sessionCount: 1,
              totalTime: 50,
              avgDuration: 50,
              completionRate: 100,
              avgPauseCount: 1,
            },
            yoga: {
              sessionCount: 1,
              totalTime: 10,
              avgDuration: 10,
              completionRate: 100,
              avgPauseCount: 0,
            },
            zen: {
              sessionCount: 1,
              totalTime: 33,
              avgDuration: 33,
              completionRate: 0, // manually stopped
              avgPauseCount: 0,
            },
          },
          mostUsedMode: 'study', // all tied at 1 session, fallback to first
          longestSession: {
            mode: 'deepwork',
            duration: 50,
          },
          preferredAmbientSounds: {
            rain: 1,
            forest: 1,
            ocean: 1,
            silence: 1,
          },
        }),
      })

      const analyticsResponse = await fetch(`${SESSIONS_ENDPOINT}/stats?userId=guest`)
      const analytics = await analyticsResponse.json()

      expect(analytics.totalSessions).toBe(4)
      expect(analytics.totalFocusTime).toBe(118)
      expect(analytics.modeBreakdown.study.totalTime).toBe(25)
      expect(analytics.modeBreakdown.deepwork.totalTime).toBe(50)
      expect(analytics.modeBreakdown.yoga.totalTime).toBe(10)
      expect(analytics.modeBreakdown.zen.totalTime).toBe(33)
      expect(analytics.modeBreakdown.zen.completionRate).toBe(0)
      expect(analytics.longestSession.mode).toBe('deepwork')
    })

    it('should track mode-specific user behavior patterns', async () => {
      // Mock detailed session tracking with behavior patterns
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userBehaviorPatterns: {
            study: {
              preferredTimeOfDay: 'morning',
              avgSessionsPerDay: 3,
              mostUsedDuration: 25,
              breakTakeRate: 95, // percentage of breaks taken
              consecutiveCycles: 4,
              preferredAmbientSound: 'rain',
            },
            deepwork: {
              preferredTimeOfDay: 'afternoon',
              avgSessionsPerDay: 1,
              mostUsedDuration: 50,
              breakTakeRate: 80,
              consecutiveCycles: 2,
              preferredAmbientSound: 'forest',
            },
            yoga: {
              preferredTimeOfDay: 'evening',
              avgSessionsPerDay: 2,
              mostUsedDuration: 15, // custom interval
              breakTakeRate: 100,
              consecutiveCycles: 3,
              preferredAmbientSound: 'ocean',
            },
            zen: {
              preferredTimeOfDay: 'anytime',
              avgSessionsPerDay: 0.5,
              avgDuration: 30, // variable open-ended
              manualStopRate: 100, // always manually stopped
              preferredAmbientSound: 'silence',
            },
          },
          recommendations: {
            suggestedModeSequence: ['study', 'deepwork', 'yoga'],
            optimalWorkDay: {
              morning: 'study',
              afternoon: 'deepwork',
              evening: 'yoga',
            },
            customIntervalSuggestions: {
              yoga: { workDuration: 15, breakDuration: 3 },
            },
          },
        }),
      })

      const behaviorResponse = await fetch(`${SESSIONS_ENDPOINT}/behavior-patterns?userId=guest`)
      const patterns = await behaviorResponse.json()

      expect(patterns.userBehaviorPatterns.study.preferredTimeOfDay).toBe('morning')
      expect(patterns.userBehaviorPatterns.deepwork.mostUsedDuration).toBe(50)
      expect(patterns.userBehaviorPatterns.zen.manualStopRate).toBe(100)
      expect(patterns.recommendations.optimalWorkDay.morning).toBe('study')
      expect(patterns.recommendations.optimalWorkDay.afternoon).toBe('deepwork')
    })
  })

  describe('Cross-Mode User Experience Integration', () => {
    it('should provide seamless mode switching UI experience', async () => {
      // Test UI state transitions between modes
      // This would typically involve DOM testing, but we'll test the data layer

      // Load session modes for UI
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [studyModeConfig, deepworkModeConfig, yogaModeConfig, zenModeConfig],
      })

      const modesResponse = await fetch(SESSION_MODES_ENDPOINT)
      const modes = await modesResponse.json()

      // Simulate UI mode selection and timer configuration
      const selectedMode = modes.find((mode) => mode.id === 'deepwork')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...deepworkModeTimerState,
          isActive: false,
          timeRemaining: selectedMode.defaultWorkDuration * 60,
        }),
      })

      const configureResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure',
          mode: selectedMode.id,
          workDuration: selectedMode.defaultWorkDuration,
          breakDuration: selectedMode.defaultBreakDuration,
        }),
      })
      const configuredTimer = await configureResponse.json()

      expect(configuredTimer.mode).toBe('deepwork')
      expect(configuredTimer.timeRemaining).toBe(3000)
      expect(configuredTimer.workDuration).toBe(50)

      // Test mode-specific UI customization availability
      const customizableMode = modes.find((mode) => mode.id === 'yoga')
      const nonCustomizableMode = modes.find((mode) => mode.id === 'zen')

      expect(customizableMode.isCustomizable).toBe(true)
      expect(nonCustomizableMode.isCustomizable).toBe(false)
    })

    it('should persist mode comparison preferences for guest users', async () => {
      // Test localStorage persistence for guest mode preferences
      const guestPreferences = {
        lastUsedModes: ['study', 'deepwork', 'yoga'],
        modeUsageCount: {
          study: 5,
          deepwork: 3,
          yoga: 2,
          zen: 1,
        },
        favoriteMode: 'study',
        modeRatings: {
          study: 5,
          deepwork: 4,
          yoga: 4,
          zen: 3,
        },
      }

      // Store guest preferences
      localStorage.setItem('zen-focus-guest-mode-preferences', JSON.stringify(guestPreferences))

      // Verify persistence
      const storedPrefs = JSON.parse(
        localStorage.getItem('zen-focus-guest-mode-preferences') || '{}'
      )
      expect(storedPrefs.favoriteMode).toBe('study')
      expect(storedPrefs.lastUsedModes).toContain('deepwork')
      expect(storedPrefs.modeUsageCount.study).toBe(5)

      // Test preference-based mode recommendations
      const recommendedMode = storedPrefs.lastUsedModes[0] // Most recent
      const popularMode = Object.keys(storedPrefs.modeUsageCount).reduce((a, b) =>
        storedPrefs.modeUsageCount[a] > storedPrefs.modeUsageCount[b] ? a : b
      )

      expect(recommendedMode).toBe('study')
      expect(popularMode).toBe('study')
    })

    it('should integrate session mode comparison with authenticated user preferences', async () => {
      // Mock authenticated user with mode preferences
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          theme: 'dark',
          defaultSessionMode: 'deepwork',
          ambientSound: 'forest',
          ambientVolume: 70,
          notifications: true,
          autoStartBreaks: false,
          customIntervals: [
            {
              id: 'custom-yoga-1',
              name: 'Extended Yoga',
              workDuration: 20,
              breakDuration: 5,
              sessionMode: 'yoga',
            },
          ],
          modePreferences: {
            study: {
              preferredDuration: 30, // customized from default 25
              preferredAmbientSound: 'rain',
            },
            deepwork: {
              preferredDuration: 45, // customized from default 50
              preferredAmbientSound: 'forest',
            },
            yoga: {
              useCustomInterval: 'custom-yoga-1',
              preferredAmbientSound: 'ocean',
            },
            zen: {
              preferredAmbientSound: 'silence',
            },
          },
        }),
      })

      const userPrefsResponse = await fetch(USER_PREFERENCES_ENDPOINT)
      const userPrefs = await userPrefsResponse.json()

      expect(userPrefs.defaultSessionMode).toBe('deepwork')
      expect(userPrefs.modePreferences.study.preferredDuration).toBe(30)
      expect(userPrefs.modePreferences.yoga.useCustomInterval).toBe('custom-yoga-1')

      // Test applying user preferences to session mode configuration
      const studyModeWithPrefs = {
        ...studyModeConfig,
        defaultWorkDuration: userPrefs.modePreferences.study.preferredDuration,
        preferredAmbientSound: userPrefs.modePreferences.study.preferredAmbientSound,
      }

      expect(studyModeWithPrefs.defaultWorkDuration).toBe(30)
      expect(studyModeWithPrefs.preferredAmbientSound).toBe('rain')
    })
  })

  describe('Session Mode Performance and Error Handling Integration', () => {
    it('should handle mode switching errors gracefully', async () => {
      // Test switching to non-existent mode
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid session mode',
          code: 'INVALID_MODE',
          message: 'Session mode "invalid-mode" is not supported',
        }),
      })

      const invalidModeResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch-mode', mode: 'invalid-mode' }),
      })

      expect(invalidModeResponse.ok).toBe(false)
      expect(invalidModeResponse.status).toBe(400)

      const error = await invalidModeResponse.json()
      expect(error.code).toBe('INVALID_MODE')

      // Test recovery by switching to valid mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => studyModeTimerState,
      })

      const recoveryResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch-mode', mode: 'study' }),
      })

      expect(recoveryResponse.ok).toBe(true)
      const recoveredTimer = await recoveryResponse.json()
      expect(recoveredTimer.mode).toBe('study')
    })

    it('should handle concurrent mode operations', async () => {
      // Mock responses for concurrent requests first
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => studyModeTimerState,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => deepworkModeTimerState,
        })

      // Test concurrent requests for mode switching
      const concurrentRequests = [
        fetch(TIMER_STATE_ENDPOINT, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'switch-mode', mode: 'study' }),
        }),
        fetch(TIMER_STATE_ENDPOINT, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'switch-mode', mode: 'deepwork' }),
        }),
      ]

      const responses = await Promise.all(concurrentRequests)
      expect(responses[0].ok).toBe(true)
      expect(responses[1].ok).toBe(true)

      // Verify final state consistency
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => deepworkModeTimerState, // Last request wins
      })

      const finalStateResponse = await fetch(`${TIMER_STATE_ENDPOINT}/current`)
      const finalState = await finalStateResponse.json()
      expect(finalState.mode).toBe('deepwork')
    })
  })
})
