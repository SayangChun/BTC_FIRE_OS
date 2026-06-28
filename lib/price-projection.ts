import type {
  DcaPlanInput,
  PriceProjectionPoint,
  PriceProjectionScenario,
} from "@/lib/types";

const BITCOIN_GENESIS_DATE = new Date("2009-01-03T00:00:00Z");
const POWER_LAW_SLOPE = 5.84509376;
const POWER_LAW_INTERCEPT = -17.01593313;

const scenarioMultipliers: Record<PriceProjectionScenario, number> = {
  bear: 0.55,
  base: 1,
  bull: 1.55,
};

const ANNUAL_INFLATION_RATE = 0.025;

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
  futureDate.setMonth(today.getMonth() + Math.round(yearsFromNow * 12));

  const futureModelPrice = calculatePowerLawPrice(futureDate);
  const valuationRatio =
    currentPrice > 0 && currentModelPrice > 0 ? currentPrice / currentModelPrice : 1;

  const meanReversionWeight = Math.max(0.35, 1 - yearsFromNow * 0.065);
  let baseProjection =
    futureModelPrice * valuationRatio ** meanReversionWeight;
  const longTermDamp = Math.max(0.72, 1 - yearsFromNow * 0.028);
  baseProjection *= longTermDamp;

  return baseProjection * scenarioMultipliers[scenario];
}

function projectAccumulatedBtc(
  currentBtc: number,
  currentBtcPrice: number,
  monthlyDca: number,
  targetYear: number,
  scenario: PriceProjectionScenario,
): number {
  let btc = currentBtc;
  for (let month = 1; month <= targetYear * 12; month++) {
    const price = projectBtcPrice(currentBtcPrice, month / 12, scenario);
    if (price > 0) btc += monthlyDca / price;
  }
  return btc;
}

export function buildPriceProjection({
  btcHoldings,
  currentPrice,
  requiredPortfolioValue,
  years = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  dcaPlan,
}: {
  btcHoldings: number;
  currentPrice: number;
  requiredPortfolioValue: number;
  years?: number[];
  dcaPlan?: DcaPlanInput;
}): PriceProjectionPoint[] {
  const scenarios: PriceProjectionScenario[] = ["bear", "base", "bull"];
  const expectedMonthlyDca = dcaPlan ? dcaPlan.dailyAmount * (365 / 12) : 0;

  return years.flatMap((year) =>
    scenarios.map((scenario) => {
      const projectedPrice = projectBtcPrice(currentPrice, year, scenario);
      const projectedBtc =
        expectedMonthlyDca > 0
          ? projectAccumulatedBtc(btcHoldings, currentPrice, expectedMonthlyDca, year, scenario)
          : btcHoldings;
      const projectedPortfolioValue = projectedBtc * projectedPrice;
      const inflationFactor = (1 + ANNUAL_INFLATION_RATE) ** year;
      const effectiveRequired = requiredPortfolioValue * inflationFactor;
      const requiredBtcForFire =
        projectedPrice > 0 ? effectiveRequired / projectedPrice : 0;
      const fireProgress =
        effectiveRequired > 0
          ? projectedPortfolioValue / effectiveRequired
          : 0;

      return {
        year,
        scenario,
        projectedPrice,
        projectedBtc,
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
