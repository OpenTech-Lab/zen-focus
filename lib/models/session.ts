import { z } from 'zod'

/**
 * Session mode type for different focus session types
 */
export type SessionMode = 'study' | 'deepwork' | 'yoga' | 'zen'

/**
 * Ambient sound type for background audio during sessions
 */
export type AmbientSound = 'rain' | 'forest' | 'ocean' | 'silence'

/**
 * Session data model interface based on OpenAPI specification
 * Represents a focus session in the ZenFocus application
 */
export interface Session {
  /** Session unique identifier (UUID format) */
  id: string
  /** User ID (UUID format, null for guest sessions) */
  userId: string | null
  /** Session mode used */
  mode: SessionMode
  /** Session start timestamp (ISO datetime) */
  startTime: string
  /** Session end timestamp (ISO datetime) */
  endTime: string
  /** Planned duration in minutes (minimum 1) */
  plannedDuration: number
  /** Actual duration in minutes (non-negative) */
  actualDuration: number
  /** Whether session completed fully */
  completedFully: boolean
  /** Number of pauses (non-negative) */
  pauseCount: number
  /** Total pause time in minutes (non-negative) */
  totalPauseTime: number
  /** Ambient sound used */
  ambientSound: AmbientSound
  /** Optional user notes (max 500 characters, nullable) */
  notes?: string | null
}

/**
 * Zod schema for Session validation
 * Provides runtime validation matching the OpenAPI specification
 */
export const SessionSchema = z.object({
  id: z.string().uuid('Invalid UUID format for session ID'),
  userId: z.string().uuid('Invalid UUID format for user ID').nullable(),
  mode: z.enum(['study', 'deepwork', 'yoga', 'zen'], {
    errorMap: () => ({ message: 'Session mode must be one of: study, deepwork, yoga, zen' }),
  }),
  startTime: z.string().datetime('Invalid ISO datetime format for startTime'),
  endTime: z.string().datetime('Invalid ISO datetime format for endTime'),
  plannedDuration: z
    .number()
    .int('Planned duration must be an integer')
    .min(1, 'Planned duration must be at least 1 minute'),
  actualDuration: z
    .number()
    .int('Actual duration must be an integer')
    .min(0, 'Actual duration must be non-negative'),
  completedFully: z.boolean({
    errorMap: () => ({ message: 'Completed fully must be a boolean value' }),
  }),
  pauseCount: z
    .number()
    .int('Pause count must be an integer')
    .min(0, 'Pause count must be non-negative'),
  totalPauseTime: z
    .number()
    .int('Total pause time must be an integer')
    .min(0, 'Total pause time must be non-negative'),
  ambientSound: z.enum(['rain', 'forest', 'ocean', 'silence'], {
    errorMap: () => ({ message: 'Ambient sound must be one of: rain, forest, ocean, silence' }),
  }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').nullable().optional(),
})

/**
 * Type derived from Zod schema for compile-time type checking
 */
export type SessionType = z.infer<typeof SessionSchema>

/**
 * Input data for creating a new session
 */
export interface CreateSessionData {
  mode: SessionMode
  plannedDuration: number
  ambientSound: AmbientSound
}

/**
 * Input data for completing a session
 */
export interface CompleteSessionData {
  actualDuration: number
  completedFully: boolean
  pauseCount: number
  totalPauseTime: number
  notes?: string | null
}

/**
 * Helper function to create a new session
 * @param sessionData - Basic session data (mode, duration, sound)
 * @param userId - User ID for authenticated sessions (null for guest sessions)
 * @returns New Session object with generated UUID and default values
 */
export function createSession(sessionData: CreateSessionData, userId?: string): Session {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    userId: userId || null,
    mode: sessionData.mode,
    startTime: now,
    endTime: now, // Will be updated when session completes
    plannedDuration: sessionData.plannedDuration,
    actualDuration: 0,
    completedFully: false,
    pauseCount: 0,
    totalPauseTime: 0,
    ambientSound: sessionData.ambientSound,
  }
}

