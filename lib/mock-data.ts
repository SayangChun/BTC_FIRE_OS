import type { BtcScenario, PricePoint } from "@/lib/types";
import { calculatePowerLawPrice } from "@/lib/price-projection";

export const MOCK_BTC_PRICE = 100_000;

function generateBtcPriceHistory(): PricePoint[] {
  const points: PricePoint[] = [];
  const genesis = new Date("2009-01-03T00:00:00Z");
  const now = new Date();

  for (let y = 2011; y <= now.getFullYear(); y++) {
    const maxM = y === now.getFullYear() ? now.getMonth() + 1 : 12;
    for (let m = 1; m <= maxM; m++) {
      const date = new Date(y, m - 1, 1);
      const daysSinceGenesis = Math.floor(
        (date.getTime() - genesis.getTime()) / 86400000,
      );
      if (daysSinceGenesis < 1) continue;

      const basePrice = calculatePowerLawPrice(date);

      const yearsSince2011 =
        (date.getTime() - new Date("2011-01-01").getTime()) /
        (365.25 * 86400000);
      const cycle = Math.sin((2 * Math.PI * yearsSince2011) / 4);
      const noise = 1 + (Math.sin(yearsSince2011 * 13.7) * 0.08 + Math.cos(yearsSince2011 * 7.3) * 0.06);

      const price = Math.max(0.01, basePrice * (1 + 0.65 * cycle) * noise);

      points.push({
        date: `${y}-${String(m).padStart(2, "0")}-01`,
        price: Math.round(price * 100) / 100,
      });
    }
  }

  return points;
}

export const MOCK_BTC_PRICE_HISTORY: PricePoint[] = generateBtcPriceHistory();

export const BTC_PRICE_SCENARIOS: BtcScenario[] = [
  {
    name: "Bear",
    price: 50_000,
    description: "Cycle drawdown",
  },
  {
    name: "Base",
    price: 100_000,
    description: "Current planning price",
  },
  {
    name: "Bull",
    price: 250_000,
    description: "Expansion scenario",
  },
];
