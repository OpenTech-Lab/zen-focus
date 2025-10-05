'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Timer from './Timer';
import TimerHistory from './TimerHistory';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { useTimerHistory } from '@/lib/hooks/useTimerHistory';
import type { TimerSession } from '@/lib/types/timer-history';

/**
 * Tab configuration data for different focus modes.
 * Defines the available timer types with their settings.
 *
 * @constant
 * @type {Array<{value: string, label: string, title: string, description: string, duration: number}>}
 */
const tabsData = [
  {
    value: 'study',
    label: 'Study',
    title: 'Study Timer',
    description: 'Focus timer for deep study sessions',
    duration: 1500, // 25 minutes
  },
  {
    value: 'work',
    label: 'Work',
    title: 'Deep Work Timer',
    description: 'Focused timer for deep work sessions',
    duration: 3600, // 60 minutes
  },
  {
    value: 'yoga',
    label: 'Yoga',
    title: 'Yoga Timer',
    description: 'Mindful timer for yoga practice',
    duration: 1800, // 30 minutes
  },
  {
    value: 'meditation',
    label: 'Meditation',
    title: 'Meditation Timer',
    description: 'Calm timer for meditation practice',
    duration: 600, // 10 minutes
  },
];

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
 * This component provides a tabbed interface with different focus modes (Study, Work,
 * Yoga, Meditation) and a history view. Each tab contains a timer configured for its
 * specific purpose, with smooth animations between tab switches.
 *
 * @component
 *
 * @remarks
 * - Includes 4 focus mode tabs and 1 history tab
 * - Each focus mode has a pre-configured timer duration
 * - Integrates with timer history tracking system
 * - Respects user's reduced motion preferences (prefers-reduced-motion)
 * - Displays theme toggle in top-right corner
 * - Uses Framer Motion for smooth tab transitions
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
   * Currently active tab value.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [activeTab, setActiveTab] = React.useState('study');

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
        <TabsList className="grid w-full grid-cols-5 mb-12" aria-label="Focus mode selection">
          {tabsData.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {tabsData.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="text-center"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={animationVariants}
              aria-describedby={`${tab.value}-description`}
            >
              <h1 className="text-4xl font-bold mb-2">{tab.title}</h1>
              <p id={`${tab.value}-description`} className="text-lg text-muted-foreground mb-8">{tab.description}</p>
              <Timer
                duration={tab.duration}
                title={tab.title}
                focusMode={tab.value as 'study' | 'work' | 'yoga' | 'meditation'}
                onSessionComplete={handleSessionComplete}
              />
            </motion.div>
          </TabsContent>
        ))}
        <TabsContent
          key="history"
          value="history"
        >
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
