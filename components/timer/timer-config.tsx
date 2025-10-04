"use client";

interface TimerConfigProps {
  duration: number;
  onDurationChange: (duration: number) => void;
}

export function TimerConfig({ duration, onDurationChange }: TimerConfigProps) {
  const presets = [5, 15, 25, 45, 60];

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium">Duration (minutes)</label>
      <div className="flex gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => onDurationChange(preset)}
            className={`px-4 py-2 rounded-lg ${
              duration === preset
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {preset}m
          </button>
        ))}
      </div>
    </div>
  );
}
