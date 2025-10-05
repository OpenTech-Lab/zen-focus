'use client';

import React, { useState, useMemo } from 'react';
import { useTimerHistory } from '@/lib/hooks/useTimerHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatTime } from '@/lib/utils/formatTime';
import { formatDuration } from '@/lib/utils/formatDuration';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { Trash2, TrendingUp, Calendar, Clock, Target, Flame } from 'lucide-react';

/**
 * Configuration for focus mode display properties.
 * Maps each focus mode to its label and color styling.
 *
 * @constant
 * @type {Object.<string, {label: string, color: string}>}
 *
 * @property {object} study - Study mode configuration with blue theme
 * @property {object} work - Work mode configuration with purple theme
 * @property {object} yoga - Yoga mode configuration with green theme
 * @property {object} meditation - Meditation mode configuration with amber theme
 */
const focusModeConfig = {
  study: { label: 'Study', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  work: { label: 'Work', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  yoga: { label: 'Yoga', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  meditation: { label: 'Meditation', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
} as const;

/**
 * Timer history and statistics display component.
 *
 * This component displays user's timer session history and productivity statistics.
 * It shows an analytics dashboard with metrics like total sessions, completion rate,
 * time spent, and streaks, along with the 10 most recent timer sessions.
 *
 * @component
 *
 * @remarks
 * - Displays comprehensive statistics dashboard including:
 *   - Total sessions count
 *   - Completed sessions count
 *   - Total time spent across all sessions
 *   - Current and longest streaks
 *   - Sessions breakdown by focus mode
 * - Shows 10 most recent sessions with details
 * - Includes confirmation dialog for clearing history
 * - Uses memoization for performance optimization
 * - Responsive design with grid layout
 * - Empty state when no sessions exist
 *
 * @example
 * ```tsx
 * // Display in History tab
 * <TimerHistory />
 * ```
 *
 * @returns {React.ReactElement} Statistics dashboard and recent sessions list
 */
function TimerHistory() {
  const { sessions, clearHistory, getStatistics } = useTimerHistory();

  /**
   * Controls the visibility of the clear history confirmation dialog.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [dialogOpen, setDialogOpen] = useState(false);

  /**
   * Computed statistics from all timer sessions.
   * @type {object}
   */
  const statistics = getStatistics();

  /**
   * Memoized list of the 10 most recent sessions.
   * Updates only when sessions array changes.
   *
   * @type {Array}
   */
  const recentSessions = useMemo(() => sessions.slice(0, 10), [sessions]);

  /**
   * Handles clearing all timer history.
   * Confirms deletion and closes the dialog.
   */
  const handleClearHistory = () => {
    clearHistory();
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statistics
          </CardTitle>
          <CardDescription>Your focus session analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Total Sessions */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Total Sessions</span>
              </div>
              <p className="text-2xl font-bold">{statistics.totalSessions}</p>
            </div>

            {/* Completed Sessions */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Completed</span>
              </div>
              <p className="text-2xl font-bold">{statistics.completedSessions}</p>
            </div>

            {/* Total Time Spent */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Total Time</span>
              </div>
              <p className="text-2xl font-bold">{formatDuration(statistics.totalTimeSpent)}</p>
            </div>

            {/* Current Streak */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4" />
                <span>Current Streak</span>
              </div>
              <p className="text-2xl font-bold">{statistics.currentStreak} days</p>
            </div>

            {/* Longest Streak */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Longest Streak</span>
              </div>
              <p className="text-2xl font-bold">{statistics.longestStreak} days</p>
            </div>
          </div>

          {/* Sessions by Mode */}
          {Object.keys(statistics.sessionsByMode).length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Sessions by Mode</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statistics.sessionsByMode).map(([mode, count]) => (
                  <Badge
                    key={mode}
                    variant="secondary"
                    className={focusModeConfig[mode as keyof typeof focusModeConfig]?.color}
                  >
                    {focusModeConfig[mode as keyof typeof focusModeConfig]?.label || mode}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Your 10 most recent timer sessions</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={sessions.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear History
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear Timer History?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all your timer sessions and statistics. This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleClearHistory}>
                    Clear History
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No timer sessions yet</p>
              <p className="text-sm mt-1">Start a timer to see your history here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge
                      variant="secondary"
                      className={focusModeConfig[session.focusMode]?.color}
                    >
                      {focusModeConfig[session.focusMode]?.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatTime(session.duration)}</span>
                        <Badge
                          variant={session.completed ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {session.completed ? 'Completed' : 'Incomplete'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatRelativeTime(session.completedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TimerHistory;
