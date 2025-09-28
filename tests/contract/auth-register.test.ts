import { describe, it, expect } from '@jest/globals';

/**
 * Contract test for POST /api/auth/register
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the registration endpoint:
 * - Accepts valid email/password combinations
 * - Returns 201 with JWT token, user, and preferences on successful registration
 * - Returns 400 with error details for invalid input or email already exists
 * - Validates request payload format
 */

describe('POST /api/auth/register - Contract Test', () => {
  const REGISTER_ENDPOINT = '/api/auth/register';

  it('should return 201 with token, user, and preferences for valid registration', async () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'validpassword123'
    };

    const response = await fetch(`http://localhost:3000${REGISTER_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRegistration),
    });

    expect(response.status).toBe(201);

    const data = await response.json();

    // Validate response structure matches contract
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('preferences');

    // Validate token
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(0);

    // Validate user schema
    expect(data.user).toMatchObject({
      id: expect.any(String),
      email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), // email format
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/), // ISO datetime
      totalFocusTime: expect.any(Number),
      currentStreak: expect.any(Number),
      longestStreak: expect.any(Number),
    });

    // Validate user constraints
    expect(data.user.totalFocusTime).toBeGreaterThanOrEqual(0);
    expect(data.user.currentStreak).toBeGreaterThanOrEqual(0);
    expect(data.user.longestStreak).toBeGreaterThanOrEqual(0);
    expect(data.user.email).toBe(validRegistration.email);

    // Validate preferences schema with defaults
    expect(data.preferences).toMatchObject({
      theme: expect.stringMatching(/^(light|dark|system)$/),
      defaultSessionMode: expect.stringMatching(/^(study|deepwork|yoga|zen)$/),
      ambientSound: expect.stringMatching(/^(rain|forest|ocean|silence)$/),
      ambientVolume: expect.any(Number),
      notifications: expect.any(Boolean),
      autoStartBreaks: expect.any(Boolean),
    });

    // Validate preferences constraints
    expect(data.preferences.ambientVolume).toBeGreaterThanOrEqual(0);
    expect(data.preferences.ambientVolume).toBeLessThanOrEqual(100);
  });

  it('should return 400 with error details for email already exists', async () => {
    const existingUserEmail = {
      email: 'existing@example.com',
      password: 'validpassword123'
    };

    const response = await fetch(`http://localhost:3000${REGISTER_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(existingUserEmail),
    });

    expect(response.status).toBe(400);

    const data = await response.json();

    // Validate error response schema
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(typeof data.error).toBe('string');
    expect(typeof data.message).toBe('string');
  });

  it('should return 400 for invalid request payload - missing email', async () => {
    const invalidPayload = {
      password: 'validpassword123'
    };

    const response = await fetch(`http://localhost:3000${REGISTER_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });

  it('should return 400 for invalid request payload - missing password', async () => {
    const invalidPayload = {
      email: 'test@example.com'
    };

    const response = await fetch(`http://localhost:3000${REGISTER_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });

  it('should return 400 for invalid email format', async () => {
    const invalidPayload = {
      email: 'not-an-email',
      password: 'validpassword123'
    };

    const response = await fetch(`http://localhost:3000${REGISTER_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });

  it('should return 400 for password shorter than 8 characters', async () => {
    const invalidPayload = {
      email: 'test@example.com',
      password: 'short'
    };

    const response = await fetch(`http://localhost:3000${REGISTER_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });

  it('should return 400 for empty request body', async () => {
    const response = await fetch(`http://localhost:3000${REGISTER_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });

  it('should return 400 for malformed JSON request body', async () => {
    const response = await fetch(`http://localhost:3000${REGISTER_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid-json',
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });
});