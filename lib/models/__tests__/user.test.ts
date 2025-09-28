import { describe, expect, test } from '@jest/globals'
import { User, UserSchema, createUser, validateUser, transformUserFromApi } from '../user'

describe('User Data Model', () => {
  describe('UserSchema validation', () => {
    test('should validate a valid user object', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validUser)
      }
    })

    test('should validate user with optional lastActiveAt', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        lastActiveAt: '2023-09-28T11:30:00.000Z',
        totalFocusTime: 120,
        currentStreak: 5,
        longestStreak: 10,
      }

      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validUser)
      }
    })

    test('should reject invalid UUID for id', () => {
      const invalidUser = {
        id: 'invalid-uuid',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    test('should reject invalid email format', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'invalid-email',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    test('should reject invalid ISO datetime for createdAt', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: 'invalid-date',
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    test('should reject negative totalFocusTime', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: -5,
        currentStreak: 0,
        longestStreak: 0,
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    test('should reject negative currentStreak', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: 0,
        currentStreak: -1,
        longestStreak: 0,
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    test('should reject negative longestStreak', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: -1,
      }

      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    test('should reject missing required fields', () => {
      const incompleteUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        // Missing createdAt, totalFocusTime, currentStreak, longestStreak
      }

      const result = UserSchema.safeParse(incompleteUser)
      expect(result.success).toBe(false)
    })

    test('should allow null lastActiveAt', () => {
      const userWithNullLastActive = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        lastActiveAt: null,
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
      }

      const result = UserSchema.safeParse(userWithNullLastActive)
      expect(result.success).toBe(true)
    })
  })

  describe('createUser helper function', () => {
    test('should create a valid user with required fields', () => {
      const email = 'test@example.com'
      const user = createUser(email)

      expect(user.email).toBe(email)
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      expect(user.totalFocusTime).toBe(0)
      expect(user.currentStreak).toBe(0)
      expect(user.longestStreak).toBe(0)
      expect(new Date(user.createdAt)).toBeInstanceOf(Date)
      expect(user.lastActiveAt).toBeUndefined()
    })

    test('should create different UUIDs for different users', () => {
      const user1 = createUser('user1@example.com')
      const user2 = createUser('user2@example.com')

      expect(user1.id).not.toBe(user2.id)
    })
  })

  describe('validateUser helper function', () => {
    test('should return valid user when input is correct', () => {
      const validInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: 120,
        currentStreak: 5,
        longestStreak: 10,
      }

      const result = validateUser(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInput)
      }
    })

    test('should return error details when input is invalid', () => {
      const invalidInput = {
        id: 'invalid-uuid',
        email: 'invalid-email',
        createdAt: 'invalid-date',
        totalFocusTime: -5,
        currentStreak: -1,
        longestStreak: -1,
      }

      const result = validateUser(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(6) // All fields should have validation errors
      }
    })
  })

  describe('transformUserFromApi helper function', () => {
    test('should transform API response to User model', () => {
      const apiResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        created_at: '2023-09-28T10:30:00.000Z', // snake_case from API
        last_active_at: '2023-09-28T11:30:00.000Z', // snake_case from API
        total_focus_time: 120, // snake_case from API
        current_streak: 5, // snake_case from API
        longest_streak: 10, // snake_case from API
      }

      const result = transformUserFromApi(apiResponse)
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        lastActiveAt: '2023-09-28T11:30:00.000Z',
        totalFocusTime: 120,
        currentStreak: 5,
        longestStreak: 10,
      })
    })

    test('should handle missing optional fields in API response', () => {
      const apiResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        created_at: '2023-09-28T10:30:00.000Z',
        total_focus_time: 0,
        current_streak: 0,
        longest_streak: 0,
      }

      const result = transformUserFromApi(apiResponse)
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
      })
    })
  })

  describe('TypeScript interface', () => {
    test('should enforce proper typing at compile time', () => {
      // This test validates TypeScript interface compliance
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        createdAt: '2023-09-28T10:30:00.000Z',
        totalFocusTime: 120,
        currentStreak: 5,
        longestStreak: 10,
      }

      // These should compile without errors
      expect(typeof user.id).toBe('string')
      expect(typeof user.email).toBe('string')
      expect(typeof user.createdAt).toBe('string')
      expect(typeof user.totalFocusTime).toBe('number')
      expect(typeof user.currentStreak).toBe('number')
      expect(typeof user.longestStreak).toBe('number')

      // lastActiveAt is optional
      if (user.lastActiveAt) {
        expect(typeof user.lastActiveAt).toBe('string')
      }
    })
  })
})
