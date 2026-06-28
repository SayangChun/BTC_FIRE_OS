export type BtcWallet = {
  id: string;
  name: string;
  btc: number;
  costBasis: number;
};

export type PortfolioInput = {
  btcHoldings: number;
  averageCostBasis: number;
};

export type DashboardMetrics = {
  currentBtcPrice: number;
  portfolioValue: number;
  costBasis: number;
  profitLoss: number;
  profitLossPercentage: number;
};

export type FireResult = {
  monthlyExpenses: number;
  withdrawalRate: number;
  annualExpenses: number;
  requiredPortfolioValue: number;
  requiredBtc: number;
  fireProgress: number;
  isFireReady: boolean;
};

export type BtcScenario = {
  name: "Bear" | "Base" | "Bull";
  price: number;
  description: string;
};

export type ScenarioResult = BtcScenario & {
  projectedPortfolioValue: number;
  requiredPortfolioValue: number;
  fireProgress: number;
  btcGap: number;
  isFireReady: boolean;
};

export type PricePoint = {
  date: string;
  price: number;
};

export type Ahr999Recommendation = "increase" | "normal" | "stop";

export type Ahr999Result = {
  value: number;
  average200DayPrice: number;
  fittedPrice: number;
  recommendation: Ahr999Recommendation;
  lastUpdated: Date | null;
};

export type PriceProjectionScenario = "bear" | "base" | "bull";

export type PriceProjectionPoint = {
  year: number;
  scenario: PriceProjectionScenario;
  projectedPrice: number;
  projectedBtc: number;
  projectedPortfolioValue: number;
  requiredBtcForFire: number;
  fireProgress: number;
  isFireReady: boolean;
};

export type Currency = "USD" | "CNY";

export type Ahr999Zone = "low" | "normal" | "high";

export type Ahr999Frequency = {
  low: number;
  normal: number;
  high: number;
  sampleDays: number;
  lastUpdated: Date | null;
};

export type DcaPlanInput = {
  dailyAmount: number;
};

export type BtcUnit = "BTC" | "mBTC" | "bits" | "sat";

export type OtherAssetsInput = {
  currentAmount: number;
  annualReturnRate: number;
  monthlyCashflow: number;
};

export type ExportData = {
  version: number;
  exportedAt: string;
  language: string;
  currency: string;
  btcUnit: string;
  wallets?: BtcWallet[];
  // legacy single fields (for old backups)
  btcHoldings?: number;
  averageCostBasis?: number;
  monthlyExpenses: number;
  withdrawalRate: number;
  dcaPlan: DcaPlanInput;
  otherAssets: OtherAssetsInput;
};

export type DcaFireProjection = {
  expectedDailyDca: number;
  expectedMonthlyDca: number;
  currentFireGapValue: number;
  currentFireGapBtc: number;
  currentCombinedValue: number;
  currentCombinedFireProgress: number;
  projectedFireYears: number | null;
  projectedFireDate: Date | null;
  projectedBtcAtFire: number | null;
  projectedOtherAssetsAtFire: number | null;
  projectedValueAtFire: number | null;
};