/**
 * Helper function to complete a session with final data
 * @param session - Original session object
 * @param completionData - Completion data (duration, pauses, notes, etc.)
 * @returns Updated session object with completion data
 */
export function completeSession(session: Session, completionData: CompleteSessionData): Session {
  return {
    ...session,
    endTime: new Date().toISOString(),
    actualDuration: completionData.actualDuration,
    completedFully: completionData.completedFully,
    pauseCount: completionData.pauseCount,
    totalPauseTime: completionData.totalPauseTime,
    notes: completionData.notes,
  }
}

/**
 * Helper function to validate session data at runtime
 * @param sessionData - Object to validate as Session
 * @returns Validation result with parsed data or error details
 */
export function validateSession(sessionData: unknown): z.SafeParseReturnType<unknown, Session> {
  return SessionSchema.safeParse(sessionData)
}

/**
 * Helper function to calculate actual duration from start and end times
 * @param startTime - Session start time (ISO datetime string)
 * @param endTime - Session end time (ISO datetime string)
 * @returns Duration in minutes (rounded up)
 */
export function calculateActualDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMs = end.getTime() - start.getTime()
  const durationMinutes = durationMs / (1000 * 60)

  // Handle edge cases: zero duration should return 0, small durations should round up to 1
  if (durationMinutes <= 0) {
    return 0
  } else if (durationMinutes < 1) {
    return 1
  }

  return Math.ceil(durationMinutes)
}

/**
 * Helper function to check if a session is a guest session
 * @param session - Session object to check
 * @returns True if session is a guest session (userId is null)
 */
export function isGuestSession(session: Session): boolean {
  return session.userId === null
}

/**
 * Helper function to calculate session efficiency
 * @param session - Session object
 * @returns Efficiency percentage (0-100)
 */
export function getSessionEfficiency(session: Session): number {
  if (session.plannedDuration === 0) {
    return 0
  }

  const efficiency = (session.actualDuration / session.plannedDuration) * 100
  // Cap at 100% for sessions that exceeded planned duration
  return Math.min(100, efficiency)
}

/**
 * API response type for session data (snake_case fields)
 */
interface ApiSessionResponse {
  id: string
  user_id: string | null
  mode: SessionMode
  start_time: string
  end_time: string
  planned_duration: number
  actual_duration: number
  completed_fully: boolean
  pause_count: number
  total_pause_time: number
  ambient_sound: AmbientSound
  notes?: string | null
}

/**
 * Helper function to transform API response to Session model
 * Converts snake_case API fields to camelCase model fields
 * @param apiData - API response data in snake_case format
 * @returns Session object with camelCase fields
 */
export function transformSessionFromApi(apiData: ApiSessionResponse): Session {
  const session: Session = {
    id: apiData.id,
    userId: apiData.user_id,
    mode: apiData.mode,
    startTime: apiData.start_time,
    endTime: apiData.end_time,
    plannedDuration: apiData.planned_duration,
    actualDuration: apiData.actual_duration,
    completedFully: apiData.completed_fully,
    pauseCount: apiData.pause_count,
    totalPauseTime: apiData.total_pause_time,
    ambientSound: apiData.ambient_sound,
  }

  // Add optional notes if present
  if (apiData.notes !== undefined) {
    session.notes = apiData.notes
  }

  return session
}

/**
 * Helper function to transform Session model to API format
 * Converts camelCase model fields to snake_case API fields
 * @param session - Session object with camelCase fields
 * @returns API data with snake_case fields
 */
export function transformSessionToApi(session: Session): ApiSessionResponse {
  const apiData: ApiSessionResponse = {
    id: session.id,
    user_id: session.userId,
    mode: session.mode,
    start_time: session.startTime,
    end_time: session.endTime,
    planned_duration: session.plannedDuration,
    actual_duration: session.actualDuration,
    completed_fully: session.completedFully,
    pause_count: session.pauseCount,
    total_pause_time: session.totalPauseTime,
    ambient_sound: session.ambientSound,
  }

  // Add optional notes if present
  if (session.notes !== undefined) {
    apiData.notes = session.notes
  }

  return apiData
}
