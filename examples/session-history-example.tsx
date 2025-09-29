'use client'

import React, { useState, useEffect } from 'react'
import { SessionHistoryInterface, SessionChart, SessionInsights } from '../components/session-history'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs'
import { type Session } from '../lib/models/session'

/**
 * Example component demonstrating the Session History Interface
 * This shows how to integrate the components with real session data
 */
export const SessionHistoryExample: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  // Mock session service for demonstration
  const mockSessionService = {
    async getSessionHistory(userId: string | null, filter?: any): Promise<Session[]> {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate mock session data
      const mockSessions: Session[] = []
      const now = new Date()

      for (let i = 0; i < 50; i++) {
        const startDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000) - Math.random() * 12 * 60 * 60 * 1000)
        const duration = 15 + Math.floor(Math.random() * 45) // 15-60 minutes
        const completed = Math.random() > 0.3 // 70% completion rate
        const modes: Array<'study' | 'deepwork' | 'yoga' | 'zen'> = ['study', 'deepwork', 'yoga', 'zen']
        const sounds: Array<'rain' | 'forest' | 'ocean' | 'silence'> = ['rain', 'forest', 'ocean', 'silence']

        mockSessions.push({
          id: `session-${i}`,
          userId: userId || null,
          mode: modes[Math.floor(Math.random() * modes.length)],
          startTime: startDate.toISOString(),
          endTime: new Date(startDate.getTime() + duration * 60 * 1000).toISOString(),
          plannedDuration: duration + Math.floor(Math.random() * 10 - 5), // Slight variation
          actualDuration: completed ? duration : Math.floor(duration * 0.6),
          completedFully: completed,
          pauseCount: Math.floor(Math.random() * 3),
          totalPauseTime: Math.floor(Math.random() * 5),
          ambientSound: sounds[Math.floor(Math.random() * sounds.length)],
          notes: Math.random() > 0.7 ? `Session notes for ${modes[Math.floor(Math.random() * modes.length)]} session` : null,
        })
      }

      return mockSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    },

    async getSessionStats(userId: string | null) {
      await new Promise(resolve => setTimeout(resolve, 500))

      return {
        totalFocusTime: 1250, // minutes
        completionRate: 72,
        currentStreak: 5,
        longestStreak: 12,
        modeBreakdown: {
          study: { count: 20, totalTime: 400 },
          deepwork: { count: 15, totalTime: 450 },
          yoga: { count: 10, totalTime: 250 },
          zen: { count: 5, totalTime: 150 },
        }
      }
    }
  }

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionData = await mockSessionService.getSessionHistory(null)
        setSessions(sessionData)
      } catch (error) {
        console.error('Failed to load sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Session History Interface Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A comprehensive demonstration of the ZenFocus session history interface,
            featuring data visualization, insights, and advanced filtering capabilities.
          </p>
        </div>

        {/* Main Interface */}
        <SessionHistoryInterface
          sessionService={mockSessionService}
          userId={null}
          defaultView="list"
          defaultTimeFilter="week"
          className="bg-white rounded-2xl shadow-lg"
        />

        {/* Component Showcase */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Individual Component Examples
            </h2>
            <p className="text-gray-600">
              Each component can be used independently for custom layouts
            </p>
          </div>

          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="charts">Charts & Visualization</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SessionChart
                  sessions={sessions}
                  type="weekly"
                  showTrend={true}
                  height={200}
                />
                <SessionChart
                  sessions={sessions}
                  type="monthly"
                  showTrend={true}
                  height={200}
                />
              </div>

              <SessionChart
                sessions={sessions}
                type="yearly"
                showTrend={true}
                height={250}
              />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SessionInsights
                  sessions={sessions}
                  timeRange="week"
                  maxInsights={4}
                />
                <SessionInsights
                  sessions={sessions}
                  timeRange="month"
                  maxInsights={4}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Design System Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Design System Integration</CardTitle>
            <CardDescription>
              The session history interface seamlessly integrates with the ZenFocus design system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-primary-200 bg-primary-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-primary-500 rounded-lg mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary-800">Study Mode</p>
                  <p className="text-xs text-primary-600">Emerald Color Palette</p>
                </CardContent>
              </Card>

              <Card className="border-secondary-200 bg-secondary-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-secondary-500 rounded-lg mx-auto mb-2" />
                  <p className="text-sm font-medium text-secondary-800">Deep Work Mode</p>
                  <p className="text-xs text-secondary-600">Blue Color Palette</p>
                </CardContent>
              </Card>

              <Card className="border-accent-200 bg-accent-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-accent-500 rounded-lg mx-auto mb-2" />
                  <p className="text-sm font-medium text-accent-800">Yoga Mode</p>
                  <p className="text-xs text-accent-600">Violet Color Palette</p>
                </CardContent>
              </Card>

              <Card className="border-neutral-200 bg-neutral-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-neutral-500 rounded-lg mx-auto mb-2" />
                  <p className="text-sm font-medium text-neutral-800">Zen Mode</p>
                  <p className="text-xs text-neutral-600">Gray Color Palette</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Key Design Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h5 className="font-medium">Visual Consistency</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Matches existing timer components</li>
                    <li>• Consistent spacing and typography</li>
                    <li>• Unified color semantics</li>
                    <li>• Familiar interaction patterns</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Accessibility First</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• WCAG 2.1 AA compliant</li>
                    <li>• Keyboard navigation support</li>
                    <li>• Screen reader optimized</li>
                    <li>• High contrast mode ready</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Mobile Responsive</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Touch-friendly controls</li>
                    <li>• Adaptive layouts</li>
                    <li>• Optimized for small screens</li>
                    <li>• Progressive enhancement</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Performance Optimized</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Efficient data loading</li>
                    <li>• Smart caching strategies</li>
                    <li>• Minimal bundle impact</li>
                    <li>• Smooth animations</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Notes</CardTitle>
            <CardDescription>
              Key considerations for integrating these components into your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-medium mb-2">Integration with SessionService</h4>
              <p className="text-blue-700 text-sm">
                The components are designed to work with the existing SessionService.
                Pass your service instance to enable real-time data loading and updates.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-green-800 font-medium mb-2">Modular Architecture</h4>
              <p className="text-green-700 text-sm">
                Each component can be used independently or as part of the complete interface.
                This allows for flexible layouts and progressive implementation.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-purple-800 font-medium mb-2">Customization Options</h4>
              <p className="text-purple-700 text-sm">
                Components accept className props for styling customization and
                support various configuration options for different use cases.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SessionHistoryExample