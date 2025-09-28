import { describe, it, expect } from '@jest/globals';

/**
 * Contract test for GET /api/sessions/stats
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the session statistics endpoint:
 * - Returns 200 with SessionStats schema for authenticated requests
 * - Returns 401 with error details for unauthenticated requests
 * - Validates Bearer token authentication requirement (security: [BearerAuth: []])
 * - Validates period query parameter (week, month, year, all - default: month)
 * - Validates complete SessionStats schema according to OpenAPI spec
 */

describe('GET /api/sessions/stats - Contract Test', () => {
  const SESSIONS_STATS_ENDPOINT = '/api/sessions/stats';
  const VALID_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const INVALID_JWT_TOKEN = 'invalid.jwt.token';
  const EXPIRED_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.invalid';

  // Helper function to validate SessionStats schema
  const validateSessionStatsSchema = (data: any) => {
    // Validate required fields are present
    expect(data).toHaveProperty('totalSessions');
    expect(data).toHaveProperty('totalFocusTime');
    expect(data).toHaveProperty('averageSessionDuration');
    expect(data).toHaveProperty('currentStreak');
    expect(data).toHaveProperty('longestStreak');
    expect(data).toHaveProperty('completionRate');
    expect(data).toHaveProperty('modeBreakdown');

    // Validate field types
    expect(typeof data.totalSessions).toBe('number');
    expect(typeof data.totalFocusTime).toBe('number');
    expect(typeof data.averageSessionDuration).toBe('number');
    expect(typeof data.currentStreak).toBe('number');
    expect(typeof data.longestStreak).toBe('number');
    expect(typeof data.completionRate).toBe('number');
    expect(typeof data.modeBreakdown).toBe('object');

    // Validate numeric constraints (minimum: 0)
    expect(data.totalSessions).toBeGreaterThanOrEqual(0);
    expect(data.totalFocusTime).toBeGreaterThanOrEqual(0);
    expect(data.averageSessionDuration).toBeGreaterThanOrEqual(0);
    expect(data.currentStreak).toBeGreaterThanOrEqual(0);
    expect(data.longestStreak).toBeGreaterThanOrEqual(0);

    // Validate completionRate range (0-100)
    expect(data.completionRate).toBeGreaterThanOrEqual(0);
    expect(data.completionRate).toBeLessThanOrEqual(100);

    // Validate modeBreakdown object structure
    expect(data.modeBreakdown).toHaveProperty('study');
    expect(data.modeBreakdown).toHaveProperty('deepwork');
    expect(data.modeBreakdown).toHaveProperty('yoga');
    expect(data.modeBreakdown).toHaveProperty('zen');

    // Validate modeBreakdown field types and constraints
    expect(typeof data.modeBreakdown.study).toBe('number');
    expect(typeof data.modeBreakdown.deepwork).toBe('number');
    expect(typeof data.modeBreakdown.yoga).toBe('number');
    expect(typeof data.modeBreakdown.zen).toBe('number');

    expect(data.modeBreakdown.study).toBeGreaterThanOrEqual(0);
    expect(data.modeBreakdown.deepwork).toBeGreaterThanOrEqual(0);
    expect(data.modeBreakdown.yoga).toBeGreaterThanOrEqual(0);
    expect(data.modeBreakdown.zen).toBeGreaterThanOrEqual(0);

    // Validate that integers are actually integers where specified
    expect(Number.isInteger(data.totalSessions)).toBe(true);
    expect(Number.isInteger(data.totalFocusTime)).toBe(true);
    expect(Number.isInteger(data.currentStreak)).toBe(true);
    expect(Number.isInteger(data.longestStreak)).toBe(true);
    expect(Number.isInteger(data.modeBreakdown.study)).toBe(true);
    expect(Number.isInteger(data.modeBreakdown.deepwork)).toBe(true);
    expect(Number.isInteger(data.modeBreakdown.yoga)).toBe(true);
    expect(Number.isInteger(data.modeBreakdown.zen)).toBe(true);
  };

  // Helper function to validate error response schema
  const validateErrorSchema = (data: any) => {
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(typeof data.error).toBe('string');
    expect(typeof data.message).toBe('string');
    expect(data.error.length).toBeGreaterThan(0);
    expect(data.message.length).toBeGreaterThan(0);
  };

  describe('Authenticated requests (200 responses)', () => {
    it('should return 200 with session stats for authenticated request (default period: month)', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionStatsSchema(data);
    });

    it('should return 200 with session stats for period=week', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=week`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionStatsSchema(data);
    });

    it('should return 200 with session stats for period=month', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=month`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionStatsSchema(data);
    });

    it('should return 200 with session stats for period=year', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=year`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionStatsSchema(data);
    });

    it('should return 200 with session stats for period=all', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionStatsSchema(data);
    });

    it('should handle multiple query parameters with valid period', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=week&other=ignored`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionStatsSchema(data);
    });
  });

  describe('Period parameter validation', () => {
    it('should return 400 for invalid period value', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=invalid`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 400 for empty period value', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 400 for numeric period value', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=123`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 400 for case-sensitive period values', async () => {
      const invalidCases = ['WEEK', 'Month', 'YEAR', 'ALL'];

      for (const period of invalidCases) {
        const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=${period}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        validateErrorSchema(data);
      }
    });
  });

  describe('Authentication requirements (401 responses)', () => {
    it('should return 401 with error details for unauthenticated request (no token)', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 401 with error details for invalid Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${INVALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 401 with error details for malformed Authorization header', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': 'InvalidFormat token123',
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 401 with error details for empty Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ',
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 401 with error details for expired JWT token', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${EXPIRED_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 401 for missing Authorization header', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      validateErrorSchema(data);
    });

    it('should return 401 for Authorization header without Bearer scheme', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': VALID_JWT_TOKEN,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      validateErrorSchema(data);
    });
  });

  describe('HTTP method validation', () => {
    it('should reject non-GET methods (405 Method Not Allowed)', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
          method,
          headers: {
            'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        expect(response.status).toBe(405);
      }
    });
  });

  describe('Edge cases and robustness', () => {
    it('should handle malformed request headers gracefully', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'invalid-content-type',
        },
      });

      // Should still work for GET request since no body is expected
      // This validates the endpoint handles edge cases gracefully
      expect([200, 401, 400]).toContain(response.status);
    });

    it('should handle URL encoding in query parameters', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=${encodeURIComponent('month')}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionStatsSchema(data);
    });

    it('should handle duplicate period parameters (use first occurrence)', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}?period=week&period=month`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      // Should handle gracefully, either use first value or return 400
      expect([200, 400]).toContain(response.status);
    });

    it('should validate SessionStats values are consistent', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_STATS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionStatsSchema(data);

      // Additional consistency checks
      const totalModesSessions = data.modeBreakdown.study + data.modeBreakdown.deepwork +
                                 data.modeBreakdown.yoga + data.modeBreakdown.zen;

      // Total sessions should equal sum of mode breakdown (if both are populated)
      if (data.totalSessions > 0 && totalModesSessions > 0) {
        expect(totalModesSessions).toBeLessThanOrEqual(data.totalSessions);
      }

      // Current streak should not exceed longest streak
      expect(data.currentStreak).toBeLessThanOrEqual(data.longestStreak);
    });
  });
});