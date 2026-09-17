"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateAhr999,
  calculateAhr9993d,
  calculateAhr9993dFittedPrice,
  calculateAhr999FittedPrice,
  getAhr999Recommendation,
} from "@/lib/ahr999";
import { fetchDailyCloses, isAbortError, type MarketSourceId } from "@/lib/market-data";
import type { Ahr999Result } from "@/lib/types";

const AVERAGE_WINDOW = 200;
const REFRESH_MS = 60 * 60 * 1000;

const CACHE_KEY = "btc-fire-os:ahr999-average200:v1";
const PRICE_HISTORY_CACHE_KEY = "btc-fire-os:btc-price-history:v1";
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

export type Ahr999Status = "loading" | "ready" | "stale" | "error";

/** Where the 200-day average currently comes from. */
export type Ahr999Source = MarketSourceId | "cache";

type Ahr999State = {
  average200DayPrice: number | null;
  status: Ahr999Status;
  lastUpdated: Date | null;
  source: Ahr999Source | null;
};

type CachedAverage = {
  value: number;
  ts: number;
  source: Ahr999Source;
};

export function useAhr999(btcPrice: number): Ahr999Result & {
  status: Ahr999Status;
  source: Ahr999Source | null;
} {
  const [state, setState] = useState<Ahr999State>({
    average200DayPrice: null,
    status: "loading",
    lastUpdated: null,
    source: null,
  });

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    // 1) Local fallback first: the card should never sit on "loading" when we
    //    already know a recent value. Sources, in order of preference:
    //      a. the last successful 200-day average
    //      b. the cached price history the chart already keeps
    const cached = readCachedAverage() ?? readAverageFromPriceHistoryCache();
    if (cached) {
      setState({
        average200DayPrice: cached.value,
        status: "stale",
        lastUpdated: new Date(cached.ts),
        source: cached.source,
      });
    }

    // 2) Network refresh: Binance -> Binance mirror -> CoinGecko.
    async function fetchAverage200DayPrice() {
      try {
        const { points, source } = await fetchDailyCloses(
          AVERAGE_WINDOW,
          abortController.signal,
        );
        const window = points.slice(-AVERAGE_WINDOW);
        if (!isMounted || window.length === 0) return;

        const average200DayPrice = calculateArithmeticMean(
          window.map((point) => point.close),
        );

        setState({
          average200DayPrice,
          status: "ready",
          lastUpdated: new Date(),
          source,
        });
        writeCachedAverage(average200DayPrice, source);
      } catch (err) {
        if (isAbortError(err) && abortController.signal.aborted) return;
        if (!isMounted) return;

        setState((current) =>
          current.average200DayPrice !== null
            ? // Keep the last known value and flag it as stale rather than
              // blanking the card out.
              { ...current, status: "stale" }
            : { ...current, status: "error" },
        );
      }
    }

    fetchAverage200DayPrice();
    const interval = window.setInterval(fetchAverage200DayPrice, REFRESH_MS);

    return () => {
      isMounted = false;
      abortController.abort();
      window.clearInterval(interval);
    };
  }, []);

  return useMemo(() => {
    const average200DayPrice = state.average200DayPrice ?? 0;
    const value = calculateAhr999(btcPrice, average200DayPrice);
    const value3d = calculateAhr9993d(btcPrice, average200DayPrice);

    return {
      value,
      average200DayPrice,
      fittedPrice: calculateAhr999FittedPrice(),
      recommendation: getAhr999Recommendation(value),
      value3d,
      fittedPrice3d: calculateAhr9993dFittedPrice(),
      recommendation3d: getAhr999Recommendation(value3d),
      lastUpdated: state.lastUpdated,
      status: state.status,
      source: state.source,
    };
  }, [
    btcPrice,
    state.average200DayPrice,
    state.lastUpdated,
    state.status,
    state.source,
  ]);
}

function readCachedAverage(): CachedAverage | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value?: number; ts?: number; source?: string };
    if (
      typeof parsed?.value !== "number" ||
      !Number.isFinite(parsed.value) ||
      parsed.value <= 0
    ) {
      return null;
    }
    if (typeof parsed.ts !== "number" || Date.now() - parsed.ts > CACHE_MAX_AGE_MS) {
      return null;
    }
    return { value: parsed.value, ts: parsed.ts, source: "cache" };
  } catch {
    return null;
  }
}

/**
 * Last resort: derive the 200-day mean from the daily price history the chart
 * already caches, so the indicator still renders on a cold, fully offline start.
 */
function readAverageFromPriceHistoryCache(): CachedAverage | null {
  try {
    const raw = window.localStorage.getItem(PRICE_HISTORY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      ts?: number;
      data?: { price?: number }[];
    };
    const prices = (parsed?.data ?? [])
      .map((point) => point?.price)
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value) && value > 0,
      );
    if (prices.length < AVERAGE_WINDOW) return null;

    return {
      value: calculateArithmeticMean(prices.slice(-AVERAGE_WINDOW)),
      ts: typeof parsed.ts === "number" ? parsed.ts : Date.now(),
      source: "cache",
    };
  } catch {
    return null;
  }
}

function writeCachedAverage(value: number, source: MarketSourceId): void {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ value, ts: Date.now(), source }),
    );
  } catch {
    // Storage is best-effort only.
  }
}

function calculateArithmeticMean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
