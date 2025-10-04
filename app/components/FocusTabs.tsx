'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Timer from './Timer';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

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

// Animation variants for tab content transitions
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

export default function FocusTabs() {
  const [activeTab, setActiveTab] = React.useState('study');
  const shouldReduceMotion = useReducedMotion();

  // Adjust animation variants based on reduced motion preference
  const animationVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
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
        className="w-full max-w-2xl"
      >
        <TabsList className="grid w-full grid-cols-4 mb-12" aria-label="Focus mode selection">
          {tabsData.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          {tabsData.map((tab) =>
            activeTab === tab.value && (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="text-center"
                asChild
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={animationVariants}
                  aria-describedby={`${tab.value}-description`}
                >
                  <h1 className="text-4xl font-bold mb-2">{tab.title}</h1>
                  <p id={`${tab.value}-description`} className="text-lg text-muted-foreground mb-8">{tab.description}</p>
                  <Timer duration={tab.duration} title={tab.title} />
                </motion.div>
              </TabsContent>
            )
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
