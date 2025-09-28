import { describe, it, expect } from '@jest/globals';

/**
 * Contract test for GET /api/session-modes
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the session-modes endpoint:
 * - Returns 200 with array of SessionMode objects
 * - Does not require authentication (security: [])
 * - Validates SessionMode schema according to OpenAPI spec
 * - Validates array structure and proper field types/constraints
 */

describe('GET /api/session-modes - Contract Test', () => {
  const SESSION_MODES_ENDPOINT = '/api/session-modes';

  it('should return 200 with array of SessionMode objects (no authentication required)', async () => {
    const response = await fetch(`http://localhost:3000${SESSION_MODES_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // No authorization header - this endpoint does not require authentication
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Validate response is an array
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Validate each SessionMode object in the array
    data.forEach((sessionMode: any, index: number) => {
      // Validate required fields exist
      expect(sessionMode).toHaveProperty('id');
      expect(sessionMode).toHaveProperty('name');
      expect(sessionMode).toHaveProperty('description');
      expect(sessionMode).toHaveProperty('defaultWorkDuration');
      expect(sessionMode).toHaveProperty('defaultBreakDuration');
      expect(sessionMode).toHaveProperty('color');
      expect(sessionMode).toHaveProperty('icon');
      expect(sessionMode).toHaveProperty('isCustomizable');

      // Validate field types
      expect(typeof sessionMode.id).toBe('string');
      expect(typeof sessionMode.name).toBe('string');
      expect(typeof sessionMode.description).toBe('string');
      expect(typeof sessionMode.defaultWorkDuration).toBe('number');
      expect(typeof sessionMode.defaultBreakDuration).toBe('number');
      expect(typeof sessionMode.color).toBe('string');
      expect(typeof sessionMode.icon).toBe('string');
      expect(typeof sessionMode.isCustomizable).toBe('boolean');

      // Validate field constraints
      expect(sessionMode.id.length).toBeGreaterThan(0);
      expect(sessionMode.name.length).toBeGreaterThan(0);
      expect(sessionMode.description.length).toBeGreaterThan(0);
      expect(sessionMode.defaultWorkDuration).toBeGreaterThanOrEqual(0);
      expect(sessionMode.defaultBreakDuration).toBeGreaterThanOrEqual(0);
      expect(sessionMode.icon.length).toBeGreaterThan(0);

      // Validate color format (hex format: #RRGGBB)
      expect(sessionMode.color).toMatch(/^#[0-9A-Fa-f]{6}$/);

      // Validate optional fields if present
      if (sessionMode.hasOwnProperty('maxWorkDuration')) {
        expect(typeof sessionMode.maxWorkDuration).toBe('number');
        expect(sessionMode.maxWorkDuration).toBeGreaterThanOrEqual(1);
      }

      if (sessionMode.hasOwnProperty('maxBreakDuration')) {
        expect(typeof sessionMode.maxBreakDuration).toBe('number');
        expect(sessionMode.maxBreakDuration).toBeGreaterThanOrEqual(1);
      }
    });
  });

  it('should include standard session modes (study, deepwork, yoga, zen)', async () => {
    const response = await fetch(`http://localhost:3000${SESSION_MODES_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    // Extract all mode IDs
    const modeIds = data.map((mode: any) => mode.id);

    // Validate that standard modes are present
    const expectedModes = ['study', 'deepwork', 'yoga', 'zen'];
    expectedModes.forEach(expectedMode => {
      expect(modeIds).toContain(expectedMode);
    });
  });

  it('should return valid SessionMode objects with all required properties', async () => {
    const response = await fetch(`http://localhost:3000${SESSION_MODES_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    // Validate each SessionMode has the complete required schema
    data.forEach((sessionMode: any) => {
      expect(sessionMode).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        defaultWorkDuration: expect.any(Number),
        defaultBreakDuration: expect.any(Number),
        color: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
        icon: expect.any(String),
        isCustomizable: expect.any(Boolean),
      });

      // Validate required field constraints from OpenAPI spec
      expect(sessionMode.defaultWorkDuration).toBeGreaterThanOrEqual(0);
      expect(sessionMode.defaultBreakDuration).toBeGreaterThanOrEqual(0);
      expect(sessionMode.id.length).toBeGreaterThan(0);
      expect(sessionMode.name.length).toBeGreaterThan(0);
      expect(sessionMode.description.length).toBeGreaterThan(0);
      expect(sessionMode.icon.length).toBeGreaterThan(0);
    });
  });

  it('should validate specific SessionMode properties for study mode', async () => {
    const response = await fetch(`http://localhost:3000${SESSION_MODES_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    const studyMode = data.find((mode: any) => mode.id === 'study');

    expect(studyMode).toBeDefined();
    expect(studyMode.name).toBe('Study');
    expect(typeof studyMode.description).toBe('string');
    expect(studyMode.description.length).toBeGreaterThan(0);
    expect(typeof studyMode.isCustomizable).toBe('boolean');
    expect(studyMode.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should validate response content-type header', async () => {
    const response = await fetch(`http://localhost:3000${SESSION_MODES_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('should handle GET request without authentication successfully', async () => {
    // This test explicitly verifies no auth is required per OpenAPI spec (security: [])
    const response = await fetch(`http://localhost:3000${SESSION_MODES_ENDPOINT}`, {
      method: 'GET',
      // Intentionally omitting any authorization headers
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});