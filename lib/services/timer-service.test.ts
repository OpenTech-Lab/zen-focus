import {
  TimerService,
  type TimerEventHandler,
  type TimerEvents,
  TimerServiceError,
  TimerError,
} from './timer-service'
import { TimerState, type SessionMode } from '../models/timer-state'
import { SessionMode as SessionModeConfig, createDefaultSessionModes } from '../models/session-mode'

describe('TimerService', () => {
  let timerService: TimerService
  let sessionModes: SessionModeConfig[]
  let mockPerformanceNow: jest.MockedFunction<typeof performance.now>
  let mockRequestAnimationFrame: jest.MockedFunction<typeof requestAnimationFrame>
  let mockCancelAnimationFrame: jest.MockedFunction<typeof cancelAnimationFrame>

  beforeEach(() => {
    sessionModes = createDefaultSessionModes()

    // Mock performance.now for precise timing control
    mockPerformanceNow = jest.fn()
    global.performance.now = mockPerformanceNow

    // Mock animation frame functions
    mockRequestAnimationFrame = jest.fn()
    mockCancelAnimationFrame = jest.fn()
    global.requestAnimationFrame = mockRequestAnimationFrame
    global.cancelAnimationFrame = mockCancelAnimationFrame

    // Initialize with current timestamp
    mockPerformanceNow.mockReturnValue(1000)

    timerService = new TimerService()
  })

  afterEach(() => {
    timerService.destroy()
    jest.restoreAllMocks()
  })

  describe('Timer Initialization', () => {
    it('should initialize with default inactive state', () => {
      expect(timerService.isActive()).toBe(false)
      expect(timerService.isPaused()).toBe(false)
      expect(timerService.getCurrentState()).toEqual({
        isActive: false,
        isPaused: false,
        mode: 'study',
        phase: 'work',
        timeRemaining: 0,
        totalElapsed: 0,
        currentCycle: 1,
      })
    })

    it('should initialize timer with session mode configuration', () => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)

      const state = timerService.getCurrentState()
      expect(state.mode).toBe('study')
      expect(state.timeRemaining).toBe(studyMode.defaultWorkDuration * 60)
      expect(state.phase).toBe('work')
    })

    it('should throw error for invalid session mode', () => {
      expect(() => {
        timerService.initializeTimer('invalid' as SessionMode, sessionModes[0])
      }).toThrow(TimerServiceError)
    })
  })

  describe('Timer Controls', () => {
    beforeEach(() => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)
    })

    it('should start timer successfully', () => {
      timerService.start()

      expect(timerService.isActive()).toBe(true)
      expect(timerService.isPaused()).toBe(false)
    })

    it('should throw error when starting already active timer', () => {
      timerService.start()

      expect(() => timerService.start()).toThrow(TimerError)
    })

    it('should pause active timer', () => {
      timerService.start()
      timerService.pause()

      expect(timerService.isActive()).toBe(false)
      expect(timerService.isPaused()).toBe(true)
    })

    it('should throw error when pausing inactive timer', () => {
      expect(() => timerService.pause()).toThrow(TimerError)
    })

    it('should resume paused timer', () => {
      timerService.start()
      timerService.pause()
      timerService.resume()

      expect(timerService.isActive()).toBe(true)
      expect(timerService.isPaused()).toBe(false)
    })

    it('should throw error when resuming non-paused timer', () => {
      expect(() => timerService.resume()).toThrow(TimerError)
    })

    it('should reset timer to initial state', () => {
      timerService.start()
      mockPerformanceNow.mockReturnValue(2000)

      timerService.reset()

      const state = timerService.getCurrentState()
      expect(state.isActive).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.totalElapsed).toBe(0)
      expect(state.currentCycle).toBe(1)
    })
  })

  describe('High-Precision Timing', () => {
    beforeEach(() => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)
    })

    it('should use performance.now() for precision timing', () => {
      timerService.start()

      expect(mockPerformanceNow).toHaveBeenCalled()
    })

    it('should update time remaining using performance.now()', () => {
      const initialTime = timerService.getCurrentState().timeRemaining

      timerService.start()
      mockPerformanceNow.mockReturnValue(2000) // +1 second

      // Simulate animation frame callback
      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(2000)

      const currentTime = timerService.getCurrentState().timeRemaining
      expect(currentTime).toBe(initialTime - 1)
    })

    it('should handle background timing accurately', () => {
      timerService.start()
      mockPerformanceNow.mockReturnValue(1000)

      // Simulate tab going to background (no animation frames)
      mockPerformanceNow.mockReturnValue(6000) // +5 seconds

      // Resume foreground operation
      timerService.handleVisibilityChange(true)

      const currentTime = timerService.getCurrentState().timeRemaining
      const expectedTime = 50 * 60 - 5 // 5 seconds elapsed
      expect(currentTime).toBe(expectedTime)
    })
  })

  describe('Event System', () => {
    let tickHandler: TimerEventHandler<'tick'>
    let completeHandler: TimerEventHandler<'complete'>
    let phaseChangeHandler: TimerEventHandler<'phaseChange'>

    beforeEach(() => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)

      tickHandler = jest.fn()
      completeHandler = jest.fn()
      phaseChangeHandler = jest.fn()

      timerService.on('tick', tickHandler)
      timerService.on('complete', completeHandler)
      timerService.on('phaseChange', phaseChangeHandler)
    })

    it('should emit tick events during active timer', () => {
      timerService.start()

      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(1100) // 100ms later to trigger tick

      expect(tickHandler).toHaveBeenCalledWith({
        timeRemaining: expect.any(Number),
        totalElapsed: expect.any(Number),
        progress: expect.any(Number),
      })
    })

    it('should emit complete event when timer reaches zero', () => {
      timerService.start()
      mockPerformanceNow.mockReturnValue(1000 + 50 * 60 * 1000) // Complete work phase

      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(1000 + 50 * 60 * 1000)

      expect(completeHandler).toHaveBeenCalledWith({
        phase: 'work',
        cycleCompleted: false,
      })
    })

    it('should emit phase change event when switching phases', () => {
      timerService.start()
      mockPerformanceNow.mockReturnValue(1000 + 50 * 60 * 1000) // Complete work phase

      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(1000 + 50 * 60 * 1000)

      expect(phaseChangeHandler).toHaveBeenCalledWith({
        fromPhase: 'work',
        toPhase: 'break',
        cycle: 1,
      })
    })

    it('should remove event listeners', () => {
      timerService.off('tick', tickHandler)
      timerService.start()

      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(1016)

      expect(tickHandler).not.toHaveBeenCalled()
    })
  })

  describe('Cycle Progression', () => {
    beforeEach(() => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)
    })

    it('should progress from work to break phase', () => {
      timerService.start()

      // Complete work phase
      mockPerformanceNow.mockReturnValue(1000 + 50 * 60 * 1000)
      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(1000 + 50 * 60 * 1000)

      const state = timerService.getCurrentState()
      expect(state.phase).toBe('break')
      expect(state.timeRemaining).toBe(10 * 60) // Break duration
    })

    it('should progress from break to next cycle work phase', () => {
      timerService.start()

      // Complete work phase
      mockPerformanceNow.mockReturnValue(1000 + 50 * 60 * 1000)
      let animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(1000 + 50 * 60 * 1000)

      // Start break
      timerService.start()

      // Complete break phase
      mockPerformanceNow.mockReturnValue(1000 + 50 * 60 * 1000 + 10 * 60 * 1000)
      animationCallback = mockRequestAnimationFrame.mock.calls[1][0]
      animationCallback(1000 + 50 * 60 * 1000 + 10 * 60 * 1000)

      const state = timerService.getCurrentState()
      expect(state.phase).toBe('work')
      expect(state.currentCycle).toBe(2)
    })

    it('should handle zen mode without breaks', () => {
      const zenMode = sessionModes.find((m) => m.id === 'zen')!
      timerService.initializeTimer('zen', zenMode)
      timerService.start()

      // Complete zen session
      mockPerformanceNow.mockReturnValue(1000 + 15 * 60 * 1000)
      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(1000 + 15 * 60 * 1000)

      const state = timerService.getCurrentState()
      expect(state.isActive).toBe(false)
      expect(state.currentCycle).toBe(2) // Cycle incremented but no break
    })
  })

  describe('Error Handling', () => {
    it('should handle extreme time passage and complete phase gracefully', () => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)

      // Get initial state
      const initialState = timerService.getCurrentState()
      expect(initialState.phase).toBe('work')
      expect(initialState.timeRemaining).toBe(50 * 60) // 50 minutes

      timerService.start() // startTime set to 1000

      // Simulate extreme time passage (more than work duration)
      const extremeTime = 1000 + 100 * 60 * 1000 // 100 minutes later
      mockPerformanceNow.mockReturnValue(extremeTime)
      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(extremeTime)

      const state = timerService.getCurrentState()

      // Timer should have completed work phase and moved to break phase
      expect(state.phase).toBe('break')
      expect(state.timeRemaining).toBe(10 * 60) // Break duration
      expect(state.isActive).toBe(false) // Timer should be paused after phase completion
    })

    it('should handle invalid state transitions', () => {
      expect(() => timerService.start()).toThrow(TimerError)
    })

    it('should validate session mode configuration', () => {
      const invalidMode = { ...sessionModes[0], defaultWorkDuration: -1 }

      expect(() => {
        timerService.initializeTimer('study', invalidMode)
      }).toThrow(TimerServiceError)
    })
  })

  describe('Background Timer Support', () => {
    beforeEach(() => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)
    })

    it('should maintain accuracy when tab becomes visible', () => {
      timerService.start()
      mockPerformanceNow.mockReturnValue(1000)

      // Simulate tab going to background
      timerService.handleVisibilityChange(false)

      // Time passes in background
      mockPerformanceNow.mockReturnValue(6000) // +5 seconds

      // Tab becomes visible again
      timerService.handleVisibilityChange(true)

      const state = timerService.getCurrentState()
      expect(state.timeRemaining).toBe(50 * 60 - 5)
    })

    it('should continue running when page is hidden', () => {
      timerService.start()
      expect(timerService.isActive()).toBe(true)

      timerService.handleVisibilityChange(false)
      expect(timerService.isActive()).toBe(true)
    })
  })

  describe('Timer State Persistence', () => {
    it('should export current timer state', () => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)
      timerService.start()

      const exportedState = timerService.exportState()
      expect(exportedState).toEqual({
        timerState: timerService.getCurrentState(),
        sessionMode: studyMode,
        startTime: expect.any(Number),
      })
    })

    it('should restore from exported state', () => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)
      timerService.start()

      const exportedState = timerService.exportState()
      const newTimerService = new TimerService()

      newTimerService.restoreState(exportedState)

      expect(newTimerService.getCurrentState()).toEqual(exportedState.timerState)
    })
  })

  describe('Performance Optimizations', () => {
    it('should throttle tick events to prevent excessive updates', () => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)

      const tickHandler = jest.fn()
      timerService.on('tick', tickHandler)
      timerService.start()

      // Simulate multiple rapid animation frames
      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0]
      animationCallback(1100) // First tick (100ms threshold met)
      animationCallback(1110) // Too soon, should not emit
      animationCallback(1120) // Too soon, should not emit

      // Should only emit tick once despite multiple frames
      expect(tickHandler).toHaveBeenCalledTimes(1)
    })

    it('should cleanup resources on destroy', () => {
      const studyMode = sessionModes.find((m) => m.id === 'study')!
      timerService.initializeTimer('study', studyMode)
      timerService.start()

      timerService.destroy()

      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })
  })
})
