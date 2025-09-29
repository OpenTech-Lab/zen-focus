/**
 * Session History Components
 *
 * A comprehensive suite of components for displaying and analyzing focus session history.
 * Designed to integrate seamlessly with the ZenFocus design system.
 */

// Main components
export { SessionHistoryInterface } from './session-history-interface'
export { SessionChart } from './session-chart'
export { SessionInsights } from './session-insights'

// Type exports
export type {
  SessionHistoryInterfaceProps,
  HistoryFilter,
  SessionStatsData,
} from './session-history-interface'

export type {
  SessionChartProps,
  ChartDataPoint,
  TrendData,
} from './session-chart'

export type {
  SessionInsightsProps,
  Insight,
  SessionPattern,
} from './session-insights'