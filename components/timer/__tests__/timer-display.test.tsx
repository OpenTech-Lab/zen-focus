import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TimerDisplay } from '../timer-display'
import { TimerService } from '../../../lib/services/timer-service'
import { SessionMode } from '../../../lib/models/session-mode'

// Mock TimerService
jest.mock('../../../lib/services/timer-service')

// Mock Next.js theme
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

const mockTimerService = {
  getCurrentState: jest.fn(),
  getSessionMode: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  isActive: jest.fn(),
  isPaused: jest.fn(),
} as jest.Mocked<Partial<TimerService>>

const mockSessionMode: SessionMode = {
  id: 'study',
  name: 'Study',
  description: 'Focused study sessions',
  defaultWorkDuration: 25,
  defaultBreakDuration: 5,
  color: '#10b981',
  icon: 'BookOpen',
}

const mockTimerState = {
  isActive: false,
  isPaused: false,
  mode: 'study' as const,
  phase: 'work' as const,
  timeRemaining: 1500, // 25 minutes in seconds
  totalElapsed: 0,
  currentCycle: 1,
}

describe('TimerDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTimerService.getCurrentState?.mockReturnValue(mockTimerState)
    mockTimerService.getSessionMode?.mockReturnValue(mockSessionMode)
    mockTimerService.isActive?.mockReturnValue(false)
    mockTimerService.isPaused?.mockReturnValue(false)
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByRole('timer')).toBeInTheDocument()
    })

    it('should display time in MM:SS format', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('25:00')).toBeInTheDocument()
    })

    it('should display current session mode', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('Study')).toBeInTheDocument()
    })

    it('should display current phase', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('Work')).toBeInTheDocument()
    })

    it('should display current cycle number', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText(/Cycle 1/)).toBeInTheDocument()
    })
  })

  describe('Progress Ring', () => {
    it('should render progress ring SVG', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const progressRing = screen.getByRole('progressbar')
      expect(progressRing).toBeInTheDocument()
    })

    it('should show 0% progress when timer is at full time', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const progressRing = screen.getByRole('progressbar')
      expect(progressRing).toHaveAttribute('aria-valuenow', '0')
    })

    it('should show 50% progress when half time has elapsed', () => {
      const halfElapsedState = {
        ...mockTimerState,
        timeRemaining: 750, // 12.5 minutes remaining = 50% elapsed
      }
      mockTimerService.getCurrentState?.mockReturnValue(halfElapsedState)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const progressRing = screen.getByRole('progressbar')
      expect(progressRing).toHaveAttribute('aria-valuenow', '50')
    })

    it('should show 100% progress when time is complete', () => {
      const completedState = {
        ...mockTimerState,
        timeRemaining: 0,
      }
      mockTimerService.getCurrentState?.mockReturnValue(completedState)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const progressRing = screen.getByRole('progressbar')
      expect(progressRing).toHaveAttribute('aria-valuenow', '100')
    })
  })

  describe('Time Formatting', () => {
    it('should format hours, minutes, and seconds correctly', () => {
      const timeState = {
        ...mockTimerState,
        timeRemaining: 3661, // 1 hour, 1 minute, 1 second
      }
      mockTimerService.getCurrentState?.mockReturnValue(timeState)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('61:01')).toBeInTheDocument()
    })

    it('should format minutes and seconds correctly', () => {
      const timeState = {
        ...mockTimerState,
        timeRemaining: 305, // 5 minutes, 5 seconds
      }
      mockTimerService.getCurrentState?.mockReturnValue(timeState)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('05:05')).toBeInTheDocument()
    })

    it('should format seconds only correctly', () => {
      const timeState = {
        ...mockTimerState,
        timeRemaining: 42, // 42 seconds
      }
      mockTimerService.getCurrentState?.mockReturnValue(timeState)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('00:42')).toBeInTheDocument()
    })

    it('should show 00:00 when time is zero', () => {
      const timeState = {
        ...mockTimerState,
        timeRemaining: 0,
      }
      mockTimerService.getCurrentState?.mockReturnValue(timeState)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('00:00')).toBeInTheDocument()
    })
  })

  describe('Session States', () => {
    it('should show break phase when in break', () => {
      const breakState = {
        ...mockTimerState,
        phase: 'break' as const,
        timeRemaining: 300, // 5 minutes break
      }
      mockTimerService.getCurrentState?.mockReturnValue(breakState)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('Break')).toBeInTheDocument()
    })

    it('should display different session modes correctly', () => {
      const deepWorkMode: SessionMode = {
        ...mockSessionMode,
        id: 'deepwork',
        name: 'Deep Work',
        color: '#3b82f6',
      }
      mockTimerService.getSessionMode?.mockReturnValue(deepWorkMode)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(screen.getByText('Deep Work')).toBeInTheDocument()
    })

    it('should show active state visually', () => {
      mockTimerService.isActive?.mockReturnValue(true)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const timerDisplay = screen.getByRole('timer')
      expect(timerDisplay).toHaveClass('timer-active')
    })

    it('should show paused state visually', () => {
      mockTimerService.isPaused?.mockReturnValue(true)

      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const timerDisplay = screen.getByRole('timer')
      expect(timerDisplay).toHaveClass('timer-paused')
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to timer events on mount', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      expect(mockTimerService.on).toHaveBeenCalledWith('tick', expect.any(Function))
      expect(mockTimerService.on).toHaveBeenCalledWith('start', expect.any(Function))
      expect(mockTimerService.on).toHaveBeenCalledWith('pause', expect.any(Function))
      expect(mockTimerService.on).toHaveBeenCalledWith('resume', expect.any(Function))
      expect(mockTimerService.on).toHaveBeenCalledWith('reset', expect.any(Function))
      expect(mockTimerService.on).toHaveBeenCalledWith('phaseChange', expect.any(Function))
    })

    it('should unsubscribe from timer events on unmount', () => {
      const { unmount } = render(<TimerDisplay timerService={mockTimerService as TimerService} />)

      unmount()

      expect(mockTimerService.off).toHaveBeenCalledWith('tick', expect.any(Function))
      expect(mockTimerService.off).toHaveBeenCalledWith('start', expect.any(Function))
      expect(mockTimerService.off).toHaveBeenCalledWith('pause', expect.any(Function))
      expect(mockTimerService.off).toHaveBeenCalledWith('resume', expect.any(Function))
      expect(mockTimerService.off).toHaveBeenCalledWith('reset', expect.any(Function))
      expect(mockTimerService.off).toHaveBeenCalledWith('phaseChange', expect.any(Function))
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)

      expect(screen.getByRole('timer')).toHaveAttribute('aria-label', 'Timer display')
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Timer progress')
    })

    it('should have proper ARIA values for progress', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const progressRing = screen.getByRole('progressbar')

      expect(progressRing).toHaveAttribute('aria-valuemin', '0')
      expect(progressRing).toHaveAttribute('aria-valuemax', '100')
      expect(progressRing).toHaveAttribute('aria-valuenow', '0')
    })

    it('should be keyboard accessible', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const timerDisplay = screen.getByRole('timer')

      expect(timerDisplay).toHaveAttribute('tabIndex', '0')
    })

    it('should announce time updates for screen readers', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)

      const announcement = screen.getByRole('status', { hidden: true })
      expect(announcement).toBeInTheDocument()
      expect(announcement).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Responsive Design', () => {
    it('should apply responsive classes for mobile and desktop', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const timerDisplay = screen.getByRole('timer')

      expect(timerDisplay).toHaveClass('responsive-timer')
    })

    it('should adjust progress ring size for different screens', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const progressRing = screen.getByRole('progressbar')

      // Should have responsive sizing classes
      expect(progressRing.closest('svg')).toHaveClass('w-64', 'h-64', 'sm:w-80', 'sm:h-80')
    })
  })

  describe('Theme Support', () => {
    it('should apply theme-aware colors', () => {
      render(<TimerDisplay timerService={mockTimerService as TimerService} />)
      const timerDisplay = screen.getByRole('timer')

      expect(timerDisplay).toHaveClass('theme-adaptive')
    })
  })

  describe('Performance Optimization', () => {
    it('should use React.memo for performance', () => {
      // This test ensures the component is wrapped with React.memo
      const TimerDisplayType = TimerDisplay as any
      expect(TimerDisplayType.$$typeof).toBeDefined()
    })
  })
})
