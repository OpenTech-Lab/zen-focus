import { z } from 'zod';

/**
 * SessionMode data model interface based on OpenAPI specification
 * Represents a session mode configuration in the ZenFocus application
 */
export interface SessionMode {
  /** Mode unique identifier */
  id: string;
  /** Display name for the session mode */
  name: string;
  /** Detailed description of the session mode */
  description: string;
  /** Default work duration in minutes (non-negative integer) */
  defaultWorkDuration: number;
  /** Default break duration in minutes (non-negative integer) */
  defaultBreakDuration: number;
  /** Theme color in hex format (#RRGGBB) */
  color: string;
  /** Icon identifier for the session mode */
  icon: string;
  /** Whether intervals can be customized by the user */
  isCustomizable: boolean;
  /** Maximum work duration allowed in minutes (optional, minimum 1) */
  maxWorkDuration?: number;
  /** Maximum break duration allowed in minutes (optional, minimum 1) */
  maxBreakDuration?: number;
}

/**
 * Zod schema for SessionMode validation
 * Provides runtime validation matching the OpenAPI specification
 */
export const SessionModeSchema = z.object({
  id: z.string().min(1, 'Session mode ID cannot be empty'),
  name: z.string().min(1, 'Session mode name cannot be empty'),
  description: z.string().min(1, 'Session mode description cannot be empty'),
  defaultWorkDuration: z.number()
    .int('Default work duration must be an integer')
    .min(0, 'Default work duration must be non-negative'),
  defaultBreakDuration: z.number()
    .int('Default break duration must be an integer')
    .min(0, 'Default break duration must be non-negative'),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be in hex format (#RRGGBB)'),
  icon: z.string().min(1, 'Session mode icon cannot be empty'),
  isCustomizable: z.boolean({
    errorMap: () => ({ message: 'isCustomizable must be a boolean value' })
  }),
  maxWorkDuration: z.number()
    .int('Max work duration must be an integer')
    .min(1, 'Max work duration must be at least 1 minute')
    .optional(),
  maxBreakDuration: z.number()
    .int('Max break duration must be an integer')
    .min(1, 'Max break duration must be at least 1 minute')
    .optional(),
});

/**
 * Type derived from Zod schema for compile-time type checking
 */
export type SessionModeType = z.infer<typeof SessionModeSchema>;

/**
 * Helper function to create default session modes
 * Returns an array of the four standard session modes: study, deepwork, yoga, zen
 * @returns Array of SessionMode objects with predefined configurations
 */
export function createDefaultSessionModes(): SessionMode[] {
  return [
    {
      id: 'study',
      name: 'Study',
      description: 'Focused learning sessions with extended work periods',
      defaultWorkDuration: 50,
      defaultBreakDuration: 10,
      color: '#3B82F6',
      icon: 'book',
      isCustomizable: true,
      maxWorkDuration: 120,
      maxBreakDuration: 30,
    },
    {
      id: 'deepwork',
      name: 'Deep Work',
      description: 'Extended focus sessions for complex tasks',
      defaultWorkDuration: 90,
      defaultBreakDuration: 20,
      color: '#7C3AED',
      icon: 'brain',
      isCustomizable: true,
      maxWorkDuration: 180,
      maxBreakDuration: 30,
    },
    {
      id: 'yoga',
      name: 'Yoga',
      description: 'Mindful movement and breath work sessions',
      defaultWorkDuration: 30,
      defaultBreakDuration: 5,
      color: '#059669',
      icon: 'lotus',
      isCustomizable: false,
    },
    {
      id: 'zen',
      name: 'Zen',
      description: 'Simple meditation and mindfulness practice',
      defaultWorkDuration: 15,
      defaultBreakDuration: 0,
      color: '#DC2626',
      icon: 'circle',
      isCustomizable: false,
    },
  ];
}

/**
 * Helper function to validate session mode data at runtime
 * @param sessionModeData - Object to validate as SessionMode
 * @returns Validation result with parsed data or error details
 */
export function validateSessionMode(sessionModeData: unknown): z.SafeParseReturnType<unknown, SessionMode> {
  return SessionModeSchema.safeParse(sessionModeData);
}

/**
 * Helper function to compare session modes for sorting
 * Compares by name in alphabetical order (case-insensitive)
 * @param mode1 - First session mode to compare
 * @param mode2 - Second session mode to compare
 * @returns Negative if mode1 < mode2, positive if mode1 > mode2, zero if equal
 */
export function compareSessionModes(mode1: SessionMode, mode2: SessionMode): number {
  return mode1.name.toLowerCase().localeCompare(mode2.name.toLowerCase());
}

/**
 * Helper function to find session mode by ID
 * @param sessionModes - Array of session modes to search
 * @param id - ID of the session mode to find
 * @returns SessionMode object if found, undefined otherwise
 */
export function getSessionModeById(sessionModes: SessionMode[], id: string): SessionMode | undefined {
  return sessionModes.find(mode => mode.id === id);
}

/**
 * Helper function to validate hex color format
 * @param color - Color string to validate
 * @returns True if valid hex color format (#RRGGBB), false otherwise
 */
export function isHexColor(color: string): boolean {
  if (typeof color !== 'string') {
    return false;
  }
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}