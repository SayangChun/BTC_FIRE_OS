import type { BtcScenario, FireResult, ScenarioResult } from "@/lib/types";

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
  return safeNumber(portfolioValue) - safeNumber(costBasis);
}

export function calculateProfitLossPercentage(
  profitLoss: number,
  costBasis: number,
): number {
  if (costBasis <= 0) {
    return 0;
  }

  return profitLoss / costBasis;
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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

export function formatBtc(value: number): string {
  return `${safeNumber(value).toLocaleString("en-US", {
    maximumFractionDigits: 4,
  })} BTC`;
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(safeNumber(value));
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function clampWithdrawalRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}
