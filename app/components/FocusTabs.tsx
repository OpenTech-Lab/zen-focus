'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Timer from './Timer';
import TimerHistory from './TimerHistory';
import RepeatTimer from './RepeatTimer';
import FocusModeSelector from './FocusModeSelector';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { useTimerHistory } from '@/lib/hooks/useTimerHistory';
import type { TimerSession } from '@/lib/types/timer-history';
import { getFocusModeConfig, type FocusMode } from '@/lib/constants/focus-modes';

/**
 * Framer Motion animation variants for tab content transitions.
 * Provides smooth fade and slide animations when switching tabs.
 *
 * @constant
 * @type {Variants}
 *
 * @property {object} hidden - Initial state before animation
 * @property {object} visible - Animated-in state with easing
 * @property {object} exit - Exit animation state
 */
const tabContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1], // Custom easing for smooth animation
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Main tabbed interface component for the focus timer application.
 *
 * This component provides a tabbed interface with a Focus tab and History view.
 * The Focus tab includes a mode selector for switching between Study, Work, Yoga,
 * and Meditation modes, each with its own timer configuration.
 *
 * @component
 *
 * @remarks
 * - 2 main tabs: Focus and History
 * - Focus tab includes a mode selector for 4 focus modes (Study, Work, Yoga, Meditation)
 * - Each focus mode has a pre-configured timer duration
 * - Integrates with timer history tracking system
 * - Respects user's reduced motion preferences (prefers-reduced-motion)
 * - Displays theme toggle in top-right corner
 * - Uses Framer Motion for smooth transitions
 * - Fully accessible with ARIA labels
 *
 * @example
 * ```tsx
 * // Main app component
 * export default function App() {
 *   return <FocusTabs />;
 * }
 * ```
 *
 * @returns {React.ReactElement} Tabbed interface with timers and history view
 */
export default function FocusTabs() {
  /**
   * Currently active tab value (either 'focus' or 'history').
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [activeTab, setActiveTab] = React.useState('focus');

  /**
   * Currently selected focus mode within the Focus tab.
   * @type {[FocusMode, React.Dispatch<React.SetStateAction<FocusMode>>]}
   */
  const [selectedMode, setSelectedMode] = React.useState<FocusMode>('study');

  /**
   * User's motion preference from browser settings.
   * @type {boolean | null}
   */
  const shouldReduceMotion = useReducedMotion();

  /**
   * Hook to add timer sessions to history.
   * @type {{ addSession: (focusMode: TimerSession['focusMode'], duration: number, completed: boolean) => void }}
   */
  const { addSession } = useTimerHistory();

  /**
   * Handles completion of a timer session.
   * Adds the session to history with focus mode, duration, and completion status.
   *
   * @param {TimerSession['focusMode']} focusMode - Type of focus session
   * @param {number} duration - Session duration in seconds
   * @param {boolean} completed - Whether session was completed or paused
   */
  const handleSessionComplete = React.useCallback(
    (focusMode: TimerSession['focusMode'], duration: number, completed: boolean) => {
      addSession(focusMode, duration, completed);
    },
    [addSession]
  );

  /**
   * Animation variants adjusted for user's reduced motion preference.
   * Uses simple opacity-only transitions if reduced motion is preferred.
   *
   * @type {Variants}
   */
  const animationVariants: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.2 }
        },
        exit: { opacity: 0 }
      }
    : tabContentVariants;

  /**
   * Get the configuration for the currently selected focus mode.
   */
  const currentModeConfig = getFocusModeConfig(selectedMode);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-8 sm:p-24">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-4xl"
      >
        <TabsList className="grid w-full grid-cols-3 mb-12" aria-label="Focus mode selection">
          <TabsTrigger value="focus">Focus</TabsTrigger>
          <TabsTrigger value="intervals">Intervals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent
          value="focus"
          className="text-center"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            aria-describedby={`${selectedMode}-description`}
          >
            <h1 className="text-4xl font-bold mb-2">{currentModeConfig.title}</h1>
            <p id={`${selectedMode}-description`} className="text-lg text-muted-foreground mb-8">
              {currentModeConfig.description}
            </p>
            <FocusModeSelector
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
            />
            <Timer
              duration={currentModeConfig.duration}
              title={currentModeConfig.title}
              focusMode={selectedMode}
              onSessionComplete={handleSessionComplete}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="intervals" className="text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
          >
            <RepeatTimer onSessionComplete={handleSessionComplete} />
          </motion.div>
        </TabsContent>

        <TabsContent value="history">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
          >
            <TimerHistory />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
