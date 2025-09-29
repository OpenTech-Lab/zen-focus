import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionHistory } from '../session-history'
import { SessionService } from '../../../lib/services/session-service'
import { Session, SessionMode } from '../../../lib/models/session'

// Mock the session service
jest.mock('../../../lib/services/session-service')
const MockedSessionService = SessionService as jest.MockedClass<typeof SessionService>

// Sample test data
const mockSessions: Session[] = [
  {
    id: '1',
    userId: 'user-1',
    mode: 'study',
    startTime: '2023-12-01T10:00:00.000Z',
    endTime: '2023-12-01T10:25:00.000Z',
    plannedDuration: 25,
    actualDuration: 25,
    completedFully: true,
    pauseCount: 0,
    totalPauseTime: 0,
    ambientSound: 'rain',
    notes: 'Great focus session',
  },
  {
    id: '2',
    userId: 'user-1',
    mode: 'deepwork',
    startTime: '2023-12-01T14:00:00.000Z',
    endTime: '2023-12-01T14:45:00.000Z',
    plannedDuration: 60,
    actualDuration: 45,
    completedFully: false,
    pauseCount: 2,
    totalPauseTime: 5,
    ambientSound: 'forest',
    notes: 'Interrupted by meeting',
  },
  {
    id: '3',
    userId: 'user-1',
    mode: 'zen',
    startTime: '2023-12-02T09:00:00.000Z',
    endTime: '2023-12-02T09:15:00.000Z',
    plannedDuration: 15,
    actualDuration: 15,
    completedFully: true,
    pauseCount: 0,
    totalPauseTime: 0,
    ambientSound: 'silence',
  },
]

const mockStats = {
  totalFocusTime: 85,
  completionRate: 67,
  currentStreak: 1,
  longestStreak: 3,
  modeBreakdown: {
    study: { count: 1, totalTime: 25 },
    deepwork: { count: 1, totalTime: 45 },
    yoga: { count: 0, totalTime: 0 },
    zen: { count: 1, totalTime: 15 },
  },
}

