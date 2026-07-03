import type { BtcDistributionBucket, BtcScenario, BtcUnit, BtcWallet, Currency, FireResult, ScenarioResult } from "@/lib/types";

export const BTC_WEALTH_DISTRIBUTION: readonly BtcDistributionBucket[] = [
  { range: "(0 - 0.00001)", min: 0, max: 0.00001, addresses: 7622624, btc: 45.14, addrPct: 12.88, btcPct: 0, topPct: 100 },
  { range: "[0.00001 - 0.0001)", min: 0.00001, max: 0.0001, addresses: 12473317, btc: 524.46, addrPct: 21.08, btcPct: 0, topPct: 87.12 },
  { range: "[0.0001 - 0.001)", min: 0.0001, max: 0.001, addresses: 14000029, btc: 5251, addrPct: 23.66, btcPct: 0.03, topPct: 66.03 },
  { range: "[0.001 - 0.01)", min: 0.001, max: 0.01, addresses: 12135629, btc: 44893, addrPct: 20.51, btcPct: 0.22, topPct: 42.37 },
  { range: "[0.01 - 0.1)", min: 0.01, max: 0.1, addresses: 8396224, btc: 282497, addrPct: 14.19, btcPct: 1.41, topPct: 21.86 },
  { range: "[0.1 - 1)", min: 0.1, max: 1, addresses: 3556378, btc: 1084429, addrPct: 6.01, btcPct: 5.41, topPct: 7.67 },
  { range: "[1 - 10)", min: 1, max: 10, addresses: 829376, btc: 2053919, addrPct: 1.4, btcPct: 10.24, topPct: 1.66 },
  { range: "[10 - 100)", min: 10, max: 100, addresses: 130306, btc: 4232312, addrPct: 0.22, btcPct: 21.11, topPct: 0.25 },
  { range: "[100 - 1,000)", min: 100, max: 1000, addresses: 17954, btc: 5145837, addrPct: 0.03, btcPct: 25.67, topPct: 0.03 },
  { range: "[1,000 - 10,000)", min: 1000, max: 10000, addresses: 1947, btc: 4245788, addrPct: 0, btcPct: 21.18, topPct: 0 },
  { range: "[10,000 - 100,000)", min: 10000, max: 100000, addresses: 84, btc: 2258730, addrPct: 0, btcPct: 11.27, topPct: 0 },
  { range: "[100,000 - 1,000,000)", min: 100000, max: 1000000, addresses: 4, btc: 694392, addrPct: 0, btcPct: 3.46, topPct: 0 },
];

export function calculateAddressTopPercent(btc: number): number {
  const ub = Number.isFinite(btc) ? Math.max(0, btc) : 0;
  const b = BTC_WEALTH_DISTRIBUTION;

  // First bucket [0, 0.00001) → 100%
  if (ub < b[1].min) return 100;

  // Find the highest bucket index where ub >= min
  let idx = 0;
  for (let i = 0; i < b.length; i++) {
    if (ub >= b[i].min) idx = i;
  }

  // Power-law alpha between bucket i and i+1
  const alpha = (i: number) =>
    Math.log(b[i].topPct / b[i + 1].topPct) / Math.log(b[i + 1].min / b[i].min);

  // Interpolated topPct at amount a within bucket i
  const valAt = (i: number, a: number, al: number) =>
    b[i].topPct * (a / b[i].min) ** (-al);

  // Buckets 1-7: both current and next have topPct > 0, interpolate normally
  if (idx <= 7) {
    return valAt(idx, ub, alpha(idx));
  }

  // Buckets 8+ or beyond: topPct rounds to 0 in data; extrapolate
  // using the last known power-law exponent (alpha from bucket 7→8)
  const a = alpha(7);
  return Math.max(0, valAt(8, ub, a));
}

export function formatTopPercent(p: number): string {
  if (!Number.isFinite(p) || p <= 0) return "<0.001%";
  if (p < 0.001) return "<0.001%";
  if (p < 1) return `${p.toFixed(3)}%`;
  return `${p.toFixed(2)}%`;
}

