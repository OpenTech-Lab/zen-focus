import { describe, expect, test } from '@jest/globals';
import {
  UserPreferences,
  UserPreferencesSchema,
  createDefaultUserPreferences,
  validateUserPreferences,
  mergeUserPreferences,
  Theme,
  SessionMode,
  AmbientSound
} from '../user-preferences';

describe('UserPreferences Data Model', () => {
  describe('UserPreferencesSchema validation', () => {
    test('should validate a valid user preferences object with defaults', () => {
      const validPreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: 50,
        notifications: true,
        autoStartBreaks: true,
      };

      const result = UserPreferencesSchema.safeParse(validPreferences);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPreferences);
      }
    });

    test('should validate user preferences with all valid enum values', () => {
      const validPreferences = {
        theme: 'dark' as const,
        defaultSessionMode: 'deepwork' as const,
        ambientSound: 'rain' as const,
        ambientVolume: 75,
        notifications: false,
        autoStartBreaks: false,
      };

      const result = UserPreferencesSchema.safeParse(validPreferences);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPreferences);
      }
    });

    test('should validate all theme enum values', () => {
      const themes: Theme[] = ['light', 'dark', 'system'];

      themes.forEach(theme => {
        const preferences = {
          theme,
          defaultSessionMode: 'study' as const,
          ambientSound: 'silence' as const,
          ambientVolume: 50,
          notifications: true,
          autoStartBreaks: true,
        };

        const result = UserPreferencesSchema.safeParse(preferences);
        expect(result.success).toBe(true);
      });
    });

    test('should validate all defaultSessionMode enum values', () => {
      const sessionModes: SessionMode[] = ['study', 'deepwork', 'yoga', 'zen'];

      sessionModes.forEach(defaultSessionMode => {
        const preferences = {
          theme: 'system' as const,
          defaultSessionMode,
          ambientSound: 'silence' as const,
          ambientVolume: 50,
          notifications: true,
          autoStartBreaks: true,
        };

        const result = UserPreferencesSchema.safeParse(preferences);
        expect(result.success).toBe(true);
      });
    });

    test('should validate all ambientSound enum values', () => {
      const ambientSounds: AmbientSound[] = ['rain', 'forest', 'ocean', 'silence'];

      ambientSounds.forEach(ambientSound => {
        const preferences = {
          theme: 'system' as const,
          defaultSessionMode: 'study' as const,
          ambientSound,
          ambientVolume: 50,
          notifications: true,
          autoStartBreaks: true,
        };

        const result = UserPreferencesSchema.safeParse(preferences);
        expect(result.success).toBe(true);
      });
    });

    test('should validate volume range bounds (0 and 100)', () => {
      const preferencesMinVolume = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: 0,
        notifications: true,
        autoStartBreaks: true,
      };

      const preferencesMaxVolume = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: 100,
        notifications: true,
        autoStartBreaks: true,
      };

      expect(UserPreferencesSchema.safeParse(preferencesMinVolume).success).toBe(true);
      expect(UserPreferencesSchema.safeParse(preferencesMaxVolume).success).toBe(true);
    });

    test('should reject invalid theme enum value', () => {
      const invalidPreferences = {
        theme: 'invalid-theme',
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: 50,
        notifications: true,
        autoStartBreaks: true,
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    test('should reject invalid defaultSessionMode enum value', () => {
      const invalidPreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'invalid-mode',
        ambientSound: 'silence' as const,
        ambientVolume: 50,
        notifications: true,
        autoStartBreaks: true,
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    test('should reject invalid ambientSound enum value', () => {
      const invalidPreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'invalid-sound',
        ambientVolume: 50,
        notifications: true,
        autoStartBreaks: true,
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    test('should reject volume below 0', () => {
      const invalidPreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: -1,
        notifications: true,
        autoStartBreaks: true,
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    test('should reject volume above 100', () => {
      const invalidPreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: 101,
        notifications: true,
        autoStartBreaks: true,
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    test('should reject non-integer volume', () => {
      const invalidPreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: 50.5,
        notifications: true,
        autoStartBreaks: true,
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    test('should reject non-boolean notifications', () => {
      const invalidPreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: 50,
        notifications: 'true', // String instead of boolean
        autoStartBreaks: true,
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    test('should reject non-boolean autoStartBreaks', () => {
      const invalidPreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        ambientSound: 'silence' as const,
        ambientVolume: 50,
        notifications: true,
        autoStartBreaks: 1, // Number instead of boolean
      };

      const result = UserPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });

    test('should reject missing required fields', () => {
      const incompletePreferences = {
        theme: 'system' as const,
        defaultSessionMode: 'study' as const,
        // Missing ambientSound, ambientVolume, notifications, autoStartBreaks
      };

      const result = UserPreferencesSchema.safeParse(incompletePreferences);
      expect(result.success).toBe(false);
    });

    test('should reject empty object', () => {
      const result = UserPreferencesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('createDefaultUserPreferences helper function', () => {
    test('should create user preferences with correct default values', () => {
      const preferences = createDefaultUserPreferences();

      expect(preferences.theme).toBe('system');
      expect(preferences.defaultSessionMode).toBe('study');
      expect(preferences.ambientSound).toBe('silence');
      expect(preferences.ambientVolume).toBe(50);
      expect(preferences.notifications).toBe(true);
      expect(preferences.autoStartBreaks).toBe(true);
    });

    test('should create valid preferences that pass schema validation', () => {
      const preferences = createDefaultUserPreferences();
      const result = UserPreferencesSchema.safeParse(preferences);

      expect(result.success).toBe(true);
    });

    test('should create consistent defaults on multiple calls', () => {
      const preferences1 = createDefaultUserPreferences();
      const preferences2 = createDefaultUserPreferences();

      expect(preferences1).toEqual(preferences2);
    });
  });

  describe('validateUserPreferences helper function', () => {
    test('should return valid preferences when input is correct', () => {
      const validInput = {
        theme: 'dark' as const,
        defaultSessionMode: 'deepwork' as const,
        ambientSound: 'forest' as const,
        ambientVolume: 80,
        notifications: false,
        autoStartBreaks: false,
      };

      const result = validateUserPreferences(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    test('should return error details when input is invalid', () => {
      const invalidInput = {
        theme: 'invalid-theme',
        defaultSessionMode: 'invalid-mode',
        ambientSound: 'invalid-sound',
        ambientVolume: -1,
        notifications: 'not-boolean',
        autoStartBreaks: 123,
      };

      const result = validateUserPreferences(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    test('should handle null and undefined input', () => {
      expect(validateUserPreferences(null).success).toBe(false);
      expect(validateUserPreferences(undefined).success).toBe(false);
    });
  });

  describe('mergeUserPreferences helper function', () => {
    test('should merge partial preferences with defaults', () => {
      const partialPreferences = {
        theme: 'dark' as const,
        ambientVolume: 75,
      };

      const result = mergeUserPreferences(partialPreferences);

      expect(result).toEqual({
        theme: 'dark',
        defaultSessionMode: 'study', // Default
        ambientSound: 'silence', // Default
        ambientVolume: 75, // Overridden
        notifications: true, // Default
        autoStartBreaks: true, // Default
      });
    });

    test('should override all defaults when full preferences provided', () => {
      const fullPreferences = {
        theme: 'light' as const,
        defaultSessionMode: 'zen' as const,
        ambientSound: 'ocean' as const,
        ambientVolume: 25,
        notifications: false,
        autoStartBreaks: false,
      };

      const result = mergeUserPreferences(fullPreferences);
      expect(result).toEqual(fullPreferences);
    });

    test('should handle empty partial preferences', () => {
      const result = mergeUserPreferences({});
      const defaults = createDefaultUserPreferences();

      expect(result).toEqual(defaults);
    });

    test('should preserve valid partial enum values', () => {
      const partialPreferences = {
        defaultSessionMode: 'yoga' as const,
        ambientSound: 'rain' as const,
      };

      const result = mergeUserPreferences(partialPreferences);

      expect(result.defaultSessionMode).toBe('yoga');
      expect(result.ambientSound).toBe('rain');
      expect(result.theme).toBe('system'); // Default preserved
    });

    test('should handle single field updates', () => {
      const tests = [
        { theme: 'light' as const },
        { defaultSessionMode: 'deepwork' as const },
        { ambientSound: 'forest' as const },
        { ambientVolume: 90 },
        { notifications: false },
        { autoStartBreaks: false },
      ];

      tests.forEach(partialPreferences => {
        const result = mergeUserPreferences(partialPreferences);
        const defaults = createDefaultUserPreferences();

        // Verify the specific field was updated
        Object.keys(partialPreferences).forEach(key => {
          expect(result[key as keyof UserPreferences]).toBe(
            partialPreferences[key as keyof typeof partialPreferences]
          );
        });

        // Verify other fields remain default
        Object.keys(defaults).forEach(key => {
          if (!(key in partialPreferences)) {
            expect(result[key as keyof UserPreferences]).toBe(
              defaults[key as keyof UserPreferences]
            );
          }
        });
      });
    });
  });

  describe('TypeScript interface', () => {
    test('should enforce proper typing at compile time', () => {
      // This test validates TypeScript interface compliance
      const preferences: UserPreferences = {
        theme: 'system',
        defaultSessionMode: 'study',
        ambientSound: 'silence',
        ambientVolume: 50,
        notifications: true,
        autoStartBreaks: true,
      };

      // These should compile without errors
      expect(typeof preferences.theme).toBe('string');
      expect(typeof preferences.defaultSessionMode).toBe('string');
      expect(typeof preferences.ambientSound).toBe('string');
      expect(typeof preferences.ambientVolume).toBe('number');
      expect(typeof preferences.notifications).toBe('boolean');
      expect(typeof preferences.autoStartBreaks).toBe('boolean');
    });

    test('should enforce enum constraints at compile time', () => {
      // These assignments should only work with valid enum values
      const theme: Theme = 'system';
      const sessionMode: SessionMode = 'study';
      const ambientSound: AmbientSound = 'silence';

      expect(['light', 'dark', 'system']).toContain(theme);
      expect(['study', 'deepwork', 'yoga', 'zen']).toContain(sessionMode);
      expect(['rain', 'forest', 'ocean', 'silence']).toContain(ambientSound);
    });
  });
});