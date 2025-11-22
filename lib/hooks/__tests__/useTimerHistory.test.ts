import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTimerHistory } from "../useTimerHistory";
import type { TimerSession } from "@/lib/types/timer-history";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useTimerHistory", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe("Adding Sessions", () => {
    it("should add a new session", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]).toMatchObject({
        focusMode: "study",
        duration: 1500,
        completed: true,
      });
      expect(result.current.sessions[0].id).toBeDefined();
      expect(result.current.sessions[0].completedAt).toBeDefined();
    });

    it("should add multiple sessions", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
        result.current.addSession("work", 3600, true);
        result.current.addSession("yoga", 1800, false);
      });

      expect(result.current.sessions).toHaveLength(3);
      expect(result.current.sessions[0].focusMode).toBe("yoga"); // Most recent first
      expect(result.current.sessions[1].focusMode).toBe("work");
      expect(result.current.sessions[2].focusMode).toBe("study");
    });

    it("should add sessions with unique IDs", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
        result.current.addSession("study", 1500, true);
      });

      expect(result.current.sessions[0].id).not.toBe(
        result.current.sessions[1].id
      );
    });

    it("should add incomplete sessions", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("meditation", 600, false);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].completed).toBe(false);
    });

    it("should generate valid ISO date string for completedAt", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
      });

      const completedAt = result.current.sessions[0].completedAt;
      expect(() => new Date(completedAt)).not.toThrow();
      expect(new Date(completedAt).toISOString()).toBe(completedAt);
    });
  });

  describe("LocalStorage Persistence - Save", () => {
    it("should save sessions to localStorage when adding", async () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
      });

      await waitFor(() => {
        const stored = localStorageMock.getItem("zenFocus_timerHistory");
        expect(stored).toBeDefined();

        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].focusMode).toBe("study");
      });
    });

    it("should update localStorage when adding multiple sessions", async () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
      });

      await waitFor(() => {
        const stored = localStorageMock.getItem("zenFocus_timerHistory");
        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
      });

      act(() => {
        result.current.addSession("work", 3600, true);
      });

      await waitFor(() => {
        const stored = localStorageMock.getItem("zenFocus_timerHistory");
        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(2);
      });
    });

    it("should persist all session data to localStorage", async () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("yoga", 1800, true);
      });

      await waitFor(() => {
        const stored = localStorageMock.getItem("zenFocus_timerHistory");
        const parsed = JSON.parse(stored!);

        expect(parsed[0]).toMatchObject({
          focusMode: "yoga",
          duration: 1800,
          completed: true,
        });
        expect(parsed[0].id).toBeDefined();
        expect(parsed[0].completedAt).toBeDefined();
      });
    });
  });

  describe("LocalStorage Persistence - Load", () => {
    it("should load sessions from localStorage on mount", () => {
      const testSessions: TimerSession[] = [
        {
          id: "test-1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
        {
          id: "test-2",
          focusMode: "work",
          duration: 3600,
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ];

      localStorageMock.setItem(
        "zenFocus_timerHistory",
        JSON.stringify(testSessions)
      );

      const { result } = renderHook(() => useTimerHistory());

      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.sessions[0].focusMode).toBe("study");
      expect(result.current.sessions[1].focusMode).toBe("work");
    });

    it("should handle empty localStorage gracefully", () => {
      const { result } = renderHook(() => useTimerHistory());

      expect(result.current.sessions).toHaveLength(0);
    });

    it("should handle corrupted localStorage data", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      localStorageMock.setItem("zenFocus_timerHistory", "invalid-json");

      const { result } = renderHook(() => useTimerHistory());

      expect(result.current.sessions).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should not load sessions if localStorage is null", () => {
      const { result } = renderHook(() => useTimerHistory());

      expect(result.current.sessions).toHaveLength(0);
    });
  });

  describe("Clearing History", () => {
    it("should clear all sessions", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
        result.current.addSession("work", 3600, true);
      });

      expect(result.current.sessions).toHaveLength(2);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.sessions).toHaveLength(0);
    });

    it("should remove data from localStorage when clearing", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
      });

      act(() => {
        result.current.clearHistory();
      });

      const stored = localStorageMock.getItem("zenFocus_timerHistory");
      expect(stored).toBeNull();
    });

    it("should handle clearing when already empty", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.sessions).toHaveLength(0);
    });
  });

  describe("Statistics Calculations", () => {
    it("should calculate total sessions correctly", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
        result.current.addSession("work", 3600, false);
        result.current.addSession("yoga", 1800, true);
      });

      const stats = result.current.getStatistics();
      expect(stats.totalSessions).toBe(3);
    });

    it("should calculate completed sessions correctly", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
        result.current.addSession("work", 3600, false);
        result.current.addSession("yoga", 1800, true);
        result.current.addSession("meditation", 600, false);
      });

      const stats = result.current.getStatistics();
      expect(stats.completedSessions).toBe(2);
    });

    it("should calculate total time spent for completed sessions only", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true); // 1500
        result.current.addSession("work", 3600, false); // Not counted
        result.current.addSession("yoga", 1800, true); // 1800
        result.current.addSession("meditation", 600, true); // 600
      });

      const stats = result.current.getStatistics();
      expect(stats.totalTimeSpent).toBe(3900); // 1500 + 1800 + 600
    });

    it("should count sessions by mode correctly", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
        result.current.addSession("study", 1500, false);
        result.current.addSession("work", 3600, true);
        result.current.addSession("yoga", 1800, true);
        result.current.addSession("study", 1500, true);
      });

      const stats = result.current.getStatistics();
      expect(stats.sessionsByMode).toEqual({
        study: 3,
        work: 1,
        yoga: 1,
      });
    });

    it("should return zero statistics for empty sessions", () => {
      const { result } = renderHook(() => useTimerHistory());

      const stats = result.current.getStatistics();
      expect(stats.totalSessions).toBe(0);
      expect(stats.completedSessions).toBe(0);
      expect(stats.totalTimeSpent).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
      expect(stats.sessionsByMode).toEqual({});
    });
  });

  describe("Streak Calculations", () => {
    it('should calculate current streak when sessions are from today', () => {
      renderHook(() => useTimerHistory());

      act(() => {
        // Add a session to test streak calculation
        const { result } = renderHook(() => useTimerHistory());
        result.current.addSession('study', 1500, true);
      });

      const { result } = renderHook(() => useTimerHistory());
      const stats = result.current.getStatistics();
      expect(stats.currentStreak).toBe(1);
    });

    it("should calculate current streak when sessions are from yesterday", () => {
      renderHook(() => useTimerHistory());

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const testSession: TimerSession = {
        id: "test-1",
        focusMode: "study",
        duration: 1500,
        completedAt: yesterday.toISOString(),
        completed: true,
      };

      localStorageMock.setItem(
        "zenFocus_timerHistory",
        JSON.stringify([testSession])
      );

      const { result: newResult } = renderHook(() => useTimerHistory());
      const stats = newResult.current.getStatistics();

      expect(stats.currentStreak).toBe(1);
    });

    it("should calculate consecutive day streak", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const testSessions: TimerSession[] = [
        {
          id: "test-1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
        {
          id: "test-2",
          focusMode: "work",
          duration: 3600,
          completedAt: yesterday.toISOString(),
          completed: true,
        },
        {
          id: "test-3",
          focusMode: "yoga",
          duration: 1800,
          completedAt: twoDaysAgo.toISOString(),
          completed: true,
        },
      ];

      localStorageMock.setItem(
        "zenFocus_timerHistory",
        JSON.stringify(testSessions)
      );

      const { result } = renderHook(() => useTimerHistory());
      const stats = result.current.getStatistics();

      expect(stats.currentStreak).toBe(3);
    });

    it("should reset current streak when gap in days", () => {
      const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

      const testSessions: TimerSession[] = [
        {
          id: "test-1",
          focusMode: "study",
          duration: 1500,
          completedAt: threeDaysAgo.toISOString(),
          completed: true,
        },
      ];

      localStorageMock.setItem(
        "zenFocus_timerHistory",
        JSON.stringify(testSessions)
      );

      const { result } = renderHook(() => useTimerHistory());
      const stats = result.current.getStatistics();

      expect(stats.currentStreak).toBe(0);
    });

    it("should calculate longest streak correctly", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(Date.now() - 120 * 60 * 60 * 1000);
      const sixDaysAgo = new Date(Date.now() - 144 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 168 * 60 * 60 * 1000);

      const testSessions: TimerSession[] = [
        {
          id: "test-1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
        {
          id: "test-2",
          focusMode: "work",
          duration: 3600,
          completedAt: yesterday.toISOString(),
          completed: true,
        },
        {
          id: "test-3",
          focusMode: "yoga",
          duration: 1800,
          completedAt: twoDaysAgo.toISOString(),
          completed: true,
        },
        // Gap here
        {
          id: "test-4",
          focusMode: "study",
          duration: 1500,
          completedAt: fiveDaysAgo.toISOString(),
          completed: true,
        },
        {
          id: "test-5",
          focusMode: "work",
          duration: 3600,
          completedAt: sixDaysAgo.toISOString(),
          completed: true,
        },
        {
          id: "test-6",
          focusMode: "meditation",
          duration: 600,
          completedAt: sevenDaysAgo.toISOString(),
          completed: true,
        },
      ];

      localStorageMock.setItem(
        "zenFocus_timerHistory",
        JSON.stringify(testSessions)
      );

      const { result } = renderHook(() => useTimerHistory());
      const stats = result.current.getStatistics();

      expect(stats.currentStreak).toBe(3);
      expect(stats.longestStreak).toBe(3);
    });

    it("should only count completed sessions in streak", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const testSessions: TimerSession[] = [
        {
          id: "test-1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
        {
          id: "test-2",
          focusMode: "work",
          duration: 3600,
          completedAt: yesterday.toISOString(),
          completed: false, // Not completed
        },
      ];

      localStorageMock.setItem(
        "zenFocus_timerHistory",
        JSON.stringify(testSessions)
      );

      const { result } = renderHook(() => useTimerHistory());
      const stats = result.current.getStatistics();

      expect(stats.currentStreak).toBe(1);
    });

    it("should handle multiple sessions on same day for streak", () => {
      const testSessions: TimerSession[] = [
        {
          id: "test-1",
          focusMode: "study",
          duration: 1500,
          completedAt: new Date().toISOString(),
          completed: true,
        },
        {
          id: "test-2",
          focusMode: "work",
          duration: 3600,
          completedAt: new Date().toISOString(),
          completed: true,
        },
        {
          id: "test-3",
          focusMode: "yoga",
          duration: 1800,
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ];

      localStorageMock.setItem(
        "zenFocus_timerHistory",
        JSON.stringify(testSessions)
      );

      const { result } = renderHook(() => useTimerHistory());
      const stats = result.current.getStatistics();

      expect(stats.currentStreak).toBe(1);
    });

    it("should return 0 for both streaks when no completed sessions", () => {
      const { result } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, false);
        result.current.addSession("work", 3600, false);
      });

      const stats = result.current.getStatistics();
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
    });
  });

  describe("Integration Tests", () => {
    it("should persist sessions across hook remounts", async () => {
      const { result, unmount } = renderHook(() => useTimerHistory());

      act(() => {
        result.current.addSession("study", 1500, true);
        result.current.addSession("work", 3600, true);
      });

      await waitFor(() => {
        expect(localStorageMock.getItem("zenFocus_timerHistory")).toBeDefined();
      });

      unmount();

      const { result: newResult } = renderHook(() => useTimerHistory());

      expect(newResult.current.sessions).toHaveLength(2);
      expect(newResult.current.sessions[0].focusMode).toBe("work");
      expect(newResult.current.sessions[1].focusMode).toBe("study");
    });

    it("should handle complete workflow: add, stats, clear", async () => {
      const { result } = renderHook(() => useTimerHistory());

      // Add sessions
      act(() => {
        result.current.addSession("study", 1500, true);
        result.current.addSession("work", 3600, true);
        result.current.addSession("yoga", 1800, false);
      });

      // Check stats
      let stats = result.current.getStatistics();
      expect(stats.totalSessions).toBe(3);
      expect(stats.completedSessions).toBe(2);
      expect(stats.totalTimeSpent).toBe(5100);

      // Clear history
      act(() => {
        result.current.clearHistory();
      });

      // Verify cleared
      stats = result.current.getStatistics();
      expect(stats.totalSessions).toBe(0);
      expect(localStorageMock.getItem("zenFocus_timerHistory")).toBeNull();
    });

    it("should update statistics reactively when sessions change", () => {
      const { result } = renderHook(() => useTimerHistory());

      let stats = result.current.getStatistics();
      expect(stats.totalSessions).toBe(0);

      act(() => {
        result.current.addSession("study", 1500, true);
      });

      stats = result.current.getStatistics();
      expect(stats.totalSessions).toBe(1);

      act(() => {
        result.current.addSession("work", 3600, true);
      });

      stats = result.current.getStatistics();
      expect(stats.totalSessions).toBe(2);
    });
  });
});
