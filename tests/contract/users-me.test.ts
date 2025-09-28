import { describe, it, expect } from '@jest/globals'

/**
 * Contract test for GET /api/users/me
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the user profile endpoint:
 * - Returns 200 with user profile for authenticated requests
 * - Returns 401 with error details for unauthenticated requests
 * - Validates Bearer token authentication requirement
 * - Validates complete User schema according to OpenAPI spec
 */

describe('GET /api/users/me - Contract Test', () => {
  const USERS_ME_ENDPOINT = '/api/users/me'
  const VALID_JWT_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  const INVALID_JWT_TOKEN = 'invalid.jwt.token'

  it('should return 200 with user profile for authenticated request', async () => {
    const response = await fetch(`http://localhost:3000${USERS_ME_ENDPOINT}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VALID_JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    expect(response.status).toBe(200)

    const data = await response.json()

    // Validate complete User schema according to OpenAPI spec
    expect(data).toMatchObject({
      id: expect.any(String),
      email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), // email format
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/), // ISO datetime
      totalFocusTime: expect.any(Number),
      currentStreak: expect.any(Number),
      longestStreak: expect.any(Number),
    })

    // Validate required fields are present
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('email')
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('totalFocusTime')
    expect(data).toHaveProperty('currentStreak')
    expect(data).toHaveProperty('longestStreak')

    // Validate field types and constraints
    expect(typeof data.id).toBe('string')
    expect(data.id.length).toBeGreaterThan(0)
    expect(typeof data.email).toBe('string')
    expect(typeof data.createdAt).toBe('string')

    // Validate numeric constraints (minimum: 0)
    expect(data.totalFocusTime).toBeGreaterThanOrEqual(0)
    expect(data.currentStreak).toBeGreaterThanOrEqual(0)
    expect(data.longestStreak).toBeGreaterThanOrEqual(0)

    // Validate UUID format for id (optional but good practice)
    expect(data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

    // Validate optional lastActiveAt field if present
    if (data.lastActiveAt) {
      expect(typeof data.lastActiveAt).toBe('string')
      expect(data.lastActiveAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    }
  })

  it('should return 401 with error details for unauthenticated request (no token)', async () => {
    const response = await fetch(`http://localhost:3000${USERS_ME_ENDPOINT}`, {
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
    const response = await fetch(`http://localhost:3000${USERS_ME_ENDPOINT}`, {
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
    const response = await fetch(`http://localhost:3000${USERS_ME_ENDPOINT}`, {
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
    const response = await fetch(`http://localhost:3000${USERS_ME_ENDPOINT}`, {
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

  it('should return 401 with error details for expired JWT token', async () => {
    // Using a token that's clearly expired (issued in 2018)
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.invalid'

    const response = await fetch(`http://localhost:3000${USERS_ME_ENDPOINT}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${expiredToken}`,
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

  it('should reject non-GET methods (405 Method Not Allowed)', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH']

    for (const method of methods) {
      const response = await fetch(`http://localhost:3000${USERS_ME_ENDPOINT}`, {
        method,
        headers: {
          Authorization: `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(405)
    }
  })

  it('should handle malformed request headers gracefully', async () => {
    const response = await fetch(`http://localhost:3000${USERS_ME_ENDPOINT}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VALID_JWT_TOKEN}`,
        'Content-Type': 'invalid-content-type',
      },
    })

    // Should still work for GET request since no body is expected
    // This validates the endpoint handles edge cases gracefully
    expect([200, 401, 400]).toContain(response.status)
  })
})
