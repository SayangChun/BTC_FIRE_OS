"use client";

import { useMemo, useState } from "react";
import { Bitcoin } from "lucide-react";

import { AccumulationChart } from "@/components/accumulation-chart";
import { Ahr999Card } from "@/components/ahr999-card";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { FireCalculator } from "@/components/fire-calculator";
import { PortfolioInput } from "@/components/portfolio-input";
import { ScenarioSimulator } from "@/components/scenario-simulator";
import {
  calculateCostBasis,
  calculateFireTarget,
  calculatePortfolioValue,
  calculateProfitLoss,
  calculateProfitLossPercentage,
  calculateScenarioResults,
  formatBtc,
  formatCurrency,
} from "@/lib/calculations";
import {
  BTC_PRICE_SCENARIOS,
  MOCK_ACCUMULATION_HISTORY,
} from "@/lib/mock-data";
import {
  languageOptions,
  translations,
  type Language,
  type Translation,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBtcPrice, type BtcPriceStatus } from "@/hooks/use-btc-price";
import { useAhr999 } from "@/hooks/use-ahr999";

export default function Home() {
  const [language, setLanguage] = useState<Language>("zhCN");
  const [btcHoldings, setBtcHoldings] = useState(1.2);
  const [averageCostBasis, setAverageCostBasis] = useState(42_000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(4_500);
  const [withdrawalRate, setWithdrawalRate] = useState(0.04);
  const btcPrice = useBtcPrice();
  const ahr999 = useAhr999(btcPrice.price);
  const t = translations[language];

  const model = useMemo(() => {
    const portfolioValue = calculatePortfolioValue(
      btcHoldings,
      btcPrice.price,
    );
    const costBasis = calculateCostBasis(btcHoldings, averageCostBasis);
    const profitLoss = calculateProfitLoss(portfolioValue, costBasis);
    const profitLossPercentage = calculateProfitLossPercentage(
      profitLoss,
      costBasis,
    );
    const fireResult = calculateFireTarget(
      monthlyExpenses,
      withdrawalRate,
      btcPrice.price,
      portfolioValue,
    );
    const scenarioResults = calculateScenarioResults(
      BTC_PRICE_SCENARIOS,
      btcHoldings,
      fireResult.requiredPortfolioValue,
    );

    return {
      dashboardMetrics: {
        currentBtcPrice: btcPrice.price,
        portfolioValue,
        costBasis,
        profitLoss,
        profitLossPercentage,
      },
      fireResult,
      scenarioResults,
    };
  }, [
    averageCostBasis,
    btcHoldings,
    btcPrice.price,
    monthlyExpenses,
    withdrawalRate,
  ]);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-bitcoin text-black">
              <Bitcoin className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {t.app.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {t.app.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:min-w-80">
            <LanguageSelector
              activeLanguage={language}
              label={t.app.language}
              onLanguageChange={setLanguage}
            />
            <div className="grid grid-cols-2 gap-3">
              <HeaderMetric
                label={t.app.liveBtcPrice}
                subvalue={formatPriceStatus(
                  btcPrice.status,
                  btcPrice.lastUpdated,
                  t.app,
                  language,
                )}
                tone={btcPrice.status === "live" ? "positive" : "default"}
                value={formatCurrency(btcPrice.price)}
              />
              <HeaderMetric
                label={t.app.currentStack}
                value={formatBtc(btcHoldings)}
              />
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <PortfolioInput
              averageCostBasis={averageCostBasis}
              btcHoldings={btcHoldings}
              t={t.portfolio}
              onAverageCostBasisChange={setAverageCostBasis}
              onBtcHoldingsChange={setBtcHoldings}
            />
            <FireCalculator
              fireResult={model.fireResult}
              t={t.fire}
              onMonthlyExpensesChange={setMonthlyExpenses}
              onWithdrawalRateChange={setWithdrawalRate}
            />
          </div>

          <div className="space-y-5">
            <DashboardMetrics metrics={model.dashboardMetrics} t={t.dashboard} />
            <Ahr999Card ahr999={ahr999} language={language} t={t.ahr999} />
            <ScenarioSimulator scenarios={model.scenarioResults} t={t.scenarios} />
            <AccumulationChart data={MOCK_ACCUMULATION_HISTORY} t={t.chart} />
          </div>
        </section>
      </div>
    </main>
  );
}

type LanguageSelectorProps = {
  activeLanguage: Language;
  label: string;
  onLanguageChange: (language: Language) => void;
};

function LanguageSelector({
  activeLanguage,
  label,
  onLanguageChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <div className="flex rounded-md border border-border bg-surface p-1">
        {languageOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={cn(
              "h-8 rounded px-3 text-sm font-semibold text-muted transition-colors hover:text-foreground",
              activeLanguage === option && "bg-bitcoin text-black hover:text-black",
            )}
            aria-pressed={activeLanguage === option}
            onClick={() => onLanguageChange(option)}
          >
            {translations[option].languageShort}
          </button>
        ))}
      </div>
    </div>
  );
}

type HeaderMetricProps = {
  label: string;
  value: string;
  subvalue?: string;
  tone?: "default" | "positive";
};

function HeaderMetric({ label, value, subvalue, tone = "default" }: HeaderMetricProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-xs uppercase tracking-[0.08em] text-muted">{label}</div>
      <div
        className={cn(
          "mt-1 break-words text-base font-semibold text-foreground",
          tone === "positive" && "text-positive",
        )}
      >
        {value}
      </div>
      {subvalue ? <div className="mt-1 text-xs text-muted">{subvalue}</div> : null}
    </div>
  );
}

type AppTranslation = Translation["app"];

function formatPriceStatus(
  status: BtcPriceStatus,
  lastUpdated: Date | null,
  t: AppTranslation,
  language: Language,
) {
  const statusLabel = {
    connecting: t.connecting,
    live: t.live,
    polling: t.polling,
    offline: t.offline,
  }[status];

  if (!lastUpdated) {
    return statusLabel;
  }

  const locale = language === "en" ? "en-US" : language === "zhTW" ? "zh-TW" : "zh-CN";
  const updatedAt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(lastUpdated);

  return `${statusLabel} · ${t.lastUpdated} ${updatedAt}`;
}
