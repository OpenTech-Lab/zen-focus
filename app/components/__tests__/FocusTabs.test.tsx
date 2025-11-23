import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FocusTabs from '../FocusTabs';

// Mock framer-motion to disable animations in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock the Timer component to avoid testing its internal logic
vi.mock('../Timer', () => ({
  default: ({ duration, title }: { duration: number; title: string }) => (
    <div data-testid="timer-component" data-duration={duration} data-title={title}>
      Mock Timer - {title} - {duration}s
    </div>
  ),
}));

// Mock the TimerHistory component
vi.mock('../TimerHistory', () => ({
  default: () => <div data-testid="timer-history">Timer History</div>,
}));

// Mock the hooks used by Timer to prevent side effects
vi.mock('@/lib/hooks/useTimer', () => ({
  useTimer: () => ({
    timeLeft: 1500,
    isRunning: false,
    isComplete: false,
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    setDuration: vi.fn(),
  }),
}));

vi.mock('@/lib/hooks/useNotification', () => ({
  useNotification: () => ({
    notify: vi.fn(),
  }),
}));

vi.mock('@/lib/hooks/useTimerHistory', () => ({
  useTimerHistory: () => ({
    sessions: [],
    addSession: vi.fn(),
    clearHistory: vi.fn(),
    getStatistics: vi.fn(() => ({
      totalSessions: 0,
      completedSessions: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      sessionsByMode: {},
    })),
  }),
}));

// Mock FocusModeSelector component
vi.mock('../FocusModeSelector', () => ({
  default: ({ selectedMode, onModeChange }: { selectedMode: string; onModeChange: (mode: string) => void }) => (
    <div data-testid="focus-mode-selector" data-selected-mode={selectedMode}>
      <button onClick={() => onModeChange('study')}>Study</button>
      <button onClick={() => onModeChange('work')}>Work</button>
      <button onClick={() => onModeChange('yoga')}>Yoga</button>
      <button onClick={() => onModeChange('meditation')}>Meditation</button>
    </div>
  ),
}));

