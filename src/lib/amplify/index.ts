// Central export for all Amplify utilities
export { configureAmplify, amplifyConfig } from './config'
export { AuthService, type AuthUser, type SignUpData, type SignInData } from './auth'
export { StorageService, LocalStorageService } from './storage'
export {
  DEFAULT_SESSION_MODES,
  validateUser,
  validateSession,
  validateUserPreferences,
  validateCustomInterval,
  createDefaultUserPreferences,
  getSessionModeById,
  calculateSessionStats,
  type User,
  type UserPreferences,
  type Session,
  type SessionMode,
  type CustomInterval,
  type TimerState,
} from './models'

// Environment variables check
export const isAmplifyConfigured = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
    'NEXT_PUBLIC_AWS_REGION',
  ]

  return requiredEnvVars.every((envVar) => process.env[envVar])
}

// Initialize Amplify when this module is imported
import { configureAmplify } from './config'

// Only configure if in browser environment
if (typeof window !== 'undefined') {
  configureAmplify()
}
