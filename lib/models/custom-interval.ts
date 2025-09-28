import { z } from 'zod';

/**
 * Session mode type for custom intervals
 */
export type SessionMode = 'study' | 'deepwork' | 'yoga' | 'zen';

/**
 * CustomInterval data model interface based on OpenAPI specification
 * Represents a user-defined custom timer interval in the ZenFocus application
 */
export interface CustomInterval {
  /** Custom interval unique identifier (UUID format) */
  id: string;
  /** Owner user ID (UUID format) */
  userId: string;
  /** User-defined name (max 50 characters) */
  name: string;
  /** Work duration in minutes (1-180) */
  workDuration: number;
  /** Break duration in minutes (0-60) */
  breakDuration: number;
  /** Associated session mode */
  sessionMode: SessionMode;
  /** Creation timestamp (ISO datetime) */
  createdAt: string;
  /** Whether interval is active */
  isActive: boolean;
}

/**
 * Zod schema for CustomInterval validation
 * Provides runtime validation matching the OpenAPI specification
 */
export const CustomIntervalSchema = z.object({
  id: z.string().uuid('Invalid UUID format for custom interval ID'),
  userId: z.string().uuid('Invalid UUID format for user ID'),
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(50, 'Name must be 50 characters or less'),
  workDuration: z.number()
    .int('Work duration must be an integer')
    .min(1, 'Work duration must be at least 1 minute')
    .max(180, 'Work duration must be at most 180 minutes'),
  breakDuration: z.number()
    .int('Break duration must be an integer')
    .min(0, 'Break duration must be non-negative')
    .max(60, 'Break duration must be at most 60 minutes'),
  sessionMode: z.enum(['study', 'deepwork', 'yoga', 'zen'], {
    errorMap: () => ({ message: 'Session mode must be one of: study, deepwork, yoga, zen' })
  }),
  createdAt: z.string().datetime('Invalid ISO datetime format for createdAt'),
  isActive: z.boolean({
    errorMap: () => ({ message: 'isActive must be a boolean value' })
  }),
});

/**
 * Type derived from Zod schema for compile-time type checking
 */
export type CustomIntervalType = z.infer<typeof CustomIntervalSchema>;

/**
 * Input data for creating a new custom interval
 */
export interface CreateCustomIntervalData {
  name: string;
  workDuration: number;
  breakDuration: number;
  sessionMode: SessionMode;
}

/**
 * Input data for updating a custom interval
 */
export interface UpdateCustomIntervalData {
  name?: string;
  workDuration?: number;
  breakDuration?: number;
  isActive?: boolean;
}

/**
 * Helper function to create a new custom interval
 * @param intervalData - Basic interval data (name, durations, mode)
 * @param userId - User ID who owns this interval
 * @returns New CustomInterval object with generated UUID and default values
 */
export function createCustomInterval(intervalData: CreateCustomIntervalData, userId: string): CustomInterval {
  return {
    id: crypto.randomUUID(),
    userId,
    name: intervalData.name,
    workDuration: intervalData.workDuration,
    breakDuration: intervalData.breakDuration,
    sessionMode: intervalData.sessionMode,
    createdAt: new Date().toISOString(),
    isActive: true, // New intervals are active by default
  };
}

/**
 * Helper function to validate custom interval data at runtime
 * @param intervalData - Object to validate as CustomInterval
 * @returns Validation result with parsed data or error details
 */
export function validateCustomInterval(intervalData: unknown): z.SafeParseReturnType<unknown, CustomInterval> {
  return CustomIntervalSchema.safeParse(intervalData);
}

/**
 * Helper function to toggle the active state of a custom interval
 * @param customInterval - CustomInterval object to toggle
 * @returns Updated CustomInterval object with toggled isActive state
 */
export function toggleCustomIntervalActive(customInterval: CustomInterval): CustomInterval {
  return {
    ...customInterval,
    isActive: !customInterval.isActive,
  };
}

/**
 * Helper function to calculate total duration (work + break) of a custom interval
 * @param customInterval - CustomInterval object
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(customInterval: CustomInterval): number {
  return customInterval.workDuration + customInterval.breakDuration;
}

/**
 * Helper function to update a custom interval with new values
 * @param customInterval - Original CustomInterval object
 * @param updates - Partial updates to apply
 * @returns Updated CustomInterval object
 */
