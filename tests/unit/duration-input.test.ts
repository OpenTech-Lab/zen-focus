import { describe, it, expect } from 'vitest';
import { parseDurationInput, validateDurationInput } from '@/lib/utils/durationInput';

describe('DurationInput', () => {
  describe('parseDurationInput', () => {
    it('should parse minutes only input', () => {
      const result = parseDurationInput('25');
      expect(result).toBe(1500); // 25 minutes * 60 seconds
    });

    it('should parse minutes and seconds input', () => {
      const result = parseDurationInput('25:30');
      expect(result).toBe(1530); // 25 minutes * 60 + 30 seconds
    });

    it('should handle single digit minutes', () => {
      const result = parseDurationInput('5');
      expect(result).toBe(300); // 5 minutes * 60 seconds
    });

    it('should handle zero padding in seconds', () => {
      const result = parseDurationInput('10:05');
      expect(result).toBe(605); // 10 minutes * 60 + 5 seconds
    });

    it('should return 0 for empty input', () => {
      const result = parseDurationInput('');
      expect(result).toBe(0);
    });

    it('should return 0 for invalid input', () => {
      const result = parseDurationInput('abc');
      expect(result).toBe(0);
    });

    it('should handle hours, minutes and seconds input', () => {
      const result = parseDurationInput('1:30:45');
      expect(result).toBe(5445); // 1 hour * 3600 + 30 minutes * 60 + 45 seconds
    });
  });

  describe('validateDurationInput', () => {
    it('should accept valid duration above minimum', () => {
      const result = validateDurationInput(60); // 1 minute
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject duration below minimum (1 second)', () => {
      const result = validateDurationInput(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Duration must be at least 1 second');
    });

    it('should reject duration above maximum (24 hours)', () => {
      const result = validateDurationInput(86401); // 24 hours + 1 second
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Duration cannot exceed 24 hours');
    });

    it('should accept maximum allowed duration', () => {
      const result = validateDurationInput(86400); // exactly 24 hours
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept minimum allowed duration', () => {
      const result = validateDurationInput(1); // 1 second
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
