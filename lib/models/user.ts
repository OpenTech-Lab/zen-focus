import { z } from 'zod'

/**
 * User data model interface based on OpenAPI specification
 * Represents a user in the ZenFocus application
 */
export interface User {
  /** User unique identifier (UUID format) */
  id: string
  /** User email address */
  email: string
  /** Account creation timestamp (ISO datetime) */
  createdAt: string
  /** Last activity timestamp (ISO datetime, optional and nullable) */
  lastActiveAt?: string | null
  /** Total focus time in minutes (non-negative integer) */
  totalFocusTime: number
  /** Current consecutive days streak (non-negative integer) */
  currentStreak: number
  /** Longest historical streak (non-negative integer) */
  longestStreak: number
}

/**
 * Zod schema for User validation
 * Provides runtime validation matching the OpenAPI specification
 */
export const UserSchema = z.object({
  id: z.string().uuid('Invalid UUID format for user ID'),
  email: z.string().email('Invalid email format'),
  createdAt: z.string().datetime('Invalid ISO datetime format for createdAt'),
  lastActiveAt: z
    .string()
    .datetime('Invalid ISO datetime format for lastActiveAt')
    .nullable()
    .optional(),
  totalFocusTime: z.number().int().min(0, 'Total focus time must be non-negative'),
  currentStreak: z.number().int().min(0, 'Current streak must be non-negative'),
  longestStreak: z.number().int().min(0, 'Longest streak must be non-negative'),
})

/**
 * Type derived from Zod schema for compile-time type checking
 */
export type UserType = z.infer<typeof UserSchema>

/**
 * Helper function to create a new user with default values
 * @param email - User's email address
 * @returns New User object with generated UUID and default values
 */
export function createUser(email: string): User {
  return {
    id: crypto.randomUUID(),
    email,
    createdAt: new Date().toISOString(),
    totalFocusTime: 0,
    currentStreak: 0,
    longestStreak: 0,
  }
}

/**
 * Helper function to validate user data at runtime
 * @param userData - Object to validate as User
 * @returns Validation result with parsed data or error details
 */
export function validateUser(userData: unknown): z.SafeParseReturnType<unknown, User> {
  return UserSchema.safeParse(userData)
}

/**
 * API response type for user data (snake_case fields)
 */
interface ApiUserResponse {
  id: string
  email: string
  created_at: string
  last_active_at?: string
  total_focus_time: number
  current_streak: number
  longest_streak: number
}

/**
 * Helper function to transform API response to User model
 * Converts snake_case API fields to camelCase model fields
 * @param apiData - API response data in snake_case format
 * @returns User object with camelCase fields
 */
export function transformUserFromApi(apiData: ApiUserResponse): User {
  const user: User = {
    id: apiData.id,
    email: apiData.email,
    createdAt: apiData.created_at,
    totalFocusTime: apiData.total_focus_time,
    currentStreak: apiData.current_streak,
    longestStreak: apiData.longest_streak,
  }

  // Add optional lastActiveAt if present
  if (apiData.last_active_at) {
    user.lastActiveAt = apiData.last_active_at
  }

  return user
}

/**
 * Helper function to transform User model to API format
 * Converts camelCase model fields to snake_case API fields
 * @param user - User object with camelCase fields
 * @returns API data with snake_case fields
 */
export function transformUserToApi(user: User): ApiUserResponse {
  const apiData: ApiUserResponse = {
    id: user.id,
    email: user.email,
    created_at: user.createdAt,
    total_focus_time: user.totalFocusTime,
    current_streak: user.currentStreak,
    longest_streak: user.longestStreak,
  }

  // Add optional lastActiveAt if present
  if (user.lastActiveAt) {
    apiData.last_active_at = user.lastActiveAt
  }

  return apiData
}

/**
 * Helper function to update user statistics
 * @param user - Current user object
 * @param focusTimeToAdd - Focus time to add in minutes
 * @param updateStreak - Whether to update the current streak
 * @returns Updated user object
 */
export function updateUserStats(
  user: User,
  focusTimeToAdd: number,
  updateStreak: boolean = false
): User {
  const updatedUser: User = {
    ...user,
    totalFocusTime: user.totalFocusTime + focusTimeToAdd,
    lastActiveAt: new Date().toISOString(),
  }

  if (updateStreak) {
    updatedUser.currentStreak = user.currentStreak + 1
    updatedUser.longestStreak = Math.max(user.longestStreak, updatedUser.currentStreak)
  }

  return updatedUser
}

/**
 * Helper function to reset user streak
 * @param user - Current user object
 * @returns User object with reset current streak
 */
export function resetUserStreak(user: User): User {
  return {
    ...user,
    currentStreak: 0,
    lastActiveAt: new Date().toISOString(),
  }
}
