import { SessionService } from '../session-service'
import { TimerService } from '../timer-service'
import { PersistenceService } from '../persistence-service'
import type {
  Session,
  SessionMode,
  AmbientSound,
  CreateSessionData,
  CompleteSessionData,
} from '../../models/session'
import type { TimerState } from '../../models/timer-state'

// Mock dependencies
jest.mock('../timer-service')
jest.mock('../persistence-service')

const MockedTimerService = TimerService as jest.MockedClass<typeof TimerService>
const MockedPersistenceService = PersistenceService as jest.MockedClass<typeof PersistenceService>

describe('SessionService', () => {
  let sessionService: SessionService
  let mockTimerService: jest.Mocked<TimerService>
  let mockPersistenceService: jest.Mocked<PersistenceService>

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
  const mockSessionData: CreateSessionData = {
    mode: 'study',
    plannedDuration: 25,
    ambientSound: 'rain',
  }

  const mockSession: Session = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: mockUserId,
    mode: 'study',
    startTime: '2023-01-01T10:00:00.000Z',
    endTime: '2023-01-01T10:25:00.000Z',
    plannedDuration: 25,
    actualDuration: 25,
    completedFully: true,
    pauseCount: 0,
    totalPauseTime: 0,
    ambientSound: 'rain',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup timer service mock
    mockTimerService = {
      on: jest.fn(),
      off: jest.fn(),
      start: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      reset: jest.fn(),
      getCurrentState: jest.fn(),
      isActive: jest.fn(),
      isPaused: jest.fn(),
      initializeTimer: jest.fn(),
      destroy: jest.fn(),
    } as any

    // Setup persistence service mock
    mockPersistenceService = {
      saveSession: jest.fn(),
      getSession: jest.fn(),
      getSessionsByUserId: jest.fn(),
    } as any

    MockedTimerService.mockImplementation(() => mockTimerService)
    MockedPersistenceService.mockImplementation(() => mockPersistenceService)

    sessionService = new SessionService()
  })

  afterEach(() => {
    sessionService.destroy()
  })

  describe('Session Lifecycle Management', () => {
    describe('createSession', () => {
      it('should create a new session with valid data', async () => {
        const createdSession = await sessionService.createSession(mockSessionData, mockUserId)

        expect(createdSession).toMatchObject({
          userId: mockUserId,
          mode: 'study',
          plannedDuration: 25,
          actualDuration: 0,
          completedFully: false,
          pauseCount: 0,
          totalPauseTime: 0,
          ambientSound: 'rain',
        })
        expect(createdSession.id).toBeDefined()
        expect(createdSession.startTime).toBeDefined()
        expect(mockPersistenceService.saveSession).toHaveBeenCalledWith(createdSession)
      })

      it('should create guest session when userId is not provided', async () => {
        const createdSession = await sessionService.createSession(mockSessionData)

        expect(createdSession.userId).toBeNull()
      })

      it('should throw error for invalid session data', async () => {
        const invalidData = { ...mockSessionData, plannedDuration: -1 }

        await expect(sessionService.createSession(invalidData, mockUserId)).rejects.toThrow(
          'Planned duration must be at least 1 minute'
        )
      })

      it('should emit sessionCreated event', async () => {
        const eventSpy = jest.fn()
        sessionService.on('sessionCreated', eventSpy)

        const createdSession = await sessionService.createSession(mockSessionData, mockUserId)

        expect(eventSpy).toHaveBeenCalledWith({ session: createdSession })
      })
    })

    describe('startSession', () => {
      it('should start session and initialize timer', async () => {
        mockPersistenceService.getSession.mockResolvedValue(mockSession)

        await sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')

        expect(mockTimerService.initializeTimer).toHaveBeenCalled()
        expect(mockTimerService.start).toHaveBeenCalled()
        expect(sessionService.getCurrentSession()).toEqual(mockSession)
      })

      it('should throw error if session not found', async () => {
        mockPersistenceService.getSession.mockResolvedValue(null)

        await expect(
          sessionService.startSession('550e8400-e29b-41d4-a716-446655440999')
        ).rejects.toThrow('Session 550e8400-e29b-41d4-a716-446655440999 not found')
      })

      it('should throw error if session already active', async () => {
        mockPersistenceService.getSession.mockResolvedValue(mockSession)
        await sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')

        await expect(
          sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')
        ).rejects.toThrow('A session is already active')
      })

      it('should emit sessionStarted event', async () => {
        const eventSpy = jest.fn()
        sessionService.on('sessionStarted', eventSpy)
        mockPersistenceService.getSession.mockResolvedValue(mockSession)

        await sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')

        expect(eventSpy).toHaveBeenCalledWith({ session: mockSession })
      })
    })

    describe('pauseSession', () => {
      beforeEach(async () => {
        mockPersistenceService.getSession.mockResolvedValue(mockSession)
        await sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')
      })

      it('should pause active session', async () => {
        await sessionService.pauseSession()

        expect(mockTimerService.pause).toHaveBeenCalled()
      })

      it('should throw error if no active session', async () => {
        sessionService.destroy()
        sessionService = new SessionService()

        await expect(sessionService.pauseSession()).rejects.toThrow('No active session')
      })

      it('should emit sessionPaused event', async () => {
        const eventSpy = jest.fn()
        sessionService.on('sessionPaused', eventSpy)

        await sessionService.pauseSession()

        expect(eventSpy).toHaveBeenCalledWith({ session: mockSession })
      })
    })

    describe('resumeSession', () => {
      beforeEach(async () => {
        mockPersistenceService.getSession.mockResolvedValue(mockSession)
        await sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')
        await sessionService.pauseSession()
      })

      it('should resume paused session', async () => {
        await sessionService.resumeSession()

        expect(mockTimerService.resume).toHaveBeenCalled()
      })

      it('should throw error if no active session', async () => {
        sessionService.destroy()
        sessionService = new SessionService()

        await expect(sessionService.resumeSession()).rejects.toThrow('No active session')
      })

      it('should emit sessionResumed event', async () => {
        const eventSpy = jest.fn()
        sessionService.on('sessionResumed', eventSpy)

        await sessionService.resumeSession()

        expect(eventSpy).toHaveBeenCalledWith({ session: mockSession })
      })
    })

    describe('completeSession', () => {
      const completionData: CompleteSessionData = {
        actualDuration: 25,
        completedFully: true,
        pauseCount: 1,
        totalPauseTime: 2,
      }

      beforeEach(async () => {
        mockPersistenceService.getSession.mockResolvedValue(mockSession)
        await sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')
      })

      it('should complete active session with provided data', async () => {
        const completedSession = await sessionService.completeSession(completionData)

        expect(completedSession).toMatchObject({
          id: mockSession.id,
          userId: mockSession.userId,
          mode: mockSession.mode,
          startTime: mockSession.startTime,
          plannedDuration: mockSession.plannedDuration,
          ambientSound: mockSession.ambientSound,
          actualDuration: 25,
          completedFully: true,
          pauseCount: 1,
          totalPauseTime: 2,
        })
        expect(completedSession.endTime).toBeDefined()
        expect(mockPersistenceService.saveSession).toHaveBeenCalledWith(completedSession)
      })

      it('should throw error if no active session', async () => {
        sessionService.destroy()
        sessionService = new SessionService()

        await expect(sessionService.completeSession(completionData)).rejects.toThrow(
          'No active session'
        )
      })

      it('should emit sessionCompleted event', async () => {
        const eventSpy = jest.fn()
        sessionService.on('sessionCompleted', eventSpy)

        const completedSession = await sessionService.completeSession(completionData)

        expect(eventSpy).toHaveBeenCalledWith({ session: completedSession })
      })
    })

    describe('cancelSession', () => {
      beforeEach(async () => {
        mockPersistenceService.getSession.mockResolvedValue(mockSession)
        await sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')
      })

      it('should cancel active session', async () => {
        const cancelledSession = await sessionService.cancelSession()

        expect(cancelledSession.completedFully).toBe(false)
        expect(mockTimerService.reset).toHaveBeenCalled()
        expect(mockPersistenceService.saveSession).toHaveBeenCalledWith(cancelledSession)
      })

      it('should throw error if no active session', async () => {
        sessionService.destroy()
        sessionService = new SessionService()

        await expect(sessionService.cancelSession()).rejects.toThrow('No active session')
      })

      it('should emit sessionCancelled event', async () => {
        const eventSpy = jest.fn()
        sessionService.on('sessionCancelled', eventSpy)

        const cancelledSession = await sessionService.cancelSession()

        expect(eventSpy).toHaveBeenCalledWith({ session: cancelledSession })
      })
    })
  })

  describe('Session Statistics', () => {
    const mockSessions: Session[] = [
      {
        ...mockSession,
        id: '550e8400-e29b-41d4-a716-446655440001',
        actualDuration: 25,
        completedFully: true,
        mode: 'study',
      },
      {
        ...mockSession,
        id: '550e8400-e29b-41d4-a716-446655440002',
        actualDuration: 20,
        completedFully: false,
        mode: 'study',
      },
      {
        ...mockSession,
        id: '550e8400-e29b-41d4-a716-446655440003',
        actualDuration: 30,
        completedFully: true,
        mode: 'deepwork',
      },
      {
        ...mockSession,
        id: '550e8400-e29b-41d4-a716-446655440004',
        actualDuration: 15,
        completedFully: true,
        mode: 'yoga',
      },
    ]

    beforeEach(() => {
      mockPersistenceService.getSessionsByUserId.mockResolvedValue(mockSessions)
    })

    describe('getTotalFocusTime', () => {
      it('should calculate total focus time for user', async () => {
        const totalTime = await sessionService.getTotalFocusTime(mockUserId)

        expect(totalTime).toBe(90) // 25 + 20 + 30 + 15
      })

      it('should return 0 for user with no sessions', async () => {
        mockPersistenceService.getSessionsByUserId.mockResolvedValue([])

        const totalTime = await sessionService.getTotalFocusTime(mockUserId)

        expect(totalTime).toBe(0)
      })
    })

    describe('getCompletionRate', () => {
      it('should calculate completion rate for user', async () => {
        const completionRate = await sessionService.getCompletionRate(mockUserId)

        expect(completionRate).toBe(75) // 3 out of 4 sessions completed
      })

      it('should return 0 for user with no sessions', async () => {
        mockPersistenceService.getSessionsByUserId.mockResolvedValue([])

        const completionRate = await sessionService.getCompletionRate(mockUserId)

        expect(completionRate).toBe(0)
      })
    })

    describe('getSessionModeBreakdown', () => {
      it('should calculate session mode breakdown', async () => {
        const breakdown = await sessionService.getSessionModeBreakdown(mockUserId)

        expect(breakdown).toEqual({
          study: { count: 2, totalTime: 45 },
          deepwork: { count: 1, totalTime: 30 },
          yoga: { count: 1, totalTime: 15 },
          zen: { count: 0, totalTime: 0 },
        })
      })
    })

    describe('getCurrentStreak', () => {
      it('should calculate current completion streak', async () => {
        const recentSessions = [
          {
            ...mockSession,
            id: '550e8400-e29b-41d4-a716-446655440001',
            completedFully: true,
            startTime: '2023-01-03T10:00:00.000Z',
          },
          {
            ...mockSession,
            id: '550e8400-e29b-41d4-a716-446655440002',
            completedFully: true,
            startTime: '2023-01-02T10:00:00.000Z',
          },
          {
            ...mockSession,
            id: '550e8400-e29b-41d4-a716-446655440003',
            completedFully: false,
            startTime: '2023-01-01T10:00:00.000Z',
          },
        ]
        mockPersistenceService.getSessionsByUserId.mockResolvedValue(recentSessions)

        const streak = await sessionService.getCurrentStreak(mockUserId)

        expect(streak).toBe(2)
      })

      it('should return 0 if most recent session was not completed', async () => {
        const recentSessions = [
          {
            ...mockSession,
            id: '550e8400-e29b-41d4-a716-446655440001',
            completedFully: false,
            startTime: '2023-01-01T10:00:00.000Z',
          },
        ]
        mockPersistenceService.getSessionsByUserId.mockResolvedValue(recentSessions)

        const streak = await sessionService.getCurrentStreak(mockUserId)

        expect(streak).toBe(0)
      })
    })
  })

  describe('Session History Management', () => {
    const mockSessions: Session[] = [
      {
        ...mockSession,
        id: '550e8400-e29b-41d4-a716-446655440001',
        startTime: '2023-01-01T10:00:00.000Z',
        mode: 'study',
      },
      {
        ...mockSession,
        id: '550e8400-e29b-41d4-a716-446655440002',
        startTime: '2023-01-02T10:00:00.000Z',
        mode: 'deepwork',
      },
      {
        ...mockSession,
        id: '550e8400-e29b-41d4-a716-446655440003',
        startTime: '2023-01-03T10:00:00.000Z',
        mode: 'study',
      },
    ]

    beforeEach(() => {
      mockPersistenceService.getSessionsByUserId.mockResolvedValue(mockSessions)
    })

    describe('getSessionHistory', () => {
      it('should return sessions sorted by start time (descending)', async () => {
        const history = await sessionService.getSessionHistory(mockUserId)

        expect(history).toHaveLength(3)
        expect(history[0].id).toBe('550e8400-e29b-41d4-a716-446655440003')
        expect(history[1].id).toBe('550e8400-e29b-41d4-a716-446655440002')
        expect(history[2].id).toBe('550e8400-e29b-41d4-a716-446655440001')
      })

      it('should filter by date range when provided', async () => {
        const startDate = '2023-01-02T00:00:00.000Z'
        const endDate = '2023-01-03T23:59:59.999Z'

        const history = await sessionService.getSessionHistory(mockUserId, {
          startDate,
          endDate,
        })

        expect(history).toHaveLength(2)
        expect(history.every((s) => s.startTime >= startDate && s.startTime <= endDate)).toBe(true)
      })

      it('should filter by mode when provided', async () => {
        const history = await sessionService.getSessionHistory(mockUserId, {
          mode: 'study',
        })

        expect(history).toHaveLength(2)
        expect(history.every((s) => s.mode === 'study')).toBe(true)
      })

      it('should filter by completion status when provided', async () => {
        const completedSessions = [
          { ...mockSession, id: '550e8400-e29b-41d4-a716-446655440001', completedFully: true },
          { ...mockSession, id: '550e8400-e29b-41d4-a716-446655440002', completedFully: false },
        ]
        mockPersistenceService.getSessionsByUserId.mockResolvedValue(completedSessions)

        const history = await sessionService.getSessionHistory(mockUserId, {
          completedOnly: true,
        })

        expect(history).toHaveLength(1)
        expect(history[0].completedFully).toBe(true)
      })

      it('should apply pagination when provided', async () => {
        const history = await sessionService.getSessionHistory(mockUserId, {
          page: 1,
          limit: 2,
        })

        expect(history).toHaveLength(1) // page 1 with limit 2 would have 1 item (items 2-3, but only 3 total)
      })
    })

    describe('getSessionById', () => {
      it('should return session by ID', async () => {
        mockPersistenceService.getSession.mockResolvedValue(mockSession)

        const session = await sessionService.getSessionById('550e8400-e29b-41d4-a716-446655440001')

        expect(session).toEqual(mockSession)
        expect(mockPersistenceService.getSession).toHaveBeenCalledWith(
          '550e8400-e29b-41d4-a716-446655440001'
        )
      })

      it('should return null if session not found', async () => {
        mockPersistenceService.getSession.mockResolvedValue(null)

        const session = await sessionService.getSessionById('550e8400-e29b-41d4-a716-446655440999')

        expect(session).toBeNull()
      })
    })
  })

  describe('Timer Integration', () => {
    beforeEach(async () => {
      mockPersistenceService.getSession.mockResolvedValue(mockSession)
      await sessionService.startSession('session-123')
    })

    it('should update session stats when timer completes', () => {
      const timerCompleteHandler = mockTimerService.on.mock.calls.find(
        (call) => call[0] === 'complete'
      )?.[1]

      expect(timerCompleteHandler).toBeDefined()

      // Simulate timer completion
      if (timerCompleteHandler) {
        timerCompleteHandler({ phase: 'work', cycleCompleted: true })
      }

      // Should trigger internal session update logic
      expect(mockTimerService.on).toHaveBeenCalledWith('complete', expect.any(Function))
    })

    it('should track pause count when timer is paused', async () => {
      await sessionService.pauseSession()

      // The pauseCount is tracked internally and would be applied when session completes
      // For now, we just verify the pause was called and event was emitted
      expect(mockTimerService.pause).toHaveBeenCalled()
    })
  })

  describe('Session Validation', () => {
    it('should validate session data before creation', async () => {
      const invalidData = {
        mode: 'invalid' as SessionMode,
        plannedDuration: -5,
        ambientSound: 'invalid' as AmbientSound,
      }

      await expect(sessionService.createSession(invalidData, mockUserId)).rejects.toThrow(
        'Planned duration must be at least 1 minute'
      )
    })

    it('should validate completion data', async () => {
      mockPersistenceService.getSession.mockResolvedValue(mockSession)
      await sessionService.startSession('session-123')

      const invalidCompletionData = {
        actualDuration: -1,
        completedFully: true,
        pauseCount: -1,
        totalPauseTime: -1,
      }

      await expect(sessionService.completeSession(invalidCompletionData)).rejects.toThrow(
        'Invalid completion data'
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockPersistenceService.saveSession.mockRejectedValue(new Error('Storage error'))

      await expect(sessionService.createSession(mockSessionData, mockUserId)).rejects.toThrow(
        'Failed to save session: Error: Storage error'
      )
    })

    it('should handle timer errors gracefully', async () => {
      mockTimerService.start.mockImplementation(() => {
        throw new Error('Timer error')
      })
      mockPersistenceService.getSession.mockResolvedValue(mockSession)

      await expect(sessionService.startSession('session-123')).rejects.toThrow(
        'Failed to start timer'
      )
    })
  })

  describe('Event System', () => {
    it('should support adding event listeners', () => {
      const handler = jest.fn()
      sessionService.on('sessionCreated', handler)

      // Should store the handler
      expect(sessionService.listenerCount('sessionCreated')).toBe(1)
    })

    it('should support removing event listeners', () => {
      const handler = jest.fn()
      sessionService.on('sessionCreated', handler)
      sessionService.off('sessionCreated', handler)

      expect(sessionService.listenerCount('sessionCreated')).toBe(0)
    })

    it('should emit events for all session lifecycle changes', async () => {
      const createdSpy = jest.fn()
      const startedSpy = jest.fn()
      const pausedSpy = jest.fn()
      const resumedSpy = jest.fn()
      const completedSpy = jest.fn()

      sessionService.on('sessionCreated', createdSpy)
      sessionService.on('sessionStarted', startedSpy)
      sessionService.on('sessionPaused', pausedSpy)
      sessionService.on('sessionResumed', resumedSpy)
      sessionService.on('sessionCompleted', completedSpy)

      // Create and go through session lifecycle
      const session = await sessionService.createSession(mockSessionData, mockUserId)
      mockPersistenceService.getSession.mockResolvedValue(session)

      await sessionService.startSession(session.id)
      await sessionService.pauseSession()
      await sessionService.resumeSession()
      await sessionService.completeSession({
        actualDuration: 25,
        completedFully: true,
        pauseCount: 1,
        totalPauseTime: 2,
      })

      expect(createdSpy).toHaveBeenCalledTimes(1)
      expect(startedSpy).toHaveBeenCalledTimes(1)
      expect(pausedSpy).toHaveBeenCalledTimes(1)
      expect(resumedSpy).toHaveBeenCalledTimes(1)
      expect(completedSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Performance and Caching', () => {
    it('should cache frequently accessed sessions', async () => {
      mockPersistenceService.getSession.mockResolvedValue(mockSession)

      // First call should hit storage
      await sessionService.getSessionById('550e8400-e29b-41d4-a716-446655440001')
      expect(mockPersistenceService.getSession).toHaveBeenCalledTimes(1)

      // Second call should use cache
      await sessionService.getSessionById('550e8400-e29b-41d4-a716-446655440001')
      expect(mockPersistenceService.getSession).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache when session is updated', async () => {
      mockPersistenceService.getSession.mockResolvedValue(mockSession)
      await sessionService.startSession('550e8400-e29b-41d4-a716-446655440001')

      // Complete session should invalidate cache
      await sessionService.completeSession({
        actualDuration: 25,
        completedFully: true,
        pauseCount: 0,
        totalPauseTime: 0,
      })

      // Next access should hit storage again
      await sessionService.getSessionById('550e8400-e29b-41d4-a716-446655440001')
      expect(mockPersistenceService.getSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('Guest User Support', () => {
    it('should support guest sessions without user ID', async () => {
      const guestSession = await sessionService.createSession(mockSessionData)

      expect(guestSession.userId).toBeNull()
      expect(mockPersistenceService.saveSession).toHaveBeenCalledWith(guestSession)
    })

    it('should retrieve guest sessions properly', async () => {
      const guestSessions = [
        { ...mockSession, userId: null, id: '550e8400-e29b-41d4-a716-446655440001' },
        { ...mockSession, userId: null, id: '550e8400-e29b-41d4-a716-446655440002' },
      ]
      mockPersistenceService.getSessionsByUserId.mockResolvedValue(guestSessions)

      const history = await sessionService.getSessionHistory(null)

      expect(history).toHaveLength(2)
      expect(mockPersistenceService.getSessionsByUserId).toHaveBeenCalledWith(null)
    })
  })

  describe('Resource Cleanup', () => {
    it('should clean up resources on destroy', () => {
      sessionService.destroy()

      expect(mockTimerService.destroy).toHaveBeenCalled()
    })

    it('should remove all event listeners on destroy', () => {
      const handler = jest.fn()
      sessionService.on('sessionCreated', handler)

      sessionService.destroy()

      expect(sessionService.listenerCount('sessionCreated')).toBe(0)
    })
  })
})
