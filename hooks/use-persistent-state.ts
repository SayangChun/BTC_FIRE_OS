"use client";

import { useEffect, useRef, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hasHydrated, setHasHydrated] = useState(false);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue !== null) {
        setValue(JSON.parse(storedValue) as T);
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
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures so the dashboard remains usable.
    }
  }, [hasHydrated, key, value]);

  return [value, setValue] as const;
}
