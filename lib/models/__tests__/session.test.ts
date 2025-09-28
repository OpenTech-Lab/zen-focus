import { describe, expect, test } from '@jest/globals'
import {
  Session,
  SessionSchema,
  SessionMode,
  AmbientSound,
  createSession,
  completeSession,
  validateSession,
  transformSessionFromApi,
  transformSessionToApi,
  calculateActualDuration,
  isGuestSession,
  getSessionEfficiency,
} from '../session'

describe('Session Data Model', () => {
  describe('SessionSchema validation', () => {
    test('should validate a valid session object', () => {
      const validSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 25,
        completedFully: false,
        pauseCount: 2,
        totalPauseTime: 5,
        ambientSound: 'rain' as AmbientSound,
        notes: 'Good focus session',
      }

      const result = SessionSchema.safeParse(validSession)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validSession)
      }
    })

    test('should validate session with null userId (guest session)', () => {
      const guestSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: null,
        mode: 'zen' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'forest' as AmbientSound,
      }

      const result = SessionSchema.safeParse(guestSession)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(guestSession)
      }
    })

    test('should validate session with null notes', () => {
      const sessionWithNullNotes = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'deepwork' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'silence' as AmbientSound,
        notes: null,
      }

      const result = SessionSchema.safeParse(sessionWithNullNotes)
      expect(result.success).toBe(true)
    })

    test('should reject invalid UUID for id', () => {
      const invalidSession = {
        id: 'invalid-uuid',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject invalid UUID for userId', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'invalid-uuid',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject invalid session mode', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'invalid-mode',
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject invalid ambient sound', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'invalid-sound',
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject invalid ISO datetime for startTime', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: 'invalid-date',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject invalid ISO datetime for endTime', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: 'invalid-date',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject plannedDuration less than 1', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 0,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject negative actualDuration', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: -5,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject negative pauseCount', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: -1,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject negative totalPauseTime', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: -5,
        ambientSound: 'rain' as AmbientSound,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should reject notes longer than 500 characters', () => {
      const longNotes = 'a'.repeat(501)
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
        notes: longNotes,
      }

      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    test('should accept notes with exactly 500 characters', () => {
      const maxLengthNotes = 'a'.repeat(500)
      const validSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
        notes: maxLengthNotes,
      }

      const result = SessionSchema.safeParse(validSession)
      expect(result.success).toBe(true)
    })

    test('should reject missing required fields', () => {
      const incompleteSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        mode: 'study' as SessionMode,
        // Missing many required fields
      }

      const result = SessionSchema.safeParse(incompleteSession)
      expect(result.success).toBe(false)
    })
  })

  describe('createSession helper function', () => {
    test('should create a valid authenticated session', () => {
      const userId = '456e7890-e89b-12d3-a456-426614174001'
      const sessionData = {
        mode: 'study' as SessionMode,
        plannedDuration: 30,
        ambientSound: 'rain' as AmbientSound,
      }

      const session = createSession(sessionData, userId)

      expect(session.userId).toBe(userId)
      expect(session.mode).toBe('study')
      expect(session.plannedDuration).toBe(30)
      expect(session.ambientSound).toBe('rain')
      expect(session.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      expect(new Date(session.startTime)).toBeInstanceOf(Date)
      expect(session.actualDuration).toBe(0)
      expect(session.completedFully).toBe(false)
      expect(session.pauseCount).toBe(0)
      expect(session.totalPauseTime).toBe(0)
      expect(session.notes).toBeUndefined()
    })

    test('should create a valid guest session', () => {
      const sessionData = {
        mode: 'zen' as SessionMode,
        plannedDuration: 45,
        ambientSound: 'forest' as AmbientSound,
      }

      const session = createSession(sessionData)

      expect(session.userId).toBeNull()
      expect(session.mode).toBe('zen')
      expect(session.plannedDuration).toBe(45)
      expect(session.ambientSound).toBe('forest')
    })

    test('should create different session IDs for different sessions', () => {
      const sessionData = {
        mode: 'study' as SessionMode,
        plannedDuration: 30,
        ambientSound: 'rain' as AmbientSound,
      }

      const session1 = createSession(sessionData)
      const session2 = createSession(sessionData)

      expect(session1.id).not.toBe(session2.id)
    })
  })

  describe('completeSession helper function', () => {
    test('should complete a session with all data', () => {
      const originalSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T10:30:00.000Z', // Will be updated
        plannedDuration: 30,
        actualDuration: 0, // Will be updated
        completedFully: false, // Will be updated
        pauseCount: 0, // Will be updated
        totalPauseTime: 0, // Will be updated
        ambientSound: 'rain' as AmbientSound,
      }

      const completionData = {
        actualDuration: 25,
        completedFully: false,
        pauseCount: 2,
        totalPauseTime: 5,
        notes: 'Good session with some interruptions',
      }

      const completedSession = completeSession(originalSession, completionData)

      expect(completedSession.actualDuration).toBe(25)
      expect(completedSession.completedFully).toBe(false)
      expect(completedSession.pauseCount).toBe(2)
      expect(completedSession.totalPauseTime).toBe(5)
      expect(completedSession.notes).toBe('Good session with some interruptions')
      expect(new Date(completedSession.endTime)).toBeInstanceOf(Date)
      // Other fields should remain unchanged
      expect(completedSession.id).toBe(originalSession.id)
      expect(completedSession.mode).toBe(originalSession.mode)
      expect(completedSession.plannedDuration).toBe(originalSession.plannedDuration)
    })

    test('should complete a session without optional notes', () => {
      const originalSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: null,
        mode: 'zen' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T10:30:00.000Z',
        plannedDuration: 30,
        actualDuration: 0,
        completedFully: false,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'forest' as AmbientSound,
      }

      const completionData = {
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
      }

      const completedSession = completeSession(originalSession, completionData)

      expect(completedSession.actualDuration).toBe(30)
      expect(completedSession.completedFully).toBe(true)
      expect(completedSession.pauseCount).toBe(0)
      expect(completedSession.totalPauseTime).toBe(0)
      expect(completedSession.notes).toBeUndefined()
    })
  })

  describe('calculateActualDuration helper function', () => {
    test('should calculate duration from start and end times', () => {
      const startTime = '2023-09-28T10:30:00.000Z'
      const endTime = '2023-09-28T11:00:00.000Z'

      const duration = calculateActualDuration(startTime, endTime)
      expect(duration).toBe(30) // 30 minutes
    })

    test('should handle durations less than a minute', () => {
      const startTime = '2023-09-28T10:30:00.000Z'
      const endTime = '2023-09-28T10:30:30.000Z'

      const duration = calculateActualDuration(startTime, endTime)
      expect(duration).toBe(1) // Should round up to 1 minute
    })

    test('should handle zero duration', () => {
      const startTime = '2023-09-28T10:30:00.000Z'
      const endTime = '2023-09-28T10:30:00.000Z'

      const duration = calculateActualDuration(startTime, endTime)
      expect(duration).toBe(0)
    })
  })

  describe('isGuestSession helper function', () => {
    test('should return true for guest session', () => {
      const guestSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: null,
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      expect(isGuestSession(guestSession)).toBe(true)
    })

    test('should return false for authenticated session', () => {
      const authSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      expect(isGuestSession(authSession)).toBe(false)
    })
  })

  describe('getSessionEfficiency helper function', () => {
    test('should calculate efficiency for completed session', () => {
      const session = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 25,
        completedFully: false,
        pauseCount: 2,
        totalPauseTime: 5,
        ambientSound: 'rain' as AmbientSound,
      }

      const efficiency = getSessionEfficiency(session)
      expect(efficiency).toBeCloseTo(83.33, 2) // (25/30) * 100
    })

    test('should return 100% efficiency for fully completed session', () => {
      const session = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const efficiency = getSessionEfficiency(session)
      expect(efficiency).toBe(100)
    })

    test('should handle sessions that exceeded planned duration', () => {
      const session = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:05:00.000Z',
        plannedDuration: 30,
        actualDuration: 35,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain' as AmbientSound,
      }

      const efficiency = getSessionEfficiency(session)
      expect(efficiency).toBe(100) // Should cap at 100%
    })
  })

  describe('validateSession helper function', () => {
    test('should return valid session when input is correct', () => {
      const validInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study',
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'rain',
      }

      const result = validateSession(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInput)
      }
    })

    test('should return error details when input is invalid', () => {
      const invalidInput = {
        id: 'invalid-uuid',
        userId: 'invalid-uuid',
        mode: 'invalid-mode',
        startTime: 'invalid-date',
        endTime: 'invalid-date',
        plannedDuration: 0,
        actualDuration: -5,
        completedFully: 'not-boolean',
        pauseCount: -1,
        totalPauseTime: -1,
        ambientSound: 'invalid-sound',
      }

      const result = validateSession(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe('transformSessionFromApi helper function', () => {
    test('should transform API response to Session model', () => {
      const apiResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study',
        start_time: '2023-09-28T10:30:00.000Z',
        end_time: '2023-09-28T11:00:00.000Z',
        planned_duration: 30,
        actual_duration: 25,
        completed_fully: false,
        pause_count: 2,
        total_pause_time: 5,
        ambient_sound: 'rain',
        notes: 'Good session',
      }

      const result = transformSessionFromApi(apiResponse)
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study',
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 25,
        completedFully: false,
        pauseCount: 2,
        totalPauseTime: 5,
        ambientSound: 'rain',
        notes: 'Good session',
      })
    })

    test('should handle guest session from API', () => {
      const apiResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        mode: 'zen',
        start_time: '2023-09-28T10:30:00.000Z',
        end_time: '2023-09-28T11:00:00.000Z',
        planned_duration: 30,
        actual_duration: 30,
        completed_fully: true,
        pause_count: 0,
        total_pause_time: 0,
        ambient_sound: 'forest',
        notes: null,
      }

      const result = transformSessionFromApi(apiResponse)
      expect(result.userId).toBeNull()
      expect(result.notes).toBeNull()
    })
  })

  describe('transformSessionToApi helper function', () => {
    test('should transform Session model to API format', () => {
      const session = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 25,
        completedFully: false,
        pauseCount: 2,
        totalPauseTime: 5,
        ambientSound: 'rain' as AmbientSound,
        notes: 'Good session',
      }

      const result = transformSessionToApi(session)
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study',
        start_time: '2023-09-28T10:30:00.000Z',
        end_time: '2023-09-28T11:00:00.000Z',
        planned_duration: 30,
        actual_duration: 25,
        completed_fully: false,
        pause_count: 2,
        total_pause_time: 5,
        ambient_sound: 'rain',
        notes: 'Good session',
      })
    })

    test('should handle guest session transformation to API', () => {
      const session = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: null,
        mode: 'zen' as SessionMode,
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 30,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
        ambientSound: 'forest' as AmbientSound,
      }

      const result = transformSessionToApi(session)
      expect(result.user_id).toBeNull()
      expect(result.notes).toBeUndefined()
    })
  })

  describe('TypeScript interface', () => {
    test('should enforce proper typing at compile time', () => {
      // This test validates TypeScript interface compliance
      const session: Session = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174001',
        mode: 'study',
        startTime: '2023-09-28T10:30:00.000Z',
        endTime: '2023-09-28T11:00:00.000Z',
        plannedDuration: 30,
        actualDuration: 25,
        completedFully: false,
        pauseCount: 2,
        totalPauseTime: 5,
        ambientSound: 'rain',
        notes: 'Good session',
      }

      // These should compile without errors
      expect(typeof session.id).toBe('string')
      expect(typeof session.mode).toBe('string')
      expect(typeof session.startTime).toBe('string')
      expect(typeof session.endTime).toBe('string')
      expect(typeof session.plannedDuration).toBe('number')
      expect(typeof session.actualDuration).toBe('number')
      expect(typeof session.completedFully).toBe('boolean')
      expect(typeof session.pauseCount).toBe('number')
      expect(typeof session.totalPauseTime).toBe('number')
      expect(typeof session.ambientSound).toBe('string')

      // Optional fields
      if (session.userId) {
        expect(typeof session.userId).toBe('string')
      }
      if (session.notes) {
        expect(typeof session.notes).toBe('string')
      }
    })
  })
})
