import type { Ahr999Recommendation } from "@/lib/types";

const BITCOIN_GENESIS_DATE = new Date("2009-01-03T00:00:00Z");

export function calculateAhr999(
  btcPrice: number,
  average200DayPrice: number,
  today = new Date(),
): number {
  const fittedPrice = calculateAhr999FittedPrice(today);

  if (btcPrice <= 0 || average200DayPrice <= 0 || fittedPrice <= 0) {
    return 0;
  }

  return (btcPrice / average200DayPrice) * (btcPrice / fittedPrice);
}

export function calculateAhr999FittedPrice(today = new Date()): number {
  const ageDays = Math.max(
    1,
    Math.floor(
      (today.getTime() - BITCOIN_GENESIS_DATE.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return 10 ** (5.84 * Math.log10(ageDays) - 17.01);
}

export function getAhr999Recommendation(
  value: number,
): Ahr999Recommendation {
  if (value <= 0.45) {
    return "increase";
  }

  if (value <= 1.2) {
    return "normal";
  }

  return "stop";
}
