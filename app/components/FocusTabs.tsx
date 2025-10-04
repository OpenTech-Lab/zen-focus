'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Timer from './Timer';

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

export default function FocusTabs() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24">
      <Tabs defaultValue="study" className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-4 mb-12">
          {tabsData.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsData.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="text-center">
            <h1 className="text-4xl font-bold mb-2">{tab.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">{tab.description}</p>
            <Timer duration={tab.duration} title={tab.title} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
