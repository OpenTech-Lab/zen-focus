'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { format, isToday, isYesterday, isThisWeek, startOfWeek, endOfWeek } from 'date-fns'
import {
  Calendar,
  Clock,
  Filter,
  Download,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronRight,
  SortAsc,
  SortDesc,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Badge } from '../../src/components/ui/badge'
import { Input } from '../../src/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../src/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../src/components/ui/tabs'
import { Progress } from '../../src/components/ui/progress'
import { cn } from '../../src/lib/utils'

import { type Session, type SessionMode } from '../../lib/models/session'

/**
 * Session history interface props
 */
interface SessionHistoryInterfaceProps {
  /** Session service instance for data operations */
  sessionService?: any // SessionService - using any for now to avoid circular deps
  /** Current user ID (null for guest mode) */
  userId?: string | null
  /** Additional CSS classes */
  className?: string
  /** Initial view mode */
  defaultView?: 'list' | 'stats'
  /** Initial time filter */
  defaultTimeFilter?: 'today' | 'week' | 'month' | 'all'
}

/**
 * Session history filter state
 */
interface HistoryFilter {
  timeRange: 'today' | 'week' | 'month' | 'all'
  mode: SessionMode | 'all'
  status: 'all' | 'completed' | 'incomplete'
  sortBy: 'startTime' | 'duration' | 'mode'
  sortDirection: 'asc' | 'desc'
  searchQuery: string
}

/**
 * Session statistics data
 */
interface SessionStatsData {
  totalSessions: number
  totalFocusTime: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  averageSessionLength: number
  modeBreakdown: {
    [K in SessionMode]: {
      count: number
      totalTime: number
      percentage: number
    }
  }
  weeklyProgress: Array<{
    date: string
    sessions: number
    focusTime: number
  }>
}

/**
 * Session row component for the history list
 */
interface SessionRowProps {
  session: Session
  isExpanded?: boolean
  onToggleExpand?: () => void
  onDelete?: (sessionId: string) => void
  className?: string
}

const SessionRow: React.FC<SessionRowProps> = ({
  session,
  isExpanded = false,
  onToggleExpand,
  onDelete,
  className,
}) => {
  const startTime = new Date(session.startTime)
  const endTime = new Date(session.endTime)
  const duration = `${session.actualDuration}m`

  // Format relative date
  const formatRelativeDate = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM d, yyyy')
  }

  // Get mode color
  const getModeColor = (mode: SessionMode) => {
    const colors = {
      study: 'bg-primary-100 text-primary-800 border-primary-200',
      deepwork: 'bg-secondary-100 text-secondary-800 border-secondary-200',
      yoga: 'bg-accent-100 text-accent-800 border-accent-200',
      zen: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    }
    return colors[mode] || colors.study
  }

  // Get status badge
  const getStatusBadge = () => {
    if (session.completedFully) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
          <XCircle className="w-3 h-3 mr-1" />
          Incomplete
        </Badge>
      )
    }
  }

  // Calculate efficiency percentage
  const efficiency = session.plannedDuration > 0
    ? Math.min(100, (session.actualDuration / session.plannedDuration) * 100)
    : 0

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Main session info */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Expand button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="p-1 h-6 w-6"
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>

            {/* Session mode */}
            <Badge className={cn('px-3 py-1 text-xs font-medium border', getModeColor(session.mode))}>
              {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}
            </Badge>

            {/* Time and date */}
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{format(startTime, 'HH:mm')}</span>
                <span>•</span>
                <span>{formatRelativeDate(startTime)}</span>
              </div>
            </div>

            {/* Duration */}
            <div className="text-sm font-medium">
              {duration}
            </div>
          </div>

          {/* Status and actions */}
          <div className="flex items-center space-x-3">
            {getStatusBadge()}

            <div className="text-xs text-muted-foreground">
              {efficiency.toFixed(0)}% efficiency
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              aria-label="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Planned Duration</div>
                <div className="text-sm font-medium">{session.plannedDuration}m</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Actual Duration</div>
                <div className="text-sm font-medium">{session.actualDuration}m</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pauses</div>
                <div className="text-sm font-medium">{session.pauseCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pause Time</div>
                <div className="text-sm font-medium">{session.totalPauseTime}m</div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Session Progress</span>
                <span>{efficiency.toFixed(0)}%</span>
              </div>
              <Progress value={efficiency} className="h-2" />
            </div>

            {/* Notes */}
            {session.notes && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-sm text-foreground p-2 bg-muted rounded-md">
                  {session.notes}
                </div>
              </div>
            )}

            {/* Ambient sound */}
            <div>
              <div className="text-xs text-muted-foreground">Ambient Sound</div>
              <div className="text-sm font-medium capitalize">{session.ambientSound}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Statistics dashboard component
 */
