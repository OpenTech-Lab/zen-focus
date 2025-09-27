import { jest } from '@jest/globals'

// Mock Amplify Auth responses
export const mockAuthUser = {
  username: 'testuser',
  attributes: {
    email: 'test@example.com',
    sub: 'user-123',
  },
}

export const mockAuthSession = {
  isValid: true,
  getIdToken: () => ({
    getJwtToken: () => 'mock-jwt-token',
  }),
  getAccessToken: () => ({
    getJwtToken: () => 'mock-access-token',
  }),
}

// Mock DataStore models for testing
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockSession = (overrides = {}) => ({
  id: 'session-123',
  userId: 'user-123',
  mode: 'pomodoro',
  duration: 1500,
  startTime: new Date().toISOString(),
  endTime: null,
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockUserPreferences = (overrides = {}) => ({
  id: 'prefs-123',
  userId: 'user-123',
  theme: 'light',
  ambientSound: 'none',
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// Helper to reset all Amplify mocks
export const resetAmplifyMocks = () => {
  jest.clearAllMocks()
}