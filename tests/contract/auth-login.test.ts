import { describe, it, expect } from '@jest/globals';

/**
 * Contract test for POST /api/auth/login
 *
 * This test validates the API contract according to the OpenAPI specification.
 * It ensures that the login endpoint:
 * - Accepts valid email/password combinations
 * - Returns 200 with JWT token, user, and preferences on success
 * - Returns 401 with error details on invalid credentials
 * - Validates request payload format
 */

describe('POST /api/auth/login - Contract Test', () => {
  const LOGIN_ENDPOINT = '/api/auth/login';

  it('should return 200 with token, user, and preferences for valid credentials', async () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'validpassword123'
    };

    const response = await fetch(`http://localhost:3000${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validCredentials),
    });

    expect(response.status).toBe(200);

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

    // Validate preferences schema
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

  it('should return 401 with error details for invalid credentials', async () => {
    const invalidCredentials = {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    };

    const response = await fetch(`http://localhost:3000${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidCredentials),
    });

    expect(response.status).toBe(401);

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

    const response = await fetch(`http://localhost:3000${LOGIN_ENDPOINT}`, {
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

    const response = await fetch(`http://localhost:3000${LOGIN_ENDPOINT}`, {
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

    const response = await fetch(`http://localhost:3000${LOGIN_ENDPOINT}`, {
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

    const response = await fetch(`http://localhost:3000${LOGIN_ENDPOINT}`, {
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
});