'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const tabsData = [
  {
    value: 'study',
    label: 'Study',
    title: 'Study Timer',
    description: 'Focus timer for deep study sessions',
  },
  {
    value: 'work',
    label: 'Work',
    title: 'Deep Work Timer',
    description: 'Focused timer for deep work sessions',
  },
  {
    value: 'yoga',
    label: 'Yoga',
    title: 'Yoga Timer',
    description: 'Mindful timer for yoga practice',
  },
  {
    value: 'meditation',
    label: 'Meditation',
    title: 'Meditation Timer',
    description: 'Calm timer for meditation practice',
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
            <h1 className="text-4xl font-bold mb-4">{tab.title}</h1>
            <p className="text-lg text-muted-foreground">{tab.description}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
