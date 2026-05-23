"use client";

import { useEffect, useState } from "react";

import { calculateAhr999 } from "@/lib/ahr999";
import type { Ahr999Frequency } from "@/lib/types";

const BINANCE_DAILY_KLINES =
  "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000";
const AHR999_COST_WINDOW = 200;

type Ahr999FrequencyStatus = "loading" | "ready" | "error";

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export function useAhr999Frequency(): Ahr999Frequency & {
  status: Ahr999FrequencyStatus;
} {
  const [state, setState] = useState<
    Ahr999Frequency & { status: Ahr999FrequencyStatus }
  >({
    low: 0,
    normal: 0,
    high: 0,
    sampleDays: 0,
    lastUpdated: null,
    status: "loading",
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchFrequency() {
      try {
        const response = await fetch(BINANCE_DAILY_KLINES, {
          cache: "no-store",
        });
        const klines = (await response.json()) as BinanceKline[];
        const closes = klines
          .map((kline) => ({
            date: new Date(kline[0]),
            close: Number(kline[4]),
          }))
          .filter((point) => Number.isFinite(point.close) && point.close > 0);

        const counts = { low: 0, normal: 0, high: 0 };
        let sampleDays = 0;

        for (let index = AHR999_COST_WINDOW - 1; index < closes.length; index += 1) {
          const window = closes
            .slice(index - AHR999_COST_WINDOW + 1, index + 1)
            .map((point) => point.close);
          const average200DayPrice = calculateAverage(window);
          const value = calculateAhr999(
            closes[index].close,
            average200DayPrice,
            closes[index].date,
          );

          if (value <= 0.45) {
            counts.low += 1;
          } else if (value <= 1.2) {
            counts.normal += 1;
          } else {
            counts.high += 1;
          }

          sampleDays += 1;
        }

        if (!isMounted || sampleDays === 0) {
          return;
        }

        setState({
          low: counts.low / sampleDays,
          normal: counts.normal / sampleDays,
          high: counts.high / sampleDays,
          sampleDays,
          lastUpdated: new Date(),
          status: "ready",
        });
      } catch {
        if (isMounted) {
          setState((current) => ({ ...current, status: "error" }));
        }
      }
    }

    fetchFrequency();
    const interval = window.setInterval(fetchFrequency, 60 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return state;
}

function calculateAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
