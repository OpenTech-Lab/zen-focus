import { EventEmitter } from 'events';
import { TimerService, type TimerEvents } from './timer-service';
import { PersistenceService } from './persistence-service';
import {
  type Session,
  type SessionMode,
  type AmbientSound,
  type CreateSessionData,
  type CompleteSessionData,
  createSession,
  completeSession,
  validateSession,
  SessionSchema,
  isGuestSession
} from '../models/session';
import type { TimerState } from '../models/timer-state';
import { SessionMode as SessionModeConfig } from '../models/session-mode';

/**
 * Session-related error classes
 */
export class SessionError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'SESSION_ERROR'
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionValidationError extends SessionError {
  constructor(message: string) {
    super(message, 'SESSION_VALIDATION_ERROR');
    this.name = 'SessionValidationError';
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(sessionId: string) {
    super(`Session ${sessionId} not found`, 'SESSION_NOT_FOUND');
    this.name = 'SessionNotFoundError';
  }
}

export class NoActiveSessionError extends SessionError {
  constructor(operation: string) {
    super(`No active session for operation: ${operation}`, 'NO_ACTIVE_SESSION');
    this.name = 'NoActiveSessionError';
  }
}

export class SessionAlreadyActiveError extends SessionError {
  constructor() {
    super('A session is already active', 'SESSION_ALREADY_ACTIVE');
    this.name = 'SessionAlreadyActiveError';
  }
}

/**
 * Session event types and their payload structures
 */
export interface SessionEvents {
  sessionCreated: { session: Session };
  sessionStarted: { session: Session };
  sessionPaused: { session: Session };
  sessionResumed: { session: Session };
  sessionCompleted: { session: Session };
  sessionCancelled: { session: Session };
  sessionUpdated: { session: Session };
  statsUpdated: { userId: string | null };
}

export type SessionEventHandler<T extends keyof SessionEvents> = (data: SessionEvents[T]) => void;

/**
 * Session statistics interface
 */
export interface SessionStats {
  totalFocusTime: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  modeBreakdown: {
    [K in SessionMode]: {
      count: number;
      totalTime: number;
    };
  };
}

/**
 * Session history filter options
 */
export interface SessionHistoryFilter {
  startDate?: string;
  endDate?: string;
  mode?: SessionMode;
  completedOnly?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Session service that manages the complete session lifecycle
 * Features:
 * - Session creation, start, pause, resume, complete, cancel
 * - Integration with TimerService for real-time tracking
 * - Session statistics calculation and aggregation
 * - Session history management with filtering and sorting
 * - Event-driven architecture for UI integration
 * - Support for both guest and authenticated users
 * - Performance optimization with caching
 * - Comprehensive validation and error handling
 */
export class SessionService extends EventEmitter {
  private timerService: TimerService;
  private persistenceService: PersistenceService;
  private currentSession: Session | null = null;
  private sessionCache = new Map<string, Session>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();

  // Session state tracking
  private pauseStartTime: number | null = null;
  private totalPauseTime = 0;
  private pauseCount = 0;

  constructor(
    timerService?: TimerService,
    persistenceService?: PersistenceService
  ) {
    super();
    this.timerService = timerService || new TimerService();
    this.persistenceService = persistenceService || new PersistenceService();

    this.setupTimerEventHandlers();
  }

  /**
   * Setup event handlers for timer service integration
   */
  private setupTimerEventHandlers(): void {
    // Handle timer completion to auto-complete session
    this.timerService.on('complete', this.handleTimerComplete.bind(this));

    // Track pause events for session statistics
    this.timerService.on('pause', this.handleTimerPause.bind(this));
    this.timerService.on('resume', this.handleTimerResume.bind(this));
  }

  /**
   * Handle timer completion event
   */
  private handleTimerComplete(data: TimerEvents['complete']): void {
    if (this.currentSession && data.phase === 'work') {
      // Auto-complete session when work phase completes
      const currentTime = performance.now();
      const actualDuration = this.calculateActualDuration();

      this.completeSession({
        actualDuration,
        completedFully: true,
        pauseCount: this.pauseCount,
        totalPauseTime: Math.ceil(this.totalPauseTime / (1000 * 60)) // Convert to minutes
      }).catch(error => {
        console.error('Failed to auto-complete session:', error);
      });
    }
  }

  /**
   * Handle timer pause event
   */
  private handleTimerPause(): void {
    this.pauseStartTime = performance.now();
    this.pauseCount++;
  }

  /**
   * Handle timer resume event
   */
  private handleTimerResume(): void {
    if (this.pauseStartTime) {
      this.totalPauseTime += performance.now() - this.pauseStartTime;
      this.pauseStartTime = null;
    }
  }

  /**
   * Calculate actual duration from session start time
   */
  private calculateActualDuration(): number {
    if (!this.currentSession) return 0;

    const now = new Date();
    const startTime = new Date(this.currentSession.startTime);
    const durationMs = now.getTime() - startTime.getTime() - this.totalPauseTime;
    const durationMinutes = durationMs / (1000 * 60);

    return Math.max(1, Math.ceil(durationMinutes));
  }

  /**
   * Validate session data before operations
   */
  private validateSessionData(data: unknown, operation: string): Session {
    const validation = validateSession(data);
    if (!validation.success) {
      throw new SessionValidationError(
        `Invalid session data for ${operation}: ${validation.error.message}`
      );
    }
    return validation.data;
  }

  /**
   * Update session cache
   */
  private updateCache(sessionId: string, session: Session): void {
    this.sessionCache.set(sessionId, session);
    this.cacheTimestamps.set(sessionId, Date.now());
  }

  /**
   * Get session from cache if valid
   */
  private getFromCache(sessionId: string): Session | null {
    const session = this.sessionCache.get(sessionId);
    const timestamp = this.cacheTimestamps.get(sessionId);

    if (!session || !timestamp) return null;

    if (Date.now() - timestamp > this.CACHE_TTL) {
      this.sessionCache.delete(sessionId);
      this.cacheTimestamps.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Invalidate cache for a session
   */
  private invalidateCache(sessionId: string): void {
    this.sessionCache.delete(sessionId);
    this.cacheTimestamps.delete(sessionId);
  }

  /**
   * Create a new session
   */
  public async createSession(
    sessionData: CreateSessionData,
    userId?: string
  ): Promise<Session> {
    try {
      // Validate input data
      if (!sessionData.mode || !sessionData.plannedDuration || !sessionData.ambientSound) {
        throw new SessionValidationError('Missing required session data');
      }

      if (sessionData.plannedDuration < 1) {
        throw new SessionValidationError('Planned duration must be at least 1 minute');
      }

      // Create session object
      const session = createSession(sessionData, userId || undefined);

      // Save to persistence
      try {
        await this.persistenceService.saveSession(session);
      } catch (error) {
        throw new SessionError(`Failed to save session: ${error}`, 'SAVE_FAILED');
      }

      // Update cache
      this.updateCache(session.id, session);

      // Emit event
      this.emit('sessionCreated', { session });

      return session;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Failed to create session: ${error}`, 'CREATE_FAILED');
    }
  }

  /**
   * Start a session by ID
   */
  public async startSession(sessionId: string): Promise<void> {
    try {
      // Check if session is already active
      if (this.currentSession) {
        throw new SessionAlreadyActiveError();
      }

      // Load session
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }

      // Reset session state tracking
      this.pauseStartTime = null;
      this.totalPauseTime = 0;
      this.pauseCount = 0;

      // Initialize timer with session mode configuration
      const sessionModeConfig: SessionModeConfig = {
        id: session.mode,
        name: session.mode.charAt(0).toUpperCase() + session.mode.slice(1),
        description: `${session.mode} session`,
        defaultWorkDuration: session.plannedDuration,
        defaultBreakDuration: session.mode === 'zen' ? 0 : 5, // Zen mode has no breaks
        color: '#4F46E5', // Default color
        icon: 'timer' // Default icon
      };

      try {
        this.timerService.initializeTimer(session.mode, sessionModeConfig);
        this.timerService.start();
      } catch (error) {
        throw new SessionError(`Failed to start timer: ${error}`, 'TIMER_START_FAILED');
      }

      // Set as current session
      this.currentSession = session;

      // Emit event
      this.emit('sessionStarted', { session });
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Failed to start session: ${error}`, 'START_FAILED');
    }
  }

  /**
   * Pause the current active session
   */
  public async pauseSession(): Promise<void> {
    if (!this.currentSession) {
      throw new NoActiveSessionError('pause');
    }

    try {
      this.timerService.pause();
      this.emit('sessionPaused', { session: this.currentSession });
    } catch (error) {
      throw new SessionError(`Failed to pause session: ${error}`, 'PAUSE_FAILED');
    }
  }

  /**
   * Resume the current paused session
   */
  public async resumeSession(): Promise<void> {
    if (!this.currentSession) {
      throw new NoActiveSessionError('resume');
    }

    try {
      this.timerService.resume();
      this.emit('sessionResumed', { session: this.currentSession });
    } catch (error) {
      throw new SessionError(`Failed to resume session: ${error}`, 'RESUME_FAILED');
    }
  }

  /**
   * Complete the current active session
   */
  public async completeSession(completionData: CompleteSessionData): Promise<Session> {
    if (!this.currentSession) {
      throw new NoActiveSessionError('complete');
    }

    try {
      // Validate completion data
      if (completionData.actualDuration < 0 ||
          completionData.pauseCount < 0 ||
          completionData.totalPauseTime < 0) {
        throw new SessionValidationError('Invalid completion data: negative values not allowed');
      }

      // Complete the session
      const completedSession = completeSession(this.currentSession, completionData);

      // Save to persistence
      await this.persistenceService.saveSession(completedSession);

      // Invalidate cache to ensure fresh data on next access
      this.invalidateCache(completedSession.id);

      // Clear current session
      this.currentSession = null;
      this.pauseStartTime = null;
      this.totalPauseTime = 0;
      this.pauseCount = 0;

      // Emit events
      this.emit('sessionCompleted', { session: completedSession });
      this.emit('statsUpdated', { userId: completedSession.userId });

      return completedSession;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Failed to complete session: ${error}`, 'COMPLETE_FAILED');
    }
  }

  /**
   * Cancel the current active session
   */
  public async cancelSession(): Promise<Session> {
    if (!this.currentSession) {
      throw new NoActiveSessionError('cancel');
    }

    try {
      const actualDuration = this.calculateActualDuration();

      // Complete session as cancelled (not fully completed)
      const cancelledSession = completeSession(this.currentSession, {
        actualDuration,
        completedFully: false,
        pauseCount: this.pauseCount,
        totalPauseTime: Math.ceil(this.totalPauseTime / (1000 * 60))
      });

      // Reset timer
      this.timerService.reset();

      // Save to persistence
      await this.persistenceService.saveSession(cancelledSession);

      // Invalidate cache to ensure fresh data on next access
      this.invalidateCache(cancelledSession.id);

      // Clear current session
      this.currentSession = null;
      this.pauseStartTime = null;
      this.totalPauseTime = 0;
      this.pauseCount = 0;

      // Emit events
      this.emit('sessionCancelled', { session: cancelledSession });
      this.emit('statsUpdated', { userId: cancelledSession.userId });

      return cancelledSession;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Failed to cancel session: ${error}`, 'CANCEL_FAILED');
    }
  }

  /**
   * Get current active session
   */
  public getCurrentSession(): Session | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Get session by ID with caching
   */
  public async getSessionById(sessionId: string): Promise<Session | null> {
    // Check cache first
    const cached = this.getFromCache(sessionId);
    if (cached) {
      return { ...cached };
    }

    // Load from persistence
    const session = await this.persistenceService.getSession(sessionId);
    if (session) {
      this.updateCache(sessionId, session);
      return { ...session };
    }

    return null;
  }

  /**
   * Get session history with filtering and sorting
   */
  public async getSessionHistory(
    userId: string | null,
    filter: SessionHistoryFilter = {}
  ): Promise<Session[]> {
    try {
      // Get all sessions for user
      let sessions = await this.persistenceService.getSessionsByUserId(userId);

      // Apply filters
      if (filter.startDate) {
        sessions = sessions.filter(s => s.startTime >= filter.startDate!);
      }

      if (filter.endDate) {
        sessions = sessions.filter(s => s.startTime <= filter.endDate!);
      }

      if (filter.mode) {
        sessions = sessions.filter(s => s.mode === filter.mode);
      }

      if (filter.completedOnly) {
        sessions = sessions.filter(s => s.completedFully);
      }

      // Sort by start time (most recent first)
      sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      // Apply pagination
      if (filter.page !== undefined && filter.limit !== undefined) {
        const startIndex = filter.page * filter.limit;
        const endIndex = startIndex + filter.limit;
        sessions = sessions.slice(startIndex, endIndex);
      }

      return sessions;
    } catch (error) {
      throw new SessionError(`Failed to get session history: ${error}`, 'HISTORY_FAILED');
    }
  }

  /**
   * Calculate total focus time for a user
   */
  public async getTotalFocusTime(userId: string | null): Promise<number> {
    try {
      const sessions = await this.persistenceService.getSessionsByUserId(userId);
      return sessions.reduce((total, session) => total + session.actualDuration, 0);
    } catch (error) {
      throw new SessionError(`Failed to calculate total focus time: ${error}`, 'STATS_FAILED');
    }
  }

  /**
   * Calculate completion rate for a user
   */
  public async getCompletionRate(userId: string | null): Promise<number> {
    try {
      const sessions = await this.persistenceService.getSessionsByUserId(userId);
      if (sessions.length === 0) return 0;

      const completedSessions = sessions.filter(s => s.completedFully).length;
      return Math.round((completedSessions / sessions.length) * 100);
    } catch (error) {
      throw new SessionError(`Failed to calculate completion rate: ${error}`, 'STATS_FAILED');
    }
  }

  /**
   * Get session mode breakdown for a user
   */
  public async getSessionModeBreakdown(userId: string | null): Promise<SessionStats['modeBreakdown']> {
    try {
      const sessions = await this.persistenceService.getSessionsByUserId(userId);

      const breakdown: SessionStats['modeBreakdown'] = {
        study: { count: 0, totalTime: 0 },
        deepwork: { count: 0, totalTime: 0 },
        yoga: { count: 0, totalTime: 0 },
        zen: { count: 0, totalTime: 0 }
      };

      sessions.forEach(session => {
        breakdown[session.mode].count++;
        breakdown[session.mode].totalTime += session.actualDuration;
      });

      return breakdown;
    } catch (error) {
      throw new SessionError(`Failed to calculate mode breakdown: ${error}`, 'STATS_FAILED');
    }
  }

  /**
   * Calculate current completion streak for a user
   */
  public async getCurrentStreak(userId: string | null): Promise<number> {
    try {
      const sessions = await this.persistenceService.getSessionsByUserId(userId);

      // Sort by start time (most recent first)
      sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      let streak = 0;
      for (const session of sessions) {
        if (session.completedFully) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      throw new SessionError(`Failed to calculate current streak: ${error}`, 'STATS_FAILED');
    }
  }

  /**
   * Get comprehensive session statistics for a user
   */
  public async getSessionStats(userId: string | null): Promise<SessionStats> {
    try {
      const [totalFocusTime, completionRate, currentStreak, modeBreakdown] = await Promise.all([
        this.getTotalFocusTime(userId),
        this.getCompletionRate(userId),
        this.getCurrentStreak(userId),
        this.getSessionModeBreakdown(userId)
      ]);

      // Calculate longest streak (simplified - would need more complex logic for real implementation)
      const longestStreak = currentStreak; // Placeholder

      return {
        totalFocusTime,
        completionRate,
        currentStreak,
        longestStreak,
        modeBreakdown
      };
    } catch (error) {
      throw new SessionError(`Failed to get session statistics: ${error}`, 'STATS_FAILED');
    }
  }

  /**
   * Add typed event listener
   */
  public on<T extends keyof SessionEvents>(
    event: T,
    listener: SessionEventHandler<T>
  ): this {
    return super.on(event, listener);
  }

  /**
   * Remove typed event listener
   */
  public off<T extends keyof SessionEvents>(
    event: T,
    listener: SessionEventHandler<T>
  ): this {
    return super.off(event, listener);
  }

  /**
   * Emit typed event
   */
  public emit<T extends keyof SessionEvents>(
    event: T,
    data: SessionEvents[T]
  ): boolean {
    return super.emit(event, data);
  }

  /**
   * Get listener count for event
   */
  public listenerCount(event: keyof SessionEvents): number {
    return super.listenerCount(event);
  }

  /**
   * Check if session is active
   */
  public isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get timer service instance
   */
  public getTimerService(): TimerService {
    return this.timerService;
  }

  /**
   * Get persistence service instance
   */
  public getPersistenceService(): PersistenceService {
    return this.persistenceService;
  }

  /**
   * Clean up resources and stop all operations
   */
  public destroy(): void {
    // Clean up timer service
    this.timerService.destroy();

    // Clear current session
    this.currentSession = null;
    this.pauseStartTime = null;
    this.totalPauseTime = 0;
    this.pauseCount = 0;

    // Clear caches
    this.sessionCache.clear();
    this.cacheTimestamps.clear();

    // Remove all event listeners
    this.removeAllListeners();
  }
}

/**
 * Create a new session service instance
 */
export function createSessionService(
  timerService?: TimerService,
  persistenceService?: PersistenceService
): SessionService {
  return new SessionService(timerService, persistenceService);
}

/**
 * Session service singleton for global usage
 */
let globalSessionService: SessionService | null = null;

/**
 * Get global session service instance (singleton)
 */
export function getGlobalSessionService(): SessionService {
  if (!globalSessionService) {
    globalSessionService = new SessionService();
  }
  return globalSessionService;
}

/**
 * Destroy global session service instance
 */
export function destroyGlobalSessionService(): void {
  if (globalSessionService) {
    globalSessionService.destroy();
    globalSessionService = null;
  }
}