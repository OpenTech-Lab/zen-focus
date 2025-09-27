// Test user data
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
  },
  newUser: {
    email: 'newuser@example.com',
    password: 'NewPassword123!',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
}

// Timer test data
export const timerSettings = {
  default: {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  },
  custom: {
    pomodoro: 30,
    shortBreak: 10,
    longBreak: 20,
    longBreakInterval: 3,
  },
  minimal: {
    pomodoro: 1, // 1 minute for quick testing
    shortBreak: 1,
    longBreak: 2,
    longBreakInterval: 2,
  },
}

// Ambient sounds
export const ambientSounds = ['none', 'rain', 'forest', 'ocean', 'cafe'] as const

// Theme options
export const themes = ['light', 'dark', 'system'] as const

// Session modes
export const sessionModes = ['pomodoro', 'short-break', 'long-break', 'custom'] as const

// Custom intervals test data
export const customIntervals = {
  study: {
    name: 'Study Session',
    workMinutes: 50,
    breakMinutes: 10,
  },
  meeting: {
    name: 'Meeting Block',
    workMinutes: 60,
    breakMinutes: 15,
  },
  deepWork: {
    name: 'Deep Work',
    workMinutes: 90,
    breakMinutes: 20,
  },
}

// Error messages
export const errorMessages = {
  auth: {
    invalidCredentials: 'Invalid email or password',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    passwordTooShort: 'Password must be at least 8 characters',
    emailInvalid: 'Please enter a valid email address',
    passwordMismatch: 'Passwords do not match',
  },
  timer: {
    invalidDuration: 'Duration must be between 1 and 180 minutes',
  },
  general: {
    networkError: 'Network error. Please try again.',
    unexpectedError: 'An unexpected error occurred.',
  },
}

// Success messages
export const successMessages = {
  auth: {
    loginSuccess: 'Successfully logged in',
    registrationSuccess: 'Account created successfully',
    logoutSuccess: 'Successfully logged out',
  },
  settings: {
    saved: 'Settings saved successfully',
  },
  session: {
    completed: 'Session completed!',
    paused: 'Session paused',
    resumed: 'Session resumed',
    reset: 'Session reset',
  },
}
