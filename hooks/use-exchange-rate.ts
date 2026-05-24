"use client";

import { useEffect, useState } from "react";

const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD";
const CNY_FALLBACK = 7.2;

export type ExchangeRateStatus = "loading" | "ready";

export function useExchangeRate(): { rate: number; status: ExchangeRateStatus } {
  const [rate, setRate] = useState<number>(CNY_FALLBACK);
  const [status, setStatus] = useState<ExchangeRateStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

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
          } else {
            setRate(CNY_FALLBACK);
          }
          setStatus("ready");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!cancelled) {
          setRate(CNY_FALLBACK);
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
