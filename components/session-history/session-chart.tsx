'use client'

import React, { useMemo } from 'react'
import { format, startOfWeek, addDays, isToday } from 'date-fns'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { cn } from '../../src/lib/utils'

import { type Session } from '../../lib/models/session'

/**
 * Session chart props
 */
interface SessionChartProps {
  /** Array of sessions to visualize */
  sessions: Session[]
  /** Chart type */
  type: 'weekly' | 'monthly' | 'yearly'
  /** Additional CSS classes */
  className?: string
  /** Show trend indicators */
  showTrend?: boolean
  /** Chart height */
  height?: number
}

/**
 * Data point for chart visualization
 */
interface ChartDataPoint {
  date: string
  label: string
  sessions: number
  focusTime: number
  completionRate: number
  isToday?: boolean
}

/**
 * Trend calculation result
 */
interface TrendData {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  description: string
}

/**
 * Simple bar chart component optimized for session data
 */
interface SimpleBarChartProps {
  data: ChartDataPoint[]
  height: number
  className?: string
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, height, className }) => {
  // Find max values for scaling
  const maxSessions = Math.max(...data.map(d => d.sessions), 1)
  const maxFocusTime = Math.max(...data.map(d => d.focusTime), 1)

  return (
    <div className={cn('w-full', className)}>
      {/* Chart area */}
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="0"
              y1={height * (1 - ratio)}
              x2="100%"
              y2={height * (1 - ratio)}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          ))}

          {/* Bars */}
          {data.map((point, index) => {
            const barWidth = (100 / data.length) * 0.8 // 80% of available space
            const barX = (100 / data.length) * index + (100 / data.length) * 0.1 // Center the bar
            const barHeight = (point.focusTime / maxFocusTime) * height
            const barY = height - barHeight

            return (
              <g key={index}>
                {/* Session count bar */}
                <rect
                  x={`${barX}%`}
                  y={barY}
                  width={`${barWidth}%`}
                  height={barHeight}
                  className={cn(
                    'transition-all duration-200 hover:opacity-80',
                    point.isToday
                      ? 'fill-primary-500'
                      : point.completionRate >= 80
                      ? 'fill-green-500'
                      : point.completionRate >= 60
                      ? 'fill-yellow-500'
                      : 'fill-gray-400'
                  )}
                  rx="2"
                />

                {/* Hover indicator */}
                <rect
                  x={`${barX}%`}
                  y="0"
                  width={`${barWidth}%`}
                  height="100%"
                  className="fill-transparent hover:fill-black hover:fill-opacity-5 cursor-pointer"
                  title={`${point.label}: ${point.sessions} sessions, ${point.focusTime}m focus time`}
                />
              </g>
            )
          })}
        </svg>

        {/* Today indicator */}
        {data.some(d => d.isToday) && (
          <div className="absolute top-0 bottom-0 pointer-events-none">
            {data.map((point, index) => {
              if (!point.isToday) return null
              const indicatorX = (100 / data.length) * index + (100 / data.length) * 0.5
              return (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-px bg-primary-500 opacity-50"
                  style={{ left: `${indicatorX}%` }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        {data.map((point, index) => (
          <div
            key={index}
            className={cn(
              'text-center',
              point.isToday && 'font-semibold text-primary-600'
            )}
          >
            {point.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Calculate trend from data points
 */
function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'stable',
      percentage: 0,
      description: current > 0 ? 'First sessions recorded' : 'No activity'
    }
  }

  const change = ((current - previous) / previous) * 100
  const absChange = Math.abs(change)

  if (absChange < 5) {
    return {
      direction: 'stable',
      percentage: absChange,
      description: 'Consistent activity'
    }
  }

  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: absChange,
    description: change > 0 ? 'Increasing activity' : 'Decreasing activity'
  }
}

/**
 * Process sessions into chart data points
 */
function processSessionsForChart(sessions: Session[], type: 'weekly' | 'monthly' | 'yearly'): ChartDataPoint[] {
  const now = new Date()
  const points: ChartDataPoint[] = []

  if (type === 'weekly') {
    // Generate 7 days starting from beginning of week
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday start

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      const dateStr = format(date, 'yyyy-MM-dd')

      const daySessions = sessions.filter(session =>
        format(new Date(session.startTime), 'yyyy-MM-dd') === dateStr
      )

      const focusTime = daySessions.reduce((sum, session) => sum + session.actualDuration, 0)
      const completedSessions = daySessions.filter(session => session.completedFully).length
      const completionRate = daySessions.length > 0 ? (completedSessions / daySessions.length) * 100 : 0

      points.push({
        date: dateStr,
        label: format(date, 'EEE'),
        sessions: daySessions.length,
        focusTime,
        completionRate,
        isToday: isToday(date)
      })
    }
  } else if (type === 'monthly') {
    // Generate last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = addDays(startOfWeek(now, { weekStartsOn: 1 }), -i * 7)
      const weekEnd = addDays(weekStart, 6)
      const label = i === 0 ? 'This week' : `${i} week${i > 1 ? 's' : ''} ago`

      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime)
        return sessionDate >= weekStart && sessionDate <= weekEnd
      })

      const focusTime = weekSessions.reduce((sum, session) => sum + session.actualDuration, 0)
      const completedSessions = weekSessions.filter(session => session.completedFully).length
      const completionRate = weekSessions.length > 0 ? (completedSessions / weekSessions.length) * 100 : 0

      points.push({
        date: format(weekStart, 'yyyy-MM-dd'),
        label,
        sessions: weekSessions.length,
        focusTime,
        completionRate,
        isToday: i === 0
      })
    }
  } else if (type === 'yearly') {
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = format(monthDate, 'MMM')

      const monthSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime)
        return sessionDate >= monthDate && sessionDate < nextMonth
      })

      const focusTime = monthSessions.reduce((sum, session) => sum + session.actualDuration, 0)
      const completedSessions = monthSessions.filter(session => session.completedFully).length
      const completionRate = monthSessions.length > 0 ? (completedSessions / monthSessions.length) * 100 : 0

      points.push({
        date: format(monthDate, 'yyyy-MM-dd'),
        label,
        sessions: monthSessions.length,
        focusTime,
        completionRate,
        isToday: i === 0
      })
    }
  }

  return points
}

