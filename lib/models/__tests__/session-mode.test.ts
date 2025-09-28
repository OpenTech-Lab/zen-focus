import { describe, expect, test } from '@jest/globals'
import {
  SessionMode,
  SessionModeSchema,
  SessionModeType,
  createDefaultSessionModes,
  validateSessionMode,
  compareSessionModes,
  getSessionModeById,
  isHexColor,
} from '../session-mode'

describe('SessionMode Data Model', () => {
  describe('SessionModeSchema validation', () => {
    test('should validate a valid session mode object', () => {
      const validSessionMode = {
        id: 'study',
        name: 'Study Mode',
        description: 'Focused learning sessions with extended work periods',
        defaultWorkDuration: 50,
        defaultBreakDuration: 10,
        color: '#3B82F6',
        icon: 'book',
        isCustomizable: true,
      }

      const result = SessionModeSchema.safeParse(validSessionMode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validSessionMode)
      }
    })

    test('should validate session mode with optional fields', () => {
      const validSessionMode = {
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
      }

      const result = SessionModeSchema.safeParse(validSessionMode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validSessionMode)
      }
    })

    test('should validate hex color format (#RRGGBB)', () => {
      const validColors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#123ABC']

      validColors.forEach((color) => {
        const sessionMode = {
          id: 'test',
          name: 'Test Mode',
          description: 'Test description',
          defaultWorkDuration: 25,
          defaultBreakDuration: 5,
          color,
          icon: 'test',
          isCustomizable: false,
        }

        const result = SessionModeSchema.safeParse(sessionMode)
        expect(result.success).toBe(true)
      })
    })

    test('should validate duration constraints (non-negative for defaults)', () => {
      const sessionModeZeroDurations = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: 0,
        defaultBreakDuration: 0,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
      }

      const result = SessionModeSchema.safeParse(sessionModeZeroDurations)
      expect(result.success).toBe(true)
    })

    test('should validate max duration constraints (≥ 1)', () => {
      const sessionModeMinMaxDurations = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
        maxWorkDuration: 1,
        maxBreakDuration: 1,
      }

      const result = SessionModeSchema.safeParse(sessionModeMinMaxDurations)
      expect(result.success).toBe(true)
    })

    test('should reject invalid hex color format', () => {
      const invalidColors = ['#FFF', '#GGGGGG', '#12345G', 'blue', 'rgb(255,0,0)', '#1234567']

      invalidColors.forEach((color) => {
        const sessionMode = {
          id: 'test',
          name: 'Test Mode',
          description: 'Test description',
          defaultWorkDuration: 25,
          defaultBreakDuration: 5,
          color,
          icon: 'test',
          isCustomizable: false,
        }

        const result = SessionModeSchema.safeParse(sessionMode)
        expect(result.success).toBe(false)
      })
    })

    test('should reject negative default durations', () => {
      const sessionModeNegativeDurations = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: -1,
        defaultBreakDuration: -1,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
      }

      const result = SessionModeSchema.safeParse(sessionModeNegativeDurations)
      expect(result.success).toBe(false)
    })

    test('should reject zero or negative max durations', () => {
      const sessionModeZeroMaxDurations = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
        maxWorkDuration: 0,
        maxBreakDuration: 0,
      }

      const result = SessionModeSchema.safeParse(sessionModeZeroMaxDurations)
      expect(result.success).toBe(false)
    })

    test('should reject missing required fields', () => {
      const incompleteSessionMode = {
        id: 'test',
        name: 'Test Mode',
        // Missing description, defaultWorkDuration, defaultBreakDuration, color, icon, isCustomizable
      }

      const result = SessionModeSchema.safeParse(incompleteSessionMode)
      expect(result.success).toBe(false)
    })

    test('should reject empty object', () => {
      const result = SessionModeSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    test('should reject invalid data types', () => {
      const invalidSessionMode = {
        id: 123, // Should be string
        name: true, // Should be string
        description: null, // Should be string
        defaultWorkDuration: '25', // Should be number
        defaultBreakDuration: '5', // Should be number
        color: 123, // Should be string
        icon: [], // Should be string
        isCustomizable: 'true', // Should be boolean
      }

      const result = SessionModeSchema.safeParse(invalidSessionMode)
      expect(result.success).toBe(false)
    })
  })

  describe('createDefaultSessionModes helper function', () => {
    test('should create all four default session modes', () => {
      const sessionModes = createDefaultSessionModes()

      expect(sessionModes).toHaveLength(4)
      expect(sessionModes.map((mode) => mode.id)).toEqual(['study', 'deepwork', 'yoga', 'zen'])
    })

    test('should create study mode with correct configuration', () => {
      const sessionModes = createDefaultSessionModes()
      const studyMode = sessionModes.find((mode) => mode.id === 'study')

      expect(studyMode).toBeDefined()
      expect(studyMode?.name).toBe('Study')
      expect(studyMode?.description).toBe('Focused learning sessions with extended work periods')
      expect(studyMode?.defaultWorkDuration).toBe(50)
      expect(studyMode?.defaultBreakDuration).toBe(10)
      expect(studyMode?.color).toBe('#3B82F6')
      expect(studyMode?.icon).toBe('book')
      expect(studyMode?.isCustomizable).toBe(true)
      expect(studyMode?.maxWorkDuration).toBe(120)
      expect(studyMode?.maxBreakDuration).toBe(30)
    })

    test('should create deepwork mode with correct configuration', () => {
      const sessionModes = createDefaultSessionModes()
      const deepworkMode = sessionModes.find((mode) => mode.id === 'deepwork')

      expect(deepworkMode).toBeDefined()
      expect(deepworkMode?.name).toBe('Deep Work')
      expect(deepworkMode?.description).toBe('Extended focus sessions for complex tasks')
      expect(deepworkMode?.defaultWorkDuration).toBe(90)
      expect(deepworkMode?.defaultBreakDuration).toBe(20)
      expect(deepworkMode?.color).toBe('#7C3AED')
      expect(deepworkMode?.icon).toBe('brain')
      expect(deepworkMode?.isCustomizable).toBe(true)
      expect(deepworkMode?.maxWorkDuration).toBe(180)
      expect(deepworkMode?.maxBreakDuration).toBe(30)
    })

    test('should create yoga mode with correct configuration', () => {
      const sessionModes = createDefaultSessionModes()
      const yogaMode = sessionModes.find((mode) => mode.id === 'yoga')

      expect(yogaMode).toBeDefined()
      expect(yogaMode?.name).toBe('Yoga')
      expect(yogaMode?.description).toBe('Mindful movement and breath work sessions')
      expect(yogaMode?.defaultWorkDuration).toBe(30)
      expect(yogaMode?.defaultBreakDuration).toBe(5)
      expect(yogaMode?.color).toBe('#059669')
      expect(yogaMode?.icon).toBe('lotus')
      expect(yogaMode?.isCustomizable).toBe(false)
    })

    test('should create zen mode with correct configuration', () => {
      const sessionModes = createDefaultSessionModes()
      const zenMode = sessionModes.find((mode) => mode.id === 'zen')

      expect(zenMode).toBeDefined()
      expect(zenMode?.name).toBe('Zen')
      expect(zenMode?.description).toBe('Simple meditation and mindfulness practice')
      expect(zenMode?.defaultWorkDuration).toBe(15)
      expect(zenMode?.defaultBreakDuration).toBe(0)
      expect(zenMode?.color).toBe('#DC2626')
      expect(zenMode?.icon).toBe('circle')
      expect(zenMode?.isCustomizable).toBe(false)
    })

    test('should create valid session modes that pass schema validation', () => {
      const sessionModes = createDefaultSessionModes()

      sessionModes.forEach((mode) => {
        const result = SessionModeSchema.safeParse(mode)
        expect(result.success).toBe(true)
      })
    })

    test('should create consistent defaults on multiple calls', () => {
      const sessionModes1 = createDefaultSessionModes()
      const sessionModes2 = createDefaultSessionModes()

      expect(sessionModes1).toEqual(sessionModes2)
    })
  })

  describe('validateSessionMode helper function', () => {
    test('should return valid session mode when input is correct', () => {
      const validInput = {
        id: 'custom',
        name: 'Custom Mode',
        description: 'A custom session mode',
        defaultWorkDuration: 45,
        defaultBreakDuration: 15,
        color: '#FF6B6B',
        icon: 'star',
        isCustomizable: true,
      }

      const result = validateSessionMode(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInput)
      }
    })

    test('should return error details when input is invalid', () => {
      const invalidInput = {
        id: '',
        name: '',
        description: '',
        defaultWorkDuration: -1,
        defaultBreakDuration: -1,
        color: 'invalid-color',
        icon: '',
        isCustomizable: 'not-boolean',
      }

      const result = validateSessionMode(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    test('should handle null and undefined input', () => {
      expect(validateSessionMode(null).success).toBe(false)
      expect(validateSessionMode(undefined).success).toBe(false)
    })
  })

  describe('compareSessionModes helper function', () => {
    test('should return 0 for identical session modes', () => {
      const mode1 = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
      }

      const mode2 = { ...mode1 }

      expect(compareSessionModes(mode1, mode2)).toBe(0)
    })

    test('should return negative value when first mode name comes before second alphabetically', () => {
      const mode1 = {
        id: 'a',
        name: 'A Mode',
        description: 'A description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'a',
        isCustomizable: false,
      }

      const mode2 = {
        id: 'b',
        name: 'B Mode',
        description: 'B description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'b',
        isCustomizable: false,
      }

      expect(compareSessionModes(mode1, mode2)).toBeLessThan(0)
    })

    test('should return positive value when first mode name comes after second alphabetically', () => {
      const mode1 = {
        id: 'z',
        name: 'Z Mode',
        description: 'Z description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'z',
        isCustomizable: false,
      }

      const mode2 = {
        id: 'a',
        name: 'A Mode',
        description: 'A description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'a',
        isCustomizable: false,
      }

      expect(compareSessionModes(mode1, mode2)).toBeGreaterThan(0)
    })

    test('should be case insensitive', () => {
      const mode1 = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
      }

      const mode2 = {
        id: 'test',
        name: 'test mode',
        description: 'Test description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
      }

      expect(compareSessionModes(mode1, mode2)).toBe(0)
    })
  })

  describe('getSessionModeById helper function', () => {
    test('should return session mode when found', () => {
      const sessionModes = createDefaultSessionModes()
      const studyMode = getSessionModeById(sessionModes, 'study')

      expect(studyMode).toBeDefined()
      expect(studyMode?.id).toBe('study')
      expect(studyMode?.name).toBe('Study')
    })

    test('should return undefined when mode not found', () => {
      const sessionModes = createDefaultSessionModes()
      const nonExistentMode = getSessionModeById(sessionModes, 'nonexistent')

      expect(nonExistentMode).toBeUndefined()
    })

    test('should return undefined for empty array', () => {
      const result = getSessionModeById([], 'study')
      expect(result).toBeUndefined()
    })

    test('should find all default session modes', () => {
      const sessionModes = createDefaultSessionModes()
      const defaultModeIds = ['study', 'deepwork', 'yoga', 'zen']

      defaultModeIds.forEach((id) => {
        const mode = getSessionModeById(sessionModes, id)
        expect(mode).toBeDefined()
        expect(mode?.id).toBe(id)
      })
    })
  })

  describe('isHexColor helper function', () => {
    test('should return true for valid hex colors', () => {
      const validColors = [
        '#000000',
        '#FFFFFF',
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#123ABC',
        '#abcdef',
        '#ABCDEF',
      ]

      validColors.forEach((color) => {
        expect(isHexColor(color)).toBe(true)
      })
    })

    test('should return false for invalid hex colors', () => {
      const invalidColors = [
        '#FFF',
        '#GGGGGG',
        '#12345G',
        'blue',
        'rgb(255,0,0)',
        '#1234567',
        '#',
        'FFFFFF',
        '123456',
      ]

      invalidColors.forEach((color) => {
        expect(isHexColor(color)).toBe(false)
      })
    })

    test('should return false for non-string input', () => {
      expect(isHexColor(123 as any)).toBe(false)
      expect(isHexColor(null as any)).toBe(false)
      expect(isHexColor(undefined as any)).toBe(false)
      expect(isHexColor([] as any)).toBe(false)
      expect(isHexColor({} as any)).toBe(false)
    })
  })

  describe('TypeScript interface', () => {
    test('should enforce proper typing at compile time', () => {
      // This test validates TypeScript interface compliance
      const sessionMode: SessionMode = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
      }

      // These should compile without errors
      expect(typeof sessionMode.id).toBe('string')
      expect(typeof sessionMode.name).toBe('string')
      expect(typeof sessionMode.description).toBe('string')
      expect(typeof sessionMode.defaultWorkDuration).toBe('number')
      expect(typeof sessionMode.defaultBreakDuration).toBe('number')
      expect(typeof sessionMode.color).toBe('string')
      expect(typeof sessionMode.icon).toBe('string')
      expect(typeof sessionMode.isCustomizable).toBe('boolean')
    })

    test('should allow optional fields', () => {
      const sessionModeWithOptionals: SessionMode = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
        maxWorkDuration: 120,
        maxBreakDuration: 30,
      }

      expect(typeof sessionModeWithOptionals.maxWorkDuration).toBe('number')
      expect(typeof sessionModeWithOptionals.maxBreakDuration).toBe('number')
    })

    test('should match Zod schema type', () => {
      const sessionMode: SessionModeType = {
        id: 'test',
        name: 'Test Mode',
        description: 'Test description',
        defaultWorkDuration: 25,
        defaultBreakDuration: 5,
        color: '#000000',
        icon: 'test',
        isCustomizable: false,
      }

      const result = SessionModeSchema.safeParse(sessionMode)
      expect(result.success).toBe(true)
    })
  })
})
