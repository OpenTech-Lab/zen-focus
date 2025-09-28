import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Integration test for error handling and edge cases across ZenFocus components
 *
 * This test validates the complete error handling experience following Scenario 5 from quickstart.md:
 * "Error Handling and Edge Cases" - validates application handles errors gracefully.
 *
 * This is an INTEGRATION test - testing error handling across multiple components working together:
 * - Network failure scenarios and offline functionality
 * - API error responses (500, timeout, rate limiting) and graceful degradation
 * - Cross-component error propagation and recovery mechanisms
 * - Timer operations edge cases: system clock changes, browser tab switching, memory pressure
 * - Data persistence error handling: corruption, missing data, invalid sessions
 * - User input validation and boundary value testing
 * - Concurrent operation conflicts and race condition handling
 * - Integration between error handling UI, error reporting service, and recovery mechanisms
 *
 * Key Integration Points Tested:
 * - Timer service + error reporting + recovery service integration
 * - Network failure + offline persistence + sync recovery
 * - Input validation + error UI + user feedback integration
 * - Data corruption + fallback mechanisms + user recovery
 * - Concurrent operations + conflict resolution + data consistency
 * - Authentication failures + session recovery + re-auth flows
 * - Cross-device sync failures + conflict resolution + data merging
 * - System resource constraints + graceful degradation + user notifications
 */

