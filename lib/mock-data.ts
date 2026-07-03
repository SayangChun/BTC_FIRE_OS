import type { BtcDistributionBucket, BtcScenario, PricePoint } from "@/lib/types";
import { calculatePowerLawPrice } from "@/lib/price-projection";

export const BTC_DISTRIBUTION: readonly BtcDistributionBucket[] = [
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
