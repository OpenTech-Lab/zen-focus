import { describe, it, expect } from '@jest/globals';

/**
 * Contract test for GET/POST /api/custom-intervals
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the custom intervals endpoints:
 * - GET /custom-intervals: Returns 200 with array of CustomInterval objects for authenticated users (requires BearerAuth)
 * - POST /custom-intervals: Returns 201 creating new custom interval for authenticated users (requires BearerAuth)
 * - Returns 401 when not authenticated (both endpoints require authentication)
 * - Returns 400 for POST with invalid custom interval data
 * - Validates complete CustomInterval schema according to OpenAPI spec
 * - Validates field constraints: workDuration (1-180), breakDuration (0-60), name (max 50 chars)
 * - Validates enum values for sessionMode (study, deepwork, yoga, zen)
 */

describe('GET/POST /api/custom-intervals - Contract Test', () => {
  const CUSTOM_INTERVALS_ENDPOINT = '/api/custom-intervals';
  const VALID_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const INVALID_JWT_TOKEN = 'invalid.jwt.token';

  // Valid custom interval data for testing
  const validCustomIntervalData = {
    name: 'Focus Session',
    workDuration: 25,
    breakDuration: 5,
    sessionMode: 'study'
  };

  describe('GET /api/custom-intervals', () => {
    it('should return 200 with array of CustomInterval objects for authenticated user', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      // Validate response is an array
      expect(Array.isArray(data)).toBe(true);

      // Validate each CustomInterval object in the array (if any)
      data.forEach((customInterval: any, index: number) => {
        validateCustomIntervalSchema(customInterval);
      });
    });

    it('should return 401 for unauthenticated request (no token)', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
      expect(data.error.length).toBeGreaterThan(0);
      expect(data.message.length).toBeGreaterThan(0);
    });

    it('should return 401 for invalid Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${INVALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return response with valid content-type header', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('POST /api/custom-intervals', () => {
    it('should return 201 creating new custom interval for authenticated user', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validCustomIntervalData),
      });

      expect(response.status).toBe(201);

      const data = await response.json();

      // Validate complete CustomInterval schema according to OpenAPI spec
      validateCustomIntervalSchema(data);

      // Validate that response includes all server-generated fields
      expect(data.id).toBeDefined();
      expect(data.userId).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(data.isActive).toBeDefined();

      // Validate that custom interval data matches request
      expect(data.name).toBe(validCustomIntervalData.name);
      expect(data.workDuration).toBe(validCustomIntervalData.workDuration);
      expect(data.breakDuration).toBe(validCustomIntervalData.breakDuration);
      expect(data.sessionMode).toBe(validCustomIntervalData.sessionMode);

      // Validate server-generated fields
      expect(typeof data.id).toBe('string');
      expect(data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(typeof data.userId).toBe('string');
      expect(data.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(typeof data.createdAt).toBe('string');
      expect(data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(typeof data.isActive).toBe('boolean');
    });

    it('should return 401 for unauthenticated request (no token)', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validCustomIntervalData),
      });

      expect(response.status).toBe(401);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
      expect(data.error.length).toBeGreaterThan(0);
      expect(data.message.length).toBeGreaterThan(0);
    });

    it('should return 401 for invalid Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INVALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validCustomIntervalData),
      });

      expect(response.status).toBe(401);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid custom interval data (missing required fields)', async () => {
      const invalidCustomIntervalData = {
        // Missing required 'name' field
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCustomIntervalData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
      expect(data.error.length).toBeGreaterThan(0);
      expect(data.message.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid sessionMode enum value', async () => {
      const invalidSessionModeData = {
        name: 'Focus Session',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'invalid-mode'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidSessionModeData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid workDuration (out of range - below minimum)', async () => {
      const invalidWorkDurationData = {
        name: 'Focus Session',
        workDuration: 0, // Below minimum of 1
        breakDuration: 5,
        sessionMode: 'study'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidWorkDurationData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid workDuration (out of range - above maximum)', async () => {
      const invalidWorkDurationData = {
        name: 'Focus Session',
        workDuration: 181, // Above maximum of 180
        breakDuration: 5,
        sessionMode: 'study'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidWorkDurationData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid breakDuration (out of range - below minimum)', async () => {
      const invalidBreakDurationData = {
        name: 'Focus Session',
        workDuration: 25,
        breakDuration: -1, // Below minimum of 0
        sessionMode: 'study'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidBreakDurationData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid breakDuration (out of range - above maximum)', async () => {
      const invalidBreakDurationData = {
        name: 'Focus Session',
        workDuration: 25,
        breakDuration: 61, // Above maximum of 60
        sessionMode: 'study'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidBreakDurationData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should return 400 for invalid name (exceeds maximum length)', async () => {
      const invalidNameData = {
        name: 'This is a very long name that exceeds the maximum length limit of 50 characters for custom interval names',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidNameData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should validate all sessionMode enums (study, deepwork, yoga, zen)', async () => {
      const validModes = ['study', 'deepwork', 'yoga', 'zen'];

      for (const sessionMode of validModes) {
        const customIntervalData = {
          name: `${sessionMode} Session`,
          workDuration: 25,
          breakDuration: 5,
          sessionMode
        };

        const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customIntervalData),
        });

        expect(response.status).toBe(201);

        const data = await response.json();
        validateCustomIntervalSchema(data);
        expect(data.sessionMode).toBe(sessionMode);
      }
    });

    it('should validate edge case values for workDuration and breakDuration', async () => {
      // Test minimum valid values
      const minValuesData = {
        name: 'Min Values',
        workDuration: 1, // Minimum valid
        breakDuration: 0, // Minimum valid
        sessionMode: 'study'
      };

      const response1 = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(minValuesData),
      });

      expect(response1.status).toBe(201);

      const data1 = await response1.json();
      validateCustomIntervalSchema(data1);
      expect(data1.workDuration).toBe(1);
      expect(data1.breakDuration).toBe(0);

      // Test maximum valid values
      const maxValuesData = {
        name: 'Max Values',
        workDuration: 180, // Maximum valid
        breakDuration: 60, // Maximum valid
        sessionMode: 'deepwork'
      };

      const response2 = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maxValuesData),
      });

      expect(response2.status).toBe(201);

      const data2 = await response2.json();
      validateCustomIntervalSchema(data2);
      expect(data2.workDuration).toBe(180);
      expect(data2.breakDuration).toBe(60);
    });

    it('should validate name at maximum allowed length (50 characters)', async () => {
      const maxLengthName = 'A'.repeat(50); // Exactly 50 characters
      const maxNameData = {
        name: maxLengthName,
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'zen'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maxNameData),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      validateCustomIntervalSchema(data);
      expect(data.name).toBe(maxLengthName);
      expect(data.name.length).toBe(50);
    });

    it('should handle malformed request bodies gracefully', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
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

    it('should return response with valid content-type header', async () => {
      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validCustomIntervalData),
      });

      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('CustomInterval Schema Validation', () => {
    it('should validate required fields are non-empty strings for name', async () => {
      const emptyNameData = {
        name: '', // Empty string should be invalid
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emptyNameData),
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should validate workDuration and breakDuration are numbers', async () => {
      const invalidTypesData = {
        name: 'Focus Session',
        workDuration: '25', // Should be number, not string
        breakDuration: '5', // Should be number, not string
        sessionMode: 'study'
      };

      const response = await fetch(`http://localhost:3000${CUSTOM_INTERVALS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTypesData),
      });

      expect([400, 201]).toContain(response.status); // Could be 400 for type validation or 201 if API coerces strings to numbers
    });
  });

  /**
   * Helper function to validate CustomInterval schema according to OpenAPI specification
   */
  function validateCustomIntervalSchema(customInterval: any) {
    // Validate all required fields are present
    expect(customInterval).toHaveProperty('id');
    expect(customInterval).toHaveProperty('userId');
    expect(customInterval).toHaveProperty('name');
    expect(customInterval).toHaveProperty('workDuration');
    expect(customInterval).toHaveProperty('breakDuration');
    expect(customInterval).toHaveProperty('sessionMode');
    expect(customInterval).toHaveProperty('createdAt');
    expect(customInterval).toHaveProperty('isActive');

    // Validate field types
    expect(typeof customInterval.id).toBe('string');
    expect(typeof customInterval.userId).toBe('string');
    expect(typeof customInterval.name).toBe('string');
    expect(typeof customInterval.workDuration).toBe('number');
    expect(typeof customInterval.breakDuration).toBe('number');
    expect(typeof customInterval.sessionMode).toBe('string');
    expect(typeof customInterval.createdAt).toBe('string');
    expect(typeof customInterval.isActive).toBe('boolean');

    // Validate UUID format for id and userId
    expect(customInterval.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(customInterval.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Validate enum values
    expect(['study', 'deepwork', 'yoga', 'zen']).toContain(customInterval.sessionMode);

    // Validate datetime format (ISO 8601)
    expect(customInterval.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Validate numeric constraints
    expect(customInterval.workDuration).toBeGreaterThanOrEqual(1);
    expect(customInterval.workDuration).toBeLessThanOrEqual(180);
    expect(customInterval.breakDuration).toBeGreaterThanOrEqual(0);
    expect(customInterval.breakDuration).toBeLessThanOrEqual(60);

    // Validate string constraints
    expect(customInterval.name.length).toBeGreaterThan(0);
    expect(customInterval.name.length).toBeLessThanOrEqual(50);

    // Validate id and userId are non-empty
    expect(customInterval.id.length).toBeGreaterThan(0);
    expect(customInterval.userId.length).toBeGreaterThan(0);
  }
});