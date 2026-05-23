import type {
  PriceProjectionPoint,
  PriceProjectionScenario,
} from "@/lib/types";

const BITCOIN_GENESIS_DATE = new Date("2009-01-03T00:00:00Z");
const POWER_LAW_SLOPE = 5.84509376;
const POWER_LAW_INTERCEPT = -17.01593313;

const scenarioMultipliers: Record<PriceProjectionScenario, number> = {
  bear: 0.55,
  base: 1,
  bull: 1.65,
};

export function calculatePowerLawPrice(date = new Date()): number {
  const ageDays = Math.max(
    1,
    Math.floor(
      (date.getTime() - BITCOIN_GENESIS_DATE.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return 10 ** (POWER_LAW_SLOPE * Math.log10(ageDays) + POWER_LAW_INTERCEPT);
}

export function projectBtcPrice(
  currentPrice: number,
  yearsFromNow: number,
  scenario: PriceProjectionScenario,
  today = new Date(),
): number {
  const currentModelPrice = calculatePowerLawPrice(today);
  const futureDate = new Date(today);
  futureDate.setFullYear(today.getFullYear() + yearsFromNow);

  const futureModelPrice = calculatePowerLawPrice(futureDate);
  const valuationRatio =
    currentPrice > 0 && currentModelPrice > 0 ? currentPrice / currentModelPrice : 1;

  // Current over/undervaluation matters less as the forecast moves further out.
  const meanReversionWeight = Math.max(0.35, 1 - yearsFromNow * 0.065);
  const baseProjection =
    futureModelPrice * valuationRatio ** meanReversionWeight;

  return baseProjection * scenarioMultipliers[scenario];
}

export function buildPriceProjection({
  btcHoldings,
  currentPrice,
  requiredPortfolioValue,
  years = [1, 5, 10],
}: {
  btcHoldings: number;
  currentPrice: number;
  requiredPortfolioValue: number;
  years?: number[];
}): PriceProjectionPoint[] {
  const scenarios: PriceProjectionScenario[] = ["bear", "base", "bull"];

  return years.flatMap((year) =>
    scenarios.map((scenario) => {
      const projectedPrice = projectBtcPrice(currentPrice, year, scenario);
      const projectedPortfolioValue = btcHoldings * projectedPrice;
      const requiredBtcForFire =
        projectedPrice > 0 ? requiredPortfolioValue / projectedPrice : 0;
      const fireProgress =
        requiredPortfolioValue > 0
          ? projectedPortfolioValue / requiredPortfolioValue
          : 0;

      return {
        year,
        scenario,
        projectedPrice,
        projectedPortfolioValue,
        requiredBtcForFire,
        fireProgress,
        isFireReady: fireProgress >= 1,
      };
    }),
  );
}

export function findFirstFireYear(points: PriceProjectionPoint[]) {
  return (
    [...points]
      .filter((point) => point.scenario === "base" && point.isFireReady)
      .sort((a, b) => a.year - b.year)[0]?.year ?? null
  );
}
