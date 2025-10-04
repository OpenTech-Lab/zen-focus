'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { parseDurationInput, validateDurationInput } from '@/lib/utils/durationInput';
import { cn } from '@/lib/utils';

interface DurationInputProps {
  onDurationSet: (durationInSeconds: number) => void;
  onCancel: () => void;
  defaultValue?: number;
  className?: string;
}

export default function DurationInput({
  onDurationSet,
  onCancel,
  defaultValue,
  className,
}: DurationInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (defaultValue) {
      // Convert seconds to MM:SS format
      const minutes = Math.floor(defaultValue / 60);
      const seconds = defaultValue % 60;
      setInputValue(seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${minutes}`);
    }
  }, [defaultValue]);

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
}