describe('SessionHistory Component', () => {
  let mockSessionService: jest.Mocked<SessionService>

  beforeEach(() => {
    mockSessionService = new MockedSessionService() as jest.Mocked<SessionService>
    mockSessionService.getSessionHistory.mockResolvedValue(mockSessions)
    mockSessionService.getSessionStats.mockResolvedValue(mockStats)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    test('should render session history component', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getByText('Session History')).toBeInTheDocument()
      })
    })

    test('should display loading state initially', () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Loading sessions...')).toBeInTheDocument()
    })

    test('should display sessions after loading', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Study Session')).toBeInTheDocument()
        expect(screen.getByText('Deep Work Session')).toBeInTheDocument()
        expect(screen.getByText('Zen Session')).toBeInTheDocument()
      })
    })
  })

  describe('Statistics Display', () => {
    test('should display total focus time', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Total Focus Time')).toBeInTheDocument()
        expect(screen.getByText('1h 25m')).toBeInTheDocument()
      })
    })

    test('should display completion rate', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Completion Rate')).toBeInTheDocument()
        expect(screen.getByText('67%')).toBeInTheDocument()
      })
    })

    test('should display current streak', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Current Streak')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })
  })

  describe('Filtering', () => {
    test('should show session mode filter', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByLabelText('Filter by session mode')).toBeInTheDocument()
      })
    })

    test('should filter sessions by mode', async () => {
      const user = userEvent.setup()
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Study Session')).toBeInTheDocument()
      })

      // Click to open the select dropdown
      const modeFilter = screen.getByLabelText('Filter by session mode')
      await user.click(modeFilter)

      // Wait for dropdown to open and click Study option
      await waitFor(() => {
        const studyOption = screen.getByText('Study')
        user.click(studyOption)
      })

      // Wait for the filtered call
      await waitFor(() => {
        expect(mockSessionService.getSessionHistory).toHaveBeenCalledTimes(2)
        expect(mockSessionService.getSessionHistory).toHaveBeenNthCalledWith(2, 'user-1', {
          mode: 'study',
          page: 0,
          limit: 10,
        })
      })
    })

    test('should show date range filter', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByLabelText('Start date')).toBeInTheDocument()
        expect(screen.getByLabelText('End date')).toBeInTheDocument()
      })
    })

    test('should filter sessions by completion status', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        const completedOnlyFilter = screen.getByLabelText('Show completed sessions only')
        fireEvent.click(completedOnlyFilter)
      })

      expect(mockSessionService.getSessionHistory).toHaveBeenCalledWith('user-1', {
        completedOnly: true,
        page: 0,
        limit: 10,
      })
    })
  })

  describe('Sorting', () => {
    test('should show sort options', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByLabelText('Sort by')).toBeInTheDocument()
      })
    })

    test('should sort sessions by date', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        const sortSelect = screen.getByLabelText('Sort by')
        fireEvent.change(sortSelect, { target: { value: 'date-desc' } })
      })

      // Verify sessions are displayed in correct order (most recent first)
      const sessions = screen.getAllByTestId('session-item')
      expect(sessions[0]).toHaveTextContent('Zen Session')
      expect(sessions[1]).toHaveTextContent('Deep Work Session')
      expect(sessions[2]).toHaveTextContent('Study Session')
    })
  })

  describe('Session Details', () => {
    test('should display session duration', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('25 min')).toBeInTheDocument()
        expect(screen.getByText('45 min')).toBeInTheDocument()
        expect(screen.getByText('15 min')).toBeInTheDocument()
      })
    })

    test('should show completion status', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getAllByText('Completed')).toHaveLength(2)
        expect(screen.getByText('Incomplete')).toBeInTheDocument()
      })
    })

    test('should display session notes when available', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      // Wait for sessions to load
      await waitFor(() => {
        expect(screen.getByText('Study Session')).toBeInTheDocument()
      })

      // Click details button to expand the first session (study session)
      const detailsButtons = screen.getAllByText('Details')
      fireEvent.click(detailsButtons[0])

      // Now check for notes
      await waitFor(() => {
        expect(screen.getByText('Great focus session')).toBeInTheDocument()
      })

      // Click details button to expand the second session (deepwork session)
      const detailsButtons2 = screen.getAllByText('Details')
      const secondDetailsButton = detailsButtons2.find(button =>
        button.getAttribute('aria-label')?.includes('Show session details')
      ) || detailsButtons2[1]

      if (secondDetailsButton) {
        fireEvent.click(secondDetailsButton)
        await waitFor(() => {
          expect(screen.getByText('Interrupted by meeting')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Export Functionality', () => {
    test('should show export button', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
    })

    test('should trigger CSV export when clicked', async () => {
      // Mock URL.createObjectURL
      const mockCreateObjectURL = jest.fn()
      global.URL.createObjectURL = mockCreateObjectURL

      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        const exportButton = screen.getByText('Export')
        fireEvent.click(exportButton)
      })

      expect(mockCreateObjectURL).toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    test('should show empty state when no sessions exist', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue([])

      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('No sessions found')).toBeInTheDocument()
        expect(screen.getByText('Start your first focus session to see your history here.')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('should display error message when session loading fails', async () => {
      mockSessionService.getSessionHistory.mockRejectedValue(new Error('Failed to load sessions'))

      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByText('Error loading sessions')).toBeInTheDocument()
        expect(screen.getByText('Try again')).toBeInTheDocument()
      })
    })

    test('should retry loading sessions when retry button is clicked', async () => {
      mockSessionService.getSessionHistory
        .mockRejectedValueOnce(new Error('Failed to load sessions'))
        .mockResolvedValueOnce(mockSessions)

      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        const retryButton = screen.getByText('Try again')
        fireEvent.click(retryButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Study Session')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Session history')
        expect(screen.getByRole('region', { name: 'Session statistics' })).toBeInTheDocument()
        expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Session history table')
      })
    })

    test('should support keyboard navigation', async () => {
      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        const sessionItems = screen.getAllByRole('button', { name: /session details/i })
        expect(sessionItems).toHaveLength(3)

        sessionItems.forEach(item => {
          expect(item).toHaveAttribute('tabIndex', '0')
        })
      })
    })
  })

  describe('Responsive Design', () => {
    test('should render mobile-friendly layout', async () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        const container = screen.getByRole('main')
        expect(container).toHaveClass('responsive-layout')
      })
    })
  })

  describe('Pagination', () => {
    test('should show pagination when there are many sessions', async () => {
      const manySessions = Array.from({ length: 25 }, (_, i) => ({
        ...mockSessions[0],
        id: `session-${i}`,
        startTime: new Date(Date.now() - i * 86400000).toISOString(),
      }))

      mockSessionService.getSessionHistory.mockResolvedValue(manySessions.slice(0, 10))

      render(<SessionHistory sessionService={mockSessionService} userId="user-1" />)

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Session history pagination' })).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })
  })
})