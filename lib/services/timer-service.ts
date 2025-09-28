import {
  TimerState,
  type SessionMode,
  createTimerState,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  switchPhase,
  incrementCycle,
  updateTimeRemaining,
  canStart,
  canPause,
  canResume,
  isActiveTimer,
  getTimerProgress,
  validateTimerState,
} from '../models/timer-state'
import { SessionMode as SessionModeConfig, validateSessionMode } from '../models/session-mode'

/**
 * Custom error classes for timer-related errors
 */
export class TimerError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'TIMER_ERROR'
  ) {
    super(message)
    this.name = 'TimerError'
  }
}

export class TimerServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'TIMER_SERVICE_ERROR'
  ) {
    super(message)
    this.name = 'TimerServiceError'
  }
}

/**
 * Timer event types and their payload structures
 */
export interface TimerEvents {
  tick: {
    timeRemaining: number
    totalElapsed: number
    progress: number
  }
  complete: {
    phase: 'work' | 'break'
    cycleCompleted: boolean
  }
  phaseChange: {
    fromPhase: 'work' | 'break'
    toPhase: 'work' | 'break'
    cycle: number
  }
  cycleComplete: {
    cycle: number
    totalCycles: number
  }
  start: {
    phase: 'work' | 'break'
    timeRemaining: number
  }
  pause: {
    phase: 'work' | 'break'
    timeRemaining: number
  }
  resume: {
    phase: 'work' | 'break'
    timeRemaining: number
  }
  reset: {
    mode: SessionMode
  }
}

export type TimerEventHandler<T extends keyof TimerEvents> = (data: TimerEvents[T]) => void

/**
 * Timer state export interface for persistence
 */
export interface TimerStateExport {
  timerState: TimerState
  sessionMode: SessionModeConfig
  startTime: number
}

/**
 * High-precision timer service with comprehensive state management
 * Provides accurate timing using performance.now() and requestAnimationFrame
 * Supports background timer operation and event-driven architecture
 */
export class TimerService {
  private timerState: TimerState
  private sessionMode: SessionModeConfig | null = null
  private startTime = 0
  private lastTickTime = 0
  private animationFrameId: number | null = null
  private isVisible = true
  private readonly eventListeners = new Map<keyof TimerEvents, Array<TimerEventHandler<any>>>()

  // Constants for timing precision
  private static readonly TICK_INTERVAL_MS = 100 // Update every 100ms for smooth UI
  private static readonly PRECISION_THRESHOLD_MS = 50 // Threshold for timing corrections

  constructor() {
    this.timerState = createTimerState('study', 0)
    this.setupVisibilityHandling()
  }

  /**
   * Initialize timer with session mode configuration
   * @param mode - Session mode identifier
   * @param sessionModeConfig - Session mode configuration object
   */
  public initializeTimer(mode: SessionMode, sessionModeConfig: SessionModeConfig): void {
    // Validate session mode configuration
    const validation = validateSessionMode(sessionModeConfig)
    if (!validation.success) {
      throw new TimerServiceError(
        `Invalid session mode configuration: ${validation.error.message}`,
        'INVALID_SESSION_MODE'
      )
    }

    // Validate mode matches configuration ID
    if (mode !== sessionModeConfig.id) {
      throw new TimerServiceError(
        `Session mode mismatch: expected ${mode}, got ${sessionModeConfig.id}`,
        'MODE_MISMATCH'
      )
    }

    this.sessionMode = sessionModeConfig
    const workDurationSeconds = sessionModeConfig.defaultWorkDuration * 60
    this.timerState = createTimerState(mode, workDurationSeconds)
  }

  /**
   * Start the timer
   * @throws TimerError if timer cannot be started
   */
  public start(): void {
    if (!this.sessionMode) {
      throw new TimerError('Timer not initialized with session mode', 'NOT_INITIALIZED')
    }

    if (!canStart(this.timerState)) {
      throw new TimerError('Timer cannot be started in current state', 'INVALID_START')
    }

    this.timerState = startTimer(this.timerState)
    this.startTime = performance.now()
    this.lastTickTime = this.startTime
    this.scheduleNextTick()

    this.emit('start', {
      phase: this.timerState.phase,
      timeRemaining: this.timerState.timeRemaining,
    })
  }

  /**
   * Pause the active timer
   * @throws TimerError if timer cannot be paused
   */
  public pause(): void {
    if (!canPause(this.timerState)) {
      throw new TimerError('Timer cannot be paused in current state', 'INVALID_PAUSE')
    }

    this.timerState = pauseTimer(this.timerState)
    this.cancelScheduledTick()

    this.emit('pause', {
      phase: this.timerState.phase,
      timeRemaining: this.timerState.timeRemaining,
    })
  }

  /**
   * Resume the paused timer
   * @throws TimerError if timer cannot be resumed
   */
  public resume(): void {
    if (!canResume(this.timerState)) {
      throw new TimerError('Timer cannot be resumed in current state', 'INVALID_RESUME')
    }

    this.timerState = resumeTimer(this.timerState)
    this.startTime = performance.now()
    this.lastTickTime = this.startTime
    this.scheduleNextTick()

    this.emit('resume', {
      phase: this.timerState.phase,
      timeRemaining: this.timerState.timeRemaining,
    })
  }

