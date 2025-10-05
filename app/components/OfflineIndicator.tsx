"use client";

import { useEffect, useState } from "react";

/**
 * Offline indicator component that displays a notification when the user loses internet connectivity.
 *
 * This component monitors the browser's online/offline status using the Navigator API
 * and window events. It displays a fixed notification banner at the bottom of the screen
 * when the user goes offline.
 *
 * @component
 *
 * @remarks
 * - Uses browser's Navigator.onLine API to detect connectivity status
 * - Listens to 'online' and 'offline' window events for real-time updates
 * - Only renders when offline (returns null when online)
 * - Positioned fixed at bottom center of viewport
 * - Important for PWA functionality to inform users of offline capability
 *
 * @example
 * ```tsx
 * // Add to root layout or main app component
 * <OfflineIndicator />
 * ```
 *
 * @returns {React.ReactElement | null} An offline notification banner or null if online
 */
export function OfflineIndicator() {
  /**
   * Tracks the online/offline status of the browser.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    /**
     * Event handler for when connection is restored.
     */
    const handleOnline = () => setIsOnline(true);

    /**
     * Event handler for when connection is lost.
     */
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        <span className="text-sm font-medium">You are offline</span>
      </div>
    </div>
  );
}