export const BTC_UNITS: Record<BtcUnit, { label: string; factor: number; decimals: number; step: string }> = {
  BTC: { label: "BTC", factor: 1, decimals: 8, step: "0.00000001" },
  mBTC: { label: "mBTC", factor: 1000, decimals: 5, step: "0.00001" },
  bits: { label: "bits", factor: 1_000_000, decimals: 2, step: "0.01" },
  sat: { label: "sat", factor: 100_000_000, decimals: 0, step: "1" },
};

export const BTC_UNIT_OPTIONS: BtcUnit[] = ["BTC", "mBTC", "bits", "sat"];

export function toFixedPrecision(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0;
  const safeDecimals = Math.max(0, Math.floor(decimals));
  const p = Math.pow(10, safeDecimals);
  return Math.round(safeNumber(value) * p) / p;
}

export function toSatPrecision(value: number): number {
  return toFixedPrecision(value, 8);
}

export function btcToUnit(btcValue: number, unit: BtcUnit): number {
  const { factor, decimals } = BTC_UNITS[unit];
  const raw = safeNumber(btcValue) * factor;
  if (unit === "sat") {
    // Exact integer satoshis. Avoids floating point drift (e.g. 0.0033 * 1e8 must be 330000, not 329999.999...).
    return Math.round(raw);
  }
  return toFixedPrecision(raw, decimals);
}

export function unitToBtc(unitValue: number, unit: BtcUnit): number {
  const { factor } = BTC_UNITS[unit];
  if (unit === "sat") {
    // Treat input as whole satoshis (integer), convert back to BTC with full 8-dec precision.
    const sats = Math.round(safeNumber(unitValue));
    return toSatPrecision(sats / factor);
  }
  return toSatPrecision(safeNumber(unitValue) / factor);
}

export function formatInputNumber(value: number, decimals: number): string {
  const cleaned = toFixedPrecision(value, decimals);
  let s = cleaned.toFixed(decimals);
  s = s.replace(/\.?0+$/, "");
  return s || "0";
}

/**
 * Format a BTC amount for the holdings input and summary on the main portfolio card.
 * - For BTC: always emit exactly 8 decimal places (e.g. "0.00330000"), never strip trailing zeros.
 * - For sat: emit the exact whole number of satoshis as integer string (e.g. "330000").
 * - For mBTC/bits: use their declared decimals, full (no trimming) so switching units is lossless in display.
 *
 * This ensures:
 *   0.0033 BTC  ->  "0.00330000" (BTC mode)
 *   0.0033 BTC  ->  "330000"     (sat mode)
 */
export function formatHoldings(value: number, unit: BtcUnit): string {
  const { factor, decimals } = BTC_UNITS[unit];
  if (unit === "sat") {
    // Exact integer satoshis. Critical to avoid 0.0033*1e8 becoming 329999.999 due to float.
    const sats = Math.round(safeNumber(value) * factor);
    return sats.toString();
  }
  const scaled = safeNumber(value) * factor;
  const fixed = toFixedPrecision(scaled, decimals);
  // Pad to the declared decimals (for BTC this is always 8 places)
  return fixed.toFixed(decimals);
}

export function calculatePortfolioValue(
  btcHoldings: number,
  btcPrice: number,
): number {
  return safeNumber(btcHoldings) * safeNumber(btcPrice);
}

export function calculateCostBasis(
  btcHoldings: number,
  averageCostBasis: number,
): number {
  return safeNumber(btcHoldings) * safeNumber(averageCostBasis);
}

export function calculateProfitLoss(
  portfolioValue: number,
  costBasis: number,
): number {
  return signedNumber(portfolioValue) - signedNumber(costBasis);
}

export function calculateProfitLossPercentage(
  profitLoss: number,
  costBasis: number,
): number {
  if (costBasis <= 0) {
    return 0;
  }

  return signedNumber(profitLoss) / costBasis;
}

