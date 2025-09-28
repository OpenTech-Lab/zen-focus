import { describe, expect, test } from '@jest/globals';
import {
  TimerState,
  TimerStateSchema,
  createTimerState,
  validateTimerState,
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
  getElapsedInCurrentCycle
} from '../timer-state';

describe('TimerState Data Model', () => {
  describe('TimerStateSchema validation', () => {
    test('should validate a valid timer state object', () => {
      const validTimerState = {
        isActive: false,
        isPaused: false,
        mode: 'study' as const,
        phase: 'work' as const,
        timeRemaining: 1500, // 25 minutes in seconds
        totalElapsed: 0,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(validTimerState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validTimerState);
      }
    });

    test('should validate timer state with all session modes', () => {
      const modes = ['study', 'deepwork', 'yoga', 'zen'] as const;

      modes.forEach(mode => {
        const timerState = {
          isActive: true,
          isPaused: false,
          mode,
          phase: 'work' as const,
          timeRemaining: 900,
          totalElapsed: 300,
          currentCycle: 2,
        };

        const result = TimerStateSchema.safeParse(timerState);
        expect(result.success).toBe(true);
      });
    });

    test('should validate timer state with both phases', () => {
      const phases = ['work', 'break'] as const;

      phases.forEach(phase => {
        const timerState = {
          isActive: true,
          isPaused: false,
          mode: 'study' as const,
          phase,
          timeRemaining: 300,
          totalElapsed: 1200,
          currentCycle: 3,
        };

        const result = TimerStateSchema.safeParse(timerState);
        expect(result.success).toBe(true);
      });
    });

    test('should reject invalid session mode', () => {
      const invalidTimerState = {
        isActive: false,
        isPaused: false,
        mode: 'invalid-mode',
        phase: 'work',
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(invalidTimerState);
      expect(result.success).toBe(false);
    });

    test('should reject invalid phase', () => {
      const invalidTimerState = {
        isActive: false,
        isPaused: false,
        mode: 'study',
        phase: 'invalid-phase',
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(invalidTimerState);
      expect(result.success).toBe(false);
    });

    test('should reject negative timeRemaining', () => {
      const invalidTimerState = {
        isActive: false,
        isPaused: false,
        mode: 'study',
        phase: 'work',
        timeRemaining: -100,
        totalElapsed: 0,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(invalidTimerState);
      expect(result.success).toBe(false);
    });

    test('should reject negative totalElapsed', () => {
      const invalidTimerState = {
        isActive: false,
        isPaused: false,
        mode: 'study',
        phase: 'work',
        timeRemaining: 1500,
        totalElapsed: -300,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(invalidTimerState);
      expect(result.success).toBe(false);
    });

    test('should reject currentCycle less than 1', () => {
      const invalidTimerState = {
        isActive: false,
        isPaused: false,
        mode: 'study',
        phase: 'work',
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 0,
      };

      const result = TimerStateSchema.safeParse(invalidTimerState);
      expect(result.success).toBe(false);
    });

    test('should reject non-boolean isActive', () => {
      const invalidTimerState = {
        isActive: 'true',
        isPaused: false,
        mode: 'study',
        phase: 'work',
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(invalidTimerState);
      expect(result.success).toBe(false);
    });

    test('should reject non-boolean isPaused', () => {
      const invalidTimerState = {
        isActive: false,
        isPaused: 'false',
        mode: 'study',
        phase: 'work',
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(invalidTimerState);
      expect(result.success).toBe(false);
    });

    test('should reject missing required fields', () => {
      const incompleteTimerState = {
        isActive: false,
        isPaused: false,
        mode: 'study',
        // Missing phase, timeRemaining, totalElapsed, currentCycle
      };

      const result = TimerStateSchema.safeParse(incompleteTimerState);
      expect(result.success).toBe(false);
    });

    test('should allow zero timeRemaining', () => {
      const timerState = {
        isActive: false,
        isPaused: false,
        mode: 'study' as const,
        phase: 'work' as const,
        timeRemaining: 0,
        totalElapsed: 1500,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(timerState);
      expect(result.success).toBe(true);
    });

    test('should allow zero totalElapsed', () => {
      const timerState = {
        isActive: false,
        isPaused: false,
        mode: 'study' as const,
        phase: 'work' as const,
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 1,
      };

      const result = TimerStateSchema.safeParse(timerState);
      expect(result.success).toBe(true);
    });
  });

  describe('createTimerState helper function', () => {
    test('should create initial timer state with defaults', () => {
      const timerState = createTimerState('study', 1500);

      expect(timerState.isActive).toBe(false);
      expect(timerState.isPaused).toBe(false);
      expect(timerState.mode).toBe('study');
      expect(timerState.phase).toBe('work');
      expect(timerState.timeRemaining).toBe(1500);
      expect(timerState.totalElapsed).toBe(0);
      expect(timerState.currentCycle).toBe(1);
    });

    test('should create timer state for different modes', () => {
      const modes = ['study', 'deepwork', 'yoga', 'zen'] as const;

      modes.forEach(mode => {
        const timerState = createTimerState(mode, 1800);
        expect(timerState.mode).toBe(mode);
        expect(timerState.timeRemaining).toBe(1800);
      });
    });
  });

  describe('validateTimerState helper function', () => {
    test('should return valid timer state when input is correct', () => {
      const validInput = {
        isActive: true,
        isPaused: false,
        mode: 'deepwork',
        phase: 'break',
        timeRemaining: 300,
        totalElapsed: 2700,
        currentCycle: 2,
      };

      const result = validateTimerState(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    test('should return error details when input is invalid', () => {
      const invalidInput = {
        isActive: 'invalid',
        isPaused: 'invalid',
        mode: 'invalid-mode',
        phase: 'invalid-phase',
        timeRemaining: -100,
        totalElapsed: -200,
        currentCycle: 0,
      };

      const result = validateTimerState(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(7); // All fields should have validation errors
      }
    });
  });

  describe('Timer state management functions', () => {
    let baseTimerState: TimerState;

    beforeEach(() => {
      baseTimerState = createTimerState('study', 1500);
    });

    describe('startTimer', () => {
      test('should start inactive timer', () => {
        const result = startTimer(baseTimerState);

        expect(result.isActive).toBe(true);
        expect(result.isPaused).toBe(false);
        expect(result.timeRemaining).toBe(1500);
      });

      test('should not change already active timer', () => {
        const activeTimer = { ...baseTimerState, isActive: true };
        const result = startTimer(activeTimer);

        expect(result).toEqual(activeTimer);
      });

      test('should resume paused timer', () => {
        const pausedTimer = { ...baseTimerState, isActive: false, isPaused: true, timeRemaining: 1200 };
        const result = startTimer(pausedTimer);

        expect(result.isActive).toBe(true);
        expect(result.isPaused).toBe(false);
        expect(result.timeRemaining).toBe(1200);
      });
    });

    describe('pauseTimer', () => {
      test('should pause active timer', () => {
        const activeTimer = { ...baseTimerState, isActive: true };
        const result = pauseTimer(activeTimer);

        expect(result.isActive).toBe(false);
        expect(result.isPaused).toBe(true);
      });

      test('should not change inactive timer', () => {
        const result = pauseTimer(baseTimerState);

        expect(result).toEqual(baseTimerState);
      });
    });

    describe('resumeTimer', () => {
      test('should resume paused timer', () => {
        const pausedTimer = { ...baseTimerState, isActive: false, isPaused: true };
        const result = resumeTimer(pausedTimer);

        expect(result.isActive).toBe(true);
        expect(result.isPaused).toBe(false);
      });

      test('should not change non-paused timer', () => {
        const result = resumeTimer(baseTimerState);

        expect(result).toEqual(baseTimerState);
      });
    });

    describe('resetTimer', () => {
      test('should reset timer to initial state', () => {
        const modifiedTimer = {
          ...baseTimerState,
          isActive: true,
          isPaused: true,
          timeRemaining: 800,
          totalElapsed: 700,
          currentCycle: 3,
        };

        const result = resetTimer(modifiedTimer, 1500);

        expect(result.isActive).toBe(false);
        expect(result.isPaused).toBe(false);
        expect(result.timeRemaining).toBe(1500);
        expect(result.totalElapsed).toBe(0);
        expect(result.currentCycle).toBe(1);
        expect(result.phase).toBe('work');
      });
    });

    describe('switchPhase', () => {
      test('should switch from work to break', () => {
        const workTimer = { ...baseTimerState, phase: 'work' as const };
        const result = switchPhase(workTimer, 300);

        expect(result.phase).toBe('break');
        expect(result.timeRemaining).toBe(300);
        expect(result.isActive).toBe(false);
        expect(result.isPaused).toBe(false);
      });

      test('should switch from break to work', () => {
        const breakTimer = { ...baseTimerState, phase: 'break' as const };
        const result = switchPhase(breakTimer, 1500);

        expect(result.phase).toBe('work');
        expect(result.timeRemaining).toBe(1500);
        expect(result.isActive).toBe(false);
        expect(result.isPaused).toBe(false);
      });
    });

    describe('incrementCycle', () => {
      test('should increment current cycle', () => {
        const result = incrementCycle(baseTimerState);

        expect(result.currentCycle).toBe(2);
      });

      test('should maintain other state properties', () => {
        const modifiedTimer = {
          ...baseTimerState,
          isActive: true,
          timeRemaining: 1200,
          totalElapsed: 300,
        };

        const result = incrementCycle(modifiedTimer);

        expect(result.currentCycle).toBe(2);
        expect(result.isActive).toBe(true);
        expect(result.timeRemaining).toBe(1200);
        expect(result.totalElapsed).toBe(300);
      });
    });

    describe('updateTimeRemaining', () => {
      test('should update time remaining', () => {
        const result = updateTimeRemaining(baseTimerState, 1200);

        expect(result.timeRemaining).toBe(1200);
      });

      test('should not allow negative time', () => {
        const result = updateTimeRemaining(baseTimerState, -100);

        expect(result.timeRemaining).toBe(0);
      });
    });
  });

  describe('Timer state validation functions', () => {
    test('canStart should return true for inactive, non-paused timer with time remaining', () => {
      const timer = createTimerState('study', 1500);
      expect(canStart(timer)).toBe(true);
    });

    test('canStart should return true for paused timer', () => {
      const timer = { ...createTimerState('study', 1500), isPaused: true };
      expect(canStart(timer)).toBe(true);
    });

    test('canStart should return false for active timer', () => {
      const timer = { ...createTimerState('study', 1500), isActive: true };
      expect(canStart(timer)).toBe(false);
    });

    test('canStart should return false for timer with no time remaining', () => {
      const timer = createTimerState('study', 0);
      expect(canStart(timer)).toBe(false);
    });

    test('canPause should return true for active timer', () => {
      const timer = { ...createTimerState('study', 1500), isActive: true };
      expect(canPause(timer)).toBe(true);
    });

    test('canPause should return false for inactive timer', () => {
      const timer = createTimerState('study', 1500);
      expect(canPause(timer)).toBe(false);
    });

    test('canResume should return true for paused timer', () => {
      const timer = { ...createTimerState('study', 1500), isPaused: true };
      expect(canResume(timer)).toBe(true);
    });

    test('canResume should return false for non-paused timer', () => {
      const timer = createTimerState('study', 1500);
      expect(canResume(timer)).toBe(false);
    });

    test('isActiveTimer should return true only when timer is active and not paused', () => {
      const activeTimer = { ...createTimerState('study', 1500), isActive: true, isPaused: false };
      expect(isActiveTimer(activeTimer)).toBe(true);

      const inactiveTimer = createTimerState('study', 1500);
      expect(isActiveTimer(inactiveTimer)).toBe(false);

      const pausedTimer = { ...createTimerState('study', 1500), isActive: false, isPaused: true };
      expect(isActiveTimer(pausedTimer)).toBe(false);
    });
  });

  describe('Timer progress and calculation functions', () => {
    test('getTimerProgress should calculate progress correctly', () => {
      const timer = { ...createTimerState('study', 1500), timeRemaining: 750 };
      const progress = getTimerProgress(timer, 1500);

      expect(progress).toBe(50); // 50% completed
    });

    test('getTimerProgress should handle edge cases', () => {
      const timerComplete = { ...createTimerState('study', 1500), timeRemaining: 0 };
      expect(getTimerProgress(timerComplete, 1500)).toBe(100);

      const timerNotStarted = createTimerState('study', 1500);
      expect(getTimerProgress(timerNotStarted, 1500)).toBe(0);
    });

    test('getElapsedInCurrentCycle should calculate elapsed time correctly', () => {
      const timer = { ...createTimerState('study', 1500), timeRemaining: 1200, totalElapsed: 300 };
      const elapsed = getElapsedInCurrentCycle(timer, 1500);

      expect(elapsed).toBe(300); // 1500 - 1200 = 300 seconds elapsed
    });
  });

  describe('Timer state logical consistency', () => {
    test('should not allow active and paused simultaneously', () => {
      const inconsistentState = {
        isActive: true,
        isPaused: true,
        mode: 'study' as const,
        phase: 'work' as const,
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 1,
      };

      // This should be caught by business logic, not just schema validation
      expect(isActiveTimer(inconsistentState)).toBe(false);
    });

    test('should validate timer state transitions', () => {
      let timer = createTimerState('study', 1500);

      // Start timer
      timer = startTimer(timer);
      expect(timer.isActive).toBe(true);
      expect(timer.isPaused).toBe(false);

      // Pause timer
      timer = pauseTimer(timer);
      expect(timer.isActive).toBe(false);
      expect(timer.isPaused).toBe(true);

      // Resume timer
      timer = resumeTimer(timer);
      expect(timer.isActive).toBe(true);
      expect(timer.isPaused).toBe(false);

      // Reset timer
      timer = resetTimer(timer, 1500);
      expect(timer.isActive).toBe(false);
      expect(timer.isPaused).toBe(false);
      expect(timer.timeRemaining).toBe(1500);
      expect(timer.totalElapsed).toBe(0);
      expect(timer.currentCycle).toBe(1);
    });
  });

  describe('TypeScript interface', () => {
    test('should enforce proper typing at compile time', () => {
      // This test validates TypeScript interface compliance
      const timer: TimerState = {
        isActive: false,
        isPaused: false,
        mode: 'study',
        phase: 'work',
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 1,
      };

      // These should compile without errors
      expect(typeof timer.isActive).toBe('boolean');
      expect(typeof timer.isPaused).toBe('boolean');
      expect(typeof timer.mode).toBe('string');
      expect(typeof timer.phase).toBe('string');
      expect(typeof timer.timeRemaining).toBe('number');
      expect(typeof timer.totalElapsed).toBe('number');
      expect(typeof timer.currentCycle).toBe('number');

      // Validate enum values
      expect(['study', 'deepwork', 'yoga', 'zen']).toContain(timer.mode);
      expect(['work', 'break']).toContain(timer.phase);
    });
  });
});