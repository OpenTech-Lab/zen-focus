"use client";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function TimerControls({ isRunning, onStart, onPause, onReset }: TimerControlsProps) {
  return (
    <div className="flex gap-4">
      {!isRunning ? (
        <button
          onClick={onStart}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start
        </button>
      ) : (
        <button
          onClick={onPause}
          className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Pause
        </button>
      )}
      <button
        onClick={onReset}
        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        Reset
      </button>
    </div>
  );
}
