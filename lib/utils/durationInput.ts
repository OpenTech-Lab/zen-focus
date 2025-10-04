/**
 * Parse duration input string to seconds
 * Supports formats:
 * - "25" (minutes only)
 * - "25:30" (minutes:seconds)
 * - "1:30:45" (hours:minutes:seconds)
 */
export function parseDurationInput(input: string): number {
  if (!input || input.trim() === '') {
    return 0;
  }

  const parts = input.split(':').map(part => parseInt(part, 10));

  // Check if any part is NaN
  if (parts.some(part => isNaN(part))) {
    return 0;
  }

  if (parts.length === 1) {
    // Minutes only
    return parts[0] * 60;
  } else if (parts.length === 2) {
    // Minutes:Seconds
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // Hours:Minutes:Seconds
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate duration in seconds
 * Minimum: 1 second
 * Maximum: 24 hours (86400 seconds)
 */
export function validateDurationInput(durationInSeconds: number): ValidationResult {
  const MIN_DURATION = 1; // 1 second
  const MAX_DURATION = 86400; // 24 hours

  if (durationInSeconds < MIN_DURATION) {
    return {
      isValid: false,
      error: 'Duration must be at least 1 second',
    };
  }

  if (durationInSeconds > MAX_DURATION) {
    return {
      isValid: false,
      error: 'Duration cannot exceed 24 hours',
    };
  }

  return {
    isValid: true,
  };
}
