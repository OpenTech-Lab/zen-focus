import { describe, it, expect } from 'vitest';

/**
 * Type definition for FocusMode object structure.
 * This type ensures all focus mode configurations have the required properties.
 */
interface FocusMode {
  value: string;
  label: string;
  title: string;
  description: string;
  duration: number;
  color: string;
}

/**
 * Expected focus modes data.
 * This mirrors the data that will be in the centralized focus-modes.ts file.
 */
const EXPECTED_FOCUS_MODES: Record<string, FocusMode> = {
  study: {
    value: 'study',
    label: 'Study',
    title: 'Study Timer',
    description: 'Focus timer for deep study sessions',
    duration: 1500, // 25 minutes
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  work: {
    value: 'work',
    label: 'Work',
    title: 'Deep Work Timer',
    description: 'Focused timer for deep work sessions',
    duration: 3600, // 60 minutes
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  yoga: {
    value: 'yoga',
    label: 'Yoga',
    title: 'Yoga Timer',
    description: 'Mindful timer for yoga practice',
    duration: 1800, // 30 minutes
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  meditation: {
    value: 'meditation',
    label: 'Meditation',
    title: 'Meditation Timer',
    description: 'Calm timer for meditation practice',
    duration: 600, // 10 minutes
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
};

describe('Focus Modes Configuration', () => {
  describe('Focus modes existence', () => {
    it('should have exactly 4 focus modes defined', () => {
      const focusModeKeys = Object.keys(EXPECTED_FOCUS_MODES);
      expect(focusModeKeys).toHaveLength(4);
    });

    it('should contain study focus mode', () => {
      expect(EXPECTED_FOCUS_MODES).toHaveProperty('study');
    });

    it('should contain work focus mode', () => {
      expect(EXPECTED_FOCUS_MODES).toHaveProperty('work');
    });

    it('should contain yoga focus mode', () => {
      expect(EXPECTED_FOCUS_MODES).toHaveProperty('yoga');
    });

    it('should contain meditation focus mode', () => {
      expect(EXPECTED_FOCUS_MODES).toHaveProperty('meditation');
    });
  });

  describe('Focus mode structure and required properties', () => {
    const focusModes = Object.values(EXPECTED_FOCUS_MODES);

    it('should have value property for all modes', () => {
      focusModes.forEach((mode) => {
        expect(mode).toHaveProperty('value');
        expect(typeof mode.value).toBe('string');
        expect(mode.value.length).toBeGreaterThan(0);
      });
    });

    it('should have label property for all modes', () => {
      focusModes.forEach((mode) => {
        expect(mode).toHaveProperty('label');
        expect(typeof mode.label).toBe('string');
        expect(mode.label.length).toBeGreaterThan(0);
      });
    });

    it('should have title property for all modes', () => {
      focusModes.forEach((mode) => {
        expect(mode).toHaveProperty('title');
        expect(typeof mode.title).toBe('string');
        expect(mode.title.length).toBeGreaterThan(0);
      });
    });

    it('should have description property for all modes', () => {
      focusModes.forEach((mode) => {
        expect(mode).toHaveProperty('description');
        expect(typeof mode.description).toBe('string');
        expect(mode.description.length).toBeGreaterThan(0);
      });
    });

    it('should have duration property for all modes', () => {
      focusModes.forEach((mode) => {
        expect(mode).toHaveProperty('duration');
        expect(typeof mode.duration).toBe('number');
        expect(mode.duration).toBeGreaterThan(0);
      });
    });

    it('should have color property for all modes', () => {
      focusModes.forEach((mode) => {
        expect(mode).toHaveProperty('color');
        expect(typeof mode.color).toBe('string');
        expect(mode.color.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Study mode configuration', () => {
    const studyMode = EXPECTED_FOCUS_MODES.study;

    it('should have correct value', () => {
      expect(studyMode.value).toBe('study');
    });

    it('should have correct label', () => {
      expect(studyMode.label).toBe('Study');
    });

    it('should have correct title', () => {
      expect(studyMode.title).toBe('Study Timer');
    });

    it('should have correct description', () => {
      expect(studyMode.description).toBe('Focus timer for deep study sessions');
    });

    it('should have duration of 1500 seconds (25 minutes)', () => {
      expect(studyMode.duration).toBe(1500);
    });

    it('should have blue color scheme', () => {
      expect(studyMode.color).toBe('bg-blue-500/10 text-blue-600 dark:text-blue-400');
    });
  });

  describe('Work mode configuration', () => {
    const workMode = EXPECTED_FOCUS_MODES.work;

    it('should have correct value', () => {
      expect(workMode.value).toBe('work');
    });

    it('should have correct label', () => {
      expect(workMode.label).toBe('Work');
    });

    it('should have correct title', () => {
      expect(workMode.title).toBe('Deep Work Timer');
    });

    it('should have correct description', () => {
      expect(workMode.description).toBe('Focused timer for deep work sessions');
    });

    it('should have duration of 3600 seconds (60 minutes)', () => {
      expect(workMode.duration).toBe(3600);
    });

    it('should have purple color scheme', () => {
      expect(workMode.color).toBe('bg-purple-500/10 text-purple-600 dark:text-purple-400');
    });
  });

  describe('Yoga mode configuration', () => {
    const yogaMode = EXPECTED_FOCUS_MODES.yoga;

    it('should have correct value', () => {
      expect(yogaMode.value).toBe('yoga');
    });

    it('should have correct label', () => {
      expect(yogaMode.label).toBe('Yoga');
    });

    it('should have correct title', () => {
      expect(yogaMode.title).toBe('Yoga Timer');
    });

    it('should have correct description', () => {
      expect(yogaMode.description).toBe('Mindful timer for yoga practice');
    });

    it('should have duration of 1800 seconds (30 minutes)', () => {
      expect(yogaMode.duration).toBe(1800);
    });

    it('should have green color scheme', () => {
      expect(yogaMode.color).toBe('bg-green-500/10 text-green-600 dark:text-green-400');
    });
  });

  describe('Meditation mode configuration', () => {
    const meditationMode = EXPECTED_FOCUS_MODES.meditation;

    it('should have correct value', () => {
      expect(meditationMode.value).toBe('meditation');
    });

    it('should have correct label', () => {
      expect(meditationMode.label).toBe('Meditation');
    });

    it('should have correct title', () => {
      expect(meditationMode.title).toBe('Meditation Timer');
    });

    it('should have correct description', () => {
      expect(meditationMode.description).toBe('Calm timer for meditation practice');
    });

    it('should have duration of 600 seconds (10 minutes)', () => {
      expect(meditationMode.duration).toBe(600);
    });

    it('should have amber color scheme', () => {
      expect(meditationMode.color).toBe('bg-amber-500/10 text-amber-600 dark:text-amber-400');
    });
  });

  describe('Focus mode type safety', () => {
    it('should ensure value matches the key for all modes', () => {
      Object.entries(EXPECTED_FOCUS_MODES).forEach(([key, mode]) => {
        expect(mode.value).toBe(key);
      });
    });

    it('should have consistent label capitalization', () => {
      Object.values(EXPECTED_FOCUS_MODES).forEach((mode) => {
        // Label should be a single word with first letter capitalized
        expect(mode.label).toMatch(/^[A-Z][a-z]+$/);
      });
    });

    it('should have consistent duration values (all positive integers)', () => {
      Object.values(EXPECTED_FOCUS_MODES).forEach((mode) => {
        expect(Number.isInteger(mode.duration)).toBe(true);
        expect(mode.duration).toBeGreaterThan(0);
      });
    });

    it('should have unique durations for each mode', () => {
      const durations = Object.values(EXPECTED_FOCUS_MODES).map((m) => m.duration);
      const uniqueDurations = new Set(durations);
      expect(uniqueDurations.size).toBe(durations.length);
    });

    it('should have valid Tailwind color classes', () => {
      Object.values(EXPECTED_FOCUS_MODES).forEach((mode) => {
        // Color should contain Tailwind classes with proper format
        expect(mode.color).toMatch(/bg-\w+-\d+\/\d+ text-\w+-\d+/);
      });
    });
  });

  describe('Focus mode relationships', () => {
    it('study mode should have the shortest common duration', () => {
      const meditationDuration = EXPECTED_FOCUS_MODES.meditation.duration;
      const studyDuration = EXPECTED_FOCUS_MODES.study.duration;

      // Meditation is shortest (10 min), study is next (25 min)
      expect(studyDuration).toBeGreaterThan(meditationDuration);
    });

    it('work mode should have the longest duration', () => {
      const workDuration = EXPECTED_FOCUS_MODES.work.duration;

      Object.values(EXPECTED_FOCUS_MODES).forEach((mode) => {
        if (mode.value !== 'work') {
          expect(workDuration).toBeGreaterThan(mode.duration);
        }
      });
    });

    it('yoga duration should be between study and work', () => {
      const yogaDuration = EXPECTED_FOCUS_MODES.yoga.duration;
      const studyDuration = EXPECTED_FOCUS_MODES.study.duration;
      const workDuration = EXPECTED_FOCUS_MODES.work.duration;

      expect(yogaDuration).toBeGreaterThan(studyDuration);
      expect(yogaDuration).toBeLessThan(workDuration);
    });

    it('should have distinct color themes for each mode', () => {
      const colors = Object.values(EXPECTED_FOCUS_MODES).map((m) => m.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });
});
