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
  const [value, setValue] = useState<T>(initialValue);
  const [hasHydrated, setHasHydrated] = useState(false);
  const validateRef = useRef(validate);
  validateRef.current = validate;
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue !== null) {
        const parsed = JSON.parse(storedValue) as T;
        const fn = validateRef.current;
        setValue(!fn || fn(parsed) ? parsed : initialValueRef.current);
      }
    } catch {
      // keep initial value on error
    } finally {
      setHasHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(sanitize(value)));
    } catch {
      // Ignore storage failures so the dashboard remains usable.
    }
  }, [hasHydrated, key, value]);

  return [value, setValue] as const;
}
