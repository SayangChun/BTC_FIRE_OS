import type { AccumulationPoint, BtcScenario } from "@/lib/types";

export const MOCK_BTC_PRICE = 100_000;

export const MOCK_ACCUMULATION_HISTORY: AccumulationPoint[] = [
  { month: "Jan", btc: 0.42, value: 31_500 },
  { month: "Feb", btc: 0.48, value: 37_440 },
  { month: "Mar", btc: 0.55, value: 46_750 },
  { month: "Apr", btc: 0.61, value: 54_900 },
  { month: "May", btc: 0.68, value: 68_000 },
  { month: "Jun", btc: 0.74, value: 74_000 },
  { month: "Jul", btc: 0.82, value: 86_100 },
  { month: "Aug", btc: 0.9, value: 90_000 },
  { month: "Sep", btc: 0.97, value: 101_850 },
  { month: "Oct", btc: 1.04, value: 109_200 },
  { month: "Nov", btc: 1.12, value: 117_600 },
  { month: "Dec", btc: 1.2, value: 120_000 },
];

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
