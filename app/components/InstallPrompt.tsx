"use client";

import { useEffect, useState } from "react";

/**
 * Custom event interface for the browser's beforeinstallprompt event.
 *
 * This extends the standard Event interface to include PWA installation
 * methods that are part of the Web App Install API.
 *
 * @interface BeforeInstallPromptEvent
 * @extends {Event}
 *
 * @property {() => Promise<void>} prompt - Shows the browser's install prompt
 * @property {Promise<{outcome: "accepted" | "dismissed"}>} userChoice - Resolves with user's installation choice
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA installation prompt component that displays when the app can be installed.
 *
 * This component listens for the browser's beforeinstallprompt event and displays
 * a custom installation prompt UI when the PWA installation criteria are met.
 * It provides a user-friendly interface to install the app to the device.
 *
 * @component
 *
 * @remarks
 * - Only displays when PWA installation is available (beforeinstallprompt event fires)
 * - Automatically prevents the browser's default mini-infobar on mobile
 * - Shows a fixed banner at the bottom of the viewport
 * - Allows users to install or dismiss the prompt
 * - The prompt can only be used once per page load
 * - Works with Chrome, Edge, and other Chromium-based browsers
 *
 * @example
 * ```tsx
 * // Add to root layout for PWA install functionality
 * <InstallPrompt />
 * ```
 *
 * @returns {React.ReactElement | null} Installation prompt UI or null if not available
 */
export function InstallPrompt() {
  /**
   * Stores the deferred beforeinstallprompt event for later use.
   * @type {[BeforeInstallPromptEvent | null, React.Dispatch<React.SetStateAction<BeforeInstallPromptEvent | null>>]}
   */
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  /**
   * Controls the visibility of the installation prompt UI.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    /**
     * Handles the beforeinstallprompt event from the browser.
     * Prevents default behavior, stores the event, and shows custom prompt.
     *
     * @param {Event} e - The beforeinstallprompt event
     */
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install prompt
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  /**
   * Handles the install button click.
   * Triggers the browser's installation prompt and waits for user response.
   *
   * @async
   * @returns {Promise<void>}
   *
   * @remarks
   * - Does nothing if deferredPrompt is not available
   * - Clears the prompt after use (can only be used once)
   * - Hides the custom UI regardless of user choice
   */
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;


    // Clear the deferredPrompt for it can only be used once
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  /**
   * Handles dismissing the installation prompt.
   * Hides the custom UI but keeps the deferred prompt for potential later use.
   */
  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Install zenFocus
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
              Install this app on your device for a better experience and
              offline access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
