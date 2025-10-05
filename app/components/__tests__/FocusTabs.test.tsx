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

describe('FocusTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Rendering', () => {
    it('should render all 5 tabs correctly', () => {
      render(<FocusTabs />);

      // Check that all tab triggers are rendered
      expect(screen.getByRole('tab', { name: /study/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /work/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /yoga/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /meditation/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
    });

    it('should render Study tab as default active tab', () => {
      render(<FocusTabs />);

      const studyTab = screen.getByRole('tab', { name: /study/i });
      expect(studyTab).toHaveAttribute('data-state', 'active');
    });

    it('should display correct title for Study tab content', () => {
      render(<FocusTabs />);

      expect(screen.getByText('Study Timer')).toBeInTheDocument();
    });

    it('should display correct description for Study tab content', () => {
      render(<FocusTabs />);

      expect(screen.getByText('Focus timer for deep study sessions')).toBeInTheDocument();
    });
  });

  describe('Tab Switching Functionality', () => {
    it('should switch to Work tab when clicked', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const workTab = screen.getByRole('tab', { name: /work/i });
      await user.click(workTab);

      await waitFor(() => {
        expect(workTab).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Deep Work Timer')).toBeInTheDocument();
        expect(screen.getByText('Focused timer for deep work sessions')).toBeInTheDocument();
      });
    });

    it('should switch to Yoga tab when clicked', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const yogaTab = screen.getByRole('tab', { name: /yoga/i });
      await user.click(yogaTab);

      await waitFor(() => {
        expect(yogaTab).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Yoga Timer')).toBeInTheDocument();
        expect(screen.getByText('Mindful timer for yoga practice')).toBeInTheDocument();
      });
    });

    it('should switch to Meditation tab when clicked', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const meditationTab = screen.getByRole('tab', { name: /meditation/i });
      await user.click(meditationTab);

      await waitFor(() => {
        expect(meditationTab).toHaveAttribute('data-state', 'active');
        expect(screen.getByText('Meditation Timer')).toBeInTheDocument();
        expect(screen.getByText('Calm timer for meditation practice')).toBeInTheDocument();
      });
    });

    it('should deactivate previous tab when switching tabs', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const studyTab = screen.getByRole('tab', { name: /study/i });
      const workTab = screen.getByRole('tab', { name: /work/i });

      // Initially Study tab is active
      expect(studyTab).toHaveAttribute('data-state', 'active');

      // Click Work tab
      await user.click(workTab);

      await waitFor(() => {
        expect(studyTab).toHaveAttribute('data-state', 'inactive');
        expect(workTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('should handle multiple tab switches correctly', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const studyTab = screen.getByRole('tab', { name: /study/i });
      const workTab = screen.getByRole('tab', { name: /work/i });
      const yogaTab = screen.getByRole('tab', { name: /yoga/i });
      const meditationTab = screen.getByRole('tab', { name: /meditation/i });

      // Switch from Study to Work
      await user.click(workTab);
      await waitFor(() => {
        expect(workTab).toHaveAttribute('data-state', 'active');
      });

      // Switch from Work to Yoga
      await user.click(yogaTab);
      await waitFor(() => {
        expect(yogaTab).toHaveAttribute('data-state', 'active');
        expect(workTab).toHaveAttribute('data-state', 'inactive');
      });

      // Switch from Yoga to Meditation
      await user.click(meditationTab);
      await waitFor(() => {
        expect(meditationTab).toHaveAttribute('data-state', 'active');
        expect(yogaTab).toHaveAttribute('data-state', 'inactive');
      });

      // Switch back to Study
      await user.click(studyTab);
      await waitFor(() => {
        expect(studyTab).toHaveAttribute('data-state', 'active');
        expect(meditationTab).toHaveAttribute('data-state', 'inactive');
      });
    });
  });

  describe('Timer Duration Configuration', () => {
    it('should render Timer with correct duration for Study tab (1500 seconds)', () => {
      render(<FocusTabs />);

      const timer = screen.getByTestId('timer-component');
      expect(timer).toHaveAttribute('data-duration', '1500');
      expect(timer).toHaveAttribute('data-title', 'Study Timer');
    });

    it('should render Timer with correct duration for Work tab (3600 seconds)', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const workTab = screen.getByRole('tab', { name: /work/i });
      await user.click(workTab);

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '3600');
        expect(timer).toHaveAttribute('data-title', 'Deep Work Timer');
      });
    });

    it('should render Timer with correct duration for Yoga tab (1800 seconds)', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const yogaTab = screen.getByRole('tab', { name: /yoga/i });
      await user.click(yogaTab);

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '1800');
        expect(timer).toHaveAttribute('data-title', 'Yoga Timer');
      });
    });

    it('should render Timer with correct duration for Meditation tab (600 seconds)', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const meditationTab = screen.getByRole('tab', { name: /meditation/i });
      await user.click(meditationTab);

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '600');
        expect(timer).toHaveAttribute('data-title', 'Meditation Timer');
      });
    });

    it('should update timer duration when switching between tabs', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      // Study tab - 1500 seconds
      let timer = screen.getByTestId('timer-component');
      expect(timer).toHaveAttribute('data-duration', '1500');

      // Switch to Work tab - 3600 seconds
      const workTab = screen.getByRole('tab', { name: /work/i });
      await user.click(workTab);

      await waitFor(() => {
        timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '3600');
      });

      // Switch to Meditation tab - 600 seconds
      const meditationTab = screen.getByRole('tab', { name: /meditation/i });
      await user.click(meditationTab);

      await waitFor(() => {
        timer = screen.getByTestId('timer-component');
        expect(timer).toHaveAttribute('data-duration', '600');
      });
    });
  });

  describe('Timer Component Rendering', () => {
    it('should render Timer component within Study tab', () => {
      render(<FocusTabs />);

      const timer = screen.getByTestId('timer-component');
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveTextContent('Study Timer');
    });

    it('should render Timer component within Work tab', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const workTab = screen.getByRole('tab', { name: /work/i });
      await user.click(workTab);

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toBeInTheDocument();
        expect(timer).toHaveTextContent('Deep Work Timer');
      });
    });

    it('should render Timer component within Yoga tab', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const yogaTab = screen.getByRole('tab', { name: /yoga/i });
      await user.click(yogaTab);

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toBeInTheDocument();
        expect(timer).toHaveTextContent('Yoga Timer');
      });
    });

    it('should render Timer component within Meditation tab', async () => {
      const user = userEvent.setup();
      render(<FocusTabs />);

      const meditationTab = screen.getByRole('tab', { name: /meditation/i });
      await user.click(meditationTab);

      await waitFor(() => {
        const timer = screen.getByTestId('timer-component');
        expect(timer).toBeInTheDocument();
        expect(timer).toHaveTextContent('Meditation Timer');
      });
    });

    it('should render exactly one Timer component at a time', () => {
      render(<FocusTabs />);

      const timers = screen.getAllByTestId('timer-component');
      // Only the active tab's timer should be visible
      expect(timers).toHaveLength(1);
    });

    it('should pass correct props to Timer component', () => {
      render(<FocusTabs />);

      const timer = screen.getByTestId('timer-component');
      expect(timer).toHaveAttribute('data-duration', '1500');
      expect(timer).toHaveAttribute('data-title', 'Study Timer');
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
    it('should render tabs list with grid layout for 5 columns', () => {
      const { container } = render(<FocusTabs />);

      const tabsList = container.querySelector('[role="tablist"]');
      expect(tabsList).toHaveClass('grid', 'w-full', 'grid-cols-5', 'mb-12');
    });

    it('should render all tabs in the correct order', () => {
      render(<FocusTabs />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);
      expect(tabs[0]).toHaveTextContent('Study');
      expect(tabs[1]).toHaveTextContent('Work');
      expect(tabs[2]).toHaveTextContent('Yoga');
      expect(tabs[3]).toHaveTextContent('Meditation');
      expect(tabs[4]).toHaveTextContent('History');
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
});