export function calculateFireTarget(
  monthlyExpenses: number,
  withdrawalRate: number,
  btcPrice: number,
  portfolioValue: number,
): FireResult {
  const annualExpenses = safeNumber(monthlyExpenses) * 12;
  const safeWithdrawalRate = clampWithdrawalRate(withdrawalRate);
  const requiredPortfolioValue =
    safeWithdrawalRate > 0 ? annualExpenses / safeWithdrawalRate : 0;
  const requiredBtc =
    btcPrice > 0 ? requiredPortfolioValue / safeNumber(btcPrice) : 0;
  const fireProgress =
    requiredPortfolioValue > 0 ? portfolioValue / requiredPortfolioValue : 0;

  return {
    monthlyExpenses: safeNumber(monthlyExpenses),
    withdrawalRate: safeWithdrawalRate,
    annualExpenses,
    requiredPortfolioValue,
    requiredBtc,
    fireProgress,
    isFireReady: fireProgress >= 1,
  };
}

export function calculateScenarioResults(
  scenarios: BtcScenario[],
  btcHoldings: number,
  requiredPortfolioValue: number,
): ScenarioResult[] {
  return scenarios.map((scenario) => {
    const projectedPortfolioValue = calculatePortfolioValue(
      btcHoldings,
      scenario.price,
    );
    const fireProgress =
      requiredPortfolioValue > 0
        ? projectedPortfolioValue / requiredPortfolioValue
        : 0;
    const requiredBtcAtScenario =
      scenario.price > 0 ? requiredPortfolioValue / scenario.price : 0;

    return {
      ...scenario,
      projectedPortfolioValue,
      requiredPortfolioValue,
      fireProgress,
      btcGap: requiredBtcAtScenario - safeNumber(btcHoldings),
      isFireReady: fireProgress >= 1,
    };
  });
}

const CURRENCY_FORMATS: Record<Currency, { locale: string; currency: string }> = {
  USD: { locale: "en-US", currency: "USD" },
  CNY: { locale: "zh-CN", currency: "CNY" },
};

export function formatCurrency(value: number, decimals = 0, currency: Currency = "USD"): string {
  const fmt = CURRENCY_FORMATS[currency];
  return new Intl.NumberFormat(fmt.locale, {
    style: "currency",
    currency: fmt.currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeNumber(value));
}

export function formatSignedCurrency(value: number, currency: Currency = "USD"): string {
  const fmt = CURRENCY_FORMATS[currency];
  return new Intl.NumberFormat(fmt.locale, {
    style: "currency",
    currency: fmt.currency,
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(signedNumber(value));
}

export function formatBtc(value: number, unit: BtcUnit = "BTC"): string {
  const { factor, label, decimals } = BTC_UNITS[unit];
  const displayValue = safeNumber(value) * factor;

  if (unit === "sat") {
    // Exact whole satoshis, with thousand separators for readability in display contexts.
    const sats = Math.round(displayValue);
    return `${sats.toLocaleString("en-US")} ${label}`;
  }

  // For BTC: force full 8 decimal places (e.g. 0.00330000).
  // For mBTC/bits: force their declared decimals.
  // This ensures switching units on holdings shows the exact corresponding value without trimming.
  return `${displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${label}`;
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(safeNumber(value));
}

export function formatSignedPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(signedNumber(value));
}

export function currencySymbol(currency: Currency): string {
  return currency === "CNY" ? "¥" : "$";
}

export function convertCurrency(usdValue: number, target: Currency, cnyRate: number): number {
  if (target === "USD") return usdValue;
  return usdValue * cnyRate;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function signedNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function calculateTotalBtc(wallets: BtcWallet[]): number {
  return wallets.reduce((sum, w) => sum + safeNumber(w.btc), 0);
}

export function calculateTotalCostBasis(wallets: BtcWallet[]): number {
  return wallets.reduce((sum, w) => sum + safeNumber(w.btc) * safeNumber(w.costBasis), 0);
}

export function calculateWeightedCostBasis(wallets: BtcWallet[]): number {
  const totalBtc = calculateTotalBtc(wallets);
  if (totalBtc <= 0) return 0;
  const totalCost = calculateTotalCostBasis(wallets);
  return toFixedPrecision(totalCost / totalBtc, 2);
}

function clampWithdrawalRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}
