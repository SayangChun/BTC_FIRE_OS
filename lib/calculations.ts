import type { BtcScenario, BtcUnit, BtcWallet, Currency, FireResult, ScenarioResult } from "@/lib/types";

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
