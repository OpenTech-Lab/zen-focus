import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RepeatTimer from "../RepeatTimer";

describe("RepeatTimer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render interval configuration inputs", () => {
      render(<RepeatTimer />);

      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repetitions/i)).toBeInTheDocument();
    });

    it("should render start button when timer is idle", () => {
      render(<RepeatTimer />);

      expect(
        screen.getByRole("button", { name: /start/i })
      ).toBeInTheDocument();
    });

    it("should show placeholder text for configuration", () => {
      render(<RepeatTimer />);

      expect(
        screen.getByText(/configure your interval timer/i)
      ).toBeInTheDocument();
    });
  });

  describe("Input Validation", () => {
    it("should accept valid duration input", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, "5");

      expect(durationInput).toHaveValue(5);
    });

    it("should accept valid repetitions input", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const repsInput = screen.getByLabelText(/repetitions/i);
      await user.clear(repsInput);
      await user.type(repsInput, "3");

      expect(repsInput).toHaveValue(3);
    });

    it("should disable start button when inputs are invalid", () => {
      render(<RepeatTimer />);

      const startButton = screen.getByRole("button", { name: /start/i });
      expect(startButton).toBeDisabled();
    });

    it("should enable start button when inputs are valid", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      const startButton = screen.getByRole("button", { name: /start/i });
      expect(startButton).toBeEnabled();
    });

    it("should display total time when duration and repetitions are entered", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "90");
      await user.clear(repsInput);
      await user.type(repsInput, "3");

      // 90 seconds × 3 repetitions = 270 seconds (4 minutes 30 seconds)
      expect(
        screen.getByText(/total.*4.*minutes.*30.*seconds/i)
      ).toBeInTheDocument();
    });

    it("should update total time when inputs change", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      // Initial values: 120 seconds × 2 = 240 seconds (4 minutes)
      await user.clear(durationInput);
      await user.type(durationInput, "120");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      expect(screen.getByText(/total.*4.*minutes/i)).toBeInTheDocument();

      // Change to: 3600 seconds × 2 = 7200 seconds (2 hours)
      await user.clear(durationInput);
      await user.type(durationInput, "3600");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      expect(screen.getByText(/total.*2.*hours/i)).toBeInTheDocument();
    });

    it("should not display total time when inputs are empty or zero", () => {
      render(<RepeatTimer />);

      expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    });
  });

  describe("Timer Execution", () => {
    it("should display current round when timer is running", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "3");

      const startButton = screen.getByRole("button", { name: /start/i });
      await user.click(startButton);

      expect(screen.getByText(/round 1 of 3/i)).toBeInTheDocument();
    });

    it("should show pause button when timer is running", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      const startButton = screen.getByRole("button", { name: /start/i });
      await user.click(startButton);

      expect(
        screen.getByRole("button", { name: /pause/i })
      ).toBeInTheDocument();
    });

    it("should show reset button when timer is running", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      const startButton = screen.getByRole("button", { name: /start/i });
      await user.click(startButton);

      expect(
        screen.getByRole("button", { name: /reset/i })
      ).toBeInTheDocument();
    });

    it("should pause timer when pause button is clicked", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      await user.click(screen.getByRole("button", { name: /start/i }));
      await user.click(screen.getByRole("button", { name: /pause/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /resume/i })
        ).toBeInTheDocument();
      });
    });

    it("should pause first round without resetting timer", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "10");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      await user.click(screen.getByRole("button", { name: /start/i }));

      // Verify timer started
      expect(screen.getByText(/round 1 of 2/i)).toBeInTheDocument();

      // Let 5 seconds pass
      vi.advanceTimersByTime(5000);

      // Verify time is at 5 seconds remaining
      await waitFor(() => {
        expect(screen.getByText(/00:05/i)).toBeInTheDocument();
      });

      // Pause the timer
      const pauseButton = screen.getByRole("button", { name: /pause/i });
      await user.click(pauseButton);

      // Wait for pause to take effect
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /resume/i })
        ).toBeInTheDocument();
      });

      // Timer should still show 00:05 (not reset to 00:10)
      expect(screen.getByText(/00:05/i)).toBeInTheDocument();

      vi.useRealTimers();
    }, 10000);

    it("should reset timer when reset button is clicked", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      await user.click(screen.getByRole("button", { name: /start/i }));
      await user.click(screen.getByRole("button", { name: /reset/i }));

      expect(
        screen.getByText(/configure your interval timer/i)
      ).toBeInTheDocument();
    });
  });

  describe("Round Progression", () => {
    it("should advance to next round after current round completes", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "3");

      await user.click(screen.getByRole("button", { name: /start/i }));

      expect(screen.getByText(/round 1 of 3/i)).toBeInTheDocument();

      // Advance timer to complete first round (1 second)
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/round 2 of 3/i)).toBeInTheDocument();
      });
    });

    it("should show completion message when all rounds are done", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      await user.click(screen.getByRole("button", { name: /start/i }));

      // Complete both rounds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/all rounds completed/i)).toBeInTheDocument();
      });
    });

    it("should count rounds consecutively (1, 2, 3, 4) without skipping", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      // Set up 4 rounds of 2 seconds each (shorter for faster test)
      await user.clear(durationInput);
      await user.type(durationInput, "2");
      await user.clear(repsInput);
      await user.type(repsInput, "4");

      await user.click(screen.getByRole("button", { name: /start/i }));

      // Verify round 1
      expect(screen.getByText(/round 1 of 4/i)).toBeInTheDocument();

      // Complete round 1 (2 seconds)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Verify round 2 (should be 2, not skipped to 3 or 4)
      await waitFor(() => {
        expect(screen.getByText(/round 2 of 4/i)).toBeInTheDocument();
      });

      // Complete round 2
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Verify round 3 (should be 3, not skipped)
      await waitFor(() => {
        expect(screen.getByText(/round 3 of 4/i)).toBeInTheDocument();
      });

      // Complete round 3
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Verify round 4 (should be 4, not skipped)
      await waitFor(() => {
        expect(screen.getByText(/round 4 of 4/i)).toBeInTheDocument();
      });

      // Complete round 4
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Verify all rounds complete
      await waitFor(() => {
        expect(screen.getByText(/all rounds completed/i)).toBeInTheDocument();
      });
    });
  });

  describe("Session Tracking", () => {
    it("should call onSessionComplete for each completed round", async () => {
      vi.useFakeTimers();
      const onSessionComplete = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<RepeatTimer onSessionComplete={onSessionComplete} />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      await user.click(screen.getByRole("button", { name: /start/i }));

      // Complete both rounds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(onSessionComplete).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Beep Sound Feature", () => {
    it("should render beep sound checkbox in configuration", () => {
      render(<RepeatTimer />);

      expect(
        screen.getByRole("checkbox", { name: /beep sound/i })
      ).toBeInTheDocument();
    });

    it("should have beep checkbox unchecked by default", () => {
      render(<RepeatTimer />);

      const checkbox = screen.getByRole("checkbox", { name: /beep sound/i });
      expect(checkbox).not.toBeChecked();
    });

    it("should toggle beep checkbox when clicked", async () => {
      const user = userEvent.setup();
      render(<RepeatTimer />);

      const checkbox = screen.getByRole("checkbox", { name: /beep sound/i });

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("should play beep sound when round completes if checkbox is enabled", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Mock Audio
      const mockPlay = vi.fn();
      const mockAudio = vi.fn().mockImplementation(() => ({
        play: mockPlay,
        currentTime: 0,
      }));
      global.Audio = mockAudio as unknown as typeof Audio;

      render(<RepeatTimer />);

      // Enable beep sound
      const checkbox = screen.getByRole("checkbox", { name: /beep sound/i });
      await user.click(checkbox);

      // Configure and start timer
      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      await user.click(screen.getByRole("button", { name: /start/i }));

      // Complete first round
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });

    it("should not play beep sound when round completes if checkbox is disabled", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Mock Audio
      const mockPlay = vi.fn();
      const mockAudio = vi.fn().mockImplementation(() => ({
        play: mockPlay,
        currentTime: 0,
      }));
      global.Audio = mockAudio as unknown as typeof Audio;

      render(<RepeatTimer />);

      // Keep beep sound disabled (default)

      // Configure and start timer
      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      await user.clear(durationInput);
      await user.type(durationInput, "1");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      await user.click(screen.getByRole("button", { name: /start/i }));

      // Complete first round
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/round 2 of 2/i)).toBeInTheDocument();
      });

      // Beep should NOT have been played
      expect(mockPlay).not.toHaveBeenCalled();
    });
  });

  describe("Elapsed Time Display", () => {
    it("should display elapsed total time during interval timer", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      // Set up 3 rounds of 60 seconds each
      await user.clear(durationInput);
      await user.type(durationInput, "60");
      await user.clear(repsInput);
      await user.type(repsInput, "3");

      await user.click(screen.getByRole("button", { name: /start/i }));

      // Initial elapsed time should be 00:00
      expect(screen.getByText(/elapsed.*00:00/i)).toBeInTheDocument();

      // Complete round 1 (60 seconds)
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      await waitFor(() => {
        expect(screen.getByText(/round 2 of 3/i)).toBeInTheDocument();
      });

      // After 1 complete round, elapsed time should be 01:00
      expect(screen.getByText(/elapsed.*01:00/i)).toBeInTheDocument();

      // Complete round 2 (60 seconds)
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      await waitFor(() => {
        expect(screen.getByText(/round 3 of 3/i)).toBeInTheDocument();
      });

      // After 2 complete rounds, elapsed time should be 02:00
      expect(screen.getByText(/elapsed.*02:00/i)).toBeInTheDocument();

      // Complete round 3
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      await waitFor(() => {
        expect(screen.getByText(/all rounds completed/i)).toBeInTheDocument();
      });

      // After all rounds complete, elapsed time should be 03:00
      expect(screen.getByText(/elapsed.*03:00/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it("should include partial round time in elapsed total", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RepeatTimer />);

      const durationInput = screen.getByLabelText(/duration/i);
      const repsInput = screen.getByLabelText(/repetitions/i);

      // Set up 2 rounds of 60 seconds each
      await user.clear(durationInput);
      await user.type(durationInput, "60");
      await user.clear(repsInput);
      await user.type(repsInput, "2");

      await user.click(screen.getByRole("button", { name: /start/i }));

      // Let 30 seconds pass in round 1
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Elapsed time should be 0:30 (30 seconds into round 1)
      expect(screen.getByText(/elapsed.*0:30/i)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
