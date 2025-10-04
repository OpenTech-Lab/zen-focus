import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import Timer from '../Timer';

// Mock DurationInput component
vi.mock('../DurationInput', () => ({
  default: () => null,
}));

// Mock useNotification hook
vi.mock('@/lib/hooks/useNotification', () => ({
  useNotification: () => ({
    notify: vi.fn(),
    playSound: vi.fn(),
    showNotification: vi.fn(),
  }),
}));

describe('Timer Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Full user flow: start → pause → reset', () => {
    it('should complete the full timer control flow', async () => {
      render(<Timer duration={10} title="Test Session" />);

      // Initial state
      expect(screen.getByText('00:10')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();

      // Start the timer
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

      // Timer starts running - check it has decreased from initial value
      expect(screen.getByText('00:10')).toBeInTheDocument();

      // Let some time pass
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      // Timer should have counted down
      const currentTime = screen.queryByText('00:10');
      expect(currentTime).not.toBeInTheDocument();

      // Pause the timer
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      act(() => {
        fireEvent.click(pauseButton);
      });
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();

      // Get the time when paused (should be less than 10)
      const timeElements = screen.getAllByText(/00:\d{2}/);
      const timeWhenPaused = timeElements[0].textContent;

      // Time should not advance when paused
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.getByText(timeWhenPaused!)).toBeInTheDocument();

      // Reset the timer
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      });
      expect(screen.getByText('00:10')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    it('should allow resuming after pause', async () => {
      render(<Timer duration={10} />);

      // Start timer
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      // Run for some time
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Get current time after countdown
      const timeAfterStart = screen.getAllByText(/00:\d{2}/)[0].textContent;

      // Pause
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
      });

      // Resume
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

      // Continue countdown
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      // Should have counted down more from the paused time
      const timeAfterResume = screen.getAllByText(/00:\d{2}/)[0].textContent;
      const timeAfterStartNum = parseInt(timeAfterStart!.split(':')[1]);
      const timeAfterResumeNum = parseInt(timeAfterResume!.split(':')[1]);
      expect(timeAfterResumeNum).toBeLessThan(timeAfterStartNum);
    });
  });

  describe('Timer countdown integration', () => {
    it('should countdown accurately second by second', async () => {
      render(<Timer duration={5} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      expect(screen.getByText('00:05')).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(screen.getByText('00:04')).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(screen.getByText('00:03')).toBeInTheDocument();
    });

    it('should stop at zero', async () => {
      render(<Timer duration={3} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
    });
  });

  describe('Timer completion', () => {
    it('should show completion message when timer reaches zero', async () => {
      render(<Timer duration={2} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(screen.getByText(/time's up!/i)).toBeInTheDocument();
    });

    it('should call onComplete callback when timer finishes', async () => {
      const onComplete = vi.fn();
      render(<Timer duration={2} onComplete={onComplete} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Wait for useEffect to run
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should call onSessionComplete with completed=true when timer finishes', async () => {
      const onSessionComplete = vi.fn();
      render(<Timer duration={3} focusMode="study" onSessionComplete={onSessionComplete} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      // Wait for useEffect to run
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(onSessionComplete).toHaveBeenCalledWith('study', 3, true);
    });

    it('should call onSessionComplete with completed=false when timer is paused', async () => {
      const onSessionComplete = vi.fn();
      render(<Timer duration={10} focusMode="work" onSessionComplete={onSessionComplete} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(onSessionComplete).toHaveBeenCalledWith('work', 5, false);
    });

    it('should not call onSessionComplete if timer runs for less than 1 second', async () => {
      const onSessionComplete = vi.fn();
      render(<Timer duration={10} focusMode="yoga" onSessionComplete={onSessionComplete} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(onSessionComplete).not.toHaveBeenCalled();
    });

    it('should pass correct focus mode to onSessionComplete', async () => {
      const onSessionComplete = vi.fn();
      render(<Timer duration={2} focusMode="meditation" onSessionComplete={onSessionComplete} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(onSessionComplete).toHaveBeenCalledWith('meditation', 2, true);
    });
  });

  describe('Integration between Timer component and useTimer hook', () => {
    it('should properly integrate UI controls with hook state', async () => {
      render(<Timer duration={10} />);

      // Verify initial state from hook
      expect(screen.getByText('00:10')).toBeInTheDocument();
      const startButton = screen.getByRole('button', { name: /start/i });
      expect(startButton).not.toBeDisabled();

      // Start should trigger hook state change
      act(() => {
        fireEvent.click(startButton);
      });
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

      // Pause should trigger hook state change
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
      });
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();

      // Reset should trigger hook state change
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      });
      expect(screen.getByText('00:10')).toBeInTheDocument();
    });

    it('should update duration when prop changes', () => {
      const { rerender } = render(<Timer duration={10} />);
      expect(screen.getByText('00:10')).toBeInTheDocument();

      rerender(<Timer duration={20} />);
      expect(screen.getByText('00:20')).toBeInTheDocument();
    });

    it('should display progress indicator that updates with countdown', async () => {
      const { container } = render(<Timer duration={10} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      // Verify SVG progress circle exists and has stroke properties
      const progressCircle = container.querySelector('circle.text-primary');
      expect(progressCircle).toBeInTheDocument();
      expect(progressCircle).toHaveAttribute('stroke-dasharray');
      expect(progressCircle).toHaveAttribute('stroke-dashoffset');
    });

    it('should reset completion state when reset is clicked', async () => {
      render(<Timer duration={2} />);

      // Complete the timer
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.getByText(/time's up!/i)).toBeInTheDocument();

      // Reset should clear completion state
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      });
      expect(screen.queryByText(/time's up!/i)).not.toBeInTheDocument();
      expect(screen.getByText('00:02')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid start/pause clicks', async () => {
      render(<Timer duration={10} />);

      // Rapid clicks
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      // Should be in running state
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

      // Timer should still countdown correctly
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(screen.getByText('00:07')).toBeInTheDocument();
    });

    it('should handle reset during active countdown', async () => {
      render(<Timer duration={10} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(screen.getByText('00:05')).toBeInTheDocument();

      // Reset while running
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      });

      expect(screen.getByText('00:10')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    it('should not allow starting when timer is at zero', async () => {
      render(<Timer duration={1} />);

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      expect(startButton).toBeDisabled();

      // Try to click disabled button
      act(() => {
        fireEvent.click(startButton);
      });

      // Should still be at zero
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });
});
