'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '../../src/lib/utils'
import { SessionService, type SessionStats } from '../../lib/services/session-service'
import { Session, SessionMode } from '../../lib/models/session'
import { Button } from '../../src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../src/components/ui/select'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'
import { Switch } from '../../src/components/ui/switch'

/**
 * Props interface for SessionHistory component
 */
interface SessionHistoryProps {
  /** Session service instance for data fetching */
  sessionService: SessionService
  /** User ID for filtering sessions (null for guest users) */
  userId: string | null
  /** Additional CSS classes */
  className?: string
}

/**
 * Filter options for session history
 */
interface SessionFilter {
  mode?: SessionMode
  startDate?: string
  endDate?: string
  completedOnly?: boolean
}

/**
 * Sort options for session history
 */
type SortOption = 'date-desc' | 'date-asc' | 'duration-desc' | 'duration-asc' | 'mode'

/**
 * Helper function to format duration in human-readable format
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Helper function to format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Helper function to get session mode display name
 */
function getSessionModeDisplayName(mode: SessionMode): string {
  const displayNames: Record<SessionMode, string> = {
    study: 'Study Session',
    deepwork: 'Deep Work Session',
    yoga: 'Yoga Session',
    zen: 'Zen Session',
  }
  return displayNames[mode]
}

/**
 * Component for displaying session statistics
 */
interface SessionStatsProps {
  stats: SessionStats
}

const SessionStatsDisplay: React.FC<SessionStatsProps> = ({ stats }) => {
  const totalFocusTimeFormatted = formatDuration(stats.totalFocusTime)

  return (
    <div role="region" aria-label="Session statistics" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Focus Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFocusTimeFormatted}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completionRate}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.currentStreak}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.longestStreak}</div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Component for filtering sessions
 */
interface SessionFiltersProps {
  filter: SessionFilter
  onFilterChange: (filter: SessionFilter) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

const SessionFilters: React.FC<SessionFiltersProps> = ({
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div>
        <Label htmlFor="mode-filter">Filter by session mode</Label>
        <Select
          value={filter.mode || 'all'}
          onValueChange={(value) =>
            onFilterChange({
              ...filter,
              mode: value === 'all' ? undefined : (value as SessionMode),
            })
          }
        >
          <SelectTrigger id="mode-filter">
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            <SelectItem value="study">Study</SelectItem>
            <SelectItem value="deepwork">Deep Work</SelectItem>
            <SelectItem value="yoga">Yoga</SelectItem>
            <SelectItem value="zen">Zen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="start-date">Start date</Label>
        <Input
          id="start-date"
          type="date"
          value={filter.startDate || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, startDate: e.target.value || undefined })
          }
        />
      </div>

      <div>
        <Label htmlFor="end-date">End date</Label>
        <Input
          id="end-date"
          type="date"
          value={filter.endDate || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, endDate: e.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="sort-by">Sort by</Label>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger id="sort-by">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (newest first)</SelectItem>
            <SelectItem value="date-asc">Date (oldest first)</SelectItem>
            <SelectItem value="duration-desc">Duration (longest first)</SelectItem>
            <SelectItem value="duration-asc">Duration (shortest first)</SelectItem>
            <SelectItem value="mode">Session mode</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="completed-only"
            checked={filter.completedOnly || false}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filter, completedOnly: checked || undefined })
            }
          />
          <Label htmlFor="completed-only">Show completed sessions only</Label>
        </div>
      </div>
    </div>
  )
}

/**
 * Component for displaying individual session
 */
interface SessionItemProps {
  session: Session
  index: number
}

