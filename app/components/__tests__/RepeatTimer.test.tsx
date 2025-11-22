import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RepeatTimer from '../RepeatTimer';

describe('RepeatTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render interval configuration inputs', () => {
      render(<RepeatTimer />);

      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repetitions/i)).toBeInTheDocument();
    });

    it('should render start button when timer is idle', () => {
      render(<RepeatTimer />);

      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    it('should show placeholder text for configuration', () => {
      render(<RepeatTimer />);

      expect(screen.getByText(/configure your interval timer/i)).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid duration input', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '5');

      expect(durationInput).toHaveValue(5);
    });

    it('should accept valid repetitions input', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const repsInput = screen.getByLabelText(/repetitions/i);
      await user.clear(repsInput);
      await user.type(repsInput, '3');

      expect(repsInput).toHaveValue(3);
    });

    it('should disable start button when inputs are invalid', () => {
      render(<RepeatTimer />);

      const startButton = screen.getByRole('button', { name: /start/i });
      expect(startButton).toBeDisabled();
    });

    it('should enable start button when inputs are valid', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '2');

      const startButton = screen.getByRole('button', { name: /start/i });
      expect(startButton).toBeEnabled();
    });

    it('should display total time when duration and repetitions are entered', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '5');
      await user.clear(repsInput);
      await user.type(repsInput, '3');

      // 5 minutes × 3 repetitions = 15 minutes total
      expect(screen.getByText(/total.*15.*minutes?/i)).toBeInTheDocument();
    });

    it('should update total time when inputs change', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      // Initial values: 10 minutes × 2 = 20 minutes
      await user.clear(durationInput);
      await user.type(durationInput, '10');
      await user.clear(repsInput);
      await user.type(repsInput, '2');

      expect(screen.getByText(/total.*20.*minutes?/i)).toBeInTheDocument();

      // Change to: 15 minutes × 4 = 60 minutes (1 hour)
      await user.clear(durationInput);
      await user.type(durationInput, '15');
      await user.clear(repsInput);
      await user.type(repsInput, '4');

      expect(screen.getByText(/total.*1.*hour/i)).toBeInTheDocument();
    });

    it('should not display total time when inputs are empty or zero', () => {
      render(<RepeatTimer />);

      expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    });
  });

  describe('Timer Execution', () => {
    it('should display current round when timer is running', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '3');

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      expect(screen.getByText(/round 1 of 3/i)).toBeInTheDocument();
    });

    it('should show pause button when timer is running', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '2');

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should show reset button when timer is running', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '2');

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('should pause timer when pause button is clicked', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '2');

      await user.click(screen.getByRole('button', { name: /start/i }));
      await user.click(screen.getByRole('button', { name: /pause/i }));

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should reset timer when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '2');

      await user.click(screen.getByRole('button', { name: /start/i }));
      await user.click(screen.getByRole('button', { name: /reset/i }));

      expect(screen.getByText(/configure your interval timer/i)).toBeInTheDocument();
    });
  });

  describe('Round Progression', () => {
    it('should advance to next round after current round completes', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '3');

      await user.click(screen.getByRole('button', { name: /start/i }));

      expect(screen.getByText(/round 1 of 3/i)).toBeInTheDocument();

      // Advance timer to complete first round (1 minute = 60 seconds)
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(screen.getByText(/round 2 of 3/i)).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('should show completion message when all rounds are done', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '2');

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Complete round 1
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(screen.getByText(/round 2 of 2/i)).toBeInTheDocument();
      });

      // Complete round 2
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(screen.getByText(/all rounds completed/i)).toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Session Tracking', () => {
    it('should call onSessionComplete for each completed round', async () => {
      vi.useFakeTimers();
      const onSessionComplete = vi.fn();
      const user = userEvent.setup({ delay: null });

      render(<RepeatTimer onSessionComplete={onSessionComplete} />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.clear(repsInput);
      await user.type(repsInput, '2');

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Complete round 1
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(onSessionComplete).toHaveBeenCalledTimes(1);
      });

      // Complete round 2
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(onSessionComplete).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });
});
