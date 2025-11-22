"use client";

import { useEffect, useRef } from "react";

export function useNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for beep sound
    audioRef.current = new Audio("/beep.mp3");
  }, []);

  const playSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/beep.mp3");
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn("Failed to play beep sound:", error);
      });
    }
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon.png" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body, icon: "/icon.png" });
          }
        });
      }
    }
  };

  const notify = (title: string, body: string) => {
    playSound();
    showNotification(title, body);
  };

  return { notify, playSound, showNotification };
}
