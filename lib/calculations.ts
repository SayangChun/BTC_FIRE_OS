import type { BtcScenario, BtcUnit, Currency, FireResult, ScenarioResult } from "@/lib/types";

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
  return toFixedPrecision(safeNumber(btcValue) * factor, decimals);
}

export function unitToBtc(unitValue: number, unit: BtcUnit): number {
  return toSatPrecision(safeNumber(unitValue) / BTC_UNITS[unit].factor);
}

export function formatInputNumber(value: number, decimals: number): string {
  const cleaned = toFixedPrecision(value, decimals);
  let s = cleaned.toFixed(decimals);
  s = s.replace(/\.?0+$/, "");
  return s || "0";
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
  return `${displayValue.toLocaleString("en-US", {
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

function clampWithdrawalRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}
