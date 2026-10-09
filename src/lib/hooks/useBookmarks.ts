"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "throwairi:bookmarks";

function readBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBookmarks(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable (private mode, blocked) — bookmarking just
    // silently doesn't persist, which is fine as a progressive enhancement.
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR, so state must start empty
    // and hydrate post-mount — reading it during render would mismatch
    // between server and client output.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarks(readBookmarks());
    setHydrated(true);
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeBookmarks(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => bookmarks.includes(id), [bookmarks]);

  return { bookmarks, hydrated, isBookmarked, toggleBookmark };
}