const SessionItem: React.FC<SessionItemProps> = ({ session, index }) => {
  const [expanded, setExpanded] = useState(false)

  const sessionModeDisplay = getSessionModeDisplayName(session.mode)
  const durationDisplay = formatDuration(session.actualDuration)
  const dateDisplay = formatDate(session.startTime)
  const completionStatus = session.completedFully ? 'Completed' : 'Incomplete'

  return (
    <>
      <tr key={session.id} data-testid="session-item">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
          {sessionModeDisplay}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {dateDisplay}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {durationDisplay}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge
            variant={session.completedFully ? 'default' : 'secondary'}
            className={session.completedFully ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
          >
            {completionStatus}
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-label={`${expanded ? 'Hide' : 'Show'} session details`}
            tabIndex={0}
          >
            {expanded ? 'Hide' : 'Details'}
          </Button>
        </td>
      </tr>
      {expanded && session.notes && (
        <tr>
          <td colSpan={5} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <strong>Notes:</strong> {session.notes}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/**
 * SessionHistory component - Displays a comprehensive history of focus sessions
 *
 * Features:
 * - Session list with detailed information
 * - Filtering by mode, date range, and completion status
 * - Sorting by various criteria
 * - Statistics dashboard with key metrics
 * - Export functionality for data backup
 * - Responsive design for mobile and desktop
 * - Full accessibility support
 * - Pagination for large datasets
 */
const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessionService,
  userId,
  className,
}) => {
  // State management
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SessionFilter>({})
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const pageSize = 10

  // Load sessions and stats
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build filter for API call
      const apiFilter = {
        ...filter,
        page,
        limit: pageSize,
      }

      const [sessionsData, statsData] = await Promise.all([
        sessionService.getSessionHistory(userId, apiFilter),
        sessionService.getSessionStats(userId),
      ])

      setSessions(sessionsData)
      setStats(statsData)
      setHasMore(sessionsData.length === pageSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [sessionService, userId, filter, page, pageSize])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset page when filter changes
  useEffect(() => {
    setPage(0)
  }, [filter, sortBy])

  // Sort sessions client-side
  const sortedSessions = useMemo(() => {
    const sorted = [...sessions]

    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      case 'duration-desc':
        return sorted.sort((a, b) => b.actualDuration - a.actualDuration)
      case 'duration-asc':
        return sorted.sort((a, b) => a.actualDuration - b.actualDuration)
      case 'mode':
        return sorted.sort((a, b) => a.mode.localeCompare(b.mode))
      default:
        return sorted
    }
  }, [sessions, sortBy])

  // Export functionality
  const handleExport = useCallback(() => {
    if (sessions.length === 0) return

    const csvHeaders = ['Date', 'Mode', 'Duration (min)', 'Completed', 'Pauses', 'Notes']
    const csvRows = sessions.map(session => [
      new Date(session.startTime).toLocaleDateString(),
      session.mode,
      session.actualDuration.toString(),
      session.completedFully ? 'Yes' : 'No',
      session.pauseCount.toString(),
      session.notes || ''
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `session-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up blob URL (with fallback for test environments)
    if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
      URL.revokeObjectURL(url)
    }
  }, [sessions])

  // Render loading state
  if (loading) {
    return (
      <div role="status" className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p>Loading sessions...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error loading sessions</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={loadData}>Try again</Button>
        </div>
      </div>
    )
  }

  // Render empty state
  if (sessions.length === 0 && !loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No sessions found</p>
          <p className="text-gray-600 dark:text-gray-400">Start your first focus session to see your history here.</p>
        </div>
      </div>
    )
  }

  return (
    <main
      role="main"
      aria-label="Session history"
      className={cn('responsive-layout space-y-6', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Session History</h1>
        <Button onClick={handleExport} disabled={sessions.length === 0}>
          Export
        </Button>
      </div>

      {/* Statistics */}
      {stats && <SessionStatsDisplay stats={stats} />}

      {/* Filters */}
      <SessionFilters
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Session Table */}
      <div className="overflow-x-auto">
        <table
          role="table"
          aria-label="Session history table"
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
        >
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Session
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedSessions.map((session, index) => (
              <SessionItem key={session.id} session={session} index={index} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(page > 0 || hasMore) && (
        <nav role="navigation" aria-label="Session history pagination" className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!hasMore}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </main>
  )
}

export { SessionHistory }
export type { SessionHistoryProps }