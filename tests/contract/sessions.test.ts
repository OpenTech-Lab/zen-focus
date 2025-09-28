import { describe, it, expect } from '@jest/globals'

/**
 * Contract test for GET/POST /api/sessions
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the sessions endpoints:
 * - GET /sessions: Returns 200 with session history for authenticated users, validates query parameters
 * - POST /sessions: Returns 201 creating new session for both authenticated and guest users
 * - Returns 401 for GET when not authenticated (requires BearerAuth)
 * - Returns 400 for POST with invalid session data
 * - Validates complete Session schema according to OpenAPI spec
 * - Validates response structure for GET: {sessions: Session[], total: number, hasMore: boolean}
 */

describe('GET/POST /api/sessions - Contract Test', () => {
  const SESSIONS_ENDPOINT = '/api/sessions'
  const VALID_JWT_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  const INVALID_JWT_TOKEN = 'invalid.jwt.token'

  // Valid session data for testing
  const validSessionData = {
    mode: 'study',
    plannedDuration: 25,
    ambientSound: 'rain',
  }

  describe('GET /api/sessions', () => {
    it('should return 200 with session history for authenticated user', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      // Validate response structure according to OpenAPI spec
      expect(data).toMatchObject({
        sessions: expect.any(Array),
        total: expect.any(Number),
        hasMore: expect.any(Boolean),
      })

      // Validate required fields are present
      expect(data).toHaveProperty('sessions')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('hasMore')

      // Validate field types and constraints
      expect(Array.isArray(data.sessions)).toBe(true)
      expect(typeof data.total).toBe('number')
      expect(typeof data.hasMore).toBe('boolean')
      expect(data.total).toBeGreaterThanOrEqual(0)

      // Validate each Session object in the array (if any)
      data.sessions.forEach((session: any, index: number) => {
        validateSessionSchema(session)
      })
    })

    it('should return 401 for unauthenticated request (no token)', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(401)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
      expect(data.error.length).toBeGreaterThan(0)
      expect(data.message.length).toBeGreaterThan(0)
    })

    it('should return 401 for invalid Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${INVALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(401)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should handle query parameters correctly (limit, offset, mode, from, to)', async () => {
      const queryParams = new URLSearchParams({
        limit: '10',
        offset: '5',
        mode: 'study',
        from: '2024-01-01',
        to: '2024-12-31',
      })

      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}?${queryParams}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      // Validate response structure
      expect(data).toMatchObject({
        sessions: expect.any(Array),
        total: expect.any(Number),
        hasMore: expect.any(Boolean),
      })

      // Validate that returned sessions don't exceed limit
      expect(data.sessions.length).toBeLessThanOrEqual(10)

      // If sessions exist, validate they match the mode filter
      data.sessions.forEach((session: any) => {
        expect(session.mode).toBe('study')
        validateSessionSchema(session)
      })
    })

    it('should validate query parameter constraints', async () => {
      // Test invalid limit (exceeds maximum of 100)
      const invalidLimitParams = new URLSearchParams({ limit: '150' })

      const response1 = await fetch(
        `http://localhost:3000${SESSIONS_ENDPOINT}?${invalidLimitParams}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect([200, 400]).toContain(response1.status) // Could be 200 with clamped value or 400 for validation error

      // Test invalid offset (negative)
      const invalidOffsetParams = new URLSearchParams({ offset: '-1' })

      const response2 = await fetch(
        `http://localhost:3000${SESSIONS_ENDPOINT}?${invalidOffsetParams}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect([200, 400]).toContain(response2.status) // Could be 200 with clamped value or 400 for validation error

      // Test invalid mode enum
      const invalidModeParams = new URLSearchParams({ mode: 'invalid-mode' })

      const response3 = await fetch(
        `http://localhost:3000${SESSIONS_ENDPOINT}?${invalidModeParams}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect([200, 400]).toContain(response3.status) // Could be 200 ignoring invalid param or 400 for validation error
    })

    it('should validate date format for from/to parameters', async () => {
      // Test invalid date format
      const invalidDateParams = new URLSearchParams({
        from: 'invalid-date',
        to: '2024/12/31', // Wrong format, should be YYYY-MM-DD
      })

      const response = await fetch(
        `http://localhost:3000${SESSIONS_ENDPOINT}?${invalidDateParams}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect([200, 400]).toContain(response.status) // Could be 200 ignoring invalid params or 400 for validation error
    })
  })

  describe('POST /api/sessions', () => {
    it('should return 201 creating new session for authenticated user', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validSessionData),
      })

      expect(response.status).toBe(201)

      const data = await response.json()

      // Validate complete Session schema according to OpenAPI spec
      validateSessionSchema(data)

      // Validate that this is an authenticated user session
      expect(data.userId).not.toBeNull()
      expect(typeof data.userId).toBe('string')
      expect(data.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

      // Validate session data matches request
      expect(data.mode).toBe(validSessionData.mode)
      expect(data.plannedDuration).toBe(validSessionData.plannedDuration)
      expect(data.ambientSound).toBe(validSessionData.ambientSound)
    })

    it('should return 201 creating new session for guest user (no authentication)', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validSessionData),
      })

      expect(response.status).toBe(201)

      const data = await response.json()

      // Validate complete Session schema according to OpenAPI spec
      validateSessionSchema(data)

      // Validate that this is a guest session (userId should be null)
      expect(data.userId).toBeNull()

      // Validate session data matches request
      expect(data.mode).toBe(validSessionData.mode)
      expect(data.plannedDuration).toBe(validSessionData.plannedDuration)
      expect(data.ambientSound).toBe(validSessionData.ambientSound)
    })

    it('should return 400 for invalid session data (missing required fields)', async () => {
      const invalidSessionData = {
        // Missing required 'mode' field
        plannedDuration: 25,
        ambientSound: 'rain',
      }

      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidSessionData),
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
      const invalidModeData = {
        mode: 'invalid-mode',
        plannedDuration: 25,
        ambientSound: 'rain',
      }

      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidModeData),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 for invalid plannedDuration (out of range)', async () => {
      const invalidDurationData = {
        mode: 'study',
        plannedDuration: 0, // Below minimum of 1
        ambientSound: 'rain',
      }

      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidDurationData),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 for invalid ambientSound enum value', async () => {
      const invalidAmbientData = {
        mode: 'study',
        plannedDuration: 25,
        ambientSound: 'invalid-sound',
      }

      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidAmbientData),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should handle missing optional ambientSound field (should default to silence)', async () => {
      const sessionDataWithoutAmbient = {
        mode: 'study',
        plannedDuration: 25,
        // ambientSound is optional and should default to 'silence'
      }

      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionDataWithoutAmbient),
      })

      expect(response.status).toBe(201)

      const data = await response.json()

      // Validate complete Session schema
      validateSessionSchema(data)

      // Validate that ambientSound defaults to 'silence'
      expect(data.ambientSound).toBe('silence')
    })

    it('should validate all session mode enums (study, deepwork, yoga, zen)', async () => {
      const validModes = ['study', 'deepwork', 'yoga', 'zen']

      for (const mode of validModes) {
        const sessionData = {
          mode,
          plannedDuration: 25,
          ambientSound: 'rain',
        }

        const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        })

        expect(response.status).toBe(201)

        const data = await response.json()
        validateSessionSchema(data)
        expect(data.mode).toBe(mode)
      }
    })

    it('should validate all ambientSound enums (rain, forest, ocean, silence)', async () => {
      const validSounds = ['rain', 'forest', 'ocean', 'silence']

      for (const sound of validSounds) {
        const sessionData = {
          mode: 'study',
          plannedDuration: 25,
          ambientSound: sound,
        }

        const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        })

        expect(response.status).toBe(201)

        const data = await response.json()
        validateSessionSchema(data)
        expect(data.ambientSound).toBe(sound)
      }
    })
  })

  describe('Session Schema Validation', () => {
    it('should return response with valid content-type header', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should handle malformed request bodies gracefully for POST', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_ENDPOINT}`, {
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
  })

  /**
   * Helper function to validate Session schema according to OpenAPI specification
   */
  function validateSessionSchema(session: any) {
    // Validate all required fields are present
    expect(session).toHaveProperty('id')
    expect(session).toHaveProperty('mode')
    expect(session).toHaveProperty('startTime')
    expect(session).toHaveProperty('endTime')
    expect(session).toHaveProperty('plannedDuration')
    expect(session).toHaveProperty('actualDuration')
    expect(session).toHaveProperty('completedFully')
    expect(session).toHaveProperty('pauseCount')
    expect(session).toHaveProperty('totalPauseTime')
    expect(session).toHaveProperty('ambientSound')

    // userId can be present or null (for guest sessions)
    expect(session).toHaveProperty('userId')

    // notes is optional and can be null
    expect(session).toHaveProperty('notes')

    // Validate field types
    expect(typeof session.id).toBe('string')
    expect(typeof session.mode).toBe('string')
    expect(typeof session.startTime).toBe('string')
    expect(typeof session.endTime).toBe('string')
    expect(typeof session.plannedDuration).toBe('number')
    expect(typeof session.actualDuration).toBe('number')
    expect(typeof session.completedFully).toBe('boolean')
    expect(typeof session.pauseCount).toBe('number')
    expect(typeof session.totalPauseTime).toBe('number')
    expect(typeof session.ambientSound).toBe('string')

    // Validate UUID format for id
    expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

    // Validate userId format (UUID or null)
    if (session.userId !== null) {
      expect(typeof session.userId).toBe('string')
      expect(session.userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    }

    // Validate enum values
    expect(['study', 'deepwork', 'yoga', 'zen']).toContain(session.mode)
    expect(['rain', 'forest', 'ocean', 'silence']).toContain(session.ambientSound)

    // Validate datetime formats (ISO 8601)
    expect(session.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(session.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

    // Validate numeric constraints
    expect(session.plannedDuration).toBeGreaterThanOrEqual(1)
    expect(session.actualDuration).toBeGreaterThanOrEqual(0)
    expect(session.pauseCount).toBeGreaterThanOrEqual(0)
    expect(session.totalPauseTime).toBeGreaterThanOrEqual(0)

    // Validate notes if present
    if (session.notes !== null) {
      expect(typeof session.notes).toBe('string')
      expect(session.notes.length).toBeLessThanOrEqual(500)
    }

    // Validate id is non-empty
    expect(session.id.length).toBeGreaterThan(0)
  }
})
