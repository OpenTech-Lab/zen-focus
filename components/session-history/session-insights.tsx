'use client'

import React, { useMemo } from 'react'
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { Progress } from '../../src/components/ui/progress'
import { cn } from '../../src/lib/utils'

import { type Session, type SessionMode } from '../../lib/models/session'

/**
 * Session insights props
 */
interface SessionInsightsProps {
  /** Array of sessions to analyze */
  sessions: Session[]
  /** Additional CSS classes */
  className?: string
  /** Time range for insights */
  timeRange?: 'week' | 'month' | 'all'
  /** Maximum number of insights to show */
  maxInsights?: number
}

/**
 * Individual insight data
 */
interface Insight {
  id: string
  type: 'achievement' | 'improvement' | 'warning' | 'tip'
  title: string
  description: string
  value?: string | number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ElementType
  priority: number // 1-10, higher = more important
}

/**
 * Session pattern analysis result
 */
interface SessionPattern {
  bestTimeOfDay: string
  mostProductiveMode: SessionMode
  averageSessionLength: number
  consistencyScore: number
  longestStreak: number
  currentStreak: number
  weeklyGoalProgress: number
}

/**
 * Format time in a human-readable way
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Get time of day category from hour
 */
function getTimeOfDayCategory(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 21) return 'Evening'
  return 'Night'
}

/**
 * Analyze session patterns to generate insights
 */
