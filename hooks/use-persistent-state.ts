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
  const initialValueRef = useRef(initialValue);

  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue !== null) {
        const parsed = JSON.parse(storedValue);
        const fn = validateRef.current;
        if (!fn || fn(parsed)) {
          return parsed as T;
        }
      }
    } catch {
      // fall back to initial on error or missing/invalid
    }
    return initialValueRef.current;
  });

  // Write to localStorage whenever the value changes (after mount).
  // The lazy initializer above ensures the first render already has the persisted value (or default).
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(sanitize(value)));
    } catch {
      // Ignore storage failures so the dashboard remains usable.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