  /**
   * Reset the timer to initial state
   */
  public reset(): void {
    if (!this.sessionMode) {
      throw new TimerError('Timer not initialized with session mode', 'NOT_INITIALIZED')
    }

    this.cancelScheduledTick()
    const workDurationSeconds = this.sessionMode.defaultWorkDuration * 60
    this.timerState = resetTimer(this.timerState, workDurationSeconds)
    this.startTime = 0
    this.lastTickTime = 0

    this.emit('reset', {
      mode: this.timerState.mode,
    })
  }

  /**
   * Complete the current timer phase manually
   */
  public complete(): void {
    if (!isActiveTimer(this.timerState)) {
      throw new TimerError('Timer must be active to complete', 'INVALID_COMPLETE')
    }

    this.handlePhaseCompletion()
  }

  /**
   * Get current timer state (immutable copy)
   */
  public getCurrentState(): Readonly<TimerState> {
    return { ...this.timerState }
  }

  /**
   * Check if timer is currently active
   */
  public isActive(): boolean {
    return isActiveTimer(this.timerState)
  }

  /**
   * Check if timer is currently paused
   */
  public isPaused(): boolean {
    return this.timerState.isPaused
  }

  /**
   * Get current session mode configuration
   */
  public getSessionMode(): Readonly<SessionModeConfig> | null {
    return this.sessionMode ? { ...this.sessionMode } : null
  }

  /**
   * Add event listener for timer events
   */
  public on<T extends keyof TimerEvents>(event: T, handler: TimerEventHandler<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(handler)
  }

  /**
   * Remove event listener for timer events
   */
  public off<T extends keyof TimerEvents>(event: T, handler: TimerEventHandler<T>): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Handle visibility change for background timer support
   */
  public handleVisibilityChange(isVisible: boolean): void {
    this.isVisible = isVisible

    if (isActiveTimer(this.timerState)) {
      if (isVisible) {
        // Recalculate elapsed time when coming back to foreground
        this.syncTimerWithRealTime()
        this.scheduleNextTick()
      } else {
        // Continue tracking time in background but stop animation frames
        this.cancelScheduledTick()
      }
    }
  }

  /**
   * Export current timer state for persistence
   */
  public exportState(): TimerStateExport {
    if (!this.sessionMode) {
      throw new TimerError('Timer not initialized with session mode', 'NOT_INITIALIZED')
    }

    return {
      timerState: { ...this.timerState },
      sessionMode: { ...this.sessionMode },
      startTime: this.startTime,
    }
  }

  /**
   * Restore timer state from export
   */
  public restoreState(exportedState: TimerStateExport): void {
    const timerValidation = validateTimerState(exportedState.timerState)
    if (!timerValidation.success) {
      throw new TimerServiceError(
        `Invalid timer state: ${timerValidation.error.message}`,
        'INVALID_TIMER_STATE'
      )
    }

    const sessionValidation = validateSessionMode(exportedState.sessionMode)
    if (!sessionValidation.success) {
      throw new TimerServiceError(
        `Invalid session mode: ${sessionValidation.error.message}`,
        'INVALID_SESSION_MODE'
      )
    }

    this.timerState = exportedState.timerState
    this.sessionMode = exportedState.sessionMode
    this.startTime = exportedState.startTime

    // Resume timer if it was active
    if (isActiveTimer(this.timerState)) {
      this.syncTimerWithRealTime()
      this.scheduleNextTick()
    }
  }

  /**
   * Cleanup resources and stop timer
   */
  public destroy(): void {
    this.cancelScheduledTick()
    this.eventListeners.clear()
    this.cleanupVisibilityHandling()
  }

