import { describe, expect, test } from '@jest/globals'
import {
  CustomInterval,
  CustomIntervalSchema,
  createCustomInterval,
  validateCustomInterval,
  transformCustomIntervalFromApi,
  transformCustomIntervalToApi,
  toggleCustomIntervalActive,
  calculateTotalDuration,
  updateCustomInterval,
  isIntervalForMode,
  getActiveIntervals,
  getIntervalsByMode,
  sortIntervalsByCreated,
  validateDurationsForMode,
  CreateCustomIntervalData,
} from '../custom-interval'

describe('CustomInterval Data Model', () => {
  describe('CustomIntervalSchema validation', () => {
    test('should validate a valid custom interval object', () => {
      const validCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Deep Focus Session',
        workDuration: 45,
        breakDuration: 10,
        sessionMode: 'deepwork' as const,
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(validCustomInterval)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validCustomInterval)
      }
    })

    test('should validate custom interval with different session modes', () => {
      const sessionModes = ['study', 'deepwork', 'yoga', 'zen'] as const

      sessionModes.forEach((mode) => {
        const customInterval = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: `${mode} interval`,
          workDuration: 25,
          breakDuration: 5,
          sessionMode: mode,
          createdAt: '2023-09-28T10:30:00.000Z',
          isActive: true,
        }

        const result = CustomIntervalSchema.safeParse(customInterval)
        expect(result.success).toBe(true)
      })
    })

    test('should validate custom interval with boundary values', () => {
      const boundaryTests = [
        { workDuration: 1, breakDuration: 0 }, // Minimum values
        { workDuration: 180, breakDuration: 60 }, // Maximum values
        { workDuration: 25, breakDuration: 15 }, // Typical values
      ]

      boundaryTests.forEach(({ workDuration, breakDuration }) => {
        const customInterval = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Boundary Test',
          workDuration,
          breakDuration,
          sessionMode: 'study' as const,
          createdAt: '2023-09-28T10:30:00.000Z',
          isActive: false,
        }

        const result = CustomIntervalSchema.safeParse(customInterval)
        expect(result.success).toBe(true)
      })
    })

    test('should reject invalid UUID for id', () => {
      const invalidCustomInterval = {
        id: 'invalid-uuid',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject invalid UUID for userId', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'invalid-user-uuid',
        name: 'Test Interval',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject empty name', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: '',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject name longer than 50 characters', () => {
      const longName = 'a'.repeat(51)
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: longName,
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject workDuration below minimum (1)', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 0,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject workDuration above maximum (180)', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 181,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject breakDuration below minimum (0)', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 25,
        breakDuration: -1,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject breakDuration above maximum (60)', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 25,
        breakDuration: 61,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject invalid sessionMode', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'invalid-mode',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject invalid ISO datetime for createdAt', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: 'invalid-date',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject non-boolean isActive', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: 'true', // Should be boolean, not string
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject missing required fields', () => {
      const incompleteCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        // Missing name, workDuration, breakDuration, sessionMode, createdAt, isActive
      }

      const result = CustomIntervalSchema.safeParse(incompleteCustomInterval)
      expect(result.success).toBe(false)
    })

    test('should reject non-integer duration values', () => {
      const invalidCustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 25.5, // Should be integer
        breakDuration: 5.7, // Should be integer
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = CustomIntervalSchema.safeParse(invalidCustomInterval)
      expect(result.success).toBe(false)
    })
  })

  describe('createCustomInterval helper function', () => {
    test('should create a valid custom interval with required fields', () => {
      const intervalData: CreateCustomIntervalData = {
        name: 'Pomodoro Session',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
      }
      const userId = '987fcdeb-51a2-43d4-8e5f-123456789abc'

      const customInterval = createCustomInterval(intervalData, userId)

      expect(customInterval.name).toBe(intervalData.name)
      expect(customInterval.workDuration).toBe(intervalData.workDuration)
      expect(customInterval.breakDuration).toBe(intervalData.breakDuration)
      expect(customInterval.sessionMode).toBe(intervalData.sessionMode)
      expect(customInterval.userId).toBe(userId)
      expect(customInterval.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      expect(customInterval.isActive).toBe(true) // Should default to active
      expect(new Date(customInterval.createdAt)).toBeInstanceOf(Date)
    })

    test('should create different UUIDs for different intervals', () => {
      const intervalData: CreateCustomIntervalData = {
        name: 'Test Interval',
        workDuration: 30,
        breakDuration: 10,
        sessionMode: 'deepwork',
      }
      const userId = '987fcdeb-51a2-43d4-8e5f-123456789abc'

      const interval1 = createCustomInterval(intervalData, userId)
      const interval2 = createCustomInterval(intervalData, userId)

      expect(interval1.id).not.toBe(interval2.id)
    })

    test('should create intervals with different session modes', () => {
      const userId = '987fcdeb-51a2-43d4-8e5f-123456789abc'
      const sessionModes: Array<'study' | 'deepwork' | 'yoga' | 'zen'> = [
        'study',
        'deepwork',
        'yoga',
        'zen',
      ]

      sessionModes.forEach((mode) => {
        const intervalData: CreateCustomIntervalData = {
          name: `${mode} interval`,
          workDuration: 30,
          breakDuration: 10,
          sessionMode: mode,
        }

        const customInterval = createCustomInterval(intervalData, userId)
        expect(customInterval.sessionMode).toBe(mode)
      })
    })
  })

  describe('validateCustomInterval helper function', () => {
    test('should return valid custom interval when input is correct', () => {
      const validInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Focus Session',
        workDuration: 45,
        breakDuration: 15,
        sessionMode: 'deepwork',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = validateCustomInterval(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInput)
      }
    })

    test('should return error details when input is invalid', () => {
      const invalidInput = {
        id: 'invalid-uuid',
        userId: 'invalid-user-uuid',
        name: '', // Empty name
        workDuration: 0, // Below minimum
        breakDuration: 61, // Above maximum
        sessionMode: 'invalid-mode',
        createdAt: 'invalid-date',
        isActive: 'not-boolean',
      }

      const result = validateCustomInterval(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe('transformCustomIntervalFromApi helper function', () => {
    test('should transform API response to CustomInterval model', () => {
      const apiResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '987fcdeb-51a2-43d4-8e5f-123456789abc', // snake_case from API
        name: 'Deep Work Session',
        work_duration: 90, // snake_case from API
        break_duration: 20, // snake_case from API
        session_mode: 'deepwork' as const, // snake_case from API
        created_at: '2023-09-28T10:30:00.000Z', // snake_case from API
        is_active: true, // snake_case from API
      }

      const result = transformCustomIntervalFromApi(apiResponse)
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Deep Work Session',
        workDuration: 90,
        breakDuration: 20,
        sessionMode: 'deepwork',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      })
    })
  })

  describe('toggleCustomIntervalActive helper function', () => {
    test('should toggle active custom interval to inactive', () => {
      const activeInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Active Interval',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = toggleCustomIntervalActive(activeInterval)
      expect(result.isActive).toBe(false)
      expect(result.id).toBe(activeInterval.id)
      expect(result.name).toBe(activeInterval.name)
    })

    test('should toggle inactive custom interval to active', () => {
      const inactiveInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Inactive Interval',
        workDuration: 50,
        breakDuration: 10,
        sessionMode: 'yoga',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: false,
      }

      const result = toggleCustomIntervalActive(inactiveInterval)
      expect(result.isActive).toBe(true)
      expect(result.id).toBe(inactiveInterval.id)
      expect(result.name).toBe(inactiveInterval.name)
    })
  })

  describe('calculateTotalDuration helper function', () => {
    test('should calculate total duration correctly', () => {
      const customInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Test Interval',
        workDuration: 45,
        breakDuration: 15,
        sessionMode: 'deepwork',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const totalDuration = calculateTotalDuration(customInterval)
      expect(totalDuration).toBe(60) // 45 + 15
    })

    test('should handle zero break duration', () => {
      const customInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Work Only Interval',
        workDuration: 30,
        breakDuration: 0,
        sessionMode: 'zen',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const totalDuration = calculateTotalDuration(customInterval)
      expect(totalDuration).toBe(30) // 30 + 0
    })
  })

  describe('updateCustomInterval helper function', () => {
    test('should update custom interval with new values', () => {
      const originalInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Original Name',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const updates = {
        name: 'Updated Name',
        workDuration: 45,
        breakDuration: 15,
        isActive: false,
      }

      const updatedInterval = updateCustomInterval(originalInterval, updates)

      expect(updatedInterval.name).toBe('Updated Name')
      expect(updatedInterval.workDuration).toBe(45)
      expect(updatedInterval.breakDuration).toBe(15)
      expect(updatedInterval.isActive).toBe(false)
      // Should preserve unchanged fields
      expect(updatedInterval.id).toBe(originalInterval.id)
      expect(updatedInterval.userId).toBe(originalInterval.userId)
      expect(updatedInterval.sessionMode).toBe(originalInterval.sessionMode)
      expect(updatedInterval.createdAt).toBe(originalInterval.createdAt)
    })

    test('should update partial fields only', () => {
      const originalInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Original Name',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const updates = {
        name: 'Updated Name Only',
      }

      const updatedInterval = updateCustomInterval(originalInterval, updates)

      expect(updatedInterval.name).toBe('Updated Name Only')
      // All other fields should remain unchanged
      expect(updatedInterval.workDuration).toBe(25)
      expect(updatedInterval.breakDuration).toBe(5)
      expect(updatedInterval.isActive).toBe(true)
      expect(updatedInterval.sessionMode).toBe('study')
    })
  })

  describe('transformCustomIntervalToApi helper function', () => {
    test('should transform CustomInterval model to API format', () => {
      const customInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Deep Work Session',
        workDuration: 90,
        breakDuration: 20,
        sessionMode: 'deepwork',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      const result = transformCustomIntervalToApi(customInterval)
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Deep Work Session',
        work_duration: 90,
        break_duration: 20,
        session_mode: 'deepwork',
        created_at: '2023-09-28T10:30:00.000Z',
        is_active: true,
      })
    })
  })

  describe('isIntervalForMode helper function', () => {
    test('should return true for matching session mode', () => {
      const customInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'Study Session',
        workDuration: 25,
        breakDuration: 5,
        sessionMode: 'study',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      expect(isIntervalForMode(customInterval, 'study')).toBe(true)
      expect(isIntervalForMode(customInterval, 'deepwork')).toBe(false)
    })
  })

  describe('getActiveIntervals helper function', () => {
    test('should return only active intervals', () => {
      const intervals: CustomInterval[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Active Interval 1',
          workDuration: 25,
          breakDuration: 5,
          sessionMode: 'study',
          createdAt: '2023-09-28T10:30:00.000Z',
          isActive: true,
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Inactive Interval',
          workDuration: 45,
          breakDuration: 15,
          sessionMode: 'deepwork',
          createdAt: '2023-09-28T11:30:00.000Z',
          isActive: false,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Active Interval 2',
          workDuration: 30,
          breakDuration: 10,
          sessionMode: 'yoga',
          createdAt: '2023-09-28T12:30:00.000Z',
          isActive: true,
        },
      ]

      const activeIntervals = getActiveIntervals(intervals)
      expect(activeIntervals).toHaveLength(2)
      expect(activeIntervals[0].name).toBe('Active Interval 1')
      expect(activeIntervals[1].name).toBe('Active Interval 2')
    })

    test('should return empty array when no active intervals', () => {
      const intervals: CustomInterval[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Inactive Interval',
          workDuration: 25,
          breakDuration: 5,
          sessionMode: 'study',
          createdAt: '2023-09-28T10:30:00.000Z',
          isActive: false,
        },
      ]

      const activeIntervals = getActiveIntervals(intervals)
      expect(activeIntervals).toHaveLength(0)
    })
  })

  describe('getIntervalsByMode helper function', () => {
    test('should return intervals matching session mode', () => {
      const intervals: CustomInterval[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Study Interval 1',
          workDuration: 25,
          breakDuration: 5,
          sessionMode: 'study',
          createdAt: '2023-09-28T10:30:00.000Z',
          isActive: true,
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Deep Work Interval',
          workDuration: 45,
          breakDuration: 15,
          sessionMode: 'deepwork',
          createdAt: '2023-09-28T11:30:00.000Z',
          isActive: true,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Study Interval 2',
          workDuration: 30,
          breakDuration: 10,
          sessionMode: 'study',
          createdAt: '2023-09-28T12:30:00.000Z',
          isActive: true,
        },
      ]

      const studyIntervals = getIntervalsByMode(intervals, 'study')
      expect(studyIntervals).toHaveLength(2)
      expect(studyIntervals[0].name).toBe('Study Interval 1')
      expect(studyIntervals[1].name).toBe('Study Interval 2')

      const deepworkIntervals = getIntervalsByMode(intervals, 'deepwork')
      expect(deepworkIntervals).toHaveLength(1)
      expect(deepworkIntervals[0].name).toBe('Deep Work Interval')

      const yogaIntervals = getIntervalsByMode(intervals, 'yoga')
      expect(yogaIntervals).toHaveLength(0)
    })
  })

  describe('sortIntervalsByCreated helper function', () => {
    test('should sort intervals by creation date (newest first)', () => {
      const intervals: CustomInterval[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Oldest Interval',
          workDuration: 25,
          breakDuration: 5,
          sessionMode: 'study',
          createdAt: '2023-09-28T10:30:00.000Z',
          isActive: true,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Newest Interval',
          workDuration: 30,
          breakDuration: 10,
          sessionMode: 'yoga',
          createdAt: '2023-09-28T12:30:00.000Z',
          isActive: true,
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
          name: 'Middle Interval',
          workDuration: 45,
          breakDuration: 15,
          sessionMode: 'deepwork',
          createdAt: '2023-09-28T11:30:00.000Z',
          isActive: true,
        },
      ]

      const sortedIntervals = sortIntervalsByCreated(intervals)
      expect(sortedIntervals).toHaveLength(3)
      expect(sortedIntervals[0].name).toBe('Newest Interval')
      expect(sortedIntervals[1].name).toBe('Middle Interval')
      expect(sortedIntervals[2].name).toBe('Oldest Interval')

      // Should not mutate original array
      expect(intervals[0].name).toBe('Oldest Interval')
    })
  })

  describe('validateDurationsForMode helper function', () => {
    test('should validate correct durations for all session modes', () => {
      const sessionModes: Array<'study' | 'deepwork' | 'yoga' | 'zen'> = [
        'study',
        'deepwork',
        'yoga',
        'zen',
      ]

      sessionModes.forEach((mode) => {
        expect(validateDurationsForMode(25, 5, mode)).toBe(true)
        expect(validateDurationsForMode(1, 0, mode)).toBe(true) // Minimum values
        expect(validateDurationsForMode(180, 60, mode)).toBe(true) // Maximum values
      })
    })

    test('should reject invalid work durations', () => {
      expect(validateDurationsForMode(0, 5, 'study')).toBe(false) // Below minimum
      expect(validateDurationsForMode(181, 5, 'study')).toBe(false) // Above maximum
    })

    test('should reject invalid break durations', () => {
      expect(validateDurationsForMode(25, -1, 'study')).toBe(false) // Below minimum
      expect(validateDurationsForMode(25, 61, 'study')).toBe(false) // Above maximum
    })
  })

  describe('TypeScript interface', () => {
    test('should enforce proper typing at compile time', () => {
      // This test validates TypeScript interface compliance
      const customInterval: CustomInterval = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '987fcdeb-51a2-43d4-8e5f-123456789abc',
        name: 'TypeScript Test',
        workDuration: 30,
        breakDuration: 10,
        sessionMode: 'deepwork',
        createdAt: '2023-09-28T10:30:00.000Z',
        isActive: true,
      }

      // These should compile without errors
      expect(typeof customInterval.id).toBe('string')
      expect(typeof customInterval.userId).toBe('string')
      expect(typeof customInterval.name).toBe('string')
      expect(typeof customInterval.workDuration).toBe('number')
      expect(typeof customInterval.breakDuration).toBe('number')
      expect(typeof customInterval.sessionMode).toBe('string')
      expect(typeof customInterval.createdAt).toBe('string')
      expect(typeof customInterval.isActive).toBe('boolean')

      // SessionMode should be one of the valid values
      const validModes: Array<CustomInterval['sessionMode']> = ['study', 'deepwork', 'yoga', 'zen']
      expect(validModes).toContain(customInterval.sessionMode)
    })
  })
})
