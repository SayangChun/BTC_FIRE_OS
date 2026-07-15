import type { Ahr999Recommendation } from "@/lib/types";

const BITCOIN_GENESIS_DATE = new Date("2009-01-03T00:00:00Z");
const ZONE_LOW = 0.45;
const ZONE_HIGH = 1.2;

/** Classic ahr999 exponential growth valuation fit. */
const AHR999_FIT_SLOPE = 5.84;
const AHR999_FIT_INTERCEPT = -17.01;

/**
 * ahr999-3D valuation fit — recalibrated coefficients for current market.
 * fittedPrice = 10^(5.5189 × log₁₀(ageDays) − 15.8993)
 */
const AHR999_3D_FIT_SLOPE = 5.5189;
const AHR999_3D_FIT_INTERCEPT = -15.8993;

function bitcoinAgeDays(today = new Date()): number {
  return Math.max(
    1,
    Math.floor(
      (today.getTime() - BITCOIN_GENESIS_DATE.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
}

function calculateFittedPrice(
  slope: number,
  intercept: number,
  today = new Date(),
): number {
  const ageDays = bitcoinAgeDays(today);
  return 10 ** (slope * Math.log10(ageDays) + intercept);
}

/**
 * Shared core: (Price / 200DCA) × (Price / fittedPrice)
 * 200DCA = mean of past 200 daily closes (DCA cost).
 */
function calculateAhr999Core(
  btcPrice: number,
  average200DayPrice: number,
  fittedPrice: number,
): number {
  if (btcPrice <= 0 || average200DayPrice <= 0 || fittedPrice <= 0) {
    return 0;
  }

  return (btcPrice / average200DayPrice) * (btcPrice / fittedPrice);
}

export function calculateAhr999(
  btcPrice: number,
  average200DayPrice: number,
  today = new Date(),
): number {
  return calculateAhr999Core(
    btcPrice,
    average200DayPrice,
    calculateAhr999FittedPrice(today),
  );
}

export function calculateAhr999FittedPrice(today = new Date()): number {
  return calculateFittedPrice(AHR999_FIT_SLOPE, AHR999_FIT_INTERCEPT, today);
}

/** ahr999-3D: same structure as ahr999, with recalibrated power-law fit. */
export function calculateAhr9993d(
  btcPrice: number,
  average200DayPrice: number,
  today = new Date(),
): number {
  return calculateAhr999Core(
    btcPrice,
    average200DayPrice,
    calculateAhr9993dFittedPrice(today),
  );
}

export function calculateAhr9993dFittedPrice(today = new Date()): number {
  return calculateFittedPrice(
    AHR999_3D_FIT_SLOPE,
    AHR999_3D_FIT_INTERCEPT,
    today,
  );
}

export function getAhr999Recommendation(
  value: number,
): Ahr999Recommendation {
  if (value <= ZONE_LOW) {
    return "increase";
  }

  if (value <= ZONE_HIGH) {
    return "normal";
  }

  return "stop";
}
