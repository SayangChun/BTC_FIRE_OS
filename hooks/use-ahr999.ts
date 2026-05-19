"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateAhr999,
  calculateAhr999FittedPrice,
  getAhr999Recommendation,
} from "@/lib/ahr999";
import type { Ahr999Result } from "@/lib/types";

const BINANCE_BTC_USDT_DAILY_KLINES =
  "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=200";

type Ahr999Status = "loading" | "ready" | "error";

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

type Ahr999State = {
  average200DayPrice: number | null;
  status: Ahr999Status;
  lastUpdated: Date | null;
};

export function useAhr999(btcPrice: number): Ahr999Result & {
  status: Ahr999Status;
} {
  const [state, setState] = useState<Ahr999State>({
    average200DayPrice: null,
    status: "loading",
    lastUpdated: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchAverage200DayPrice() {
      try {
        const response = await fetch(BINANCE_BTC_USDT_DAILY_KLINES, {
          cache: "no-store",
        });
        const klines = (await response.json()) as BinanceKline[];
        const closes = klines
          .map((kline) => Number(kline[4]))
          .filter((value) => Number.isFinite(value) && value > 0);

        if (!isMounted || closes.length === 0) {
          return;
        }

        const average200DayPrice = calculateGeometricMean(closes);

        setState({
          average200DayPrice,
          status: "ready",
          lastUpdated: new Date(),
        });
      } catch {
        if (isMounted) {
          setState((current) => ({ ...current, status: "error" }));
        }
      }
    }

    fetchAverage200DayPrice();
    const interval = window.setInterval(fetchAverage200DayPrice, 60 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return useMemo(() => {
    const average200DayPrice = state.average200DayPrice ?? 0;
    const value = calculateAhr999(btcPrice, average200DayPrice);

    return {
      value,
      average200DayPrice,
      fittedPrice: calculateAhr999FittedPrice(),
      recommendation: getAhr999Recommendation(value),
      lastUpdated: state.lastUpdated,
      status: state.status,
    };
  }, [btcPrice, state.average200DayPrice, state.lastUpdated, state.status]);
}

function calculateGeometricMean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const logSum = values.reduce((sum, value) => sum + Math.log(value), 0);

  return Math.exp(logSum / values.length);
}
