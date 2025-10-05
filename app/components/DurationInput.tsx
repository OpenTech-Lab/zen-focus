'use client';

import { useState, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { parseDurationInput, validateDurationInput } from '@/lib/utils/durationInput';
import { cn } from '@/lib/utils';

/**
 * Props for the DurationInput component.
 *
 * @interface DurationInputProps
 *
 * @property {(durationInSeconds: number) => void} onDurationSet - Callback invoked when a valid duration is set
 * @property {() => void} onCancel - Callback invoked when the input is cancelled
 * @property {number} [defaultValue] - Optional default duration value in seconds to pre-populate the input
 * @property {string} [className] - Optional CSS class name for styling the component container
 */
interface DurationInputProps {
  onDurationSet: (durationInSeconds: number) => void;
  onCancel: () => void;
  defaultValue?: number;
  className?: string;
}

/**
 * Duration input component for setting custom timer durations.
 *
 * This component provides a flexible input field for users to enter timer durations
 * in various formats (minutes, MM:SS, or HH:MM:SS). It includes validation, error
 * handling, and keyboard shortcuts for improved user experience.
 *
 * @component
 *
 * @remarks
 * - Accepts multiple input formats: minutes (e.g., "25"), MM:SS (e.g., "25:30"), or HH:MM:SS
 * - Validates input and displays error messages for invalid durations
 * - Supports keyboard shortcuts: Enter to submit, Escape to cancel
 * - Auto-focuses the input field when mounted
 * - Converts defaultValue from seconds to user-friendly format
 * - Memoized to prevent unnecessary re-renders
 *
 * @param {DurationInputProps} props - Component props
 *
 * @example
 * ```tsx
 * <DurationInput
 *   onDurationSet={(seconds) => console.log('Duration set:', seconds)}
 *   onCancel={() => console.log('Cancelled')}
 *   defaultValue={1500} // 25 minutes
 * />
 * ```
 *
 * @returns {React.ReactElement} Duration input form with validation
 */
const DurationInput = memo(function DurationInput({
  onDurationSet,
  onCancel,
  defaultValue,
  className,
}: DurationInputProps) {
  /**
   * Current value of the duration input field.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [inputValue, setInputValue] = useState('');

  /**
   * Validation error message, if any.
   * @type {[string | undefined, React.Dispatch<React.SetStateAction<string | undefined>>]}
   */
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (defaultValue) {
      // Convert seconds to MM:SS format
      const minutes = Math.floor(defaultValue / 60);
      const seconds = defaultValue % 60;
      setInputValue(seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${minutes}`);
    }
  }, [defaultValue]);

  /**
   * Handles form submission.
   * Parses and validates the input, then calls onDurationSet if valid.
   * Displays error message if validation fails.
   */
  const handleSubmit = () => {
    const durationInSeconds = parseDurationInput(inputValue);
    const validation = validateDurationInput(durationInSeconds);

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError(undefined);
    onDurationSet(durationInSeconds);
  };

  /**
   * Handles keyboard events on the input field.
   * Enter key submits the form, Escape key cancels.
   *
   * @param {React.KeyboardEvent<HTMLInputElement>} e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="e.g., 25 or 25:30"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(undefined);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'font-mono',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          autoFocus
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          className="shrink-0"
          title="Set duration"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={onCancel}
          className="shrink-0"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Enter minutes (e.g., 25) or MM:SS (e.g., 25:30) or HH:MM:SS
      </p>
    </div>
  );
});

export default DurationInput;
