"use client";

import { useEffect, useRef, useState } from "react";

function sanitize(value: unknown): unknown {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (Array.isArray(value)) return value.map(sanitize);
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitize(v);
    }
    return result;
  }
  return value;
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  validate?: (v: unknown) => v is T,
) {
  const validateRef = useRef(validate);
  validateRef.current = validate;

  // Always initialize with the caller-provided default.
  // This guarantees the server-rendered HTML and the first client render match (hydration safety).
  // Persisted values are applied after mount via the effect below (one-way hydration: storage → state on mount).
  const [value, setValue] = useState<T>(initialValue);

  // After mount, read localStorage and upgrade state if a valid persisted value exists.
  // We intentionally do this in an effect so the initial render (used for SSR HTML) is identical on server and client.
  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue !== null) {
        const parsed = JSON.parse(storedValue);
        const fn = validateRef.current;
        if (!fn || fn(parsed)) {
          // Only update if it actually differs (avoid no-op renders)
          if (JSON.stringify(parsed) !== JSON.stringify(value)) {
            setValue(parsed as T);
          }
        }
      }
    } catch {
      // ignore corrupt or missing storage
    }
    // We only want to run this once after mount for the given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Write to localStorage whenever the (current) value changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(sanitize(value)));
    } catch {
      // Ignore storage failures so the dashboard remains usable.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
