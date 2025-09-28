import { describe, it, expect } from '@jest/globals';

/**
 * Contract test for PUT /api/sessions/{sessionId}
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the session update endpoint:
 * - PUT /sessions/{sessionId}: Returns 200 updating session (completing session) for authenticated users OR guest sessions (allows both auth and no auth)
 * - Returns 404 when session not found
 * - Returns 400 for invalid update data
 * - Returns 401 responses when not authenticated (though it also allows guest access)
 * - Validates complete Session schema in response according to OpenAPI spec
 * - Validates path parameter sessionId must be UUID format
 * - Validates request body fields: endTime, actualDuration, completedFully, pauseCount, totalPauseTime, and optional notes
 */

describe('PUT /api/sessions/{sessionId} - Contract Test', () => {
  const SESSIONS_BASE_ENDPOINT = '/api/sessions';
  const VALID_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const INVALID_JWT_TOKEN = 'invalid.jwt.token';

  // Valid session IDs for testing
  const VALID_SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';
  const NON_EXISTENT_SESSION_ID = '123e4567-e89b-12d3-a456-426614174000';
  const INVALID_SESSION_ID = 'not-a-uuid';

  // Valid session update data for testing
  const validUpdateData = {
    endTime: '2024-01-15T10:25:30.000Z',
    actualDuration: 25,
    completedFully: true,
    pauseCount: 0,
    totalPauseTime: 0
  };

  const validUpdateDataWithNotes = {
    endTime: '2024-01-15T10:25:30.000Z',
    actualDuration: 23,
    completedFully: false,
    pauseCount: 2,
    totalPauseTime: 3,
    notes: 'Had to pause twice for phone calls'
  };

  describe('PUT /api/sessions/{sessionId} - Successful Updates', () => {
    it('should return 200 updating session for authenticated user', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      // Validate complete Session schema according to OpenAPI spec
      validateSessionSchema(data);

      // Validate that this is an authenticated user session
      expect(data.userId).not.toBeNull();
      expect(typeof data.userId).toBe('string');
      expect(data.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Validate that update data was applied
      expect(data.endTime).toBe(validUpdateData.endTime);
      expect(data.actualDuration).toBe(validUpdateData.actualDuration);
      expect(data.completedFully).toBe(validUpdateData.completedFully);
      expect(data.pauseCount).toBe(validUpdateData.pauseCount);
      expect(data.totalPauseTime).toBe(validUpdateData.totalPauseTime);
    });

    it('should return 200 updating session for guest user (no authentication)', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      // Validate complete Session schema according to OpenAPI spec
      validateSessionSchema(data);

      // Validate that this is a guest session (userId should be null)
      expect(data.userId).toBeNull();

      // Validate that update data was applied
      expect(data.endTime).toBe(validUpdateData.endTime);
      expect(data.actualDuration).toBe(validUpdateData.actualDuration);
      expect(data.completedFully).toBe(validUpdateData.completedFully);
      expect(data.pauseCount).toBe(validUpdateData.pauseCount);
      expect(data.totalPauseTime).toBe(validUpdateData.totalPauseTime);
    });

    it('should return 200 updating session with optional notes field', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateDataWithNotes),
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      // Validate complete Session schema
      validateSessionSchema(data);

      // Validate that update data including notes was applied
      expect(data.endTime).toBe(validUpdateDataWithNotes.endTime);
      expect(data.actualDuration).toBe(validUpdateDataWithNotes.actualDuration);
      expect(data.completedFully).toBe(validUpdateDataWithNotes.completedFully);
      expect(data.pauseCount).toBe(validUpdateDataWithNotes.pauseCount);
      expect(data.totalPauseTime).toBe(validUpdateDataWithNotes.totalPauseTime);
      expect(data.notes).toBe(validUpdateDataWithNotes.notes);
    });

    it('should return 200 updating session with null notes field', async () => {
      const updateDataWithNullNotes = {
        ...validUpdateData,
        notes: null
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateDataWithNullNotes),
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      // Validate complete Session schema
      validateSessionSchema(data);

      // Validate that notes is null
      expect(data.notes).toBeNull();
    });
  });

  describe('PUT /api/sessions/{sessionId} - Path Parameter Validation', () => {
    it('should return 404 for non-existent session ID', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${NON_EXISTENT_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      expect(response.status).toBe(404);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
      expect(data.error.length).toBeGreaterThan(0);
      expect(data.message.length).toBeGreaterThan(0);
    });

    it('should return 400 for malformed UUID in path parameter', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${INVALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for empty UUID in path parameter', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      // This should return 400 or 404 depending on routing implementation
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('PUT /api/sessions/{sessionId} - Request Body Validation', () => {
    it('should return 400 for missing required field: endTime', async () => {
      const invalidData = {
        // Missing endTime
        actualDuration: 25,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for missing required field: actualDuration', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        // Missing actualDuration
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for missing required field: completedFully', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: 25,
        // Missing completedFully
        pauseCount: 0,
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for missing required field: pauseCount', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: 25,
        completedFully: true,
        // Missing pauseCount
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for missing required field: totalPauseTime', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: 25,
        completedFully: true,
        pauseCount: 0
        // Missing totalPauseTime
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid actualDuration type (string instead of number)', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: '25', // Should be number, not string
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid actualDuration value (negative)', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: -5, // Must be >= 0
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid completedFully type (string instead of boolean)', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: 25,
        completedFully: 'true', // Should be boolean, not string
        pauseCount: 0,
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid pauseCount value (negative)', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: 25,
        completedFully: true,
        pauseCount: -1, // Must be >= 0
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid totalPauseTime value (negative)', async () => {
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: 25,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: -2 // Must be >= 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid endTime format (not ISO 8601)', async () => {
      const invalidData = {
        endTime: '2024/01/15 10:25:30', // Wrong format, should be ISO 8601
        actualDuration: 25,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for notes exceeding maximum length (500 characters)', async () => {
      const longNotes = 'a'.repeat(501); // 501 characters, exceeds max of 500
      const invalidData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: 25,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        notes: longNotes
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should handle malformed request body gracefully', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid-json-body',
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });
  });

  describe('PUT /api/sessions/{sessionId} - Authentication and Authorization', () => {
    it('should return 401 for invalid Bearer token (when using auth)', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${INVALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      expect(response.status).toBe(401);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 401 for malformed Authorization header', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': 'InvalidFormat token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      expect(response.status).toBe(401);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });
  });

  describe('PUT /api/sessions/{sessionId} - Response Headers and Format', () => {
    it('should return response with valid content-type header', async () => {
      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('PUT /api/sessions/{sessionId} - Edge Cases', () => {
    it('should handle actualDuration of 0 (valid edge case)', async () => {
      const edgeCaseData = {
        endTime: '2024-01-15T10:00:00.000Z',
        actualDuration: 0, // Valid edge case - session ended immediately
        completedFully: false,
        pauseCount: 0,
        totalPauseTime: 0
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(edgeCaseData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionSchema(data);
      expect(data.actualDuration).toBe(0);
    });

    it('should handle high pause count and pause time values', async () => {
      const edgeCaseData = {
        endTime: '2024-01-15T11:00:00.000Z',
        actualDuration: 30,
        completedFully: false,
        pauseCount: 10, // High but valid pause count
        totalPauseTime: 15 // High but valid pause time
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(edgeCaseData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionSchema(data);
      expect(data.pauseCount).toBe(10);
      expect(data.totalPauseTime).toBe(15);
    });

    it('should handle notes with exactly 500 characters (boundary test)', async () => {
      const exactLengthNotes = 'a'.repeat(500); // Exactly 500 characters, should be valid
      const boundaryData = {
        endTime: '2024-01-15T10:25:30.000Z',
        actualDuration: 25,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        notes: exactLengthNotes
      };

      const response = await fetch(`http://localhost:3000${SESSIONS_BASE_ENDPOINT}/${VALID_SESSION_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boundaryData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateSessionSchema(data);
      expect(data.notes).toBe(exactLengthNotes);
      expect(data.notes.length).toBe(500);
    });
  });

  /**
   * Helper function to validate Session schema according to OpenAPI specification
   */
  function validateSessionSchema(session: any) {
    // Validate all required fields are present
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('mode');
    expect(session).toHaveProperty('startTime');
    expect(session).toHaveProperty('endTime');
    expect(session).toHaveProperty('plannedDuration');
    expect(session).toHaveProperty('actualDuration');
    expect(session).toHaveProperty('completedFully');
    expect(session).toHaveProperty('pauseCount');
    expect(session).toHaveProperty('totalPauseTime');
    expect(session).toHaveProperty('ambientSound');

    // userId can be present or null (for guest sessions)
    expect(session).toHaveProperty('userId');

    // notes is optional and can be null
    expect(session).toHaveProperty('notes');

    // Validate field types
    expect(typeof session.id).toBe('string');
    expect(typeof session.mode).toBe('string');
    expect(typeof session.startTime).toBe('string');
    expect(typeof session.endTime).toBe('string');
    expect(typeof session.plannedDuration).toBe('number');
    expect(typeof session.actualDuration).toBe('number');
    expect(typeof session.completedFully).toBe('boolean');
    expect(typeof session.pauseCount).toBe('number');
    expect(typeof session.totalPauseTime).toBe('number');
    expect(typeof session.ambientSound).toBe('string');

    // Validate UUID format for id
    expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Validate userId format (UUID or null)
    if (session.userId !== null) {
      expect(typeof session.userId).toBe('string');
      expect(session.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }

    // Validate enum values
    expect(['study', 'deepwork', 'yoga', 'zen']).toContain(session.mode);
    expect(['rain', 'forest', 'ocean', 'silence']).toContain(session.ambientSound);

    // Validate datetime formats (ISO 8601)
    expect(session.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(session.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Validate numeric constraints
    expect(session.plannedDuration).toBeGreaterThanOrEqual(1);
    expect(session.actualDuration).toBeGreaterThanOrEqual(0);
    expect(session.pauseCount).toBeGreaterThanOrEqual(0);
    expect(session.totalPauseTime).toBeGreaterThanOrEqual(0);

    // Validate notes if present
    if (session.notes !== null) {
      expect(typeof session.notes).toBe('string');
      expect(session.notes.length).toBeLessThanOrEqual(500);
    }

    // Validate id is non-empty
    expect(session.id.length).toBeGreaterThan(0);
  }
});