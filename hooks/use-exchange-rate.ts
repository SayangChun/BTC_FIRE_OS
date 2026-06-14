"use client";

import { useEffect, useState } from "react";

const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD";
const CNY_FALLBACK = 7.2;
const CACHE_KEY = "btc-fire-os:exchange-rate-cny";

function getCachedRate(): number {
  try {
    const cached = window.localStorage.getItem(CACHE_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return CNY_FALLBACK;
}

function setCachedRate(rate: number): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(rate));
  } catch {
    // ignore
  }
}

export type ExchangeRateStatus = "loading" | "ready";

export function useExchangeRate(): { rate: number; status: ExchangeRateStatus } {
  // Always start with the stable fallback on both server and first client render.
  // Cached rate (if any) is applied after mount to avoid hydration mismatch.
  const [rate, setRate] = useState<number>(CNY_FALLBACK);
  const [status, setStatus] = useState<ExchangeRateStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    // Apply any previously cached rate synchronously on mount (before first fetch).
    // This is safe because it happens after the initial render/hydration.
    try {
      const cached = window.localStorage.getItem(CACHE_KEY);
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0) {
          setRate(parsed);
        }
      }
    } catch {}

    async function fetchRate() {
      try {
        const res = await fetch(EXCHANGE_RATE_API, {
          cache: "no-store",
          signal: abortController.signal,
        });
        const data = (await res.json()) as { rates?: Record<string, number> };
        const cnyRate = data.rates?.CNY;

        if (!cancelled) {
          if (cnyRate && Number.isFinite(cnyRate) && cnyRate > 0) {
            setRate(cnyRate);
            setCachedRate(cnyRate);
          } else {
            setRate(CNY_FALLBACK);
          }
          setStatus("ready");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!cancelled) {
          // keep whatever we have (fallback or cached), just mark ready
          setStatus("ready");
        }
      }
    }

    fetchRate();
    const interval = window.setInterval(fetchRate, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      abortController.abort();
      window.clearInterval(interval);
    };
  }, []);

  return { rate, status };
}
