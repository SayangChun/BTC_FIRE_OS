"use client";

import { useEffect, useRef, useState } from "react";

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  validate?: (v: unknown) => v is T,
) {
  const [value, setValue] = useState<T>(initialValue);
  const [hasHydrated, setHasHydrated] = useState(false);
  const initialValueRef = useRef(initialValue);
  const validateRef = useRef(validate);
  validateRef.current = validate;

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue !== null) {
        const parsed = JSON.parse(storedValue) as T;
        const fn = validateRef.current;
        setValue(!fn || fn(parsed) ? parsed : initialValueRef.current);
      }
    } catch {
      setValue(initialValueRef.current);
    } finally {
      setHasHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    try {
      const toStore = typeof value === "number" && !Number.isFinite(value) ? 0 : value;
      window.localStorage.setItem(key, JSON.stringify(toStore));
    } catch {
      // Ignore storage failures so the dashboard remains usable.
    }
  }, [hasHydrated, key, value]);

  return [value, setValue] as const;
}
