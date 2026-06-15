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

      // As soon as we have (or just loaded) a real wallets array, nuke the ancient
      // single-value legacy keys. This is the root cause of "持仓数据无法保存 / 每次重载回退到很久之前的数据".
      // Those legacy keys may contain data from years ago; while they exist, the one-time
      // migration in page.tsx can (and did) overwrite the current multi-wallet state.
      if (key === "btc-fire-os:wallets") {
        try {
          localStorage.removeItem("btc-fire-os:btc-holdings");
          localStorage.removeItem("btc-fire-os:average-cost-basis");
        } catch {}
      }
    } catch {
      // ignore corrupt or missing storage
    }
    // We only want to run this once after mount for the given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist on every change (including the upgrade from the restore effect above).
  // Because we start from the stable initialValue (for hydration) and only upgrade in an effect,
  // the first write(s) will either be the default (harmless for a new user) or the restored real data.
  // Subsequent user edits are always written. This is what makes "保存" actually work across reloads.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(sanitize(value)));
    } catch {
      // Ignore storage failures so the dashboard remains usable.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
