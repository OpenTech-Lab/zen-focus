# zenFocus API Documentation

> Comprehensive API documentation for the zenFocus PWA - A mindful productivity timer application built with Next.js 15, React, and TypeScript.

## Table of Contents

- [Components API](#components-api)
  - [Timer](#timer)
  - [FocusTabs](#focustabs)
  - [TimerHistory](#timerhistory)
  - [DurationInput](#durationinput)
  - [ThemeToggle](#themetoggle)
  - [InstallPrompt](#installprompt)
  - [OfflineIndicator](#offlineindicator)
- [Hooks API](#hooks-api)
  - [useTimer](#usetimer)
  - [useTimerHistory](#usetimerhistory)
  - [useNotification](#usenotification)
- [Utilities API](#utilities-api)
  - [formatTime](#formattime)
  - [formatDuration](#formatduration)
  - [formatRelativeTime](#formatrelativetime)
  - [parseDurationInput](#parsedurationinput)
  - [validateDurationInput](#validatedurationinput)
- [Types & Interfaces](#types--interfaces)
  - [TimerSession](#timersession)
  - [TimerStatistics](#timerstatistics)
  - [UseTimerReturn](#usetimerreturn)
- [PWA Features](#pwa-features)
  - [Service Worker](#service-worker)
  - [Web App Manifest](#web-app-manifest)
  - [Offline Support](#offline-support)

---

## Components API

### Timer

Countdown timer component with customizable duration and focus modes.

**Location:** `/app/components/Timer.tsx`

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `duration` | `number` | Yes | - | Initial timer duration in seconds |
| `title` | `string` | No | `'Focus Session'` | Title displayed in completion notification |
| `onComplete` | `() => void` | No | - | Callback invoked when timer completes |
| `focusMode` | `'study' \| 'work' \| 'yoga' \| 'meditation'` | No | `'study'` | Type of focus session |
| `onSessionComplete` | `(focusMode, duration, completed) => void` | No | - | Callback for tracking session completion |

#### Features

- Circular progress indicator with remaining time
- Custom duration input during idle state
- Session tracking for analytics
- Browser notifications on completion
- Records incomplete sessions when paused
- Memoized to prevent unnecessary re-renders
- Automatically resets when duration prop changes (only when idle)

#### Usage Example

```tsx
import Timer from '@/app/components/Timer';

function MyApp() {
  const handleComplete = () => {
    console.log('Timer complete!');
  };

  const handleSessionComplete = (mode, duration, completed) => {
    console.log(`${mode} session: ${duration}s, completed: ${completed}`);
  };

  return (
    <Timer
      duration={1500} // 25 minutes in seconds
      title="Study Session"
      focusMode="study"
      onComplete={handleComplete}
      onSessionComplete={handleSessionComplete}
    />
  );
}
```

#### Behavior Notes

- Timer tracks sessions that run for at least 1 second
- Incomplete sessions are recorded when paused after starting
- Custom duration input available via "Custom Duration" button
- Progress is visualized with animated circular indicator
- Displays completion message with animation when finished

---

### FocusTabs

Main tabbed interface component for the focus timer application.

**Location:** `/app/components/FocusTabs.tsx`

#### Props

This component does not accept props. It manages its own state internally.

#### Features

- 4 focus mode tabs: Study, Work, Yoga, Meditation
- 1 history tab for session analytics
- Pre-configured timer durations for each mode
- Integrates with timer history tracking
- Respects user's reduced motion preferences
- Smooth tab transitions with Framer Motion
- Theme toggle in top-right corner
- Fully accessible with ARIA labels

#### Focus Mode Configuration

| Mode | Duration | Description |
|------|----------|-------------|
| Study | 1500s (25 min) | Deep study sessions |
| Work | 3600s (60 min) | Deep work sessions |
| Yoga | 1800s (30 min) | Yoga practice |
| Meditation | 600s (10 min) | Meditation practice |

#### Usage Example

```tsx
import FocusTabs from '@/app/components/FocusTabs';

export default function App() {
  return <FocusTabs />;
}
```

#### Animation Configuration

The component uses Framer Motion for tab transitions:

```typescript
const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};
```

Animations are simplified for users with `prefers-reduced-motion` enabled.

---

### TimerHistory

Timer history and statistics display component.

**Location:** `/app/components/TimerHistory.tsx`

#### Props

This component does not accept props. It uses the `useTimerHistory` hook internally.

#### Features

- Comprehensive statistics dashboard
- Displays 10 most recent sessions
- Confirmation dialog for clearing history
- Memoized for performance optimization
- Responsive grid layout
- Empty state when no sessions exist

#### Statistics Displayed

| Metric | Description | Icon |
|--------|-------------|------|
| Total Sessions | Count of all timer sessions | Target |
| Completed | Count of completed sessions | Target |
| Total Time | Sum of time spent on completed sessions | Clock |
| Current Streak | Consecutive days with completed sessions | Flame |
| Longest Streak | Longest streak ever achieved | Calendar |
| Sessions by Mode | Breakdown by focus mode (badges) | - |

#### Usage Example

```tsx
import TimerHistory from '@/app/components/TimerHistory';

function HistoryTab() {
  return <TimerHistory />;
}
```

#### Focus Mode Styling

```typescript
const focusModeConfig = {
  study: { label: 'Study', color: 'bg-blue-500/10 text-blue-600' },
  work: { label: 'Work', color: 'bg-purple-500/10 text-purple-600' },
  yoga: { label: 'Yoga', color: 'bg-green-500/10 text-green-600' },
  meditation: { label: 'Meditation', color: 'bg-amber-500/10 text-amber-600' }
};
```

---

### DurationInput

Duration input component for setting custom timer durations.

**Location:** `/app/components/DurationInput.tsx`

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onDurationSet` | `(durationInSeconds: number) => void` | Yes | - | Callback invoked when valid duration is set |
| `onCancel` | `() => void` | Yes | - | Callback invoked when input is cancelled |
| `defaultValue` | `number` | No | - | Default duration value in seconds |
| `className` | `string` | No | - | Optional CSS class name |

#### Features

- Accepts multiple input formats
- Validates input with error messages
- Keyboard shortcuts (Enter to submit, Escape to cancel)
- Auto-focuses input field
- Converts defaultValue to user-friendly format
- Memoized to prevent unnecessary re-renders

#### Supported Input Formats

| Format | Example | Description |
|--------|---------|-------------|
| Minutes | `25` | Minutes only (converted to seconds) |
| MM:SS | `25:30` | Minutes and seconds |
| HH:MM:SS | `1:30:45` | Hours, minutes, and seconds |

#### Validation Rules

- Minimum duration: 1 second
- Maximum duration: 24 hours (86400 seconds)
- Invalid formats show error message

#### Usage Example

```tsx
import DurationInput from '@/app/components/DurationInput';

function CustomTimerForm() {
  const handleDurationSet = (seconds) => {
    console.log('Duration set:', seconds);
  };

  const handleCancel = () => {
    console.log('Cancelled');
  };

  return (
    <DurationInput
      onDurationSet={handleDurationSet}
      onCancel={handleCancel}
      defaultValue={1500} // 25 minutes
    />
  );
}
```

#### Error Handling

```tsx
// Too short
Input: "0"
Error: "Duration must be at least 1 second"

// Too long
Input: "25:00:00" (25 hours)
Error: "Duration cannot exceed 24 hours"
```

---

### ThemeToggle

Theme toggle button component that switches between light and dark modes.

**Location:** `/app/components/ThemeToggle.tsx`

#### Props

This component does not accept props. It uses `next-themes` internally.

#### Features

- Toggles between light and dark themes
- Uses next-themes library for state management
- Handles hydration mismatches
- Sun icon in dark mode, Moon icon in light mode
- Supports system theme preferences
- Smooth transitions between theme changes
- Memoized to prevent unnecessary re-renders

#### Usage Example

```tsx
import { ThemeToggle } from '@/app/components/ThemeToggle';

function Header() {
  return (
    <div className="header">
      <h1>zenFocus</h1>
      <ThemeToggle />
    </div>
  );
}
```

#### Theme Provider Setup

The component requires `ThemeProvider` from `next-themes`:

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

### InstallPrompt

PWA installation prompt component.

**Location:** `/app/components/InstallPrompt.tsx`

#### Props

This component does not accept props. It manages installation state internally.

#### Features

- Listens for beforeinstallprompt event
- Prevents browser's default mini-infobar on mobile
- Shows fixed banner at bottom of viewport
- Install or dismiss options
- Only shows when PWA installation is available
- Works with Chrome, Edge, and Chromium-based browsers

#### Usage Example

```tsx
import { InstallPrompt } from '@/app/components/InstallPrompt';

// Add to root layout for PWA install functionality
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
```

#### Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Edge | ✅ Full support |
| Opera | ✅ Full support |
| Safari | ❌ Limited (iOS 16.4+) |
| Firefox | ❌ Not supported |

#### Event Flow

```typescript
// 1. Browser fires beforeinstallprompt event
window.addEventListener('beforeinstallprompt', handler);

// 2. Component shows custom UI
setShowInstallPrompt(true);

// 3. User clicks Install
await deferredPrompt.prompt();

// 4. Wait for user response
const { outcome } = await deferredPrompt.userChoice;

// 5. Clean up
setDeferredPrompt(null);
setShowInstallPrompt(false);
```

---

### OfflineIndicator

Offline indicator component that displays when user loses connectivity.

**Location:** `/app/components/OfflineIndicator.tsx`

#### Props

This component does not accept props. It monitors connectivity automatically.

#### Features

- Monitors browser's online/offline status
- Uses Navigator.onLine API
- Listens to 'online' and 'offline' window events
- Only renders when offline
- Fixed position at bottom center
- Important for PWA functionality

#### Usage Example

```tsx
import { OfflineIndicator } from '@/app/components/OfflineIndicator';

// Add to root layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <OfflineIndicator />
      </body>
    </html>
  );
}
```

#### Connectivity Detection

```typescript
// Initial check
const isOnline = navigator.onLine;

// Listen for changes
window.addEventListener('online', () => setIsOnline(true));
window.addEventListener('offline', () => setIsOnline(false));
```

---

## Hooks API

### useTimer

Custom hook for managing timer state and controls.

**Location:** `/lib/hooks/useTimer.ts`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `initialDuration` | `number` | No | `1500` | Initial timer duration in seconds |

#### Return Value

Returns an object of type `UseTimerReturn`:

| Property | Type | Description |
|----------|------|-------------|
| `timeLeft` | `number` | Remaining time in seconds |
| `isRunning` | `boolean` | Whether timer is currently running |
| `isComplete` | `boolean` | Whether timer has completed |
| `start` | `() => void` | Start the timer |
| `pause` | `() => void` | Pause the timer |
| `reset` | `() => void` | Reset timer to initial duration |
| `setDuration` | `(seconds: number) => void` | Set new duration and reset |

#### Usage Example

```tsx
import { useTimer } from '@/lib/hooks/useTimer';
import { formatTime } from '@/lib/utils/formatTime';

function SimpleTimer() {
  const { timeLeft, isRunning, start, pause, reset } = useTimer(1500);

  return (
    <div>
      <h1>{formatTime(timeLeft)}</h1>
      <button onClick={isRunning ? pause : start}>
        {isRunning ? 'Pause' : 'Start'}
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

#### Advanced Example

```tsx
import { useTimer } from '@/lib/hooks/useTimer';

function AdvancedTimer() {
  const timer = useTimer(1500);

  useEffect(() => {
    if (timer.isComplete) {
      console.log('Timer completed!');
    }
  }, [timer.isComplete]);

  const handleSetCustomDuration = () => {
    timer.setDuration(3600); // 1 hour
  };

  return (
    <div>
      <p>Time: {timer.timeLeft}s</p>
      <p>Status: {timer.isRunning ? 'Running' : 'Paused'}</p>
      <button onClick={timer.start}>Start</button>
      <button onClick={timer.pause}>Pause</button>
      <button onClick={timer.reset}>Reset</button>
      <button onClick={handleSetCustomDuration}>Set 1 Hour</button>
    </div>
  );
}
```

#### Implementation Details

- Uses `setInterval` for countdown
- Cleans up interval on unmount
- Memoized callbacks to prevent unnecessary re-renders
- Automatically stops at 0 and sets `isComplete` to true

---

### useTimerHistory

Custom hook for managing timer session history and statistics.

**Location:** `/lib/hooks/useTimerHistory.ts`

#### Parameters

None

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `sessions` | `TimerSession[]` | Array of all timer sessions |
| `addSession` | `(focusMode, duration, completed) => void` | Add new session to history |
| `clearHistory` | `() => void` | Clear all session history |
| `getStatistics` | `() => TimerStatistics` | Get computed statistics |

#### Storage

- Uses localStorage with key `'zenFocus_timerHistory'`
- Automatically persists sessions
- Loads sessions on mount
- Handles JSON parsing errors gracefully

#### Usage Example

```tsx
import { useTimerHistory } from '@/lib/hooks/useTimerHistory';

function HistoryPanel() {
  const { sessions, addSession, clearHistory, getStatistics } = useTimerHistory();
  const stats = getStatistics();

  const handleAddSession = () => {
    addSession('study', 1500, true);
  };

  return (
    <div>
      <h2>Statistics</h2>
      <p>Total Sessions: {stats.totalSessions}</p>
      <p>Completed: {stats.completedSessions}</p>
      <p>Total Time: {stats.totalTimeSpent}s</p>
      <p>Current Streak: {stats.currentStreak} days</p>

      <h2>Recent Sessions</h2>
      {sessions.slice(0, 5).map(session => (
        <div key={session.id}>
          {session.focusMode} - {session.duration}s
        </div>
      ))}

      <button onClick={handleAddSession}>Add Session</button>
      <button onClick={clearHistory}>Clear History</button>
    </div>
  );
}
```

#### Streak Calculation

Streaks are calculated based on consecutive days with at least one completed session:

- **Current Streak**: Active if last session was today or yesterday
- **Longest Streak**: Maximum consecutive days ever achieved
- Days are compared in YYYY-MM-DD format (local timezone)

#### Session Object Structure

```typescript
{
  id: "1234567890-abc123",
  focusMode: "study",
  duration: 1500,
  completedAt: "2025-10-05T10:30:00.000Z",
  completed: true
}
```

---

### useNotification

Custom hook for browser notifications and sounds.

**Location:** `/lib/hooks/useNotification.ts`

#### Parameters

None

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `notify` | `(title: string, body: string) => void` | Show notification with sound |
| `playSound` | `() => void` | Play notification sound only |
| `showNotification` | `(title: string, body: string) => void` | Show notification only |

#### Features

- Requests notification permission automatically
- Plays notification sound from `/notification.mp3`
- Shows browser notification with custom icon
- Handles permission denial gracefully
- Creates audio element on mount

#### Usage Example

```tsx
import { useNotification } from '@/lib/hooks/useNotification';

function NotificationDemo() {
  const { notify, playSound, showNotification } = useNotification();

  return (
    <div>
      <button onClick={() => notify('Timer Complete', 'Great work!')}>
        Full Notification
      </button>
      <button onClick={playSound}>
        Sound Only
      </button>
      <button onClick={() => showNotification('Alert', 'Check this out')}>
        Visual Only
      </button>
    </div>
  );
}
```

#### Notification Permissions

| Permission State | Behavior |
|-----------------|----------|
| `granted` | Shows notification immediately |
| `denied` | Skips notification (no error) |
| `default` | Requests permission, then shows if granted |

#### Error Handling

```typescript
// Sound playback errors are logged but don't throw
audioRef.current.play().catch((error) => {
  console.warn('Failed to play notification sound:', error);
});
```

#### Best Practices

```tsx
// Use in timer completion
useEffect(() => {
  if (isComplete) {
    notify('Study Session Complete!', 'Great work! Take a break.');
  }
}, [isComplete, notify]);

// Request permission early
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

---

## Utilities API

### formatTime

Formats seconds into MM:SS format.

**Location:** `/lib/utils/formatTime.ts`

#### Signature

```typescript
function formatTime(seconds: number): string
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `seconds` | `number` | Total seconds to format |

#### Returns

`string` - Formatted time string (e.g., "25:00")

#### Usage Example

```typescript
import { formatTime } from '@/lib/utils/formatTime';

formatTime(0);     // "00:00"
formatTime(30);    // "00:30"
formatTime(90);    // "01:30"
formatTime(1500);  // "25:00"
formatTime(3661);  // "61:01"
```

#### Implementation

```typescript
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
```

---

### formatDuration

Formats seconds into a readable duration string.

**Location:** `/lib/utils/formatDuration.ts`

#### Signature

```typescript
function formatDuration(seconds: number): string
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `seconds` | `number` | Total seconds to format |

#### Returns

`string` - Formatted duration (e.g., "2h 30m", "45m", "1h")

#### Usage Example

```typescript
import { formatDuration } from '@/lib/utils/formatDuration';

formatDuration(0);      // "0m"
formatDuration(1800);   // "30m"
formatDuration(3600);   // "1h"
formatDuration(5400);   // "1h 30m"
formatDuration(7200);   // "2h"
formatDuration(9000);   // "2h 30m"
```

#### Format Rules

- Hours only: When minutes = 0 (e.g., "2h")
- Minutes only: When hours = 0 (e.g., "45m")
- Combined: When both exist (e.g., "2h 30m")

---

### formatRelativeTime

Formats an ISO date string to relative time.

**Location:** `/lib/utils/formatRelativeTime.ts`

#### Signature

```typescript
function formatRelativeTime(isoString: string): string
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `isoString` | `string` | ISO date string (e.g., "2025-10-05T10:30:00.000Z") |

#### Returns

`string` - Formatted relative time string

#### Usage Example

```typescript
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';

// Assuming current time is 2025-10-05T12:00:00.000Z
formatRelativeTime('2025-10-05T11:59:30.000Z'); // "just now"
formatRelativeTime('2025-10-05T11:30:00.000Z'); // "30 minutes ago"
formatRelativeTime('2025-10-05T09:00:00.000Z'); // "3 hours ago"
formatRelativeTime('2025-10-03T12:00:00.000Z'); // "2 days ago"
formatRelativeTime('2025-09-20T12:00:00.000Z'); // "9/20/2025"
```

#### Time Ranges

| Difference | Format |
|-----------|--------|
| < 60 seconds | "just now" |
| < 60 minutes | "X minute(s) ago" |
| < 24 hours | "X hour(s) ago" |
| < 7 days | "X day(s) ago" |
| ≥ 7 days | Date string (localized) |

---

### parseDurationInput

Parse duration input string to seconds.

**Location:** `/lib/utils/durationInput.ts`

#### Signature

```typescript
function parseDurationInput(input: string): number
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | Duration input string |

#### Returns

`number` - Duration in seconds (returns 0 for invalid input)

#### Supported Formats

| Format | Example | Result (seconds) |
|--------|---------|-----------------|
| Minutes only | `"25"` | 1500 |
| MM:SS | `"25:30"` | 1530 |
| HH:MM:SS | `"1:30:45"` | 5445 |

#### Usage Example

```typescript
import { parseDurationInput } from '@/lib/utils/durationInput';

parseDurationInput('25');         // 1500 (25 minutes)
parseDurationInput('25:30');      // 1530 (25 min 30 sec)
parseDurationInput('1:30:45');    // 5445 (1h 30m 45s)
parseDurationInput('invalid');    // 0
parseDurationInput('');           // 0
```

#### Error Handling

```typescript
// Invalid inputs return 0
parseDurationInput('abc');     // 0
parseDurationInput('12:xy');   // 0
parseDurationInput('');        // 0
parseDurationInput('  ');      // 0
```

---

### validateDurationInput

Validate duration in seconds.

**Location:** `/lib/utils/durationInput.ts`

#### Signature

```typescript
function validateDurationInput(durationInSeconds: number): ValidationResult

interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `durationInSeconds` | `number` | Duration to validate |

#### Returns

`ValidationResult` - Object with validation status and optional error message

#### Validation Rules

- Minimum: 1 second
- Maximum: 86400 seconds (24 hours)

#### Usage Example

```typescript
import { validateDurationInput } from '@/lib/utils/durationInput';

// Valid duration
const result1 = validateDurationInput(1500);
console.log(result1); // { isValid: true }

// Too short
const result2 = validateDurationInput(0);
console.log(result2);
// { isValid: false, error: 'Duration must be at least 1 second' }

// Too long
const result3 = validateDurationInput(90000);
console.log(result3);
// { isValid: false, error: 'Duration cannot exceed 24 hours' }
```

#### Complete Validation Flow

```typescript
import { parseDurationInput, validateDurationInput } from '@/lib/utils/durationInput';

function handleDurationInput(input: string) {
  const seconds = parseDurationInput(input);
  const validation = validateDurationInput(seconds);

  if (!validation.isValid) {
    console.error(validation.error);
    return null;
  }

  return seconds;
}

handleDurationInput('25');      // 1500
handleDurationInput('0');       // null (logs error)
handleDurationInput('25:00:00'); // null (logs error - exceeds 24h)
```

---

## Types & Interfaces

### TimerSession

Represents a single timer session record.

**Location:** `/lib/types/timer-history.ts`

#### Definition

```typescript
interface TimerSession {
  id: string;
  focusMode: 'study' | 'work' | 'yoga' | 'meditation';
  duration: number; // in seconds
  completedAt: string; // ISO date string
  completed: boolean; // true if timer ran to completion
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (timestamp-random) |
| `focusMode` | `'study' \| 'work' \| 'yoga' \| 'meditation'` | Type of focus session |
| `duration` | `number` | Session duration in seconds |
| `completedAt` | `string` | ISO 8601 date string of completion |
| `completed` | `boolean` | Whether timer finished or was paused |

#### Example

```typescript
const session: TimerSession = {
  id: "1696512000000-abc123def",
  focusMode: "study",
  duration: 1500,
  completedAt: "2025-10-05T10:30:00.000Z",
  completed: true
};
```

---

### TimerStatistics

Computed statistics from timer sessions.

**Location:** `/lib/types/timer-history.ts`

#### Definition

```typescript
interface TimerStatistics {
  totalSessions: number;
  completedSessions: number;
  totalTimeSpent: number; // in seconds
  currentStreak: number; // consecutive days with at least one completed session
  longestStreak: number;
  sessionsByMode: Record<string, number>;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalSessions` | `number` | Total count of all sessions |
| `completedSessions` | `number` | Count of completed sessions |
| `totalTimeSpent` | `number` | Sum of completed session durations (seconds) |
| `currentStreak` | `number` | Current consecutive days with sessions |
| `longestStreak` | `number` | Longest consecutive days ever |
| `sessionsByMode` | `Record<string, number>` | Session count by focus mode |

#### Example

```typescript
const stats: TimerStatistics = {
  totalSessions: 42,
  completedSessions: 38,
  totalTimeSpent: 57000, // ~15.8 hours
  currentStreak: 5,
  longestStreak: 14,
  sessionsByMode: {
    study: 20,
    work: 15,
    yoga: 5,
    meditation: 2
  }
};
```

---

### UseTimerReturn

Return type of the `useTimer` hook.

**Location:** `/lib/hooks/useTimer.ts`

#### Definition

```typescript
interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isComplete: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setDuration: (seconds: number) => void;
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `timeLeft` | `number` | Remaining time in seconds |
| `isRunning` | `boolean` | Whether timer is actively counting down |
| `isComplete` | `boolean` | Whether timer has reached 0 |
| `start` | `() => void` | Start/resume the timer |
| `pause` | `() => void` | Pause the timer |
| `reset` | `() => void` | Reset to initial duration |
| `setDuration` | `(seconds: number) => void` | Set new duration and reset state |

#### Usage

```typescript
import { useTimer, type UseTimerReturn } from '@/lib/hooks/useTimer';

function MyComponent() {
  const timer: UseTimerReturn = useTimer(1500);

  return (
    <div>
      <p>Time left: {timer.timeLeft}</p>
      <p>Running: {timer.isRunning ? 'Yes' : 'No'}</p>
      <p>Complete: {timer.isComplete ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

---

## PWA Features

### Service Worker

The application uses Serwist (next-generation service worker library) for PWA functionality.

**Location:** `/public/sw.js`

#### Features

- **Precaching**: All static assets are precached on install
- **Runtime Caching**: Dynamic content cached with strategies
- **Offline Support**: App works offline after first load
- **Background Sync**: Failed requests retry when online
- **Navigation Preload**: Faster page loads
- **Auto Updates**: Service worker updates automatically

#### Caching Strategies

| Resource Type | Strategy | Cache Name | Max Entries | Max Age |
|--------------|----------|------------|-------------|---------|
| Google Fonts (webfonts) | CacheFirst | google-fonts-webfonts | 4 | 1 year |
| Google Fonts (stylesheets) | StaleWhileRevalidate | google-fonts-stylesheets | 4 | 7 days |
| Static fonts | StaleWhileRevalidate | static-font-assets | 4 | 7 days |
| Images (jpg, png, svg, etc.) | StaleWhileRevalidate | static-image-assets | 64 | 30 days |
| Next.js static JS | CacheFirst | next-static-js-assets | 64 | 1 day |
| Next.js images | StaleWhileRevalidate | next-image | 64 | 1 day |
| Audio (mp3, wav, ogg) | CacheFirst | static-audio-assets | 32 | 1 day |
| Video (mp4, webm) | CacheFirst | static-video-assets | 32 | 1 day |
| JavaScript | StaleWhileRevalidate | static-js-assets | 48 | 1 day |
| CSS | StaleWhileRevalidate | static-style-assets | 32 | 1 day |
| Next.js data | NetworkFirst | next-data | 32 | 1 day |
| JSON/XML/CSV | NetworkFirst | static-data-assets | 32 | 1 day |
| API routes | NetworkFirst | apis | 16 | 1 day |
| RSC prefetch | NetworkFirst | pages-rsc-prefetch | 32 | 1 day |
| RSC | NetworkFirst | pages-rsc | 32 | 1 day |
| HTML pages | NetworkFirst | pages-html | 32 | 1 day |
| Other same-origin | NetworkFirst | others | 32 | 1 day |
| Cross-origin | NetworkFirst | cross-origin | 32 | 1 hour |

#### Precached Assets

All build assets are automatically precached:

- Next.js chunks and bundles
- Static assets (fonts, icons, images)
- Public files (notification.mp3, etc.)
- App icons (72x72 to 512x512)

#### Lifecycle Events

```typescript
// Install: Precache all assets
self.addEventListener('install', async (event) => {
  await precacheAssets();
  self.skipWaiting(); // Activate immediately
});

// Activate: Clean up old caches
self.addEventListener('activate', async (event) => {
  await cleanupOldCaches();
  self.clients.claim(); // Take control immediately
});

// Fetch: Serve from cache with strategies
self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
```

#### Manual Updates

```typescript
// Force update service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(registration => {
    // Check for updates
    registration.update();
  });
}

// Skip waiting and activate new SW
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

---

### Web App Manifest

The web app manifest defines how the app appears when installed.

**Location:** `/app/manifest.ts`

#### Configuration

```typescript
{
  name: "zenFocus - Mindful Productivity Timers",
  short_name: "zenFocus",
  description: "Stay present, stay productive with focus timers...",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#000000",
  icons: [
    // 72x72 to 512x512 PNG icons
  ],
  categories: ["productivity", "lifestyle", "utilities"]
}
```

#### Display Modes

| Mode | Description |
|------|-------------|
| `standalone` | App looks like native app (no browser UI) |
| `fullscreen` | Full screen (not used) |
| `minimal-ui` | Minimal browser UI (not used) |
| `browser` | Normal browser tab (fallback) |

#### Icons

The app provides icons in multiple sizes:

- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

All icons are PNG format with `purpose: "any"`.

#### Installation Criteria

For PWA to be installable:

1. ✅ Served over HTTPS
2. ✅ Has web app manifest
3. ✅ Has service worker with fetch handler
4. ✅ Has valid icons (192x192 and 512x512)
5. ✅ Has start_url
6. ✅ Has name or short_name

---

### Offline Support

The app provides comprehensive offline functionality.

#### Offline Capabilities

| Feature | Offline Support |
|---------|----------------|
| Timer functionality | ✅ Full support |
| Theme switching | ✅ Full support |
| Timer history | ✅ Full support (localStorage) |
| Statistics | ✅ Full support (computed locally) |
| Navigation | ✅ Full support (cached pages) |
| Notifications | ✅ Full support (browser API) |
| Install prompt | ❌ Requires online |

#### Data Persistence

```typescript
// Timer history uses localStorage
const STORAGE_KEY = 'zenFocus_timerHistory';

// Save sessions
localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

// Load sessions
const stored = localStorage.getItem(STORAGE_KEY);
const sessions = JSON.parse(stored);
```

#### Offline Detection

```tsx
import { OfflineIndicator } from '@/app/components/OfflineIndicator';

// Shows banner when offline
<OfflineIndicator />

// Programmatic detection
const isOnline = navigator.onLine;

window.addEventListener('online', () => {
  console.log('Back online!');
});

window.addEventListener('offline', () => {
  console.log('You are offline');
});
```

#### Cache Management

```typescript
// Check cache usage
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const { usage, quota } = await navigator.storage.estimate();
  console.log(`Using ${usage} of ${quota} bytes`);
}

// Clear app caches
async function clearAppCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
}
```

#### Best Practices

1. **First Load**: Requires internet for initial asset download
2. **Updates**: Service worker updates in background
3. **Storage**: Timer history limited by localStorage quota (~5-10MB)
4. **Cache Quota**: Browser may evict caches under storage pressure
5. **Notifications**: Permission persists offline

---

## Integration Examples

### Complete Timer Implementation

```tsx
import Timer from '@/app/components/Timer';
import { useTimerHistory } from '@/lib/hooks/useTimerHistory';
import { useNotification } from '@/lib/hooks/useNotification';

function CompleteTimerExample() {
  const { addSession } = useTimerHistory();
  const { notify } = useNotification();

  const handleComplete = () => {
    notify('Study Complete!', 'Great work! Take a break.');
  };

  const handleSessionComplete = (mode, duration, completed) => {
    addSession(mode, duration, completed);
    console.log(`Session ${completed ? 'completed' : 'paused'}`);
  };

  return (
    <Timer
      duration={1500}
      title="Study Session"
      focusMode="study"
      onComplete={handleComplete}
      onSessionComplete={handleSessionComplete}
    />
  );
}
```

### Custom Analytics Integration

```tsx
import { useTimerHistory } from '@/lib/hooks/useTimerHistory';
import { useEffect } from 'react';

function AnalyticsIntegration() {
  const { sessions, getStatistics } = useTimerHistory();
  const stats = getStatistics();

  useEffect(() => {
    // Track to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timer_stats', {
        total_sessions: stats.totalSessions,
        completed_sessions: stats.completedSessions,
        current_streak: stats.currentStreak,
      });
    }
  }, [stats]);

  return null;
}
```

### Progressive Enhancement

```tsx
'use client';

import { InstallPrompt } from '@/app/components/InstallPrompt';
import { OfflineIndicator } from '@/app/components/OfflineIndicator';
import { useEffect, useState } from 'react';

function PWAEnhancements() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches
    );
  }, []);

  return (
    <>
      {!isStandalone && <InstallPrompt />}
      <OfflineIndicator />
    </>
  );
}
```

---

## Development Notes

### TypeScript Configuration

The project uses strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Component Patterns

1. **Memoization**: Components use `React.memo` where appropriate
2. **Hooks**: Custom hooks follow `use*` naming convention
3. **Client Components**: Marked with `'use client'` directive
4. **Type Safety**: All props and returns are typed

### Testing Strategy

Components and utilities have comprehensive test coverage:

```bash
# Run tests
npm test

# Run specific test
npm test Timer.test.tsx

# Coverage report
npm test -- --coverage
```

### Performance Optimizations

1. **Code Splitting**: Next.js automatic code splitting
2. **Memoization**: `React.memo` and `useCallback` used strategically
3. **Service Worker**: Aggressive caching with smart invalidation
4. **Bundle Analysis**: Regular bundle size monitoring

---

## Browser Support

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Opera | 76+ | ✅ Full |

### PWA Support by Browser

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Web App Manifest | ✅ | ⚠️ | ⚠️ | ✅ |
| Install Prompt | ✅ | ❌ | ⚠️ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️ | ✅ |

---

## Migration Guide

### From v1.x to v2.x (if applicable)

Not applicable - this is the initial release.

---

## Troubleshooting

### Common Issues

**Service Worker Not Updating**

```typescript
// Force update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}
```

**Timer History Not Persisting**

```typescript
// Check localStorage availability
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage not available');
}
```

**Notifications Not Working**

```typescript
// Check permission status
console.log('Permission:', Notification.permission);

// Request permission
Notification.requestPermission().then(permission => {
  console.log('New permission:', permission);
});
```

---

## Contributing

When adding new APIs:

1. Add JSDoc comments to source code
2. Update this API documentation
3. Add usage examples
4. Include TypeScript types
5. Add tests for new functionality

---

## License

This API documentation is part of the zenFocus project.

---

**Last Updated:** 2025-10-05
**Version:** 1.0.0
**Maintained by:** zenFocus Team
