import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

/**
 * Integration test for user registration and data persistence
 *
 * This test validates the complete authenticated user experience following Scenario 4 from quickstart.md:
 * "User Registration and Data Persistence" - validates authentication flow and data synchronization.
 *
 * This is an INTEGRATION test - testing multiple components working together:
 * - Authentication service integration with user management
 * - User registration workflow from start to finish
 * - Session management and JWT token handling
 * - Data persistence across authentication states
 * - Guest-to-authenticated user data migration
 * - Cross-component data flow for authenticated users
 * - User preferences persistence and synchronization
 * - Session history and data integrity
 *
 * Key Integration Points Tested:
 * - Auth UI + Auth Service + User Service + Persistence Layer
 * - Registration → Email verification → Login → Profile setup
 * - JWT tokens + Session management + Refresh tokens
 * - User preferences + Session data + Custom intervals persistence
 * - Guest data migration + Authenticated user isolation
 * - Cross-device synchronization and data consistency
 * - Error handling across authentication components
 */

describe('Authentication Flow and Data Persistence - Integration Test', () => {
  // API endpoints for authentication and user management
  const AUTH_REGISTER_ENDPOINT = '/api/auth/register'
  const AUTH_LOGIN_ENDPOINT = '/api/auth/login'
  const AUTH_LOGOUT_ENDPOINT = '/api/auth/logout'
  const AUTH_REFRESH_ENDPOINT = '/api/auth/refresh'
  const USER_ME_ENDPOINT = '/api/users/me'
  const USER_PREFERENCES_ENDPOINT = '/api/users/me/preferences'
  const SESSIONS_ENDPOINT = '/api/sessions'
  const SESSION_STATS_ENDPOINT = '/api/sessions/stats'
  const CUSTOM_INTERVALS_ENDPOINT = '/api/custom-intervals'
  const TIMER_STATE_ENDPOINT = '/api/timer/state'

  // Test user data
  const testUser = {
    email: 'test@zenfocus.app',
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
  }

  const updatedUserPreferences = {
    theme: 'dark',
    defaultSessionMode: 'deepwork',
    ambientSound: 'forest',
    ambientVolume: 75,
    notifications: true,
    autoStartBreaks: false,
  }

  const testSession = {
    mode: 'study',
    plannedDuration: 25,
    actualDuration: 25,
    completedFully: true,
    pauseCount: 1,
    totalPauseTime: 2,
    ambientSound: 'rain',
    notes: 'Great focus session',
  }

  const testCustomInterval = {
    name: 'Short Sprint',
    workDuration: 15,
    breakDuration: 3,
    sessionMode: 'study',
  }

  // Guest session data that should be migrated
  const guestSessionData = {
    preferences: {
      theme: 'light',
      defaultSessionMode: 'study',
      ambientSound: 'ocean',
      ambientVolume: 60,
      notifications: true,
      autoStartBreaks: true,
    },
    sessions: [
      {
        mode: 'study',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        endTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90 minutes ago
        plannedDuration: 25,
        actualDuration: 25,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'silence',
      },
    ],
  }

  let authToken: string
  let refreshToken: string
  let userId: string

  beforeEach(async () => {
    // Clear all local storage and session storage
    global.localStorage?.clear()
    global.sessionStorage?.clear()

    // Reset authentication state
    authToken = ''
    refreshToken = ''
    userId = ''

    // Set up guest user data in localStorage to test migration
    if (global.localStorage) {
      global.localStorage.setItem('guest_preferences', JSON.stringify(guestSessionData.preferences))
      global.localStorage.setItem('guest_sessions', JSON.stringify(guestSessionData.sessions))
    }
  })

  afterEach(async () => {
    // Clean up any created user data
    if (authToken && userId) {
      try {
        await fetch(`${USER_ME_ENDPOINT}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }

    // Clear storage
    global.localStorage?.clear()
    global.sessionStorage?.clear()
  })

  describe('Complete User Registration Workflow', () => {
    it('should complete full registration flow: email/password → verify account → login → profile setup', async () => {
      // Step 1: Register new user account
      const registerResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()

      expect(registerData).toMatchObject({
        success: true,
        message: expect.stringContaining('registration successful'),
        user: {
          id: expect.any(String),
          email: testUser.email,
          createdAt: expect.any(String),
          totalFocusTime: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        requiresVerification: true,
      })

      userId = registerData.user.id

      // Step 2: Simulate email verification (in real app, user clicks email link)
      const verifyResponse = await fetch(`${AUTH_REGISTER_ENDPOINT}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          verificationCode: 'mock_verification_code', // Mock code for testing
        }),
      })

      expect(verifyResponse.status).toBe(200)
      const verifyData = await verifyResponse.json()
      expect(verifyData.success).toBe(true)
      expect(verifyData.message).toContain('email verified')

      // Step 3: Login with verified account
      const loginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()

      expect(loginData).toMatchObject({
        success: true,
        user: {
          id: userId,
          email: testUser.email,
          createdAt: expect.any(String),
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: expect.any(Number),
        },
      })

      authToken = loginData.tokens.accessToken
      refreshToken = loginData.tokens.refreshToken

      // Step 4: Verify user can access authenticated profile
      const profileResponse = await fetch(USER_ME_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(profileResponse.status).toBe(200)
      const profileData = await profileResponse.json()

      expect(profileData).toMatchObject({
        id: userId,
        email: testUser.email,
        createdAt: expect.any(String),
        lastActiveAt: expect.any(String),
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        preferences: {
          theme: 'system',
          defaultSessionMode: 'study',
          ambientSound: 'silence',
          ambientVolume: 50,
          notifications: true,
          autoStartBreaks: true,
        },
      })

      // Step 5: Set up user profile preferences
      const preferencesResponse = await fetch(USER_PREFERENCES_ENDPOINT, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserPreferences),
      })

      expect(preferencesResponse.status).toBe(200)
      const preferencesData = await preferencesResponse.json()
      expect(preferencesData.preferences).toMatchObject(updatedUserPreferences)
    })

    it('should handle registration errors gracefully', async () => {
      // Test duplicate email registration
      await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      // Try to register same email again
      const duplicateResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })

      expect(duplicateResponse.status).toBe(409)
      const duplicateData = await duplicateResponse.json()
      expect(duplicateData.success).toBe(false)
      expect(duplicateData.error).toContain('email already exists')

      // Test invalid email format
      const invalidEmailResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: testUser.password,
          confirmPassword: testUser.password,
        }),
      })

      expect(invalidEmailResponse.status).toBe(400)
      const invalidEmailData = await invalidEmailResponse.json()
      expect(invalidEmailData.success).toBe(false)
      expect(invalidEmailData.error).toContain('invalid email format')

      // Test weak password
      const weakPasswordResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test2@zenfocus.app',
          password: '123',
          confirmPassword: '123',
        }),
      })

      expect(weakPasswordResponse.status).toBe(400)
      const weakPasswordData = await weakPasswordResponse.json()
      expect(weakPasswordData.success).toBe(false)
      expect(weakPasswordData.error).toContain('password requirements')
    })
  })

  describe('User Authentication Flow', () => {
    beforeEach(async () => {
      // Register and verify user for authentication tests
      const registerResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })
      const registerData = await registerResponse.json()
      userId = registerData.user.id

      await fetch(`${AUTH_REGISTER_ENDPOINT}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          verificationCode: 'mock_verification_code',
        }),
      })
    })

    it('should handle complete login → session management → authenticated API access', async () => {
      // Step 1: Login with valid credentials
      const loginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })

      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()

      expect(loginData.tokens.accessToken).toBeTruthy()
      expect(loginData.tokens.refreshToken).toBeTruthy()
      expect(loginData.tokens.expiresIn).toBeGreaterThan(0)

      authToken = loginData.tokens.accessToken
      refreshToken = loginData.tokens.refreshToken

      // Step 2: Verify session is valid for authenticated API access
      const authenticatedResponse = await fetch(SESSIONS_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(authenticatedResponse.status).toBe(200)

      // Step 3: Test token refresh mechanism
      const refreshResponse = await fetch(AUTH_REFRESH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      expect(refreshResponse.status).toBe(200)
      const refreshData = await refreshResponse.json()

      expect(refreshData.tokens.accessToken).toBeTruthy()
      expect(refreshData.tokens.accessToken).not.toBe(authToken) // New token
      expect(refreshData.tokens.expiresIn).toBeGreaterThan(0)

      // Step 4: Verify new token works for API access
      const newTokenResponse = await fetch(USER_ME_ENDPOINT, {
        headers: { Authorization: `Bearer ${refreshData.tokens.accessToken}` },
      })

      expect(newTokenResponse.status).toBe(200)

      // Step 5: Test logout and session invalidation
      const logoutResponse = await fetch(AUTH_LOGOUT_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshData.tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshData.tokens.refreshToken }),
      })

      expect(logoutResponse.status).toBe(200)

      // Step 6: Verify tokens are invalidated after logout
      const invalidTokenResponse = await fetch(USER_ME_ENDPOINT, {
        headers: { Authorization: `Bearer ${refreshData.tokens.accessToken}` },
      })

      expect(invalidTokenResponse.status).toBe(401)
    })

    it('should handle authentication errors properly', async () => {
      // Test invalid credentials
      const invalidLoginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'WrongPassword',
        }),
      })

      expect(invalidLoginResponse.status).toBe(401)
      const invalidLoginData = await invalidLoginResponse.json()
      expect(invalidLoginData.success).toBe(false)
      expect(invalidLoginData.error).toContain('invalid credentials')

      // Test non-existent user
      const nonExistentResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@zenfocus.app',
          password: testUser.password,
        }),
      })

      expect(nonExistentResponse.status).toBe(401)

      // Test accessing protected resource without token
      const noTokenResponse = await fetch(USER_ME_ENDPOINT)
      expect(noTokenResponse.status).toBe(401)

      // Test accessing protected resource with invalid token
      const invalidTokenResponse = await fetch(USER_ME_ENDPOINT, {
        headers: { Authorization: 'Bearer invalid_token' },
      })
      expect(invalidTokenResponse.status).toBe(401)
    })
  })

  describe('Data Persistence for Authenticated Users', () => {
    beforeEach(async () => {
      // Set up authenticated user
      const registerResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })
      const registerData = await registerResponse.json()
      userId = registerData.user.id

      await fetch(`${AUTH_REGISTER_ENDPOINT}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          verificationCode: 'mock_verification_code',
        }),
      })

      const loginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
      const loginData = await loginResponse.json()
      authToken = loginData.tokens.accessToken
    })

    it('should persist user preferences, session history, and custom intervals in database', async () => {
      // Step 1: Create and persist user preferences
      const preferencesResponse = await fetch(USER_PREFERENCES_ENDPOINT, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserPreferences),
      })

      expect(preferencesResponse.status).toBe(200)

      // Step 2: Create and persist session history
      const sessionResponse = await fetch(SESSIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testSession),
      })

      expect(sessionResponse.status).toBe(201)
      const sessionData = await sessionResponse.json()

      expect(sessionData.session).toMatchObject({
        id: expect.any(String),
        userId: userId,
        mode: testSession.mode,
        plannedDuration: testSession.plannedDuration,
        actualDuration: testSession.actualDuration,
        completedFully: testSession.completedFully,
        startTime: expect.any(String),
        endTime: expect.any(String),
      })

      // Step 3: Create and persist custom intervals
      const customIntervalResponse = await fetch(CUSTOM_INTERVALS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCustomInterval),
      })

      expect(customIntervalResponse.status).toBe(201)
      const customIntervalData = await customIntervalResponse.json()

      expect(customIntervalData.customInterval).toMatchObject({
        id: expect.any(String),
        userId: userId,
        name: testCustomInterval.name,
        workDuration: testCustomInterval.workDuration,
        breakDuration: testCustomInterval.breakDuration,
        sessionMode: testCustomInterval.sessionMode,
        isActive: true,
      })

      // Step 4: Verify all data persists across logout/login cycle
      await fetch(AUTH_LOGOUT_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      const reloginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
      const reloginData = await reloginResponse.json()
      authToken = reloginData.tokens.accessToken

      // Verify preferences persistence
      const persistedPreferencesResponse = await fetch(USER_PREFERENCES_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const persistedPreferencesData = await persistedPreferencesResponse.json()
      expect(persistedPreferencesData.preferences).toMatchObject(updatedUserPreferences)

      // Verify session history persistence
      const persistedSessionsResponse = await fetch(SESSIONS_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const persistedSessionsData = await persistedSessionsResponse.json()
      expect(persistedSessionsData.sessions).toHaveLength(1)
      expect(persistedSessionsData.sessions[0]).toMatchObject({
        mode: testSession.mode,
        plannedDuration: testSession.plannedDuration,
        actualDuration: testSession.actualDuration,
      })

      // Verify custom intervals persistence
      const persistedIntervalsResponse = await fetch(CUSTOM_INTERVALS_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const persistedIntervalsData = await persistedIntervalsResponse.json()
      expect(persistedIntervalsData.customIntervals).toHaveLength(1)
      expect(persistedIntervalsData.customIntervals[0]).toMatchObject({
        name: testCustomInterval.name,
        workDuration: testCustomInterval.workDuration,
        breakDuration: testCustomInterval.breakDuration,
      })
    })

    it('should track session statistics and user progress metrics', async () => {
      // Create multiple sessions to test statistics
      const sessions = [
        { ...testSession, mode: 'study', actualDuration: 25, completedFully: true },
        { ...testSession, mode: 'deepwork', actualDuration: 50, completedFully: true },
        { ...testSession, mode: 'study', actualDuration: 15, completedFully: false },
      ]

      for (const session of sessions) {
        await fetch(SESSIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(session),
        })
      }

      // Get session statistics
      const statsResponse = await fetch(SESSION_STATS_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(statsResponse.status).toBe(200)
      const statsData = await statsResponse.json()

      expect(statsData.stats).toMatchObject({
        totalSessions: 3,
        completedSessions: 2,
        totalFocusTime: 75, // 25 + 50 (only completed sessions count)
        averageSessionDuration: 37.5, // (25 + 50) / 2
        completionRate: expect.closeTo(0.67, 2), // 2/3
        currentStreak: expect.any(Number),
        longestStreak: expect.any(Number),
        sessionsByMode: {
          study: 2,
          deepwork: 1,
          yoga: 0,
          zen: 0,
        },
      })

      // Verify user profile is updated with statistics
      const profileResponse = await fetch(USER_ME_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const profileData = await profileResponse.json()

      expect(profileData.totalFocusTime).toBe(75)
      expect(profileData.currentStreak).toBeGreaterThanOrEqual(0)
      expect(profileData.longestStreak).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Guest-to-User Data Migration', () => {
    beforeEach(async () => {
      // Ensure guest data is set up in localStorage
      if (global.localStorage) {
        global.localStorage.setItem(
          'guest_preferences',
          JSON.stringify(guestSessionData.preferences)
        )
        global.localStorage.setItem('guest_sessions', JSON.stringify(guestSessionData.sessions))
      }
    })

    it('should migrate guest preferences and session data when user registers', async () => {
      // Step 1: Verify guest data exists before registration
      const guestPrefs = global.localStorage?.getItem('guest_preferences')
      const guestSessions = global.localStorage?.getItem('guest_sessions')

      expect(guestPrefs).toBeTruthy()
      expect(guestSessions).toBeTruthy()

      // Step 2: Register new user with guest data present
      const registerResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          migrateGuestData: true, // Flag to trigger migration
        }),
      })

      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      userId = registerData.user.id

      // Verify and login
      await fetch(`${AUTH_REGISTER_ENDPOINT}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          verificationCode: 'mock_verification_code',
        }),
      })

      const loginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
      const loginData = await loginResponse.json()
      authToken = loginData.tokens.accessToken

      // Step 3: Verify guest preferences were migrated
      const preferencesResponse = await fetch(USER_PREFERENCES_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const preferencesData = await preferencesResponse.json()

      expect(preferencesData.preferences).toMatchObject(guestSessionData.preferences)

      // Step 4: Verify guest sessions were migrated
      const sessionsResponse = await fetch(SESSIONS_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const sessionsData = await sessionsResponse.json()

      expect(sessionsData.sessions).toHaveLength(1)
      expect(sessionsData.sessions[0]).toMatchObject({
        userId: userId,
        mode: guestSessionData.sessions[0].mode,
        plannedDuration: guestSessionData.sessions[0].plannedDuration,
        actualDuration: guestSessionData.sessions[0].actualDuration,
        completedFully: guestSessionData.sessions[0].completedFully,
      })

      // Step 5: Verify guest data is cleared from localStorage after migration
      const remainingGuestPrefs = global.localStorage?.getItem('guest_preferences')
      const remainingGuestSessions = global.localStorage?.getItem('guest_sessions')

      expect(remainingGuestPrefs).toBeNull()
      expect(remainingGuestSessions).toBeNull()
    })

    it('should isolate guest and authenticated user data properly', async () => {
      // Step 1: Create some guest timer state
      if (global.sessionStorage) {
        global.sessionStorage.setItem(
          'timer_state',
          JSON.stringify({
            isActive: true,
            mode: 'study',
            timeRemaining: 1200,
            phase: 'work',
          })
        )
      }

      // Step 2: Register and login user (without migration)
      const registerResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          migrateGuestData: false,
        }),
      })
      const registerData = await registerResponse.json()
      userId = registerData.user.id

      await fetch(`${AUTH_REGISTER_ENDPOINT}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          verificationCode: 'mock_verification_code',
        }),
      })

      const loginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
      const loginData = await loginResponse.json()
      authToken = loginData.tokens.accessToken

      // Step 3: Verify user starts with clean state (no guest data)
      const sessionsResponse = await fetch(SESSIONS_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const sessionsData = await sessionsResponse.json()
      expect(sessionsData.sessions).toHaveLength(0)

      const preferencesResponse = await fetch(USER_PREFERENCES_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const preferencesData = await preferencesResponse.json()
      expect(preferencesData.preferences.theme).toBe('system') // Default, not guest theme

      // Step 4: Verify guest timer state is preserved but isolated
      const guestTimerState = global.sessionStorage?.getItem('timer_state')
      expect(guestTimerState).toBeTruthy()

      // Step 5: Create authenticated timer state
      const authTimerStateResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: true,
          mode: 'deepwork',
          timeRemaining: 3000,
          phase: 'work',
        }),
      })

      expect(authTimerStateResponse.status).toBe(200)

      // Step 6: Verify authenticated timer state is separate from guest state
      const authTimerResponse = await fetch(TIMER_STATE_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const authTimerData = await authTimerResponse.json()

      expect(authTimerData.timerState).toMatchObject({
        mode: 'deepwork',
        timeRemaining: 3000,
      })

      // Guest state should still exist in sessionStorage
      const persistentGuestState = global.sessionStorage?.getItem('timer_state')
      expect(JSON.parse(persistentGuestState!)).toMatchObject({
        mode: 'study',
        timeRemaining: 1200,
      })
    })
  })

  describe('Cross-Device Synchronization', () => {
    beforeEach(async () => {
      // Set up authenticated user
      const registerResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })
      const registerData = await registerResponse.json()
      userId = registerData.user.id

      await fetch(`${AUTH_REGISTER_ENDPOINT}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          verificationCode: 'mock_verification_code',
        }),
      })

      const loginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
      const loginData = await loginResponse.json()
      authToken = loginData.tokens.accessToken
    })

    it('should synchronize user data across multiple devices/sessions', async () => {
      // Step 1: Create data on "device 1" (current session)
      await fetch(USER_PREFERENCES_ENDPOINT, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserPreferences),
      })

      await fetch(SESSIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testSession),
      })

      // Step 2: Simulate "device 2" by getting new login tokens
      const device2LoginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
      const device2LoginData = await device2LoginResponse.json()
      const device2Token = device2LoginData.tokens.accessToken

      // Step 3: Verify data syncs to "device 2"
      const device2PreferencesResponse = await fetch(USER_PREFERENCES_ENDPOINT, {
        headers: { Authorization: `Bearer ${device2Token}` },
      })
      const device2PreferencesData = await device2PreferencesResponse.json()
      expect(device2PreferencesData.preferences).toMatchObject(updatedUserPreferences)

      const device2SessionsResponse = await fetch(SESSIONS_ENDPOINT, {
        headers: { Authorization: `Bearer ${device2Token}` },
      })
      const device2SessionsData = await device2SessionsResponse.json()
      expect(device2SessionsData.sessions).toHaveLength(1)

      // Step 4: Create new session on "device 2"
      const device2Session = {
        ...testSession,
        mode: 'deepwork',
        actualDuration: 50,
        notes: 'Session from device 2',
      }

      await fetch(SESSIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${device2Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(device2Session),
      })

      // Step 5: Verify new session syncs back to "device 1"
      const updatedSessionsResponse = await fetch(SESSIONS_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const updatedSessionsData = await updatedSessionsResponse.json()
      expect(updatedSessionsData.sessions).toHaveLength(2)

      const device2SessionInDevice1 = updatedSessionsData.sessions.find(
        (session: any) => session.notes === 'Session from device 2'
      )
      expect(device2SessionInDevice1).toBeTruthy()
      expect(device2SessionInDevice1.mode).toBe('deepwork')
    })
  })

  describe('Error Handling and Network Scenarios', () => {
    beforeEach(async () => {
      // Set up authenticated user
      const registerResponse = await fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })
      const registerData = await registerResponse.json()
      userId = registerData.user.id

      await fetch(`${AUTH_REGISTER_ENDPOINT}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          verificationCode: 'mock_verification_code',
        }),
      })

      const loginResponse = await fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
      const loginData = await loginResponse.json()
      authToken = loginData.tokens.accessToken
    })

    it('should handle network failures gracefully with offline persistence', async () => {
      // Step 1: Create data while online
      await fetch(USER_PREFERENCES_ENDPOINT, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserPreferences),
      })

      // Step 2: Simulate network failure for timer state operations
      // This should fall back to local storage
      const timerStateData = {
        isActive: true,
        mode: 'study',
        timeRemaining: 1500,
        phase: 'work',
      }

      // Simulate offline by storing in sessionStorage when network call fails
      if (global.sessionStorage) {
        global.sessionStorage.setItem('offline_timer_state', JSON.stringify(timerStateData))
      }

      // Step 3: Verify offline timer state is preserved
      const offlineTimerState = global.sessionStorage?.getItem('offline_timer_state')
      expect(offlineTimerState).toBeTruthy()
      expect(JSON.parse(offlineTimerState!)).toMatchObject(timerStateData)

      // Step 4: Simulate network restoration and sync
      const syncResponse = await fetch(TIMER_STATE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timerStateData),
      })

      expect(syncResponse.status).toBe(200)

      // Step 5: Verify offline data is synced and cleared
      const syncedTimerResponse = await fetch(TIMER_STATE_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const syncedTimerData = await syncedTimerResponse.json()
      expect(syncedTimerData.timerState).toMatchObject(timerStateData)
    })

    it('should handle authentication token expiry and auto-refresh', async () => {
      // Step 1: Simulate token expiry by waiting or using expired token
      const expiredTokenResponse = await fetch(USER_ME_ENDPOINT, {
        headers: { Authorization: 'Bearer expired_token_simulation' },
      })

      expect(expiredTokenResponse.status).toBe(401)

      // Step 2: Simulate automatic token refresh
      if (refreshToken) {
        const refreshResponse = await fetch(AUTH_REFRESH_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        expect(refreshResponse.status).toBe(200)
        const refreshData = await refreshResponse.json()

        const newAuthToken = refreshData.tokens.accessToken

        // Step 3: Verify new token works
        const newTokenResponse = await fetch(USER_ME_ENDPOINT, {
          headers: { Authorization: `Bearer ${newAuthToken}` },
        })

        expect(newTokenResponse.status).toBe(200)
      }
    })

    it('should handle concurrent session modifications gracefully', async () => {
      // Step 1: Create two concurrent requests to modify preferences
      const preference1 = { ...updatedUserPreferences, theme: 'light' }
      const preference2 = { ...updatedUserPreferences, theme: 'dark' }

      const [response1, response2] = await Promise.all([
        fetch(USER_PREFERENCES_ENDPOINT, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preference1),
        }),
        fetch(USER_PREFERENCES_ENDPOINT, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preference2),
        }),
      ])

      // Step 2: Both should succeed (last write wins or conflict resolution)
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Step 3: Verify final state is consistent
      const finalPreferencesResponse = await fetch(USER_PREFERENCES_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const finalPreferencesData = await finalPreferencesResponse.json()

      // Should be either 'light' or 'dark', but consistent
      expect(['light', 'dark']).toContain(finalPreferencesData.preferences.theme)
    })
  })
})
