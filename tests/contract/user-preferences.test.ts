import { describe, it, expect } from '@jest/globals'

/**
 * Contract test for GET/PUT /api/users/me/preferences
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the user preferences endpoints:
 * - GET: Returns 200 with user preferences for authenticated requests
 * - PUT: Returns 200 with updated preferences for valid data
 * - Both endpoints return 401 with error details for unauthenticated requests
 * - PUT returns 400 with error details for invalid preferences data
 * - Validates complete UserPreferences schema according to OpenAPI spec
 */

describe('GET/PUT /api/users/me/preferences - Contract Test', () => {
  const PREFERENCES_ENDPOINT = '/api/users/me/preferences'
  const VALID_JWT_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  const INVALID_JWT_TOKEN = 'invalid.jwt.token'

  // Valid UserPreferences payload for testing
  const validPreferences = {
    theme: 'dark',
    defaultSessionMode: 'deepwork',
    ambientSound: 'forest',
    ambientVolume: 75,
    notifications: true,
    autoStartBreaks: false,
  }

  describe('GET /api/users/me/preferences', () => {
    it('should return 200 with user preferences for authenticated request', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      // Validate complete UserPreferences schema according to OpenAPI spec
      expect(data).toMatchObject({
        theme: expect.stringMatching(/^(light|dark|system)$/),
        defaultSessionMode: expect.stringMatching(/^(study|deepwork|yoga|zen)$/),
        ambientSound: expect.stringMatching(/^(rain|forest|ocean|silence)$/),
        ambientVolume: expect.any(Number),
        notifications: expect.any(Boolean),
        autoStartBreaks: expect.any(Boolean),
      })

      // Validate all required fields are present
      expect(data).toHaveProperty('theme')
      expect(data).toHaveProperty('defaultSessionMode')
      expect(data).toHaveProperty('ambientSound')
      expect(data).toHaveProperty('ambientVolume')
      expect(data).toHaveProperty('notifications')
      expect(data).toHaveProperty('autoStartBreaks')

      // Validate field types
      expect(typeof data.theme).toBe('string')
      expect(typeof data.defaultSessionMode).toBe('string')
      expect(typeof data.ambientSound).toBe('string')
      expect(typeof data.ambientVolume).toBe('number')
      expect(typeof data.notifications).toBe('boolean')
      expect(typeof data.autoStartBreaks).toBe('boolean')

      // Validate numeric constraints
      expect(data.ambientVolume).toBeGreaterThanOrEqual(0)
      expect(data.ambientVolume).toBeLessThanOrEqual(100)

      // Validate enum values
      expect(['light', 'dark', 'system']).toContain(data.theme)
      expect(['study', 'deepwork', 'yoga', 'zen']).toContain(data.defaultSessionMode)
      expect(['rain', 'forest', 'ocean', 'silence']).toContain(data.ambientSound)
    })

    it('should return 401 with error details for unauthenticated request (no token)', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
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

    it('should return 401 with error details for invalid Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
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

    it('should return 401 with error details for malformed Authorization header', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: 'InvalidFormat token123',
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

    it('should return 401 with error details for empty Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ',
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
  })

  describe('PUT /api/users/me/preferences', () => {
    it('should return 200 with updated preferences for valid data', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPreferences),
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      // Validate complete UserPreferences schema according to OpenAPI spec
      expect(data).toMatchObject({
        theme: expect.stringMatching(/^(light|dark|system)$/),
        defaultSessionMode: expect.stringMatching(/^(study|deepwork|yoga|zen)$/),
        ambientSound: expect.stringMatching(/^(rain|forest|ocean|silence)$/),
        ambientVolume: expect.any(Number),
        notifications: expect.any(Boolean),
        autoStartBreaks: expect.any(Boolean),
      })

      // Validate the returned data matches what was sent
      expect(data.theme).toBe(validPreferences.theme)
      expect(data.defaultSessionMode).toBe(validPreferences.defaultSessionMode)
      expect(data.ambientSound).toBe(validPreferences.ambientSound)
      expect(data.ambientVolume).toBe(validPreferences.ambientVolume)
      expect(data.notifications).toBe(validPreferences.notifications)
      expect(data.autoStartBreaks).toBe(validPreferences.autoStartBreaks)

      // Validate numeric constraints
      expect(data.ambientVolume).toBeGreaterThanOrEqual(0)
      expect(data.ambientVolume).toBeLessThanOrEqual(100)
    })

    it('should return 401 with error details for unauthenticated request (no token)', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPreferences),
      })

      expect(response.status).toBe(401)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 401 with error details for invalid Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${INVALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPreferences),
      })

      expect(response.status).toBe(401)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for invalid theme value', async () => {
      const invalidPreferences = {
        ...validPreferences,
        theme: 'invalid_theme',
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for invalid defaultSessionMode value', async () => {
      const invalidPreferences = {
        ...validPreferences,
        defaultSessionMode: 'invalid_mode',
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for invalid ambientSound value', async () => {
      const invalidPreferences = {
        ...validPreferences,
        ambientSound: 'invalid_sound',
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for ambientVolume below minimum (0)', async () => {
      const invalidPreferences = {
        ...validPreferences,
        ambientVolume: -1,
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for ambientVolume above maximum (100)', async () => {
      const invalidPreferences = {
        ...validPreferences,
        ambientVolume: 101,
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for missing required field - theme', async () => {
      const { theme, ...invalidPreferences } = validPreferences

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for missing required field - defaultSessionMode', async () => {
      const { defaultSessionMode, ...invalidPreferences } = validPreferences

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for missing required field - ambientSound', async () => {
      const { ambientSound, ...invalidPreferences } = validPreferences

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for missing required field - ambientVolume', async () => {
      const { ambientVolume, ...invalidPreferences } = validPreferences

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for missing required field - notifications', async () => {
      const { notifications, ...invalidPreferences } = validPreferences

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for missing required field - autoStartBreaks', async () => {
      const { autoStartBreaks, ...invalidPreferences } = validPreferences

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for invalid JSON payload', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid json{',
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for non-boolean notifications field', async () => {
      const invalidPreferences = {
        ...validPreferences,
        notifications: 'not_a_boolean',
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should return 400 with error details for non-boolean autoStartBreaks field', async () => {
      const invalidPreferences = {
        ...validPreferences,
        autoStartBreaks: 'not_a_boolean',
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPreferences),
      })

      expect(response.status).toBe(400)

      const data = await response.json()

      // Validate error response schema
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
      expect(typeof data.error).toBe('string')
      expect(typeof data.message).toBe('string')
    })

    it('should accept valid preferences with all valid enum values - light theme', async () => {
      const lightPreferences = {
        theme: 'light',
        defaultSessionMode: 'study',
        ambientSound: 'rain',
        ambientVolume: 25,
        notifications: false,
        autoStartBreaks: true,
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lightPreferences),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toMatchObject(lightPreferences)
    })

    it('should accept valid preferences with system theme and zen mode', async () => {
      const systemPreferences = {
        theme: 'system',
        defaultSessionMode: 'zen',
        ambientSound: 'ocean',
        ambientVolume: 0,
        notifications: true,
        autoStartBreaks: false,
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemPreferences),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toMatchObject(systemPreferences)
    })

    it('should accept valid preferences with maximum ambientVolume', async () => {
      const maxVolumePreferences = {
        theme: 'dark',
        defaultSessionMode: 'yoga',
        ambientSound: 'silence',
        ambientVolume: 100,
        notifications: false,
        autoStartBreaks: false,
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maxVolumePreferences),
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toMatchObject(maxVolumePreferences)
    })
  })

  describe('Edge Cases and Security', () => {
    it('should reject non-GET/PUT methods (405 Method Not Allowed)', async () => {
      const methods = ['POST', 'DELETE', 'PATCH']

      for (const method of methods) {
        const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
          method,
          headers: {
            Authorization: `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: method !== 'DELETE' ? JSON.stringify(validPreferences) : undefined,
        })

        expect(response.status).toBe(405)
      }
    })

    it('should handle malformed request headers gracefully for GET', async () => {
      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'invalid-content-type',
        },
      })

      // Should still work for GET request since no body is expected
      expect([200, 401, 400]).toContain(response.status)
    })

    it('should handle large payload gracefully for PUT', async () => {
      const largePayload = {
        ...validPreferences,
        extraField: 'a'.repeat(10000), // Large string
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(largePayload),
      })

      // Should handle gracefully - either accept (ignoring extra fields) or reject with 400
      expect([200, 400]).toContain(response.status)
    })

    it('should handle SQL injection attempts in string fields', async () => {
      const maliciousPreferences = {
        ...validPreferences,
        theme: "'; DROP TABLE users; --",
      }

      const response = await fetch(`http://localhost:3000${PREFERENCES_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maliciousPreferences),
      })

      // Should be rejected as invalid enum value
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
    })
  })
})
