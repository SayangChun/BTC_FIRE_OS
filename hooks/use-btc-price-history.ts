"use client";

import { useEffect, useState } from "react";
import type { PricePoint } from "@/lib/types";

const BINANCE_KLINES = "https://api.binance.com/api/v3/klines";
const CHUNK = 1000;

const CACHE_KEY = "btc-fire-os:btc-price-history:v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h stale-while-revalidate

type Kline = [number, string, string, string, string, string, number, string, number, string, string, string];

function parseKline(k: Kline): PricePoint | null {
  const close = Number(k[4]);
  if (!Number.isFinite(close) || close <= 0) return null;
  const d = new Date(k[0]);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return { date: `${d.getUTCFullYear()}-${mm}-${dd}`, price: Math.round(close * 100) / 100 };
}

type HistoryState = {
  data: PricePoint[];
  loading: boolean;
  error: boolean;
};

export function useBtcPriceHistory(): HistoryState {
  // IMPORTANT: Always start with the exact same initial state on server and first client render.
  // Any localStorage read or Date.now() here would cause hydration mismatch.
  // We restore from cache (if fresh) in the effect *after* mount.
  const [state, setState] = useState<HistoryState>({
    data: [],
    loading: true,
    error: false,
  });

  useEffect(() => {
    // Try to restore a recent cache immediately after mount (before network fetch).
    // This is post-hydration, so it's safe to have different data now.
    let restoredFromCache = false;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; data: PricePoint[] };
        if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0 && Date.now() - parsed.ts < CACHE_TTL_MS * 2) {
          setState({ data: parsed.data, loading: true, error: false });
          restoredFromCache = true;
        }
      }
    } catch {}

    let cancelled = false;
    const abortController = new AbortController();

    async function fetchAll() {
      try {
        const all: PricePoint[] = [];
        let startTime = new Date("2017-08-01T00:00:00Z").getTime();

        while (true) {
          if (cancelled) return;
          const url = `${BINANCE_KLINES}?symbol=BTCUSDT&interval=1d&startTime=${startTime}&limit=${CHUNK}`;
          const res = await fetch(url, { cache: "no-store", signal: abortController.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const raw: Kline[] = await res.json();
          if (raw.length === 0) break;

          const parsed = raw.map(parseKline).filter((p): p is PricePoint => p !== null);
          if (parsed.length === 0) break;

          all.push(...parsed);

          if (raw.length < CHUNK) break;

          const lastTs = raw[raw.length - 1][0];
          startTime = lastTs + 86400000;

          await new Promise((r) => setTimeout(r, 60));
          if (cancelled) return;
        }

        if (!cancelled && all.length > 0) {
          setState({ data: all, loading: false, error: false });
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: all }));
          } catch {}
        } else if (!cancelled) {
          setState((s) => ({ ...s, loading: false }));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: s.data.length === 0 }));
        }
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, []);

  return state;
}
