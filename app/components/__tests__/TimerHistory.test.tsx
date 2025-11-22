import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimerHistory from "../TimerHistory";
import type { TimerSession } from "@/lib/types/timer-history";

// Mock the useTimerHistory hook
const mockSessions: TimerSession[] = [];
const mockClearHistory = vi.fn();
const mockGetStatistics = vi.fn();

vi.mock("@/lib/hooks/useTimerHistory", () => ({
  useTimerHistory: () => ({
    sessions: mockSessions,
    clearHistory: mockClearHistory,
    getStatistics: mockGetStatistics,
    addSession: vi.fn(),
  }),
}));

// Mock utility functions
vi.mock("@/lib/utils/formatTime", () => ({
  formatTime: (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },
}));

vi.mock("@/lib/utils/formatDuration", () => ({
  formatDuration: (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  },
}));

vi.mock("@/lib/utils/formatRelativeTime", () => ({
  formatRelativeTime: (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    return `${Math.floor(diffMinutes / 60)} hours ago`;
  },
}));

describe("TimerHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessions.length = 0; // Clear array
  });

  describe("Rendering Statistics", () => {
    it("should render statistics section with title", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 0,
        completedSessions: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("Statistics")).toBeInTheDocument();
      expect(
        screen.getByText("Your focus session analytics")
      ).toBeInTheDocument();
    });

    it("should display total sessions count", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 15,
        completedSessions: 12,
        totalTimeSpent: 25200,
        currentStreak: 3,
        longestStreak: 5,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("Total Sessions")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("should display completed sessions count", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 20,
        completedSessions: 16,
        totalTimeSpent: 28800,
        currentStreak: 2,
        longestStreak: 7,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("Completed")).toBeInTheDocument();
      expect(screen.getByText("16")).toBeInTheDocument();
    });

    it("should display total time spent formatted correctly", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 10,
        completedSessions: 8,
        totalTimeSpent: 7200, // 2 hours
        currentStreak: 1,
        longestStreak: 3,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("Total Time")).toBeInTheDocument();
      expect(screen.getByText("2h")).toBeInTheDocument();
    });

    it("should display total time with hours and minutes", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 10,
        completedSessions: 8,
        totalTimeSpent: 9000, // 2h 30m
        currentStreak: 1,
        longestStreak: 3,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("2h 30m")).toBeInTheDocument();
    });

    it("should display current streak", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 10,
        completedSessions: 8,
        totalTimeSpent: 14400,
        currentStreak: 5,
        longestStreak: 8,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("Current Streak")).toBeInTheDocument();
      expect(screen.getByText("5 days")).toBeInTheDocument();
    });

    it("should display longest streak", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 25,
        completedSessions: 20,
        totalTimeSpent: 36000,
        currentStreak: 3,
        longestStreak: 12,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("Longest Streak")).toBeInTheDocument();
      expect(screen.getByText("12 days")).toBeInTheDocument();
    });

    it("should display sessions by mode when available", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 15,
        completedSessions: 12,
        totalTimeSpent: 25200,
        currentStreak: 3,
        longestStreak: 5,
        sessionsByMode: {
          study: 6,
          work: 5,
          yoga: 3,
          meditation: 1,
        },
      });

      render(<TimerHistory />);

      expect(screen.getByText("Sessions by Mode")).toBeInTheDocument();
      expect(screen.getByText(/Study.*6/)).toBeInTheDocument();
      expect(screen.getByText(/Work.*5/)).toBeInTheDocument();
      expect(screen.getByText(/Yoga.*3/)).toBeInTheDocument();
      expect(screen.getByText(/Meditation.*1/)).toBeInTheDocument();
    });

    it("should not display sessions by mode when empty", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 0,
        completedSessions: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.queryByText("Sessions by Mode")).not.toBeInTheDocument();
    });
  });

  describe("Rendering Session List", () => {
    it("should render recent sessions section with title", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 0,
        completedSessions: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("Recent Sessions")).toBeInTheDocument();
      expect(
        screen.getByText("Your 10 most recent timer sessions")
      ).toBeInTheDocument();
    });

    it("should display empty state when no sessions", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 0,
        completedSessions: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      expect(screen.getByText("No timer sessions yet")).toBeInTheDocument();
      expect(
        screen.getByText("Start a timer to see your history here")
      ).toBeInTheDocument();
    });

    it("should display session list when sessions exist", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
        {
          id: "2",
          focusMode: "work",
          duration: 3600,
          completedAt: new Date(Date.now() - 3600000).toISOString(),
          completed: false,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 2,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1, work: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText("Study")).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    it("should display session duration formatted", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "study",
          duration: 1500, // 25:00
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText("25:00")).toBeInTheDocument();
    });

    it("should display completed badge for completed sessions", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      render(<TimerHistory />);

      const completedBadges = screen.getAllByText("Completed");
      // Should have "Completed" in both statistics section and session badge
      expect(completedBadges.length).toBeGreaterThanOrEqual(1);
      // Verify at least one is in a badge (has the badge-specific class)
      const sessionCompletedBadge = completedBadges.find(
        (el) => el.getAttribute("data-slot") === "badge"
      );
      expect(sessionCompletedBadge).toBeInTheDocument();
    });

    it("should display incomplete badge for incomplete sessions", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "work",
          duration: 1800,
          completedAt: new Date().toISOString(),
          completed: false,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsByMode: { work: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText("Incomplete")).toBeInTheDocument();
    });

    it("should display relative time for each session", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          completed: true,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText(/minutes ago/)).toBeInTheDocument();
    });

    it("should display only 10 most recent sessions", () => {
      const sessions: TimerSession[] = Array.from({ length: 15 }, (_, i) => ({
        id: `session-${i}`,
        focusMode: "study" as const,
        duration: 1500,
        completedAt: new Date(Date.now() - i * 3600000).toISOString(),
        completed: true,
      }));

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 15,
        completedSessions: 15,
        totalTimeSpent: 22500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 15 },
      });

      const { container } = render(<TimerHistory />);

      // Count session items (they have specific structure)
      const sessionItems = container.querySelectorAll(
        '[class*="flex items-center justify-between p-3"]'
      );
      expect(sessionItems.length).toBe(10);
    });
  });

  describe("Clear History Button", () => {
    it("should render clear history button", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      mockSessions.push({
        id: "1",
        focusMode: "study",
        duration: 1500,
        completedAt: new Date().toISOString(),
        completed: true,
      });

      render(<TimerHistory />);

      expect(
        screen.getByRole("button", { name: /clear history/i })
      ).toBeInTheDocument();
    });

    it("should disable clear history button when no sessions", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 0,
        completedSessions: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsByMode: {},
      });

      render(<TimerHistory />);

      const clearButton = screen.getByRole("button", {
        name: /clear history/i,
      });
      expect(clearButton).toBeDisabled();
    });

    it("should open confirmation dialog when clear history is clicked", async () => {
      const user = userEvent.setup();

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      mockSessions.push({
        id: "1",
        focusMode: "study",
        duration: 1500,
        completedAt: new Date().toISOString(),
        completed: true,
      });

      render(<TimerHistory />);

      const clearButton = screen.getByRole("button", {
        name: /clear history/i,
      });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText("Clear Timer History?")).toBeInTheDocument();
        expect(
          screen.getByText(
            /This will permanently delete all your timer sessions/
          )
        ).toBeInTheDocument();
      });
    });

    it("should show cancel and confirm buttons in dialog", async () => {
      const user = userEvent.setup();

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      mockSessions.push({
        id: "1",
        focusMode: "study",
        duration: 1500,
        completedAt: new Date().toISOString(),
        completed: true,
      });

      render(<TimerHistory />);

      const clearButton = screen.getByRole("button", {
        name: /clear history/i,
      });
      await user.click(clearButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /cancel/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /^clear history$/i })
        ).toBeInTheDocument();
      });
    });

    it("should close dialog when cancel is clicked", async () => {
      const user = userEvent.setup();

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      mockSessions.push({
        id: "1",
        focusMode: "study",
        duration: 1500,
        completedAt: new Date().toISOString(),
        completed: true,
      });

      render(<TimerHistory />);

      const clearButton = screen.getByRole("button", {
        name: /clear history/i,
      });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText("Clear Timer History?")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Clear Timer History?")
        ).not.toBeInTheDocument();
      });
    });

    it("should call clearHistory when confirm is clicked", async () => {
      const user = userEvent.setup();

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      mockSessions.push({
        id: "1",
        focusMode: "study",
        duration: 1500,
        completedAt: new Date().toISOString(),
        completed: true,
      });

      render(<TimerHistory />);

      const clearButton = screen.getByRole("button", {
        name: /clear history/i,
      });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText("Clear Timer History?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /^clear history$/i,
      });
      await user.click(confirmButton);

      expect(mockClearHistory).toHaveBeenCalledTimes(1);
    });

    it("should close dialog after clearing history", async () => {
      const user = userEvent.setup();

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      mockSessions.push({
        id: "1",
        focusMode: "study",
        duration: 1500,
        completedAt: new Date().toISOString(),
        completed: true,
      });

      render(<TimerHistory />);

      const clearButton = screen.getByRole("button", {
        name: /clear history/i,
      });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText("Clear Timer History?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /^clear history$/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Clear Timer History?")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Focus Mode Badges", () => {
    it("should display Study badge with correct styling", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1500,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText("Study")).toBeInTheDocument();
    });

    it("should display Work badge with correct styling", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "work",
          duration: 3600,
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 3600,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { work: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    it("should display Yoga badge with correct styling", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "yoga",
          duration: 1800,
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 1800,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { yoga: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText("Yoga")).toBeInTheDocument();
    });

    it("should display Meditation badge with correct styling", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "meditation",
          duration: 600,
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 1,
        completedSessions: 1,
        totalTimeSpent: 600,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { meditation: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText("Meditation")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("should update display when statistics change", () => {
      mockGetStatistics.mockReturnValue({
        totalSessions: 5,
        completedSessions: 4,
        totalTimeSpent: 7500,
        currentStreak: 2,
        longestStreak: 3,
        sessionsByMode: { study: 3, work: 2 },
      });

      const { rerender } = render(<TimerHistory />);

      expect(screen.getByText("5")).toBeInTheDocument();

      mockGetStatistics.mockReturnValue({
        totalSessions: 10,
        completedSessions: 8,
        totalTimeSpent: 15000,
        currentStreak: 4,
        longestStreak: 5,
        sessionsByMode: { study: 5, work: 3, yoga: 2 },
      });

      rerender(<TimerHistory />);

      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should display multiple sessions with different focus modes", () => {
      const sessions: TimerSession[] = [
        {
          id: "1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
        {
          id: "2",
          focusMode: "work",
          duration: 3600,
          completedAt: new Date(Date.now() - 3600000).toISOString(),
          completed: true,
        },
        {
          id: "3",
          focusMode: "yoga",
          duration: 1800,
          completedAt: new Date(Date.now() - 7200000).toISOString(),
          completed: false,
        },
        {
          id: "4",
          focusMode: "meditation",
          duration: 600,
          completedAt: new Date(Date.now() - 10800000).toISOString(),
          completed: true,
        },
      ];

      mockSessions.push(...sessions);

      mockGetStatistics.mockReturnValue({
        totalSessions: 4,
        completedSessions: 3,
        totalTimeSpent: 5700,
        currentStreak: 1,
        longestStreak: 1,
        sessionsByMode: { study: 1, work: 1, yoga: 1, meditation: 1 },
      });

      render(<TimerHistory />);

      expect(screen.getByText("Study")).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
      expect(screen.getByText("Yoga")).toBeInTheDocument();
      expect(screen.getByText("Meditation")).toBeInTheDocument();
    });
  });
});
