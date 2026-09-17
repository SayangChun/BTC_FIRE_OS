import {
  DEFAULT_ANNUAL_INFLATION_RATE,
  inflateValue,
} from "@/lib/calculations";
import { projectBtcPrice } from "@/lib/price-projection";
import type {
  DcaFireProjection,
  DcaPlanInput,
  OtherAssetsInput,
} from "@/lib/types";

const DAYS_PER_MONTH = 365 / 12;
const MAX_PROJECTION_MONTHS = 40 * 12;

export function calculateExpectedDailyDca(plan: DcaPlanInput) {
  return plan.dailyAmount;
}

export function projectDcaFire({
  btcHoldings,
  currentBtcPrice,
  requiredPortfolioValue,
  plan,
  otherAssets,
  annualInflationRate = DEFAULT_ANNUAL_INFLATION_RATE,
}: {
  btcHoldings: number;
  currentBtcPrice: number;
  requiredPortfolioValue: number;
  plan: DcaPlanInput;
  otherAssets: OtherAssetsInput;
  /**
   * Grows the FIRE target over time, matching buildPriceProjection.
   * Without it this projection would ignore inflation and report an
   * unrealistically early FIRE date.
   */
  annualInflationRate?: number;
}): DcaFireProjection {
  const expectedDailyDca = calculateExpectedDailyDca(plan);
  const expectedMonthlyDca = expectedDailyDca * DAYS_PER_MONTH;
  const currentBtcValue = btcHoldings * currentBtcPrice;
  const currentOtherAssetsValue = sanitizePositive(otherAssets.currentAmount);
  const currentCombinedValue = currentBtcValue + currentOtherAssetsValue;
  const currentCombinedFireProgress =
    requiredPortfolioValue > 0 ? currentCombinedValue / requiredPortfolioValue : 0;
  const currentFireGapValue = Math.max(
    requiredPortfolioValue - currentCombinedValue,
    0,
  );
  const currentFireGapBtc =
    currentBtcPrice > 0 ? currentFireGapValue / currentBtcPrice : 0;

  let projectedBtc = btcHoldings;
  let projectedOtherAssets = currentOtherAssetsValue;
  const monthlyOtherAssetsReturn =
    (1 + sanitizeReturnRate(otherAssets.annualReturnRate)) ** (1 / 12) - 1;
  const monthlyCashflow = sanitizePositive((otherAssets as any).monthlyCashflow ?? 0);

  for (let month = 1; month <= MAX_PROJECTION_MONTHS; month += 1) {
    const yearsFromNow = month / 12;
    const projectedPrice = projectBtcPrice(
      currentBtcPrice,
      yearsFromNow,
      "base",
    );

    if (projectedPrice > 0) {
      projectedBtc += expectedMonthlyDca / projectedPrice;
    }

    projectedOtherAssets *= 1 + monthlyOtherAssetsReturn;
    projectedOtherAssets += monthlyCashflow;
    const projectedValue = projectedBtc * projectedPrice + projectedOtherAssets;

    // The target itself grows with inflation, so the comparison is apples-to-apples.
    const requiredValueNow = inflateValue(
      requiredPortfolioValue,
      annualInflationRate,
      yearsFromNow,
    );

    if (projectedValue >= requiredValueNow) {
      const projectedFireDate = new Date();
      projectedFireDate.setMonth(projectedFireDate.getMonth() + month);

      return {
        expectedDailyDca,
        expectedMonthlyDca,
        currentFireGapValue,
        currentFireGapBtc,
        currentCombinedValue,
        currentCombinedFireProgress,
        projectedFireYears: yearsFromNow,
        projectedFireDate,
        projectedBtcAtFire: projectedBtc,
        projectedOtherAssetsAtFire: projectedOtherAssets,
        projectedValueAtFire: projectedValue,
        requiredValueAtFire: requiredValueNow,
      };
    }
  }

  return {
    expectedDailyDca,
    expectedMonthlyDca,
    currentFireGapValue,
    currentFireGapBtc,
    currentCombinedValue,
    currentCombinedFireProgress,
    projectedFireYears: null,
    projectedFireDate: null,
    projectedBtcAtFire: null,
    projectedOtherAssetsAtFire: null,
    projectedValueAtFire: null,
    requiredValueAtFire: null,
  };
}

function sanitizePositive(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function sanitizeReturnRate(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(value, -0.99);
}