function analyzeSessionPatterns(sessions: Session[], timeRange: 'week' | 'month' | 'all'): SessionPattern {
  if (sessions.length === 0) {
    return {
      bestTimeOfDay: 'Morning',
      mostProductiveMode: 'study',
      averageSessionLength: 0,
      consistencyScore: 0,
      longestStreak: 0,
      currentStreak: 0,
      weeklyGoalProgress: 0,
    }
  }

  // Filter sessions by time range
  const now = new Date()
  let filteredSessions = sessions

  if (timeRange === 'week') {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    filteredSessions = sessions.filter(session =>
      isWithinInterval(parseISO(session.startTime), { start: weekStart, end: weekEnd })
    )
  } else if (timeRange === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    filteredSessions = sessions.filter(session =>
      parseISO(session.startTime) >= monthStart
    )
  }

  // Analyze time of day preferences
  const timeOfDayStats: Record<string, { count: number; totalDuration: number; completionRate: number }> = {
    'Morning': { count: 0, totalDuration: 0, completionRate: 0 },
    'Afternoon': { count: 0, totalDuration: 0, completionRate: 0 },
    'Evening': { count: 0, totalDuration: 0, completionRate: 0 },
    'Night': { count: 0, totalDuration: 0, completionRate: 0 },
  }

  filteredSessions.forEach(session => {
    const hour = parseISO(session.startTime).getHours()
    const timeOfDay = getTimeOfDayCategory(hour)
    timeOfDayStats[timeOfDay].count++
    timeOfDayStats[timeOfDay].totalDuration += session.actualDuration
    if (session.completedFully) {
      timeOfDayStats[timeOfDay].completionRate++
    }
  })

  // Calculate completion rates
  Object.keys(timeOfDayStats).forEach(timeOfDay => {
    const stats = timeOfDayStats[timeOfDay]
    stats.completionRate = stats.count > 0 ? (stats.completionRate / stats.count) * 100 : 0
  })

  // Find best time of day (highest completion rate with significant sample size)
  const bestTimeOfDay = Object.entries(timeOfDayStats)
    .filter(([_, stats]) => stats.count >= 2) // At least 2 sessions
    .sort((a, b) => b[1].completionRate - a[1].completionRate)[0]?.[0] || 'Morning'

  // Analyze mode productivity
  const modeStats: Record<SessionMode, { count: number; totalDuration: number; completionRate: number }> = {
    study: { count: 0, totalDuration: 0, completionRate: 0 },
    deepwork: { count: 0, totalDuration: 0, completionRate: 0 },
    yoga: { count: 0, totalDuration: 0, completionRate: 0 },
    zen: { count: 0, totalDuration: 0, completionRate: 0 },
  }

  filteredSessions.forEach(session => {
    modeStats[session.mode].count++
    modeStats[session.mode].totalDuration += session.actualDuration
    if (session.completedFully) {
      modeStats[session.mode].completionRate++
    }
  })

  // Calculate mode completion rates
  Object.keys(modeStats).forEach(mode => {
    const stats = modeStats[mode as SessionMode]
    stats.completionRate = stats.count > 0 ? (stats.completionRate / stats.count) * 100 : 0
  })

  // Find most productive mode
  const mostProductiveMode = (Object.entries(modeStats)
    .filter(([_, stats]) => stats.count > 0)
    .sort((a, b) => b[1].completionRate - a[1].completionRate)[0]?.[0] || 'study') as SessionMode

  // Calculate average session length
  const averageSessionLength = filteredSessions.length > 0
    ? Math.round(filteredSessions.reduce((sum, s) => sum + s.actualDuration, 0) / filteredSessions.length)
    : 0

  // Calculate consistency score (based on regular activity)
  const daysWithSessions = new Set(
    filteredSessions.map(s => format(parseISO(s.startTime), 'yyyy-MM-dd'))
  ).size

  const totalDaysInRange = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : Math.min(365, sessions.length > 0 ?
    Math.ceil((now.getTime() - parseISO(sessions[sessions.length - 1].startTime).getTime()) / (1000 * 60 * 60 * 24)) : 0)

  const consistencyScore = totalDaysInRange > 0 ? Math.round((daysWithSessions / totalDaysInRange) * 100) : 0

  // Calculate streaks (simplified)
  const sortedSessions = [...sessions].sort((a, b) =>
    parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
  )

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const sessionDays = sortedSessions.map(s => format(parseISO(s.startTime), 'yyyy-MM-dd'))
  const uniqueDays = Array.from(new Set(sessionDays)).sort()

  for (let i = 0; i < uniqueDays.length; i++) {
    const daysSessions = sortedSessions.filter(s =>
      format(parseISO(s.startTime), 'yyyy-MM-dd') === uniqueDays[i]
    )
    const hasCompletedSession = daysSessions.some(s => s.completedFully)

    if (hasCompletedSession) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  // Current streak calculation (simplified)
  const recentDays = uniqueDays.slice(-7) // Last 7 days with sessions
  currentStreak = 0
  for (let i = recentDays.length - 1; i >= 0; i--) {
    const daysSessions = sortedSessions.filter(s =>
      format(parseISO(s.startTime), 'yyyy-MM-dd') === recentDays[i]
    )
    if (daysSessions.some(s => s.completedFully)) {
      currentStreak++
    } else {
      break
    }
  }

  // Weekly goal progress (assuming 5 sessions per week goal)
  const weeklyGoalProgress = timeRange === 'week'
    ? Math.min(100, (filteredSessions.filter(s => s.completedFully).length / 5) * 100)
    : 0

  return {
    bestTimeOfDay,
    mostProductiveMode,
    averageSessionLength,
    consistencyScore,
    longestStreak,
    currentStreak,
    weeklyGoalProgress,
  }
}

/**
 * Generate insights based on session patterns
 */
function generateInsights(sessions: Session[], patterns: SessionPattern, timeRange: 'week' | 'month' | 'all'): Insight[] {
  const insights: Insight[] = []

  // Achievement insights
  if (patterns.currentStreak >= 7) {
    insights.push({
      id: 'streak-achievement',
      type: 'achievement',
      title: 'Impressive Streak!',
      description: `You're on a ${patterns.currentStreak}-day completion streak. Keep up the excellent work!`,
      value: `${patterns.currentStreak} days`,
      icon: Award,
      priority: 9,
    })
  } else if (patterns.currentStreak >= 3) {
    insights.push({
      id: 'streak-building',
      type: 'achievement',
      title: 'Building Momentum',
      description: `You have a ${patterns.currentStreak}-day streak going. Just a few more days to reach a week!`,
      value: `${patterns.currentStreak} days`,
      icon: Target,
      priority: 7,
    })
  }

  if (patterns.consistencyScore >= 80) {
    insights.push({
      id: 'consistency-high',
      type: 'achievement',
      title: 'Highly Consistent',
      description: `You've been active ${patterns.consistencyScore}% of days. Your consistency is paying off!`,
      value: `${patterns.consistencyScore}%`,
      icon: CheckCircle2,
      priority: 8,
    })
  }

  if (timeRange === 'week' && patterns.weeklyGoalProgress >= 100) {
    insights.push({
      id: 'weekly-goal-complete',
      type: 'achievement',
      title: 'Weekly Goal Achieved!',
      description: 'You\'ve completed your weekly focus session goal. Excellent discipline!',
      value: '100%',
      icon: Target,
      priority: 9,
    })
  }

  // Improvement insights
  if (patterns.averageSessionLength > 0 && patterns.averageSessionLength < 20) {
    insights.push({
      id: 'session-length-short',
      type: 'improvement',
      title: 'Consider Longer Sessions',
      description: `Your average session is ${patterns.averageSessionLength} minutes. Try extending to 25-45 minutes for deeper focus.`,
      value: formatDuration(patterns.averageSessionLength),
      icon: Clock,
      priority: 6,
    })
  }

  if (patterns.consistencyScore < 50 && sessions.length > 5) {
    insights.push({
      id: 'consistency-low',
      type: 'improvement',
      title: 'Improve Consistency',
      description: 'Try to practice daily, even if just for 10-15 minutes. Small, regular sessions build lasting habits.',
      value: `${patterns.consistencyScore}% active days`,
      icon: Calendar,
      priority: 8,
    })
  }

  // Warning insights
  const recentSessions = sessions.slice(-10) // Last 10 sessions
  const recentCompletionRate = recentSessions.length > 0
    ? (recentSessions.filter(s => s.completedFully).length / recentSessions.length) * 100
    : 100

  if (recentCompletionRate < 60 && recentSessions.length >= 5) {
    insights.push({
      id: 'completion-rate-low',
      type: 'warning',
      title: 'Low Completion Rate',
      description: `Only ${recentCompletionRate.toFixed(0)}% of your recent sessions were completed. Consider shorter sessions to build momentum.`,
      value: `${recentCompletionRate.toFixed(0)}%`,
      trend: 'down',
      icon: AlertCircle,
      priority: 7,
    })
  }

  if (patterns.currentStreak === 0 && sessions.length > 3) {
    insights.push({
      id: 'streak-broken',
      type: 'warning',
      title: 'Restart Your Streak',
      description: 'You haven\'t completed a session recently. A quick 15-minute session can get you back on track.',
      icon: TrendingDown,
      priority: 6,
    })
  }

  // Tips and suggestions
  if (patterns.bestTimeOfDay && sessions.length >= 5) {
    insights.push({
      id: 'best-time-tip',
      type: 'tip',
      title: `${patterns.bestTimeOfDay} Works Best for You`,
      description: `You have the highest completion rate during ${patterns.bestTimeOfDay.toLowerCase()} sessions. Schedule your most important work then.`,
      icon: Lightbulb,
      priority: 5,
    })
  }

  if (patterns.mostProductiveMode && sessions.filter(s => s.mode === patterns.mostProductiveMode).length >= 3) {
    insights.push({
      id: 'productive-mode-tip',
      type: 'tip',
      title: `${patterns.mostProductiveMode.charAt(0).toUpperCase() + patterns.mostProductiveMode.slice(1)} Mode Suits You`,
      description: `You complete ${patterns.mostProductiveMode} sessions most consistently. Consider using this mode for challenging tasks.`,
      icon: Zap,
      priority: 4,
    })
  }

  if (timeRange === 'week' && patterns.weeklyGoalProgress < 100 && patterns.weeklyGoalProgress > 0) {
    const remaining = Math.ceil((100 - patterns.weeklyGoalProgress) / 20) // Assuming 20% per session
    insights.push({
      id: 'weekly-goal-progress',
      type: 'tip',
      title: 'Weekly Goal in Progress',
      description: `You're ${patterns.weeklyGoalProgress.toFixed(0)}% toward your weekly goal. Just ${remaining} more session${remaining !== 1 ? 's' : ''} to go!`,
      value: `${patterns.weeklyGoalProgress.toFixed(0)}%`,
      icon: Target,
      priority: 6,
    })
  }

  // Sort by priority (highest first) and return
  return insights.sort((a, b) => b.priority - a.priority)
}

/**
 * Insight card component
 */
interface InsightCardProps {
  insight: Insight
  className?: string
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, className }) => {
  const getInsightStyles = () => {
    switch (insight.type) {
      case 'achievement':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
        }
      case 'improvement':
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
        }
      case 'warning':
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50',
          iconColor: 'text-orange-600',
          titleColor: 'text-orange-800',
        }
      case 'tip':
        return {
          border: 'border-purple-200',
          bg: 'bg-purple-50',
          iconColor: 'text-purple-600',
          titleColor: 'text-purple-800',
        }
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800',
        }
    }
  }

  const styles = getInsightStyles()
  const Icon = insight.icon

  return (
    <Card className={cn('border-2', styles.border, styles.bg, className)}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={cn('p-2 rounded-lg bg-white', styles.iconColor)}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className={cn('text-sm font-semibold', styles.titleColor)}>
                {insight.title}
              </h4>
              {insight.value && (
                <Badge variant="outline" className="text-xs">
                  {insight.value}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {insight.description}
            </p>

            {insight.trend && (
              <div className="flex items-center mt-2">
                {insight.trend === 'up' && (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                )}
                {insight.trend === 'down' && (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className="text-xs text-muted-foreground">
                  {insight.trend === 'up' ? 'Improving' : 'Declining'} trend
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Session insights component for showing AI-powered insights
 */
export const SessionInsights: React.FC<SessionInsightsProps> = ({
  sessions,
  className,
  timeRange = 'week',
  maxInsights = 6,
}) => {
  // Analyze patterns and generate insights
  const { patterns, insights } = useMemo(() => {
    const patterns = analyzeSessionPatterns(sessions, timeRange)
    const insights = generateInsights(sessions, patterns, timeRange)
    return { patterns, insights: insights.slice(0, maxInsights) }
  }, [sessions, timeRange, maxInsights])

  if (sessions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No insights yet</h3>
              <p className="text-muted-foreground">
                Complete a few focus sessions to see personalized insights and tips
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">All looking good!</h3>
              <p className="text-muted-foreground">
                No specific insights or recommendations at this time. Keep up the great work!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Insights & Recommendations</h3>
        <Badge variant="outline" className="text-xs">
          {insights.length} insight{insights.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  )
}

// Export component and types
export type { SessionInsightsProps, Insight, SessionPattern }