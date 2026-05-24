"use client";

import { useEffect, useRef, useState } from "react";

const BINANCE_BTC_USDT_STREAM = "wss://stream.binance.com:9443/ws/btcusdt@trade";
const BINANCE_BTC_USDT_REST =
  "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";
const FALLBACK_PRICE = 100_000;

export type BtcPriceStatus = "connecting" | "live" | "polling" | "offline";

type BinanceTradeMessage = {
  p?: string;
};

type BinanceTickerResponse = {
  price?: string;
};

export type BtcPriceState = {
  price: number;
  status: BtcPriceStatus;
  lastUpdated: Date | null;
};

export function useBtcPrice(): BtcPriceState {
  const [state, setState] = useState<BtcPriceState>({
    price: FALLBACK_PRICE,
    status: "connecting",
    lastUpdated: null,
  });
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let socket: WebSocket | null = null;
    const abortController = new AbortController();

    async function fetchRestPrice() {
      try {
        const response = await fetch(BINANCE_BTC_USDT_REST, {
          cache: "no-store",
          signal: abortController.signal,
        });
        const data = (await response.json()) as BinanceTickerResponse;
        const nextPrice = Number(data.price);

        if (!isMounted || !Number.isFinite(nextPrice) || nextPrice <= 0) {
          return;
        }

        setState({
          price: nextPrice,
          status: "polling",
          lastUpdated: new Date(),
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (isMounted) {
          setState((current) => ({ ...current, status: "offline" }));
        }
      }
    }

    function connectWebSocket() {
      if (!isMounted) {
        return;
      }

      setState((current) => ({
        ...current,
        status: current.lastUpdated ? "polling" : "connecting",
      }));

      socket = new WebSocket(BINANCE_BTC_USDT_STREAM);

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

          setState({
            price: nextPrice,
            status: "live",
            lastUpdated: new Date(),
          });
        } catch {
          // ignore malformed messages
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (!isMounted) {
          return;
        }

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
    const pollingInterval = window.setInterval(fetchRestPrice, 30_000);

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