interface StatsDashboardProps {
  stats: SessionStatsData
  className?: string
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, className }) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <Target className="h-8 w-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Focus Time</p>
                <p className="text-2xl font-bold">{formatTime(stats.totalFocusTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-secondary-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Session Mode Breakdown</span>
          </CardTitle>
          <CardDescription>
            Distribution of your focus sessions by mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.modeBreakdown).map(([mode, data]) => (
              <div key={mode} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{mode}</span>
                  <span className="text-sm text-muted-foreground">
                    {data.count} sessions • {formatTime(data.totalTime)}
                  </span>
                </div>
                <Progress value={data.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Weekly Progress</span>
          </CardTitle>
          <CardDescription>
            Your focus activity over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.weeklyProgress.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {format(new Date(day.date), 'EEE')}
                </div>
                <div className="flex-1 mx-4">
                  <Progress
                    value={(day.focusTime / Math.max(...stats.weeklyProgress.map(d => d.focusTime))) * 100}
                    className="h-2"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTime(day.focusTime)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Empty state component
 */
const EmptyState: React.FC<{ filter: HistoryFilter }> = ({ filter }) => {
  const isFiltered = filter.mode !== 'all' || filter.status !== 'all' || filter.searchQuery !== ''

  if (isFiltered) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <Search className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No sessions found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more results
            </p>
          </div>
          <Button variant="outline" onClick={() => {/* Reset filters */}}>
            Clear Filters
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <Target className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">Start your first session</h3>
          <p className="text-muted-foreground">
            Begin a focus session to see your history and progress here
          </p>
        </div>
        <Button>
          <Play className="h-4 w-4 mr-2" />
          Start Session
        </Button>
      </div>
    </Card>
  )
}

/**
 * Main session history interface component
 */
export const SessionHistoryInterface: React.FC<SessionHistoryInterfaceProps> = ({
  sessionService,
  userId = null,
  className,
  defaultView = 'list',
  defaultTimeFilter = 'week',
}) => {
  // State management
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<SessionStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const [filter, setFilter] = useState<HistoryFilter>({
    timeRange: defaultTimeFilter,
    mode: 'all',
    status: 'all',
    sortBy: 'startTime',
    sortDirection: 'desc',
    searchQuery: '',
  })

  // Load data
  const loadData = useCallback(async () => {
    if (!sessionService) return

    setLoading(true)
    setError(null)

    try {
      // Load sessions and stats in parallel
      const [sessionsData, statsData] = await Promise.all([
        sessionService.getSessionHistory(userId, {
          // Convert filter to service filter format
          completedOnly: filter.status === 'completed' ? true : undefined,
          mode: filter.mode !== 'all' ? filter.mode : undefined,
        }),
        sessionService.getSessionStats(userId),
      ])

      setSessions(sessionsData)

      // Calculate additional stats
      const totalSessions = sessionsData.length
      const averageSessionLength = totalSessions > 0
        ? Math.round(sessionsData.reduce((sum, s) => sum + s.actualDuration, 0) / totalSessions)
        : 0

      // Calculate mode breakdown percentages
      const modeBreakdown: SessionStatsData['modeBreakdown'] = {
        study: { count: 0, totalTime: 0, percentage: 0 },
        deepwork: { count: 0, totalTime: 0, percentage: 0 },
        yoga: { count: 0, totalTime: 0, percentage: 0 },
        zen: { count: 0, totalTime: 0, percentage: 0 },
      }

      sessionsData.forEach((session) => {
        modeBreakdown[session.mode].count++
        modeBreakdown[session.mode].totalTime += session.actualDuration
      })

      // Calculate percentages
      Object.values(modeBreakdown).forEach((mode) => {
        mode.percentage = totalSessions > 0 ? (mode.count / totalSessions) * 100 : 0
      })

      // Generate weekly progress (mock data for now)
      const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.toISOString(),
          sessions: Math.floor(Math.random() * 5),
          focusTime: Math.floor(Math.random() * 120),
        }
      })

      setStats({
        ...statsData,
        totalSessions,
        averageSessionLength,
        modeBreakdown,
        weeklyProgress,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session data')
    } finally {
      setLoading(false)
    }
  }, [sessionService, userId, filter.status, filter.mode])

  // Effect to load data
  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions]

    // Apply search filter
    if (filter.searchQuery) {
      filtered = filtered.filter((session) =>
        session.mode.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        (session.notes && session.notes.toLowerCase().includes(filter.searchQuery.toLowerCase()))
      )
    }

    // Apply time range filter
    const now = new Date()
    switch (filter.timeRange) {
      case 'today':
        filtered = filtered.filter((session) => isToday(new Date(session.startTime)))
        break
      case 'week':
        const weekStart = startOfWeek(now)
        const weekEnd = endOfWeek(now)
        filtered = filtered.filter((session) => {
          const sessionDate = new Date(session.startTime)
          return sessionDate >= weekStart && sessionDate <= weekEnd
        })
        break
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        filtered = filtered.filter((session) => new Date(session.startTime) >= monthStart)
        break
      // 'all' - no filtering needed
    }

    // Apply status filter
    if (filter.status !== 'all') {
      filtered = filtered.filter((session) =>
        filter.status === 'completed' ? session.completedFully : !session.completedFully
      )
    }

    // Apply mode filter
    if (filter.mode !== 'all') {
      filtered = filtered.filter((session) => session.mode === filter.mode)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filter.sortBy) {
        case 'startTime':
          aValue = new Date(a.startTime).getTime()
          bValue = new Date(b.startTime).getTime()
          break
        case 'duration':
          aValue = a.actualDuration
          bValue = b.actualDuration
          break
        case 'mode':
          aValue = a.mode
          bValue = b.mode
          break
        default:
          return 0
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return filter.sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [sessions, filter])

  // Handle session expansion
  const toggleSessionExpansion = useCallback((sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }, [])

  // Export functionality
  const handleExport = useCallback(() => {
    const exportData = {
      sessions: filteredSessions,
      stats,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zen-focus-sessions-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredSessions, stats])

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Failed to load session data</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Session History</h1>
          <p className="text-muted-foreground">
            View your focus sessions and track your progress over time
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultView} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Statistics</span>
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sessions..."
                      value={filter.searchQuery}
                      onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Time Range Filter */}
                <Select
                  value={filter.timeRange}
                  onValueChange={(value: any) => setFilter(prev => ({ ...prev, timeRange: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>

                {/* Mode Filter */}
                <Select
                  value={filter.mode}
                  onValueChange={(value: any) => setFilter(prev => ({ ...prev, mode: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="deepwork">Deep Work</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="zen">Zen</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={filter.status}
                  onValueChange={(value: any) => setFilter(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Options */}
                <div className="flex space-x-2">
                  <Select
                    value={filter.sortBy}
                    onValueChange={(value: any) => setFilter(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startTime">Date</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                      <SelectItem value="mode">Mode</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setFilter(prev => ({
                      ...prev,
                      sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
                    }))}
                  >
                    {filter.sortDirection === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session List */}
          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              filteredSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isExpanded={expandedSessions.has(session.id)}
                  onToggleExpand={() => toggleSessionExpansion(session.id)}
                />
              ))
            )}
          </div>

          {/* Load More / Pagination could go here */}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          {stats ? (
            <StatsDashboard stats={stats} />
          ) : (
            <Card className="p-8">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No statistics available</h3>
                <p className="text-muted-foreground">
                  Complete some focus sessions to see your statistics
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Export component and types
export type { SessionHistoryInterfaceProps, HistoryFilter, SessionStatsData }