export function updateCustomInterval(
  customInterval: CustomInterval,
  updates: UpdateCustomIntervalData
): CustomInterval {
  return {
    ...customInterval,
    ...updates,
  };
}

/**
 * API response type for custom interval data (snake_case fields)
 */
interface ApiCustomIntervalResponse {
  id: string;
  user_id: string;
  name: string;
  work_duration: number;
  break_duration: number;
  session_mode: SessionMode;
  created_at: string;
  is_active: boolean;
}

/**
 * Helper function to transform API response to CustomInterval model
 * Converts snake_case API fields to camelCase model fields
 * @param apiData - API response data in snake_case format
 * @returns CustomInterval object with camelCase fields
 */
export function transformCustomIntervalFromApi(apiData: ApiCustomIntervalResponse): CustomInterval {
  return {
    id: apiData.id,
    userId: apiData.user_id,
    name: apiData.name,
    workDuration: apiData.work_duration,
    breakDuration: apiData.break_duration,
    sessionMode: apiData.session_mode,
    createdAt: apiData.created_at,
    isActive: apiData.is_active,
  };
}

/**
 * Helper function to transform CustomInterval model to API format
 * Converts camelCase model fields to snake_case API fields
 * @param customInterval - CustomInterval object with camelCase fields
 * @returns API data with snake_case fields
 */
export function transformCustomIntervalToApi(customInterval: CustomInterval): ApiCustomIntervalResponse {
  return {
    id: customInterval.id,
    user_id: customInterval.userId,
    name: customInterval.name,
    work_duration: customInterval.workDuration,
    break_duration: customInterval.breakDuration,
    session_mode: customInterval.sessionMode,
    created_at: customInterval.createdAt,
    is_active: customInterval.isActive,
  };
}

/**
 * Helper function to check if a custom interval is suitable for a given session mode
 * @param customInterval - CustomInterval object to check
 * @param targetMode - Target session mode to compare against
 * @returns True if the interval's session mode matches the target mode
 */
export function isIntervalForMode(customInterval: CustomInterval, targetMode: SessionMode): boolean {
  return customInterval.sessionMode === targetMode;
}

/**
 * Helper function to get all active custom intervals from a list
 * @param customIntervals - Array of CustomInterval objects
 * @returns Array of active CustomInterval objects
 */
export function getActiveIntervals(customIntervals: CustomInterval[]): CustomInterval[] {
  return customIntervals.filter(interval => interval.isActive);
}

/**
 * Helper function to find custom intervals by session mode
 * @param customIntervals - Array of CustomInterval objects
 * @param sessionMode - Session mode to filter by
 * @returns Array of CustomInterval objects matching the session mode
 */
export function getIntervalsByMode(customIntervals: CustomInterval[], sessionMode: SessionMode): CustomInterval[] {
  return customIntervals.filter(interval => interval.sessionMode === sessionMode);
}

/**
 * Helper function to sort custom intervals by creation date (newest first)
 * @param customIntervals - Array of CustomInterval objects
 * @returns Sorted array of CustomInterval objects
 */
export function sortIntervalsByCreated(customIntervals: CustomInterval[]): CustomInterval[] {
  return [...customIntervals].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Helper function to validate that work and break durations are within limits for a session mode
 * @param workDuration - Work duration in minutes
 * @param breakDuration - Break duration in minutes
 * @param sessionMode - Session mode to validate against
 * @returns True if durations are valid for the session mode
 */
export function validateDurationsForMode(
  workDuration: number,
  breakDuration: number,
  sessionMode: SessionMode
): boolean {
  // Basic validation - all modes have the same constraints per API spec
  const isWorkValid = workDuration >= 1 && workDuration <= 180;
  const isBreakValid = breakDuration >= 0 && breakDuration <= 60;

  // Additional mode-specific logic could be added here if needed
  switch (sessionMode) {
    case 'study':
    case 'deepwork':
    case 'yoga':
    case 'zen':
      return isWorkValid && isBreakValid;
    default:
      return false;
  }
}