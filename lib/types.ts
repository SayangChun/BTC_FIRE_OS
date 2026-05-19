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

export type AccumulationPoint = {
  month: string;
  btc: number;
  value: number;
};

export type Ahr999Recommendation = "increase" | "normal" | "stop";

export type Ahr999Result = {
  value: number;
  average200DayPrice: number;
  fittedPrice: number;
  recommendation: Ahr999Recommendation;
  lastUpdated: Date | null;
};