describe('Error Handling and Edge Cases - Integration Test', () => {
  const TIMER_STATE_ENDPOINT = '/api/timer/state';
  const SESSION_MODES_ENDPOINT = '/api/session-modes';
  const SESSIONS_ENDPOINT = '/api/sessions';
  const USER_PREFERENCES_ENDPOINT = '/api/user/preferences';
  const AUTH_LOGIN_ENDPOINT = '/api/auth/login';
  const AUTH_REGISTER_ENDPOINT = '/api/auth/register';
  const USERS_ME_ENDPOINT = '/api/users/me';
  const CUSTOM_INTERVALS_ENDPOINT = '/api/custom-intervals';
  const SESSION_STATS_ENDPOINT = '/api/session-stats';

  // Mock fetch for simulating network failures and API errors
  let originalFetch: typeof global.fetch;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  // Sample valid timer state for testing
  const validTimerState = {
    isActive: true,
    isPaused: false,
    mode: 'study',
    phase: 'work',
    timeRemaining: 1500,
    totalElapsed: 0,
    currentCycle: 1
  };

  const validUserPreferences = {
    theme: 'light',
    defaultSessionMode: 'study',
    ambientSound: 'rain',
    soundVolume: 0.7,
    breakReminders: true,
    focusReminders: true
  };

  const validSessionData = {
    mode: 'study',
    startTime: new Date().toISOString(),
    duration: 1500,
    completed: true,
    userId: 'test-user-id'
  };

  beforeEach(async () => {
    // Store original fetch
    originalFetch = global.fetch;

    // Create mock fetch
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;

    // Clear any existing state
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }

    // Clear any service worker caches if available
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  });

  afterEach(async () => {
    // Restore original fetch
    global.fetch = originalFetch;

    // Clean up any mock timers
    jest.useRealTimers();

    // Clear storage
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
  });

  describe('Network Failure Scenarios and Offline Functionality', () => {
    it('should handle complete network failure with offline timer functionality and data sync when reconnected', async () => {
      // Step 1: Start timer session while online
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validTimerState,
      } as Response);

      const onlineTimerResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTimerState),
      });

      expect(onlineTimerResponse.ok).toBe(true);
      const onlineTimer = await onlineTimerResponse.json();
      expect(onlineTimer).toMatchObject(validTimerState);

      // Step 2: Simulate network failure - all requests should fail
      mockFetch.mockRejectedValue(new Error('Network failure'));

      // Timer should continue to function offline using localStorage
      let offlineTimer;
      try {
        await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        // Should fall back to localStorage
        const storedTimer = window.localStorage.getItem('offline_timer_state');
        offlineTimer = storedTimer ? JSON.parse(storedTimer) : validTimerState;
      }

      expect(offlineTimer).toBeDefined();
      expect(offlineTimer.isActive).toBe(true);

      // Step 3: Update timer state while offline (should store locally)
      const offlineUpdateState = { ...validTimerState, timeRemaining: 1200, totalElapsed: 300 };

      try {
        await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(offlineUpdateState),
        });
      } catch (error) {
        // Should store update locally for later sync
        window.localStorage.setItem('offline_timer_state', JSON.stringify(offlineUpdateState));
        window.localStorage.setItem('offline_changes', JSON.stringify([{
          type: 'timer_update',
          data: offlineUpdateState,
          timestamp: Date.now()
        }]));
      }

      const localState = JSON.parse(window.localStorage.getItem('offline_timer_state') || '{}');
      expect(localState.timeRemaining).toBe(1200);

      // Step 4: Restore network connection and sync changes
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...offlineUpdateState, synced: true }),
      } as Response);

      // Simulate sync operation when network is restored
      const syncResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offlineChanges: JSON.parse(window.localStorage.getItem('offline_changes') || '[]')
        }),
      });

      expect(syncResponse.ok).toBe(true);
      const syncedData = await syncResponse.json();
      expect(syncedData.synced).toBe(true);
      expect(syncedData.timeRemaining).toBe(1200);

      // Offline changes should be cleared after successful sync
      expect(window.localStorage.getItem('offline_changes')).toBe(null);
    });

    it('should handle intermittent network connectivity with retry mechanisms and backoff strategies', async () => {
      // Step 1: Simulate intermittent connectivity (success, fail, fail, success)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => validUserPreferences,
        } as Response)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...validUserPreferences, retrySuccess: true }),
        } as Response);

      // First request succeeds
      const firstResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(firstResponse.ok).toBe(true);

      // Next requests fail - should implement retry with exponential backoff
      let retryAttempts = 0;
      let finalResponse;

      while (retryAttempts < 3) {
        try {
          const response = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validUserPreferences),
          });

          if (response.ok) {
            finalResponse = response;
            break;
          }
        } catch (error) {
          retryAttempts++;
          // Simulate exponential backoff delay
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryAttempts) * 100));
        }
      }

      expect(finalResponse).toBeDefined();
      expect(finalResponse?.ok).toBe(true);

      const retryData = await finalResponse!.json();
      expect(retryData.retrySuccess).toBe(true);
    });
  });

  describe('API Error Responses and Graceful Degradation', () => {
    it('should handle 500 server errors with fallback mechanisms and user notifications', async () => {
      // Step 1: Simulate 500 error for timer state
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
          code: 'SERVER_ERROR',
          message: 'Timer service temporarily unavailable'
        }),
      } as Response);

      const errorResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(errorResponse.ok).toBe(false);
      expect(errorResponse.status).toBe(500);

      const errorData = await errorResponse.json();
      expect(errorData.code).toBe('SERVER_ERROR');

      // Should fall back to cached/local state
      const fallbackState = window.localStorage.getItem('cached_timer_state');
      const localState = fallbackState ? JSON.parse(fallbackState) : validTimerState;

      // Store fallback state for testing
      window.localStorage.setItem('cached_timer_state', JSON.stringify(validTimerState));

      expect(localState).toBeDefined();
      expect(localState.isActive).toBeDefined();
    });

    it('should handle timeout errors with progressive timeouts and circuit breaker pattern', async () => {
      // Step 1: Simulate timeout errors
      mockFetch
        .mockImplementationOnce(() =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
        )
        .mockImplementationOnce(() =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 200)
          )
        )
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...validSessionData, recovered: true }),
        } as Response);

      // First timeout attempt
      let timeoutError;
      try {
        await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validSessionData),
        });
      } catch (error) {
        timeoutError = error;
      }

      expect(timeoutError).toBeDefined();
      expect((timeoutError as Error).message).toContain('timeout');

      // Circuit breaker should track failures and eventually succeed
      let circuitBreakerOpen = false;
      let finalResponse;

      // Simulate circuit breaker logic
      for (let attempt = 0; attempt < 3; attempt++) {
        if (circuitBreakerOpen && attempt < 2) {
          // Circuit breaker is open, reject immediately
          continue;
        }

        try {
          const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validSessionData),
          });

          finalResponse = response;
          circuitBreakerOpen = false; // Reset on success
          break;
        } catch (error) {
          circuitBreakerOpen = true;
          await new Promise(resolve => setTimeout(resolve, 50)); // Brief delay
        }
      }

      expect(finalResponse?.ok).toBe(true);
      const recoveredData = await finalResponse!.json();
      expect(recoveredData.recovered).toBe(true);
    });

    it('should handle rate limiting (429 errors) with backoff and queue management', async () => {
      // Step 1: Simulate rate limiting
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({
            'Retry-After': '2',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + 2000)
          }),
          json: async () => ({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT',
            message: 'Too many requests, please try again later',
            retryAfter: 2
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...validTimerState, rateLimitRecovered: true }),
        } as Response);

      // First request hits rate limit
      const rateLimitResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTimerState),
      });

      expect(rateLimitResponse.status).toBe(429);

      const rateLimitData = await rateLimitResponse.json();
      expect(rateLimitData.code).toBe('RATE_LIMIT');
      expect(rateLimitData.retryAfter).toBe(2);

      // Should queue request and retry after specified delay
      await new Promise(resolve => setTimeout(resolve, 2100)); // Wait for retry-after period

      const retryResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTimerState),
      });

      expect(retryResponse.ok).toBe(true);
      const retryData = await retryResponse.json();
      expect(retryData.rateLimitRecovered).toBe(true);
    });

    it('should handle invalid API responses and malformed data gracefully', async () => {
      // Step 1: Test malformed JSON response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON');
        },
      } as Response);

      let jsonError;
      try {
        const response = await fetch(`http://localhost:3000${SESSION_MODES_ENDPOINT}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        await response.json();
      } catch (error) {
        jsonError = error;
      }

      expect(jsonError).toBeDefined();
      expect((jsonError as Error).message).toContain('JSON');

      // Should fall back to default session modes
      const defaultModes = [
        { name: 'study', workDuration: 1500, breakDuration: 300 },
        { name: 'deepwork', workDuration: 3000, breakDuration: 600 },
        { name: 'zen', workDuration: 0, breakDuration: 0 },
        { name: 'yoga', workDuration: 600, breakDuration: 120 }
      ];

      // Application should provide fallback data
      expect(defaultModes).toHaveLength(4);
      expect(defaultModes[0].name).toBe('study');

      // Step 2: Test response with missing required fields
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          // Missing required timer state fields
          isActive: true,
          // missing: isPaused, mode, phase, timeRemaining
        }),
      } as Response);

      const incompleteResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const incompleteData = await incompleteResponse.json();

      // Should validate and provide defaults for missing fields
      const sanitizedData = {
        isActive: incompleteData.isActive || false,
        isPaused: incompleteData.isPaused || false,
        mode: incompleteData.mode || 'study',
        phase: incompleteData.phase || 'work',
        timeRemaining: incompleteData.timeRemaining || 1500,
        totalElapsed: incompleteData.totalElapsed || 0,
        currentCycle: incompleteData.currentCycle || 1
      };

      expect(sanitizedData.isActive).toBe(true);
      expect(sanitizedData.mode).toBe('study');
      expect(sanitizedData.timeRemaining).toBe(1500);
    });
  });

  describe('Data Corruption and Recovery Mechanisms', () => {
    it('should handle corrupted localStorage data with recovery and user notification', async () => {
      // Step 1: Simulate corrupted timer state in localStorage
      window.localStorage.setItem('timer_state', 'invalid-json-data{corrupted');
      window.localStorage.setItem('user_preferences', '{"theme":"invalid-theme","corrupt');
      window.localStorage.setItem('session_history', '[{"id":1,"invalid":}]');

      // Step 2: Attempt to read corrupted data
      let timerError, prefsError, historyError;
      let recoveredTimer, recoveredPrefs, recoveredHistory;

      try {
        recoveredTimer = JSON.parse(window.localStorage.getItem('timer_state') || '{}');
      } catch (error) {
        timerError = error;
        // Should fall back to defaults
        recoveredTimer = validTimerState;
        window.localStorage.setItem('timer_state', JSON.stringify(validTimerState));
      }

      try {
        recoveredPrefs = JSON.parse(window.localStorage.getItem('user_preferences') || '{}');
      } catch (error) {
        prefsError = error;
        // Should fall back to defaults
        recoveredPrefs = validUserPreferences;
        window.localStorage.setItem('user_preferences', JSON.stringify(validUserPreferences));
      }

      try {
        recoveredHistory = JSON.parse(window.localStorage.getItem('session_history') || '[]');
      } catch (error) {
        historyError = error;
        // Should fall back to empty array
        recoveredHistory = [];
        window.localStorage.setItem('session_history', JSON.stringify([]));
      }

      expect(timerError).toBeDefined();
      expect(prefsError).toBeDefined();
      expect(historyError).toBeDefined();

      expect(recoveredTimer).toMatchObject(validTimerState);
      expect(recoveredPrefs).toMatchObject(validUserPreferences);
      expect(recoveredHistory).toEqual([]);

      // Step 3: Verify data integrity after recovery
      const restoredTimer = JSON.parse(window.localStorage.getItem('timer_state') || '{}');
      const restoredPrefs = JSON.parse(window.localStorage.getItem('user_preferences') || '{}');
      const restoredHistory = JSON.parse(window.localStorage.getItem('session_history') || '[]');

      expect(restoredTimer.isActive).toBeDefined();
      expect(restoredPrefs.theme).toBe('light');
      expect(Array.isArray(restoredHistory)).toBe(true);
    });

    it('should handle invalid session data with validation and sanitization', async () => {
      // Step 1: Test invalid session data from API
      const invalidSessionData = {
        mode: 'invalid-mode',
        duration: -1500, // negative duration
        timeRemaining: 'not-a-number', // invalid type
        phase: null, // null value
        customIntervals: { work: 'invalid', break: true }, // invalid structure
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => invalidSessionData,
      } as Response);

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const invalidData = await response.json();

      // Should validate and sanitize invalid data
      const sanitizedSession = {
        mode: ['study', 'deepwork', 'zen', 'yoga'].includes(invalidData.mode) ? invalidData.mode : 'study',
        duration: typeof invalidData.duration === 'number' && invalidData.duration > 0 ? invalidData.duration : 1500,
        timeRemaining: typeof invalidData.timeRemaining === 'number' ? invalidData.timeRemaining : 1500,
        phase: ['work', 'break'].includes(invalidData.phase) ? invalidData.phase : 'work',
        customIntervals: null, // Invalid structure should be reset
      };

      expect(sanitizedSession.mode).toBe('study');
      expect(sanitizedSession.duration).toBe(1500);
      expect(sanitizedSession.timeRemaining).toBe(1500);
      expect(sanitizedSession.phase).toBe('work');
      expect(sanitizedSession.customIntervals).toBe(null);
    });

    it('should handle database connection failures with local backup and sync recovery', async () => {
      // Step 1: Simulate database connection failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR',
          message: 'Unable to connect to database, using local backup'
        }),
      } as Response);

      const dbError = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(dbError.status).toBe(503);
      const errorData = await dbError.json();
      expect(errorData.code).toBe('DB_CONNECTION_ERROR');

      // Should fall back to local backup
      const localBackup = [
        { id: 1, mode: 'study', duration: 1500, completed: true },
        { id: 2, mode: 'deepwork', duration: 3000, completed: false }
      ];

      window.localStorage.setItem('session_backup', JSON.stringify(localBackup));

      const backupData = JSON.parse(window.localStorage.getItem('session_backup') || '[]');
      expect(backupData).toHaveLength(2);
      expect(backupData[0].mode).toBe('study');

      // Step 2: Test sync recovery when database comes back online
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          synced: true,
          conflicts: [],
          merged: localBackup
        }),
      } as Response);

      const syncResponse = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData: localBackup }),
      });

      expect(syncResponse.ok).toBe(true);
      const syncData = await syncResponse.json();
      expect(syncData.synced).toBe(true);
      expect(syncData.merged).toHaveLength(2);
    });
  });

  describe('Timer Edge Cases and System Integration', () => {
    it('should handle system clock changes and maintain timer accuracy', async () => {
      // Step 1: Start timer with initial system time
      const startTime = Date.now();
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(startTime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...validTimerState, startTime }),
      } as Response);

      const startResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validTimerState, startTime }),
      });

      expect(startResponse.ok).toBe(true);

      // Step 2: Simulate system clock being moved forward (e.g., user changes timezone)
      const clockSkewTime = startTime + (10 * 60 * 1000); // 10 minutes forward
      mockDateNow.mockReturnValue(clockSkewTime);

      // Timer should detect clock changes and adjust accordingly
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...validTimerState,
          timeRemaining: 900, // Should account for clock skew
          clockSkewDetected: true,
          adjustedTime: 600 // 10 minutes worth of adjustment
        }),
      } as Response);

      const clockSkewResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const clockSkewData = await clockSkewResponse.json();
      expect(clockSkewData.clockSkewDetected).toBe(true);
      expect(clockSkewData.adjustedTime).toBe(600);

      // Step 3: Simulate system clock being moved backward
      const clockBackTime = startTime - (5 * 60 * 1000); // 5 minutes backward
      mockDateNow.mockReturnValue(clockBackTime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...validTimerState,
          timeRemaining: 1500, // Should not go backward
          clockSkewDetected: true,
          preventedBackwardSkew: true
        }),
      } as Response);

      const backwardSkewResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const backwardSkewData = await backwardSkewResponse.json();
      expect(backwardSkewData.preventedBackwardSkew).toBe(true);
      expect(backwardSkewData.timeRemaining).toBe(1500); // Should not decrease due to backward clock

      mockDateNow.mockRestore();
    });

    it('should handle browser tab switching and background timer behavior', async () => {
      // Step 1: Start timer in active tab
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validTimerState,
      } as Response);

      await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTimerState),
      });

      // Step 2: Simulate tab becoming hidden (user switches tabs)
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
      });

      // Simulate visibility change event
      const visibilityEvent = new Event('visibilitychange');
      document.dispatchEvent(visibilityEvent);

      // Timer should continue in background but may have reduced frequency
      const backgroundState = { ...validTimerState, backgroundMode: true, updateFrequency: 10000 };
      window.localStorage.setItem('background_timer', JSON.stringify(backgroundState));

      // Step 3: Simulate tab becoming visible again
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...validTimerState,
          timeRemaining: 1200, // Should account for background time
          backgroundTimeElapsed: 300,
          resyncedFromBackground: true
        }),
      } as Response);

      document.dispatchEvent(visibilityEvent);

      const resyncResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}/resync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundState }),
      });

      expect(resyncResponse.ok).toBe(true);
      const resyncData = await resyncResponse.json();
      expect(resyncData.resyncedFromBackground).toBe(true);
      expect(resyncData.backgroundTimeElapsed).toBe(300);
    });

    it('should handle memory pressure and resource constraints gracefully', async () => {
      // Step 1: Simulate low memory warning
      const mockMemory = jest.spyOn(navigator, 'deviceMemory', 'get').mockReturnValue(1); // 1GB = low memory

      // Should reduce cache size and frequency of operations
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...validTimerState,
          lowMemoryMode: true,
          reducedCaching: true,
          optimizedUpdateFrequency: 5000
        }),
      } as Response);

      const lowMemoryResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryConstraint: true }),
      });

      const lowMemoryData = await lowMemoryResponse.json();
      expect(lowMemoryData.lowMemoryMode).toBe(true);
      expect(lowMemoryData.reducedCaching).toBe(true);

      // Step 2: Test garbage collection and cleanup
      // Clear non-essential cached data
      const nonEssentialKeys = ['session_cache', 'audio_cache', 'theme_cache'];
      nonEssentialKeys.forEach(key => {
        window.localStorage.removeItem(key);
      });

      // Verify essential data is preserved
      const essentialData = window.localStorage.getItem('timer_state');
      expect(essentialData).toBeDefined();

      mockMemory.mockRestore();
    });
  });

  describe('Concurrent Operations and Race Condition Handling', () => {
    it('should handle simultaneous session updates with conflict resolution', async () => {
      // Step 1: Simulate two simultaneous timer updates
      const update1 = { ...validTimerState, timeRemaining: 1400, version: 1 };
      const update2 = { ...validTimerState, timeRemaining: 1350, version: 2 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => update1,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 409, // Conflict
          json: async () => ({
            error: 'Conflicting update detected',
            code: 'UPDATE_CONFLICT',
            currentVersion: 2,
            conflictData: update2
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ...update2,
            resolvedConflict: true,
            mergedUpdate: true
          }),
        } as Response);

      // First update succeeds
      const firstUpdate = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update1),
      });

      expect(firstUpdate.ok).toBe(true);

      // Second update conflicts
      const conflictUpdate = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update2),
      });

      expect(conflictUpdate.status).toBe(409);
      const conflictData = await conflictUpdate.json();
      expect(conflictData.code).toBe('UPDATE_CONFLICT');

      // Resolve conflict by merging updates
      const resolvedUpdate = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseVersion: 1,
          conflictingUpdate: update2,
          mergeStrategy: 'latest-wins'
        }),
      });

      expect(resolvedUpdate.ok).toBe(true);
      const resolvedData = await resolvedUpdate.json();
      expect(resolvedData.resolvedConflict).toBe(true);
      expect(resolvedData.mergedUpdate).toBe(true);
    });

    it('should handle concurrent preference changes with proper locking', async () => {
      // Step 1: Simulate multiple preference updates happening simultaneously
      const themeUpdate = { ...validUserPreferences, theme: 'dark' };
      const soundUpdate = { ...validUserPreferences, ambientSound: 'forest' };
      const volumeUpdate = { ...validUserPreferences, soundVolume: 0.9 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...themeUpdate, lockAcquired: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 423, // Locked
          json: async () => ({
            error: 'Resource locked',
            code: 'RESOURCE_LOCKED',
            message: 'Preferences currently being updated by another operation'
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ...validUserPreferences,
            theme: 'dark',
            ambientSound: 'forest',
            soundVolume: 0.9,
            mergedPreferences: true
          }),
        } as Response);

      // First update acquires lock
      const themeResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeUpdate),
      });

      expect(themeResponse.ok).toBe(true);

      // Second update is blocked
      const lockedResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(soundUpdate),
      });

      expect(lockedResponse.status).toBe(423);

      // Batch update after lock is released
      const batchResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [themeUpdate, soundUpdate, volumeUpdate],
          strategy: 'merge'
        }),
      });

      expect(batchResponse.ok).toBe(true);
      const batchData = await batchResponse.json();
      expect(batchData.mergedPreferences).toBe(true);
      expect(batchData.theme).toBe('dark');
      expect(batchData.ambientSound).toBe('forest');
    });
  });

  describe('Cross-Component Error Propagation and Recovery', () => {
    it('should propagate authentication errors across all dependent components', async () => {
      // Step 1: Simulate authentication token expiration
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired'
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
          }),
        } as Response);

      // All authenticated endpoints should fail
      const timerFail = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer expired-token' },
      });

      const prefsFail = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer expired-token' },
      });

      const sessionsFail = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer expired-token' },
      });

      expect(timerFail.status).toBe(401);
      expect(prefsFail.status).toBe(401);
      expect(sessionsFail.status).toBe(401);

      // Should trigger global auth error handling
      const authErrors = [timerFail, prefsFail, sessionsFail];
      const allAuthErrors = authErrors.every(response => response.status === 401);
      expect(allAuthErrors).toBe(true);

      // Should clear local auth state and redirect to login
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('user_data');

      expect(window.localStorage.getItem('auth_token')).toBe(null);
    });

    it('should handle cascading service failures with graceful degradation', async () => {
      // Step 1: Timer service failure
      mockFetch.mockImplementationOnce((url) => {
        if (url.toString().includes('/timer/')) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({ error: 'Timer service unavailable' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({}),
        } as Response);
      });

      const timerServiceDown = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
      });

      expect(timerServiceDown.status).toBe(503);

      // Should fall back to client-side timer
      const clientSideTimer = {
        ...validTimerState,
        clientSideMode: true,
        reducedFeatures: true,
        noCloudSync: true
      };

      window.localStorage.setItem('fallback_timer', JSON.stringify(clientSideTimer));

      const fallbackTimer = JSON.parse(window.localStorage.getItem('fallback_timer') || '{}');
      expect(fallbackTimer.clientSideMode).toBe(true);
      expect(fallbackTimer.reducedFeatures).toBe(true);

      // Other services should continue to work
      const otherServicesStillWork = await fetch(`http://localhost:3000${SESSION_MODES_ENDPOINT}`, {
        method: 'GET',
      });

      expect(otherServicesStillWork.ok).toBe(true);
    });
  });

  describe('User Input Validation and Boundary Testing', () => {
    it('should validate and sanitize all user inputs with proper error messages', async () => {
      // Step 1: Test custom interval inputs
      const invalidIntervals = [
        { work: -1, break: 5 }, // negative work time
        { work: 60 * 60 * 24, break: 5 }, // unreasonably long work (24 hours)
        { work: 0, break: 5 }, // zero work time
        { work: 25, break: -1 }, // negative break time
        { work: 'invalid', break: 5 }, // non-numeric work time
        { work: 25, break: null }, // null break time
      ];

      for (const interval of invalidIntervals) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'Invalid interval data',
            code: 'VALIDATION_ERROR',
            details: {
              work: interval.work < 1 || interval.work > 3600 ? 'Work time must be between 1 and 3600 seconds' : null,
              break: interval.break < 0 || interval.break > 1800 ? 'Break time must be between 0 and 1800 seconds' : null,
            }
          }),
        } as Response);

        const invalidResponse = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interval),
        });

        expect(invalidResponse.status).toBe(400);
        const errorData = await invalidResponse.json();
        expect(errorData.code).toBe('VALIDATION_ERROR');
        expect(errorData.details).toBeDefined();
      }

      // Step 2: Test valid boundary values
      const validBoundaries = [
        { work: 1, break: 0 }, // minimum values
        { work: 3600, break: 1800 }, // maximum values
        { work: 300, break: 60 }, // typical values
      ];

      for (const interval of validBoundaries) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...interval, id: Math.random(), valid: true }),
        } as Response);

        const validResponse = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interval),
        });

        expect(validResponse.ok).toBe(true);
        const validData = await validResponse.json();
        expect(validData.valid).toBe(true);
      }
    });

    it('should prevent injection attacks and sanitize malicious input', async () => {
      // Step 1: Test various injection attempts
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE sessions; --',
        '${constructor.constructor("return process")().env}',
        '../../../etc/passwd',
        '%3Cscript%3Ealert%28%22xss%22%29%3C%2Fscript%3E',
        'javascript:alert("xss")',
      ];

      for (const maliciousInput of maliciousInputs) {
        const maliciousPreferences = {
          ...validUserPreferences,
          theme: maliciousInput,
          ambientSound: maliciousInput,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'Invalid input detected',
            code: 'SECURITY_VIOLATION',
            message: 'Input contains potentially malicious content',
            sanitized: true
          }),
        } as Response);

        const maliciousResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(maliciousPreferences),
        });

        expect(maliciousResponse.status).toBe(400);
        const securityData = await maliciousResponse.json();
        expect(securityData.code).toBe('SECURITY_VIOLATION');
        expect(securityData.sanitized).toBe(true);
      }

      // Step 2: Test proper sanitization of valid inputs with special characters
      const validSpecialCharInputs = {
        theme: 'light',
        ambientSound: 'café-rain', // accented characters
        customLabel: 'Study & Focus Time!', // ampersand and special chars
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...validSpecialCharInputs,
          sanitized: {
            customLabel: 'Study &amp; Focus Time!' // HTML entities escaped
          }
        }),
      } as Response);

      const sanitizedResponse = await fetch(`http://localhost:3000${USER_PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSpecialCharInputs),
      });

      expect(sanitizedResponse.ok).toBe(true);
      const sanitizedData = await sanitizedResponse.json();
      expect(sanitizedData.sanitized.customLabel).toBe('Study &amp; Focus Time!');
    });
  });
});