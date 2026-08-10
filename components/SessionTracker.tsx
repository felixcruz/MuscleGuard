"use client";

import { useEffect } from "react";

export function SessionTracker() {
  useEffect(() => {
    fetch("/api/track-session", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