  /**
   * Private method to emit events to registered listeners
   */
  private emit<T extends keyof TimerEvents>(event: T, data: TimerEvents[T]): void {
    const handlers = this.eventListeners.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in timer event handler for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Schedule next timer tick using requestAnimationFrame
   */
  private scheduleNextTick(): void {
    if (this.animationFrameId !== null) {
      return // Already scheduled
    }

    this.animationFrameId = requestAnimationFrame((timestamp) => {
      this.animationFrameId = null
      this.handleTick(timestamp)
    })
  }

  /**
   * Cancel scheduled timer tick
   */
  private cancelScheduledTick(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Handle timer tick and update state
   */
  private handleTick(timestamp: number): void {
    if (!isActiveTimer(this.timerState)) {
      return
    }

    // Calculate elapsed time with high precision
    const currentTime = performance.now()
    const elapsedMs = currentTime - this.startTime
    const elapsedSeconds = Math.floor(elapsedMs / 1000)

    // Update timer state
    const initialTime = this.getInitialPhaseTime()
    const newTimeRemaining = Math.max(0, initialTime - elapsedSeconds)
    this.timerState = updateTimeRemaining(this.timerState, newTimeRemaining)

    // Only emit tick events at specified intervals to prevent excessive updates
    const shouldEmitTick = timestamp - this.lastTickTime >= TimerService.TICK_INTERVAL_MS

    // Emit tick event if enough time has passed
    if (shouldEmitTick) {
      this.lastTickTime = timestamp
      this.emit('tick', {
        timeRemaining: this.timerState.timeRemaining,
        totalElapsed: elapsedSeconds,
        progress: getTimerProgress(this.timerState, initialTime),
      })
    }

    // Check if phase is complete
    if (this.timerState.timeRemaining <= 0) {
      this.handlePhaseCompletion()
    } else {
      // Continue timer
      this.scheduleNextTick()
    }
  }

  /**
   * Handle completion of current timer phase
   */
  private handlePhaseCompletion(): void {
    if (!this.sessionMode) return

    const currentPhase = this.timerState.phase
    const isWorkPhase = currentPhase === 'work'
    const cycleCompleted = isWorkPhase && this.sessionMode.defaultBreakDuration === 0

    // Emit completion event
    this.emit('complete', {
      phase: currentPhase,
      cycleCompleted,
    })

    // Stop the timer
    this.timerState = pauseTimer(this.timerState)
    this.cancelScheduledTick()

    // Handle phase transitions
    if (isWorkPhase) {
      // Work phase completed
      if (this.sessionMode.defaultBreakDuration > 0) {
        // Switch to break phase
        const breakDurationSeconds = this.sessionMode.defaultBreakDuration * 60
        this.timerState = switchPhase(this.timerState, breakDurationSeconds)

        this.emit('phaseChange', {
          fromPhase: 'work',
          toPhase: 'break',
          cycle: this.timerState.currentCycle,
        })
      } else {
        // No break phase (zen mode), increment cycle and reset to work
        const currentCycleNumber = this.timerState.currentCycle
        this.timerState = incrementCycle(this.timerState)
        const workDurationSeconds = this.sessionMode.defaultWorkDuration * 60
        this.timerState = resetTimer(this.timerState, workDurationSeconds)
        // Preserve the incremented cycle
        this.timerState = {
          ...this.timerState,
          currentCycle: currentCycleNumber + 1,
        }

        this.emit('cycleComplete', {
          cycle: currentCycleNumber,
          totalCycles: this.timerState.currentCycle,
        })
      }
    } else {
      // Break phase completed, switch to work and increment cycle
      const currentCycleNumber = this.timerState.currentCycle
      this.timerState = incrementCycle(this.timerState)
      const workDurationSeconds = this.sessionMode.defaultWorkDuration * 60
      this.timerState = switchPhase(this.timerState, workDurationSeconds)

      this.emit('phaseChange', {
        fromPhase: 'break',
        toPhase: 'work',
        cycle: this.timerState.currentCycle,
      })

      this.emit('cycleComplete', {
        cycle: currentCycleNumber,
        totalCycles: this.timerState.currentCycle,
      })
    }
  }

  /**
   * Get initial time for current phase
   */
  private getInitialPhaseTime(): number {
    if (!this.sessionMode) return 0

    return this.timerState.phase === 'work'
      ? this.sessionMode.defaultWorkDuration * 60
      : this.sessionMode.defaultBreakDuration * 60
  }

  /**
   * Sync timer with real time for background accuracy
   */
  private syncTimerWithRealTime(): void {
    if (!isActiveTimer(this.timerState) || this.startTime === 0) return

    const currentTime = performance.now()
    const totalElapsedMs = currentTime - this.startTime
    const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000)

    const initialTime = this.getInitialPhaseTime()
    const newTimeRemaining = Math.max(0, initialTime - totalElapsedSeconds)

    this.timerState = updateTimeRemaining(this.timerState, newTimeRemaining)
  }

  /**
   * Setup visibility change handling for background timer support
   */
  private setupVisibilityHandling(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChangeEvent)
    }
  }

  /**
   * Cleanup visibility change handling
   */
  private cleanupVisibilityHandling(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChangeEvent)
    }
  }

  /**
   * Handle browser visibility change events
   */
  private handleVisibilityChangeEvent = (): void => {
    if (typeof document !== 'undefined') {
      this.handleVisibilityChange(!document.hidden)
    }
  }
}

/**
 * Create a new timer service instance
 * @returns New TimerService instance
 */
export function createTimerService(): TimerService {
  return new TimerService()
}

/**
 * Timer service singleton for global usage
 */
let globalTimerService: TimerService | null = null

/**
 * Get global timer service instance (singleton)
 * @returns Global TimerService instance
 */
export function getGlobalTimerService(): TimerService {
  if (!globalTimerService) {
    globalTimerService = new TimerService()
  }
  return globalTimerService
}

/**
 * Destroy global timer service instance
 */
export function destroyGlobalTimerService(): void {
  if (globalTimerService) {
    globalTimerService.destroy()
    globalTimerService = null
  }
}
