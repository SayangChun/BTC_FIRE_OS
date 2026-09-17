"use client";

import { useEffect, useRef, useState } from "react";

import {
  BINANCE_WS_TRADE_STREAMS,
  fetchSpotPrice,
  isAbortError,
  isPrimarySource,
  type MarketSourceId,
} from "@/lib/market-data";

/**
 * Shown only until we have a real quote. The UI must never present this as a
 * live price (see `isPlaceholder` below).
 */
const FALLBACK_PRICE = 100_000;

/** REST polling cadence for users whose WebSocket cannot connect. */
const REST_POLL_MS = 30_000;

/**
 * Safety valve: a failing WebSocket reconnect loop also triggers REST reads.
 * Keep them at most one per 10s so a blocked network cannot hammer the APIs.
 */
const REST_MIN_GAP_MS = 10_000;

/**
 * If a backup source answered, we stay on it (one request per poll instead of
 * four). Every N polls we re-probe the primary so a temporary block does not
 * pin the app to a fallback forever.
 */
const PRIMARY_REPROBE_EVERY = 20;

const CACHE_KEY = "btc-fire-os:last-price:v1";
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export type BtcPriceStatus =
  | "connecting"
  | "live"
  | "polling"
  | "cached"
  | "offline";

export type BtcPriceState = {
  price: number;
  status: BtcPriceStatus;
  lastUpdated: Date | null;
  /** Endpoint that produced the current price (null while we only have a placeholder). */
  source: MarketSourceId | null;
  /** True when the price comes from a backup source instead of Binance. */
  usingFallbackSource: boolean;
  /** True while `price` is the hardcoded placeholder rather than a real quote. */
  isPlaceholder: boolean;
};

type BinanceTradeMessage = {
  p?: string;
};

type CachedPrice = {
  price: number;
  source: MarketSourceId | null;
  ts: number;
};

function readCachedPrice(): CachedPrice | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPrice;
    if (
      !parsed ||
      typeof parsed.price !== "number" ||
      !Number.isFinite(parsed.price) ||
      parsed.price <= 0
    ) {
      return null;
    }
    if (typeof parsed.ts !== "number" || Date.now() - parsed.ts > CACHE_MAX_AGE_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedPrice(price: number, source: MarketSourceId | null): void {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ price, source, ts: Date.now() }),
    );
  } catch {
    // Storage is best-effort only.
  }
}

export function useBtcPrice(): BtcPriceState {
  const [state, setState] = useState<BtcPriceState>({
    price: FALLBACK_PRICE,
    status: "connecting",
    lastUpdated: null,
    source: null,
    usingFallbackSource: false,
    isPlaceholder: true,
  });
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let socket: WebSocket | null = null;
    const abortController = new AbortController();

    // Sticky source + throttles. These live in the effect closure so a single
    // hook instance keeps its own bookkeeping.
    let preferredSource: MarketSourceId | null = null;
    let pollCount = 0;
    let lastAttemptAt = 0;
    let lastCacheWriteAt = 0;

    // Restore the last known price (post-mount, so hydration stays safe) so a
    // blocked network shows a real recent price instead of $100,000.
    const cached = readCachedPrice();
    if (cached) {
      setState({
        price: cached.price,
        status: "cached",
        lastUpdated: new Date(cached.ts),
        source: cached.source,
        usingFallbackSource: !isPrimarySource(cached.source),
        isPlaceholder: false,
      });
      preferredSource = cached.source;
      lastCacheWriteAt = Date.now();
    }

    function applyPrice(
      price: number,
      status: BtcPriceStatus,
      source: MarketSourceId | null,
    ) {
      if (!isMounted) return;

      setState({
        price,
        status,
        lastUpdated: new Date(),
        source,
        usingFallbackSource: !isPrimarySource(source),
        isPlaceholder: false,
      });

      // WebSocket ticks arrive many times per second — throttle persistence.
      if (Date.now() - lastCacheWriteAt > REST_POLL_MS) {
        lastCacheWriteAt = Date.now();
        writeCachedPrice(price, source);
      }
    }

    async function fetchRestPrice() {
      const now = Date.now();
      if (now - lastAttemptAt < REST_MIN_GAP_MS) return;
      lastAttemptAt = now;

      pollCount += 1;
      if (preferredSource && pollCount % PRIMARY_REPROBE_EVERY === 0) {
        preferredSource = null;
      }

      try {
        const quote = await fetchSpotPrice(abortController.signal, preferredSource);
        preferredSource = quote.source;
        applyPrice(quote.price, "polling", quote.source);
      } catch (err) {
        if (isAbortError(err) && abortController.signal.aborted) return;
        if (!isMounted) return;

        setState((current) => {
          // The socket is feeding us live ticks — a failed REST poll is noise.
          if (current.status === "live") return current;
          // No real quote yet: only the placeholder is available.
          if (current.isPlaceholder) return { ...current, status: "offline" };
          // Keep showing the last known good price, flagged as cached.
          return { ...current, status: "cached" };
        });
      }
    }

    function connectWebSocket() {
      if (!isMounted) return;

      setState((current) => ({
        ...current,
        status: current.isPlaceholder ? "connecting" : "polling",
      }));

      // Rotate through the trade streams: a blocked host fails fast and the
      // next attempt uses the official market-data mirror.
      const stream =
        BINANCE_WS_TRADE_STREAMS[
          reconnectAttemptRef.current % BINANCE_WS_TRADE_STREAMS.length
        ];

      socket = new WebSocket(stream.url);

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as BinanceTradeMessage;
          const nextPrice = Number(data.p);

          if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
            return;
          }

          applyPrice(nextPrice, "live", stream.source);
        } catch {
          // ignore malformed messages
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (!isMounted) return;

        fetchRestPrice();
        reconnectAttemptRef.current += 1;
        const reconnectDelay = Math.min(
          10_000,
          1_000 * reconnectAttemptRef.current,
        );

        reconnectTimerRef.current = setTimeout(
          connectWebSocket,
          reconnectDelay,
        );
      };
    }

    fetchRestPrice();
    connectWebSocket();
    const pollingInterval = window.setInterval(fetchRestPrice, REST_POLL_MS);

    return () => {
      isMounted = false;
      abortController.abort();
      window.clearInterval(pollingInterval);

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      socket?.close();
    };
  }, []);

  return state;
}
