import type { BtcWallet, DcaPlanInput, OtherAssetsInput } from "@/lib/types";

/**
 * One-click sample profile.
 *
 * The app ships with *no* holdings by default (see DEFAULT_WALLETS in app/page.tsx),
 * so a first-time visitor sees an honest empty state instead of someone else's
 * 1.2 BTC. This gives them a realistic-looking portfolio to explore every module
 * with a single click — and everything stays local, nothing is uploaded.
 */
export const DEMO_WALLETS: BtcWallet[] = [
  { id: "demo-cold", name: "Cold storage", btc: 0.42, costBasis: 28_500 },
  { id: "demo-exchange", name: "Exchange DCA", btc: 0.18, costBasis: 61_200 },
];

export const DEMO_MONTHLY_EXPENSES = 4_500;
export const DEMO_WITHDRAWAL_RATE = 0.04;
export const DEMO_INFLATION_RATE = 0.025;
export const DEMO_DCA_PLAN: DcaPlanInput = { dailyAmount: 30 };
export const DEMO_OTHER_ASSETS: OtherAssetsInput = {
  currentAmount: 25_000,
  annualReturnRate: 0.04,
  monthlyCashflow: 500,
};