/**
 * Session chart component for visualizing session data over time
 */
export const SessionChart: React.FC<SessionChartProps> = ({
  sessions,
  type,
  className,
  showTrend = true,
  height = 200,
}) => {
  // Process data for chart
  const chartData = useMemo(() =>
    processSessionsForChart(sessions, type),
    [sessions, type]
  )

  // Calculate trend
  const trend = useMemo(() => {
    if (!showTrend || chartData.length < 2) return null

    const current = chartData[chartData.length - 1]?.focusTime || 0
    const previous = chartData[chartData.length - 2]?.focusTime || 0

    return calculateTrend(current, previous)
  }, [chartData, showTrend])

  // Get chart title
  const getChartTitle = () => {
    switch (type) {
      case 'weekly':
        return 'This Week'
      case 'monthly':
        return 'Last 4 Weeks'
      case 'yearly':
        return 'Last 12 Months'
      default:
        return 'Focus Activity'
    }
  }

  // Get chart description
  const getChartDescription = () => {
    const totalSessions = chartData.reduce((sum, point) => sum + point.sessions, 0)
    const totalFocusTime = chartData.reduce((sum, point) => sum + point.focusTime, 0)
    const avgCompletionRate = chartData.length > 0
      ? chartData.reduce((sum, point) => sum + point.completionRate, 0) / chartData.length
      : 0

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (hours > 0) {
        return `${hours}h ${mins}m`
      }
      return `${mins}m`
    }

    return `${totalSessions} sessions • ${formatTime(totalFocusTime)} focus time • ${avgCompletionRate.toFixed(0)}% completion rate`
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{getChartTitle()}</CardTitle>
            <CardDescription className="text-sm">
              {getChartDescription()}
            </CardDescription>
          </div>

          {/* Trend indicator */}
          {trend && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                trend.direction === 'up' && 'border-green-200 bg-green-50 text-green-700',
                trend.direction === 'down' && 'border-red-200 bg-red-50 text-red-700',
                trend.direction === 'stable' && 'border-blue-200 bg-blue-50 text-blue-700'
              )}
            >
              {trend.direction === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
              {trend.direction === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
              {trend.direction === 'stable' && <Minus className="w-3 h-3 mr-1" />}
              {trend.percentage > 0 ? `${trend.percentage.toFixed(0)}%` : trend.description}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <SimpleBarChart data={chartData} height={height} />

        {/* Legend */}
        <div className="flex justify-center mt-4 space-x-6 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span>High completion (80%+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
            <span>Medium completion (60-79%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-400 rounded-sm" />
            <span>Low completion (&lt;60%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-primary-500 rounded-sm" />
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export component and types
export type { SessionChartProps, ChartDataPoint, TrendData }