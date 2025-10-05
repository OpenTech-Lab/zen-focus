"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * Theme toggle button component that switches between light and dark modes.
 *
 * This component provides a button to toggle between light and dark themes.
 * It uses the next-themes library to manage theme state and handles hydration
 * mismatches by rendering a placeholder on the server and mounting the actual
 * toggle on the client.
 *
 * @component
 *
 * @remarks
 * - The component is memoized to prevent unnecessary re-renders
 * - Uses a mounted state to avoid hydration mismatches between server and client
 * - Displays a Sun icon in dark mode and Moon icon in light mode
 * - Automatically handles system theme preferences
 * - Includes smooth transitions between theme changes
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 *
 * @returns {React.ReactElement} A button component that toggles between light and dark themes
 */
export const ThemeToggle = React.memo(function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder button to avoid hydration mismatch
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <Sun className="size-5" />
      </Button>
    );
  }

  /**
   * Resolves the current theme, accounting for system theme preference.
   * @type {string | undefined}
   */
  const currentTheme = theme === "system" ? systemTheme : theme;

  /**
   * Determines if the current theme is dark mode.
   * @type {boolean}
   */
  const isDark = currentTheme === "dark";

  /**
   * Toggles between light and dark theme modes.
   * Sets theme to 'light' if currently dark, or 'dark' if currently light.
   */
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="size-5 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="size-5 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </Button>
  );
});
