import { z } from 'zod'

/**
 * Theme type for user interface appearance
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Session mode type for default session mode
 */
export type SessionMode = 'study' | 'deepwork' | 'yoga' | 'zen'

/**
 * Ambient sound type for background audio
 */
export type AmbientSound = 'rain' | 'forest' | 'ocean' | 'silence'

/**
 * User preferences interface based on OpenAPI specification
 * Represents user customization settings for the ZenFocus application
 */
export interface UserPreferences {
  /** User interface theme preference (light, dark, or system) */
  theme: Theme
  /** Default session mode for new timer sessions */
  defaultSessionMode: SessionMode
  /** Default ambient sound for focus sessions */
  ambientSound: AmbientSound
  /** Ambient sound volume (0-100) */
  ambientVolume: number
  /** Whether to show notifications */
  notifications: boolean
  /** Whether to automatically start break sessions */
  autoStartBreaks: boolean
}

/**
 * Zod schema for UserPreferences validation
 * Provides runtime validation matching the OpenAPI specification
 */
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], {
    errorMap: () => ({ message: 'Theme must be one of: light, dark, system' }),
  }),
  defaultSessionMode: z.enum(['study', 'deepwork', 'yoga', 'zen'], {
    errorMap: () => ({
      message: 'Default session mode must be one of: study, deepwork, yoga, zen',
    }),
  }),
  ambientSound: z.enum(['rain', 'forest', 'ocean', 'silence'], {
    errorMap: () => ({ message: 'Ambient sound must be one of: rain, forest, ocean, silence' }),
  }),
  ambientVolume: z
    .number()
    .int('Ambient volume must be an integer')
    .min(0, 'Ambient volume must be between 0 and 100')
    .max(100, 'Ambient volume must be between 0 and 100'),
  notifications: z.boolean({
    errorMap: () => ({ message: 'Notifications must be a boolean value' }),
  }),
  autoStartBreaks: z.boolean({
    errorMap: () => ({ message: 'Auto start breaks must be a boolean value' }),
  }),
})

/**
 * Type derived from Zod schema for compile-time type checking
 */
export type UserPreferencesType = z.infer<typeof UserPreferencesSchema>

/**
 * Helper function to create default user preferences
 * Returns UserPreferences with the default values specified in the API contract
 * @returns UserPreferences object with default values
 */
export function createDefaultUserPreferences(): UserPreferences {
  return {
    theme: 'system',
    defaultSessionMode: 'study',
    ambientSound: 'silence',
    ambientVolume: 50,
    notifications: true,
    autoStartBreaks: true,
  }
}

/**
 * Helper function to validate user preferences data at runtime
 * @param preferencesData - Object to validate as UserPreferences
 * @returns Validation result with parsed data or error details
 */
export function validateUserPreferences(
  preferencesData: unknown
): z.SafeParseReturnType<unknown, UserPreferences> {
  return UserPreferencesSchema.safeParse(preferencesData)
}

/**
 * Partial UserPreferences type for preference updates
 */
export type PartialUserPreferences = Partial<UserPreferences>

/**
 * Helper function to merge partial user preferences with defaults
 * Takes partial preferences and fills in missing values with defaults
 * @param partialPreferences - Partial preferences to merge with defaults
 * @returns Complete UserPreferences object
 */
export function mergeUserPreferences(partialPreferences: PartialUserPreferences): UserPreferences {
  const defaults = createDefaultUserPreferences()

  return {
    ...defaults,
    ...partialPreferences,
  }
}

/**
 * API response type for user preferences data (snake_case fields)
 */
interface ApiUserPreferencesResponse {
  theme: Theme
  default_session_mode: SessionMode
  ambient_sound: AmbientSound
  ambient_volume: number
  notifications: boolean
  auto_start_breaks: boolean
}

/**
 * Helper function to transform API response to UserPreferences model
 * Converts snake_case API fields to camelCase model fields
 * @param apiData - API response data in snake_case format
 * @returns UserPreferences object with camelCase fields
 */
export function transformUserPreferencesFromApi(
  apiData: ApiUserPreferencesResponse
): UserPreferences {
  return {
    theme: apiData.theme,
    defaultSessionMode: apiData.default_session_mode,
    ambientSound: apiData.ambient_sound,
    ambientVolume: apiData.ambient_volume,
    notifications: apiData.notifications,
    autoStartBreaks: apiData.auto_start_breaks,
  }
}

/**
 * Helper function to transform UserPreferences model to API format
 * Converts camelCase model fields to snake_case API fields
 * @param preferences - UserPreferences object with camelCase fields
 * @returns API data with snake_case fields
 */
export function transformUserPreferencesToApi(
  preferences: UserPreferences
): ApiUserPreferencesResponse {
  return {
    theme: preferences.theme,
    default_session_mode: preferences.defaultSessionMode,
    ambient_sound: preferences.ambientSound,
    ambient_volume: preferences.ambientVolume,
    notifications: preferences.notifications,
    auto_start_breaks: preferences.autoStartBreaks,
  }
}

/**
 * Helper function to check if theme preference requires dark mode
 * @param preferences - UserPreferences object
 * @param systemTheme - Current system theme ('light' | 'dark')
 * @returns Whether dark mode should be active
 */
export function isDarkModeActive(
  preferences: UserPreferences,
  systemTheme: 'light' | 'dark' = 'light'
): boolean {
  switch (preferences.theme) {
    case 'dark':
      return true
    case 'light':
      return false
    case 'system':
      return systemTheme === 'dark'
    default:
      return false
  }
}

/**
 * Helper function to get human-readable labels for preference values
 */
export const PreferenceLabels = {
  theme: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  defaultSessionMode: {
    study: 'Study',
    deepwork: 'Deep Work',
    yoga: 'Yoga',
    zen: 'Zen',
  },
  ambientSound: {
    rain: 'Rain',
    forest: 'Forest',
    ocean: 'Ocean',
    silence: 'Silence',
  },
} as const

/**
 * Helper function to validate individual preference fields
 * Useful for form validation and incremental updates
 */
export const FieldValidators = {
  theme: (value: unknown) => z.enum(['light', 'dark', 'system']).safeParse(value),
  defaultSessionMode: (value: unknown) =>
    z.enum(['study', 'deepwork', 'yoga', 'zen']).safeParse(value),
  ambientSound: (value: unknown) => z.enum(['rain', 'forest', 'ocean', 'silence']).safeParse(value),
  ambientVolume: (value: unknown) => z.number().int().min(0).max(100).safeParse(value),
  notifications: (value: unknown) => z.boolean().safeParse(value),
  autoStartBreaks: (value: unknown) => z.boolean().safeParse(value),
} as const
