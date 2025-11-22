'use client';

import React from 'react';
import { getFocusModeList, type FocusMode } from '@/lib/constants/focus-modes';

/**
 * Props for FocusModeSelector component.
 *
 * @interface FocusModeSelectorProps
 * @property {FocusMode} selectedMode - Currently selected focus mode
 * @property {(mode: FocusMode) => void} onModeChange - Callback when mode is changed
 */
interface FocusModeSelectorProps {
  selectedMode: FocusMode;
  onModeChange: (mode: FocusMode) => void;
}

/**
 * FocusModeSelector component for choosing between different focus modes.
 *
 * This component provides a radio group interface for selecting between Study, Work,
 * Yoga, and Meditation modes. It's designed to be used within the Focus tab to allow
 * users to switch between different timer configurations without changing tabs.
 *
 * @component
 *
 * @remarks
 * - Uses native radio inputs for accessibility
 * - Supports keyboard navigation (arrow keys)
 * - Displays all available focus modes in a horizontal layout
 * - Visual feedback for selected mode with border styling
 * - Fully accessible with proper ARIA labels and roles
 *
 * @example
 * ```tsx
 * const [mode, setMode] = useState<FocusMode>('study');
 * return (
 *   <FocusModeSelector
 *     selectedMode={mode}
 *     onModeChange={setMode}
 *   />
 * );
 * ```
 *
 * @param {FocusModeSelectorProps} props - Component props
 * @returns {React.ReactElement} Radio group for focus mode selection
 */
export default function FocusModeSelector({
  selectedMode,
  onModeChange,
}: FocusModeSelectorProps): React.ReactElement {
  const focusModes = getFocusModeList();

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onModeChange(event.target.value as FocusMode);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Focus mode"
      className="flex gap-3 mb-8 justify-center flex-wrap"
    >
      {focusModes.map((mode) => (
        <label
          key={mode.value}
          className={`
            relative flex items-center justify-center
            px-6 py-3 rounded-lg border-2 cursor-pointer
            transition-all duration-200 ease-in-out
            ${
              selectedMode === mode.value
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'
            }
            focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
          `}
        >
          <input
            type="radio"
            name="focus-mode"
            value={mode.value}
            checked={selectedMode === mode.value}
            onChange={handleModeChange}
            aria-label={mode.label}
            className="sr-only"
          />
          <span className="text-sm font-medium">{mode.label}</span>
        </label>
      ))}
    </div>
  );
}