describe('FocusTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Rendering', () => {
    it('should render only 3 tabs: Focus, Intervals and History', () => {
      render(<FocusTabs />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(screen.getByRole('tab', { name: /focus/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /intervals/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
    });

    it('should not render individual mode tabs', () => {
      render(<FocusTabs />);

      expect(screen.queryByRole('tab', { name: /^study$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /^work$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /^yoga$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /^meditation$/i })).not.toBeInTheDocument();
    });

    it('should render Focus tab as default active tab', () => {
      render(<FocusTabs />);

      const focusTab = screen.getByRole('tab', { name: /focus/i });
      expect(focusTab).toHaveAttribute('data-state', 'active');
    });

    it('should display correct title for default Study mode', () => {
      render(<FocusTabs />);

      expect(screen.getByText('Study Timer')).toBeInTheDocument();
    });

    it('should display correct description for default Study mode', () => {
      render(<FocusTabs />);

      expect(screen.getByText('Focus timer for deep study sessions')).toBeInTheDocument();
    });

    it('should render FocusModeSelector within Focus tab', () => {
      render(<FocusTabs />);

      const selector = screen.getByTestId('focus-mode-selector');
      expect(selector).toBeInTheDocument();
    });
  });

  describe('Tab Switching Functionality', () => {
    it('should switch to History tab when clicked', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const historyTab = screen.getByRole('tab', { name: /history/i });
      await user.click(historyTab);

      await waitFor(() => {
        expect(historyTab).toHaveAttribute('data-state', 'active');
        expect(screen.getByTestId('timer-history')).toBeInTheDocument();
      });
    });

    it('should deactivate Focus tab when switching to History', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const focusTab = screen.getByRole('tab', { name: /focus/i });
      const historyTab = screen.getByRole('tab', { name: /history/i });

      expect(focusTab).toHaveAttribute('data-state', 'active');

      await user.click(historyTab);

      await waitFor(() => {
        expect(focusTab).toHaveAttribute('data-state', 'inactive');
        expect(historyTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('should switch back to Focus tab from History', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const focusTab = screen.getByRole('tab', { name: /focus/i });
      const historyTab = screen.getByRole('tab', { name: /history/i });

      await user.click(historyTab);
      await waitFor(() => {
        expect(historyTab).toHaveAttribute('data-state', 'active');
      });

      await user.click(focusTab);
      await waitFor(() => {
        expect(focusTab).toHaveAttribute('data-state', 'active');
        expect(historyTab).toHaveAttribute('data-state', 'inactive');
      });
    });
  });

  describe('Focus Mode Switching', () => {
    it('should update title when switching to Work mode', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const workButton = screen.getByText('Work');
      await user.click(workButton);

      await waitFor(() => {
        expect(screen.getByText('Deep Work Timer')).toBeInTheDocument();
        expect(screen.getByText('Focused timer for deep work sessions')).toBeInTheDocument();
      });
    });

    it('should update title when switching to Yoga mode', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const yogaButton = screen.getByText('Yoga');
      await user.click(yogaButton);

      await waitFor(() => {
        expect(screen.getByText('Yoga Timer')).toBeInTheDocument();
        expect(screen.getByText('Mindful timer for yoga practice')).toBeInTheDocument();
      });
    });

    it('should update title when switching to Meditation mode', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const meditationButton = screen.getByText('Meditation');
      await user.click(meditationButton);

      await waitFor(() => {
        expect(screen.getByText('Meditation Timer')).toBeInTheDocument();
        expect(screen.getByText('Calm timer for meditation practice')).toBeInTheDocument();
      });
    });

    it('should handle multiple mode switches correctly', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      // Switch to Work
      await user.click(screen.getByText('Work'));
      await waitFor(() => {
        expect(screen.getByText('Deep Work Timer')).toBeInTheDocument();
      });

      // Switch to Yoga
      await user.click(screen.getByText('Yoga'));
      await waitFor(() => {
        expect(screen.getByText('Yoga Timer')).toBeInTheDocument();
      });

      // Switch to Meditation
      await user.click(screen.getByText('Meditation'));
      await waitFor(() => {
        expect(screen.getByText('Meditation Timer')).toBeInTheDocument();
      });

      // Switch back to Study
      await user.click(screen.getByText('Study'));
      await waitFor(() => {
        expect(screen.getByText('Study Timer')).toBeInTheDocument();
      });
    });

    it('should pass selected mode to FocusModeSelector', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const selector = screen.getByTestId('focus-mode-selector');
      expect(selector).toHaveAttribute('data-selected-mode', 'study');

      await user.click(screen.getByText('Work'));

      await waitFor(() => {
        expect(selector).toHaveAttribute('data-selected-mode', 'work');
      });
    });
  });

  describe('Timer Duration Configuration', () => {
    it('should render Timer with correct duration for default Study mode (1500 seconds)', () => {
      render(<FocusTabs />);

      const timer = screen.getByTestId('timer-component');
      expect(timer).toHaveAttribute('data-duration', '1500');
      expect(timer).toHaveAttribute('data-title', 'Study Timer');
    });

    it('should render Timer with correct duration for Work mode (3600 seconds)', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      await user.click(screen.getByText('Work'));

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '3600');
        expect(timer).toHaveAttribute('data-title', 'Deep Work Timer');
      });
    });

    it('should render Timer with correct duration for Yoga mode (1800 seconds)', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      await user.click(screen.getByText('Yoga'));

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '1800');
        expect(timer).toHaveAttribute('data-title', 'Yoga Timer');
      });
    });

    it('should render Timer with correct duration for Meditation mode (600 seconds)', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      await user.click(screen.getByText('Meditation'));

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '600');
        expect(timer).toHaveAttribute('data-title', 'Meditation Timer');
      });
    });

    it('should update timer duration when switching between modes', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      // Study mode - 1500 seconds
      let timer = screen.getByTestId('timer-component');
      expect(timer).toHaveAttribute('data-duration', '1500');

      // Switch to Work mode - 3600 seconds
      await user.click(screen.getByText('Work'));

      await waitFor(() => {
        timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '3600');
      });

      // Switch to Meditation mode - 600 seconds
      await user.click(screen.getByText('Meditation'));

      await waitFor(() => {
        timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '600');
      });
    });
  });

  describe('Timer Component Rendering', () => {
    it('should render Timer component within Focus tab for Study mode', () => {
      render(<FocusTabs />);

      const timer = screen.getByTestId('timer-component');
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveTextContent('Study Timer');
    });

    it('should render Timer component for Work mode', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      await user.click(screen.getByText('Work'));

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toBeInTheDocument();
        expect(timer).toHaveTextContent('Deep Work Timer');
      });
    });

    it('should render Timer component for Yoga mode', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      await user.click(screen.getByText('Yoga'));

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toBeInTheDocument();
        expect(timer).toHaveTextContent('Yoga Timer');
      });
    });

    it('should render Timer component for Meditation mode', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      await user.click(screen.getByText('Meditation'));

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toBeInTheDocument();
        expect(timer).toHaveTextContent('Meditation Timer');
      });
    });

    it('should render exactly one Timer component at a time', () => {
      render(<FocusTabs />);

      const timers = screen.getAllByTestId('timer-component');
      expect(timers).toHaveLength(1);
    });

    it('should pass correct props to Timer component', () => {
      render(<FocusTabs />);

      const timer = screen.getByTestId('timer-component');
      expect(timer).toHaveAttribute('data-duration', '1500');
      expect(timer).toHaveAttribute('data-title', 'Study Timer');
    });

    it('should not render Timer in History tab', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      await user.click(screen.getByRole('tab', { name: /history/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('timer-component')).not.toBeInTheDocument();
        expect(screen.getByTestId('timer-history')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Content Structure', () => {
    it('should render tab content with correct CSS classes', () => {
      const { container } = render(<FocusTabs />);

      const tabContent = container.querySelector('[role="tabpanel"]');
      expect(tabContent).toHaveClass('text-center');
    });

    it('should render title with correct styling', () => {
      render(<FocusTabs />);

      const title = screen.getByText('Study Timer');
      expect(title.tagName).toBe('H1');
      expect(title).toHaveClass('text-4xl', 'font-bold', 'mb-2');
    });

    it('should render description with correct styling', () => {
      render(<FocusTabs />);

      const description = screen.getByText('Focus timer for deep study sessions');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-lg', 'text-muted-foreground', 'mb-8');
    });
  });

  describe('Tabs Layout', () => {
    it('should render tabs list with grid layout for 3 columns', () => {
      const { container } = render(<FocusTabs />);

      const tabsList = container.querySelector('[role="tablist"]');
      expect(tabsList).toHaveClass('grid', 'w-full', 'grid-cols-3', 'mb-12');
    });

    it('should render tabs in the correct order', () => {
      render(<FocusTabs />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveTextContent('Focus');
      expect(tabs[1]).toHaveTextContent('Intervals');
      expect(tabs[2]).toHaveTextContent('History');
    });

    it('should render main container with correct layout classes', () => {
      const { container } = render(<FocusTabs />);

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass(
        'flex',
        'min-h-screen',
        'flex-col',
        'items-center',
        'justify-center',
        'p-8',
        'sm:p-24'
      );
    });
  });

  describe('Mode Persistence', () => {
    it('should maintain selected mode when switching between Focus and History tabs', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      // Switch to Work mode
      await user.click(screen.getByText('Work'));
      await waitFor(() => {
        expect(screen.getByText('Deep Work Timer')).toBeInTheDocument();
      });

      // Switch to History tab
      await user.click(screen.getByRole('tab', { name: /history/i }));
      await waitFor(() => {
        expect(screen.getByTestId('timer-history')).toBeInTheDocument();
      });

      // Switch back to Focus tab
      await user.click(screen.getByRole('tab', { name: /focus/i }));
      await waitFor(() => {
        // Should still be on Work mode
        expect(screen.getByText('Deep Work Timer')).toBeInTheDocument();
        const selector = screen.getByTestId('focus-mode-selector');
        expect(selector).toHaveAttribute('data-selected-mode', 'work');
      });
    });
  });
});
