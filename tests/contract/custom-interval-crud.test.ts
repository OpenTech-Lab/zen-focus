import { describe, it, expect } from '@jest/globals';

/**
 * Contract test for PUT/DELETE /api/custom-intervals/{id}
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the custom interval CRUD endpoints:
 * - PUT /custom-intervals/{intervalId}: Returns 200 response updating custom interval for authenticated users (requires BearerAuth)
 * - DELETE /custom-intervals/{intervalId}: Returns 204 response deleting custom interval for authenticated users (requires BearerAuth)
 * - Returns 404 responses when interval not found (both endpoints)
 * - Returns 401 responses when not authenticated (both endpoints require authentication)
 * - Returns 400 response for PUT with invalid custom interval data
 * - Proper validation of CustomInterval schema in PUT response according to OpenAPI spec
 * - Path parameter validation (intervalId must be UUID format)
 */

describe('PUT/DELETE /api/custom-intervals/{intervalId} - Contract Test', () => {
  const CUSTOM_INTERVAL_BASE_ENDPOINT = '/api/custom-intervals';
  const VALID_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const INVALID_JWT_TOKEN = 'invalid.jwt.token';

  // Valid UUID for testing
  const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const NON_EXISTENT_UUID = '987fcdeb-51a2-43d1-9876-543210987654';
  const INVALID_UUID = 'not-a-valid-uuid';

  // Valid custom interval update data
  const validUpdateData = {
    name: 'Updated Focus Session',
    workDuration: 30,
    breakDuration: 10,
    isActive: true
  };

  describe('PUT /api/custom-intervals/{intervalId}', () => {
    const getUpdateEndpoint = (intervalId: string) => `${CUSTOM_INTERVAL_BASE_ENDPOINT}/${intervalId}`;

    it('should return 200 with updated CustomInterval for valid authenticated request', async () => {
      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validUpdateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      // Validate complete CustomInterval schema according to OpenAPI spec
      validateCustomIntervalSchema(data);

      // Validate that response includes updated fields
      expect(data.name).toBe(validUpdateData.name);
      expect(data.workDuration).toBe(validUpdateData.workDuration);
      expect(data.breakDuration).toBe(validUpdateData.breakDuration);
      expect(data.isActive).toBe(validUpdateData.isActive);

      // Validate server-managed fields are still present
      expect(data.id).toBeDefined();
      expect(data.userId).toBeDefined();
      expect(data.sessionMode).toBeDefined();
      expect(data.createdAt).toBeDefined();
    });

    it('should return 401 for unauthenticated request (no token)', async () => {
      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
        headers: {
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
      expect(data.error.length).toBeGreaterThan(0);
      expect(data.message.length).toBeGreaterThan(0);
    });

    it('should return 401 for invalid Bearer token', async () => {
      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
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

    it('should return 404 for non-existent interval ID', async () => {
      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(NON_EXISTENT_UUID)}`, {
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
      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(INVALID_UUID)}`, {
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

    it('should return 400 for invalid request data (missing required fields)', async () => {
      const invalidUpdateData = {
        // Missing required 'name' field
        workDuration: 30,
        breakDuration: 10,
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUpdateData),
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

    it('should return 400 for invalid workDuration (out of range - below minimum)', async () => {
      const invalidWorkDurationData = {
        name: 'Updated Session',
        workDuration: 0, // Below minimum of 1
        breakDuration: 5,
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
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
        name: 'Updated Session',
        workDuration: 181, // Above maximum of 180
        breakDuration: 5,
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
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
        name: 'Updated Session',
        workDuration: 25,
        breakDuration: -1, // Below minimum of 0
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
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
        name: 'Updated Session',
        workDuration: 25,
        breakDuration: 61, // Above maximum of 60
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
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
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
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

    it('should return 400 for empty name field', async () => {
      const emptyNameData = {
        name: '', // Empty string should be invalid
        workDuration: 25,
        breakDuration: 5,
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
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

    it('should validate edge case values for workDuration and breakDuration', async () => {
      // Test minimum valid values
      const minValuesData = {
        name: 'Min Values Update',
        workDuration: 1, // Minimum valid
        breakDuration: 0, // Minimum valid
        isActive: false
      };

      const response1 = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(minValuesData),
      });

      expect(response1.status).toBe(200);

      const data1 = await response1.json();
      validateCustomIntervalSchema(data1);
      expect(data1.workDuration).toBe(1);
      expect(data1.breakDuration).toBe(0);
      expect(data1.isActive).toBe(false);

      // Test maximum valid values
      const maxValuesData = {
        name: 'Max Values Update',
        workDuration: 180, // Maximum valid
        breakDuration: 60, // Maximum valid
        isActive: true
      };

      const response2 = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maxValuesData),
      });

      expect(response2.status).toBe(200);

      const data2 = await response2.json();
      validateCustomIntervalSchema(data2);
      expect(data2.workDuration).toBe(180);
      expect(data2.breakDuration).toBe(60);
      expect(data2.isActive).toBe(true);
    });

    it('should validate name at maximum allowed length (50 characters)', async () => {
      const maxLengthName = 'A'.repeat(50); // Exactly 50 characters
      const maxNameData = {
        name: maxLengthName,
        workDuration: 25,
        breakDuration: 5,
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maxNameData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      validateCustomIntervalSchema(data);
      expect(data.name).toBe(maxLengthName);
      expect(data.name.length).toBe(50);
    });

    it('should handle malformed request bodies gracefully', async () => {
      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
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

    it('should validate field types for workDuration and breakDuration', async () => {
      const invalidTypesData = {
        name: 'Updated Session',
        workDuration: '25', // Should be number, not string
        breakDuration: '5', // Should be number, not string
        isActive: true
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTypesData),
      });

      expect([400, 200]).toContain(response.status); // Could be 400 for type validation or 200 if API coerces strings to numbers
    });

    it('should validate boolean type for isActive field', async () => {
      const invalidBooleanData = {
        name: 'Updated Session',
        workDuration: 25,
        breakDuration: 5,
        isActive: 'true' // Should be boolean, not string
      };

      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidBooleanData),
      });

      expect([400, 200]).toContain(response.status); // Could be 400 for type validation or 200 if API coerces strings to booleans
    });

    it('should return response with valid content-type header', async () => {
      const response = await fetch(`http://localhost:3000${getUpdateEndpoint(VALID_UUID)}`, {
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

  describe('DELETE /api/custom-intervals/{intervalId}', () => {
    const getDeleteEndpoint = (intervalId: string) => `${CUSTOM_INTERVAL_BASE_ENDPOINT}/${intervalId}`;

    it('should return 204 for successful deletion of existing interval', async () => {
      const response = await fetch(`http://localhost:3000${getDeleteEndpoint(VALID_UUID)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        },
      });

      expect(response.status).toBe(204);

      // Validate no response body for 204 No Content
      const responseText = await response.text();
      expect(responseText).toBe('');
    });

    it('should return 401 for unauthenticated request (no token)', async () => {
      const response = await fetch(`http://localhost:3000${getDeleteEndpoint(VALID_UUID)}`, {
        method: 'DELETE',
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
      const response = await fetch(`http://localhost:3000${getDeleteEndpoint(VALID_UUID)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${INVALID_JWT_TOKEN}`,
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

    it('should return 404 for non-existent interval ID', async () => {
      const response = await fetch(`http://localhost:3000${getDeleteEndpoint(NON_EXISTENT_UUID)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        },
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
      const response = await fetch(`http://localhost:3000${getDeleteEndpoint(INVALID_UUID)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        },
      });

      expect(response.status).toBe(400);

      const data = await response.json();

      // Validate error response schema
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(typeof data.error).toBe('string');
      expect(typeof data.message).toBe('string');
    });

    it('should handle multiple valid UUID formats correctly', async () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'ABCDEF12-3456-789A-BCDE-F0123456789A',
        'abcdef12-3456-789a-bcde-f0123456789a'
      ];

      for (const uuid of validUUIDs) {
        const response = await fetch(`http://localhost:3000${getDeleteEndpoint(uuid)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          },
        });

        // Should either be 204 (found and deleted) or 404 (not found but valid UUID format)
        expect([204, 404]).toContain(response.status);
      }
    });

    it('should handle malformed UUIDs correctly', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456', // Too short
        '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
        '123e4567-e89b-12d3-a456-42661417400g', // Invalid character
        '123e4567e89b12d3a456426614174000', // Missing hyphens
        ''
      ];

      for (const invalidUuid of invalidUUIDs) {
        const response = await fetch(`http://localhost:3000${getDeleteEndpoint(invalidUuid)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          },
        });

        expect(response.status).toBe(400);

        const data = await response.json();

        // Validate error response schema
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
        expect(typeof data.error).toBe('string');
        expect(typeof data.message).toBe('string');
      }
    });

    it('should not require content-type header for DELETE request', async () => {
      const response = await fetch(`http://localhost:3000${getDeleteEndpoint(VALID_UUID)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          // Intentionally no Content-Type header
        },
      });

      // Should succeed regardless of content-type header presence
      expect([204, 404]).toContain(response.status);
    });

    it('should handle DELETE request with empty body correctly', async () => {
      const response = await fetch(`http://localhost:3000${getDeleteEndpoint(VALID_UUID)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        },
        body: '', // Empty body should be fine for DELETE
      });

      // Should succeed regardless of empty body
      expect([204, 404]).toContain(response.status);
    });
  });

  describe('Path Parameter Validation', () => {
    it('should validate UUID format strictly for both PUT and DELETE', async () => {
      const testCases = [
        { uuid: '123e4567-e89b-12d3-a456-426614174000', expectValid: true },
        { uuid: 'ABCDEF12-3456-789A-BCDE-F0123456789A', expectValid: true },
        { uuid: 'not-a-uuid', expectValid: false },
        { uuid: '123', expectValid: false },
        { uuid: '', expectValid: false },
        { uuid: '123e4567-e89b-12d3-a456-42661417400g', expectValid: false } // Invalid character 'g'
      ];

      for (const testCase of testCases) {
        // Test PUT
        const putResponse = await fetch(`http://localhost:3000${CUSTOM_INTERVAL_BASE_ENDPOINT}/${testCase.uuid}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validUpdateData),
        });

        if (testCase.expectValid) {
          expect([200, 404]).toContain(putResponse.status); // Valid UUID format - either found or not found
        } else {
          expect(putResponse.status).toBe(400); // Invalid UUID format
        }

        // Test DELETE
        const deleteResponse = await fetch(`http://localhost:3000${CUSTOM_INTERVAL_BASE_ENDPOINT}/${testCase.uuid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          },
        });

        if (testCase.expectValid) {
          expect([204, 404]).toContain(deleteResponse.status); // Valid UUID format - either deleted or not found
        } else {
          expect(deleteResponse.status).toBe(400); // Invalid UUID format
        }
      }
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