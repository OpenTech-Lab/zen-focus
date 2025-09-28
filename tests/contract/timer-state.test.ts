import { describe, it, expect } from '@jest/globals'

/**
 * Contract test for GET/POST/DELETE /api/timer/state
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the timer state endpoints:
 * - GET /timer/state: Returns 200 with TimerState OR 404 when no active timer (allows both auth and guest access)
 * - POST /timer/state: Returns 200 saving timer state (allows both auth and guest access)
 * - DELETE /timer/state: Returns 204 clearing timer state (allows both auth and guest access)
 * - Proper validation of TimerState schema according to OpenAPI spec
 * - Support for both authenticated users AND guest access (security: [BearerAuth: []] and {} in OpenAPI)
 */

describe('GET/POST/DELETE /api/timer/state - Contract Test', () => {
  const TIMER_STATE_ENDPOINT = '/api/timer/state'
  const VALID_JWT_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  const INVALID_JWT_TOKEN = 'invalid.jwt.token'

  // Valid timer state data for testing
  const validTimerState = {
    isActive: true,
    isPaused: false,
    mode: 'study',
    phase: 'work',
    timeRemaining: 1500,
    totalElapsed: 300,
    currentCycle: 1,
  }

  const validPausedTimerState = {
    isActive: true,
    isPaused: true,
    mode: 'deepwork',
    phase: 'break',
    timeRemaining: 900,
    totalElapsed: 1800,
    currentCycle: 2,
  }

  const validInactiveTimerState = {
    isActive: false,
    isPaused: false,
    mode: 'zen',
    phase: 'work',
    timeRemaining: 0,
    totalElapsed: 0,
    currentCycle: 1,
  }

  describe('GET /api/timer/state', () => {
    it('should return 200 with TimerState for authenticated user when timer exists', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      // Should return either 200 with TimerState or 404 when no active timer
      expect([200, 404]).toContain(response.status)

      if (response.status === 200) {
        const data = await response.json()
        validateTimerStateSchema(data)
      } else if (response.status === 404) {
        const data = await response.json()
        // Validate error response schema
        expect(data).toHaveProperty('error')
        expect(data).toHaveProperty('message')
        expect(typeof data.error).toBe('string')
        expect(typeof data.message).toBe('string')
      }
    })

    it('should return 200 with TimerState for guest user when timer exists', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // No authorization header - guest access allowed
      })

      // Should return either 200 with TimerState or 404 when no active timer
      expect([200, 404]).toContain(response.status)

      if (response.status === 200) {
        const data = await response.json()
        validateTimerStateSchema(data)
      } else if (response.status === 404) {
        const data = await response.json()
        // Validate error response schema
        expect(data).toHaveProperty('error')
        expect(data).toHaveProperty('message')
        expect(typeof data.error).toBe('string')
        expect(typeof data.message).toBe('string')
      }
    })

    it('should return 404 when no active timer exists for authenticated user', async () => {
      // First clear any existing timer state
      await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(404)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
      expect(data.error.length).toBeGreaterThan(0)
      expect(data.message.length).toBeGreaterThan(0)
    })

    it('should return 404 when no active timer exists for guest user', async () => {
      // First clear any existing timer state
      await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(404)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should validate response content-type header', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect([200, 404]).toContain(response.status)
      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('POST /api/timer/state', () => {
    it('should return 200 saving timer state for authenticated user', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTimerState),
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      // Validate complete TimerState schema according to OpenAPI spec
      validateTimerStateSchema(data)

      // Validate that the saved timer state matches request
      expect(data.isActive).toBe(validTimerState.isActive)
      expect(data.isPaused).toBe(validTimerState.isPaused)
      expect(data.mode).toBe(validTimerState.mode)
      expect(data.phase).toBe(validTimerState.phase)
      expect(data.timeRemaining).toBe(validTimerState.timeRemaining)
      expect(data.totalElapsed).toBe(validTimerState.totalElapsed)
      expect(data.currentCycle).toBe(validTimerState.currentCycle)
    })

    it('should return 200 saving timer state for guest user', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTimerState),
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      // Validate complete TimerState schema according to OpenAPI spec
      validateTimerStateSchema(data)

      // Validate that the saved timer state matches request
      expect(data.isActive).toBe(validTimerState.isActive)
      expect(data.isPaused).toBe(validTimerState.isPaused)
      expect(data.mode).toBe(validTimerState.mode)
      expect(data.phase).toBe(validTimerState.phase)
      expect(data.timeRemaining).toBe(validTimerState.timeRemaining)
      expect(data.totalElapsed).toBe(validTimerState.totalElapsed)
      expect(data.currentCycle).toBe(validTimerState.currentCycle)
    })

    it('should handle paused timer state correctly', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPausedTimerState),
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      validateTimerStateSchema(data)
      expect(data.isPaused).toBe(true)
      expect(data.isActive).toBe(true)
    })

    it('should handle inactive timer state correctly', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validInactiveTimerState),
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      validateTimerStateSchema(data)
      expect(data.isActive).toBe(false)
      expect(data.timeRemaining).toBe(0)
      expect(data.totalElapsed).toBe(0)
    })

    it('should return 400 for invalid timer state (missing required fields)', async () => {
      const invalidTimerState = {
        // Missing required 'isActive' field
        isPaused: false,
        mode: 'study',
        phase: 'work',
        timeRemaining: 1500,
        totalElapsed: 300,
        currentCycle: 1,
      }

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTimerState),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
      expect(data.error.length).toBeGreaterThan(0)
      expect(data.message.length).toBeGreaterThan(0)
    })

    it('should return 400 for invalid mode enum value', async () => {
      const invalidModeState = {
        ...validTimerState,
        mode: 'invalid-mode',
      }

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidModeState),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 for invalid phase enum value', async () => {
      const invalidPhaseState = {
        ...validTimerState,
        phase: 'invalid-phase',
      }

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPhaseState),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 for invalid timeRemaining (negative value)', async () => {
      const invalidTimeState = {
        ...validTimerState,
        timeRemaining: -1,
      }

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTimeState),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 for invalid currentCycle (less than 1)', async () => {
      const invalidCycleState = {
        ...validTimerState,
        currentCycle: 0,
      }

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCycleState),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should validate all mode enums (study, deepwork, yoga, zen)', async () => {
      const validModes = ['study', 'deepwork', 'yoga', 'zen']

      for (const mode of validModes) {
        const timerState = {
          ...validTimerState,
          mode,
        }

        const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timerState),
        })

        expect(response.status).toBe(200)

        const data = await response.json()
        validateTimerStateSchema(data)
        expect(data.mode).toBe(mode)
      }
    })

    it('should validate all phase enums (work, break)', async () => {
      const validPhases = ['work', 'break']

      for (const phase of validPhases) {
        const timerState = {
          ...validTimerState,
          phase,
        }

        const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timerState),
        })

        expect(response.status).toBe(200)

        const data = await response.json()
        validateTimerStateSchema(data)
        expect(data.phase).toBe(phase)
      }
    })

    it('should handle malformed request bodies gracefully', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid-json-body',
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should validate edge case values for timeRemaining and totalElapsed', async () => {
      const edgeCaseState = {
        ...validTimerState,
        timeRemaining: 0,
        totalElapsed: 0,
      }

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(edgeCaseState),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      validateTimerStateSchema(data)
      expect(data.timeRemaining).toBe(0)
      expect(data.totalElapsed).toBe(0)
    })

    it('should validate boolean field types for isActive and isPaused', async () => {
      // Test all combinations of boolean values
      const booleanCombinations = [
        { isActive: true, isPaused: true },
        { isActive: true, isPaused: false },
        { isActive: false, isPaused: true },
        { isActive: false, isPaused: false },
      ]

      for (const boolCombination of booleanCombinations) {
        const timerState = {
          ...validTimerState,
          ...boolCombination,
        }

        const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timerState),
        })

        expect(response.status).toBe(200)

        const data = await response.json()
        validateTimerStateSchema(data)
        expect(data.isActive).toBe(boolCombination.isActive)
        expect(data.isPaused).toBe(boolCombination.isPaused)
      }
    })
  })

  describe('DELETE /api/timer/state', () => {
    it('should return 204 clearing timer state for authenticated user', async () => {
      // First save a timer state
      await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTimerState),
      })

      // Then delete it
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(204)

      // Verify no content is returned
      const text = await response.text()
      expect(text).toBe('')
    })

    it('should return 204 clearing timer state for guest user', async () => {
      // First save a timer state
      await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTimerState),
      })

      // Then delete it
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(204)

      // Verify no content is returned
      const text = await response.text()
      expect(text).toBe('')
    })

    it('should return 204 even when no timer state exists for authenticated user', async () => {
      // Try to delete when no timer state exists
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(204)

      // Verify no content is returned
      const text = await response.text()
      expect(text).toBe('')
    })

    it('should return 204 even when no timer state exists for guest user', async () => {
      // Try to delete when no timer state exists
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(204)

      // Verify no content is returned
      const text = await response.text()
      expect(text).toBe('')
    })

    it('should verify timer state is actually cleared after delete', async () => {
      // First save a timer state
      const saveResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTimerState),
      })
      expect(saveResponse.status).toBe(200)

      // Delete the timer state
      const deleteResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })
      expect(deleteResponse.status).toBe(204)

      // Verify GET returns 404 (no timer state)
      const getResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })
      expect(getResponse.status).toBe(404)
    })
  })

  describe('TimerState Schema Validation', () => {
    it('should return response with valid content-type header for POST', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTimerState),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should validate complete TimerState schema for complex state', async () => {
      const complexTimerState = {
        isActive: true,
        isPaused: true,
        mode: 'yoga',
        phase: 'break',
        timeRemaining: 59,
        totalElapsed: 3541,
        currentCycle: 5,
      }

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complexTimerState),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      validateTimerStateSchema(data)

      // Validate all fields match exactly
      expect(data).toMatchObject(complexTimerState)
    })

    it('should handle very large values for time fields within constraints', async () => {
      const largeValueState = {
        ...validTimerState,
        timeRemaining: 999999,
        totalElapsed: 999999,
        currentCycle: 999,
      }

      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(largeValueState),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      validateTimerStateSchema(data)
      expect(data.timeRemaining).toBe(999999)
      expect(data.totalElapsed).toBe(999999)
      expect(data.currentCycle).toBe(999)
    })
  })

  describe('Authentication and Authorization', () => {
    it('should allow access with valid Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect([200, 404]).toContain(response.status)
    })

    it('should allow access without authentication (guest access)', async () => {
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect([200, 404]).toContain(response.status)
    })

    it('should handle invalid Bearer token gracefully', async () => {
      // According to the spec, timer/state allows both auth and guest access
      // So even with invalid token, it should allow the request as guest
      const response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${INVALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      // Should either process as guest (200/404) or reject invalid auth (401)
      expect([200, 404, 401]).toContain(response.status)
    })
  })

  /**
   * Helper function to validate TimerState schema according to OpenAPI specification
   */
  function validateTimerStateSchema(timerState: any) {
    // Validate all required fields are present
    expect(timerState).toHaveProperty('isActive')
    expect(timerState).toHaveProperty('isPaused')
    expect(timerState).toHaveProperty('mode')
    expect(timerState).toHaveProperty('phase')
    expect(timerState).toHaveProperty('timeRemaining')
    expect(timerState).toHaveProperty('totalElapsed')
    expect(timerState).toHaveProperty('currentCycle')

    // Validate field types
    expect(typeof timerState.isActive).toBe('boolean')
    expect(typeof timerState.isPaused).toBe('boolean')
    expect(typeof timerState.mode).toBe('string')
    expect(typeof timerState.phase).toBe('string')
    expect(typeof timerState.timeRemaining).toBe('number')
    expect(typeof timerState.totalElapsed).toBe('number')
    expect(typeof timerState.currentCycle).toBe('number')

    // Validate enum values
    expect(['study', 'deepwork', 'yoga', 'zen']).toContain(timerState.mode)
    expect(['work', 'break']).toContain(timerState.phase)

    // Validate numeric constraints
    expect(timerState.timeRemaining).toBeGreaterThanOrEqual(0)
    expect(timerState.totalElapsed).toBeGreaterThanOrEqual(0)
    expect(timerState.currentCycle).toBeGreaterThanOrEqual(1)

    // Validate that timeRemaining and totalElapsed are integers
    expect(Number.isInteger(timerState.timeRemaining)).toBe(true)
    expect(Number.isInteger(timerState.totalElapsed)).toBe(true)
    expect(Number.isInteger(timerState.currentCycle)).toBe(true)

    // Validate string field constraints
    expect(timerState.mode.length).toBeGreaterThan(0)
    expect(timerState.phase.length).toBeGreaterThan(0)
  }
})
