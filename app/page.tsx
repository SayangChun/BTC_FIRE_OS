"use client";

import { useMemo } from "react";
import { Bitcoin, User, Globe } from "lucide-react";

import { BtcPriceChart } from "@/components/accumulation-chart";
import { Ahr999Card } from "@/components/ahr999-card";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { DcaFirePlannerCard } from "@/components/dca-fire-planner-card";
import { FireCalculator } from "@/components/fire-calculator";
import { FutureFireCard } from "@/components/future-fire-card";
import { PortfolioInput } from "@/components/portfolio-input";
import { ScenarioSimulator } from "@/components/scenario-simulator";
import {
  calculateCostBasis,
  calculateFireTarget,
  calculatePortfolioValue,
  calculateProfitLoss,
  calculateProfitLossPercentage,
  calculateScenarioResults,
  convertCurrency,
  formatBtc,
  formatCurrency,
} from "@/lib/calculations";
import { projectDcaFire } from "@/lib/dca-fire";
import {
  buildPriceProjection,
  findFirstFireYear,
} from "@/lib/price-projection";
import { BTC_PRICE_SCENARIOS } from "@/lib/mock-data";
import {
  languageOptions,
  translations,
  type Language,
  type Translation,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBtcPrice, type BtcPriceStatus } from "@/hooks/use-btc-price";
import { useAhr999 } from "@/hooks/use-ahr999";
import { useAhr999Frequency } from "@/hooks/use-ahr999-frequency";
import { useBtcPriceHistory } from "@/hooks/use-btc-price-history";
import { usePersistentState } from "@/hooks/use-persistent-state";
import type { Currency, DcaPlanInput, OtherAssetsInput } from "@/lib/types";
import { useExchangeRate } from "@/hooks/use-exchange-rate";

export default function Home() {
  const [language, setLanguage] = usePersistentState<Language>(
    "btc-fire-os:language",
    "zhCN",
  );
  const [btcHoldings, setBtcHoldings] = usePersistentState(
    "btc-fire-os:btc-holdings",
    1.2,
  );
  const [averageCostBasis, setAverageCostBasis] = usePersistentState(
    "btc-fire-os:average-cost-basis",
    42_000,
  );
  const [monthlyExpenses, setMonthlyExpenses] = usePersistentState(
    "btc-fire-os:monthly-expenses",
    4_500,
  );
  const [withdrawalRate, setWithdrawalRate] = usePersistentState(
    "btc-fire-os:withdrawal-rate",
    0.04,
  );
  const [dcaPlan, setDcaPlan] = usePersistentState<DcaPlanInput>(
    "btc-fire-os:dca-plan",
    {
    lowDailyAmount: 100,
    normalDailyAmount: 30,
    highDailyAmount: 0,
    },
  );
  const [otherAssets, setOtherAssets] = usePersistentState<OtherAssetsInput>(
    "btc-fire-os:other-assets",
    {
    currentAmount: 0,
    annualReturnRate: 0.04,
    },
  );
  const [activeTab, setActiveTab] = usePersistentState<string>(
    "btc-fire-os:active-tab",
    "my",
  );
  const [currency, setCurrency] = usePersistentState<Currency>(
    "btc-fire-os:currency",
    "USD",
  );
  const { rate: cnyRate } = useExchangeRate();
  const btcPrice = useBtcPrice();
  const ahr999 = useAhr999(btcPrice.price);
  const ahr999Frequency = useAhr999Frequency();
  const btcPriceHistory = useBtcPriceHistory();
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
    const futureFireProjection = buildPriceProjection({
      btcHoldings,
      currentPrice: btcPrice.price,
      requiredPortfolioValue: fireResult.requiredPortfolioValue,
      dcaPlan,
      ahr999Frequency,
    });
    const dcaFireProjection = projectDcaFire({
      btcHoldings,
      currentBtcPrice: btcPrice.price,
      requiredPortfolioValue: fireResult.requiredPortfolioValue,
      plan: dcaPlan,
      frequency: ahr999Frequency,
      otherAssets,
    });

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
      futureFireProjection,
      firstFireYear: findFirstFireYear(futureFireProjection),
      dcaFireProjection,
    };
  }, [
    averageCostBasis,
    ahr999Frequency,
    btcHoldings,
    btcPrice.price,
    dcaPlan,
    monthlyExpenses,
    otherAssets,
    withdrawalRate,
  ]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[1fr_25rem] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-bitcoin text-black">
              <Bitcoin className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {t.app.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {t.app.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LanguageSelector
              activeLanguage={language}
              label={t.app.language}
              onLanguageChange={setLanguage}
            />
            <CurrencySelector
              activeCurrency={currency}
              label={t.app.currency}
              onCurrencyChange={setCurrency}
            />
            <HeaderMetric
              label={t.app.liveBtcPrice}
              subvalue={formatPriceStatus(
                btcPrice.status,
                btcPrice.lastUpdated,
                t.app,
                language,
              )}
              tone={btcPrice.status === "live" ? "positive" : "default"}
              value={formatCurrency(btcPrice.price, 2)}
            />
            <HeaderMetric
              label={t.app.currentStack}
              value={formatBtc(btcHoldings)}
            />
          </div>
        </header>

        <div className="flex flex-col gap-5 md:flex-row">
          <NavSidebar activeTab={activeTab} onTabChange={setActiveTab} t={t.nav} />

          {activeTab === "my" ? (
            <section className="flex-1 space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <PortfolioInput
                  averageCostBasis={averageCostBasis}
                  btcHoldings={btcHoldings}
                  t={t.portfolio}
                  onAverageCostBasisChange={setAverageCostBasis}
                  onBtcHoldingsChange={setBtcHoldings}
                />
                <DashboardMetrics metrics={model.dashboardMetrics} t={t.dashboard} />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <FireCalculator
                  currency={currency}
                  fireResult={{
                    ...model.fireResult,
                    monthlyExpenses: convertCurrency(model.fireResult.monthlyExpenses, currency, cnyRate),
                  }}
                  t={t.fire}
                  onMonthlyExpensesChange={(value) => setMonthlyExpenses(currency === "CNY" ? value / cnyRate : value)}
                  onWithdrawalRateChange={setWithdrawalRate}
                />
                <DcaFirePlannerCard
                  currency={currency}
                  cnyRate={cnyRate}
                  frequency={ahr999Frequency}
                  language={language}
                  otherAssets={otherAssets}
                  plan={dcaPlan}
                  projection={model.dcaFireProjection}
                  t={t.dcaPlanner}
                  onOtherAssetsChange={setOtherAssets}
                  onPlanChange={setDcaPlan}
                />
              </div>
              <FutureFireCard
                currency={currency}
                cnyRate={cnyRate}
                currentRequiredBtc={model.fireResult.requiredBtc}
                firstFireYear={model.firstFireYear}
                points={model.futureFireProjection}
                t={t.future}
              />
            </section>
          ) : (
            <section className="flex-1 space-y-5">
              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5">
                  <ScenarioSimulator scenarios={model.scenarioResults} t={t.scenarios} />
                </div>

                <div className="space-y-5">
                  <Ahr999Card ahr999={ahr999} language={language} t={t.ahr999} />
                  <BtcPriceChart data={btcPriceHistory.data} loading={btcPriceHistory.loading} error={btcPriceHistory.error} language={language} t={t.chart} />
                </div>
              </div>
            </section>
          )}
        </div>
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
    <div className="flex items-center justify-between gap-1.5">
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

type CurrencySelectorProps = {
  activeCurrency: Currency;
  label: string;
  onCurrencyChange: (currency: Currency) => void;
};

function CurrencySelector({
  activeCurrency,
  label,
  onCurrencyChange,
}: CurrencySelectorProps) {
  const currencies: Currency[] = ["USD", "CNY"];

  return (
    <div className="flex items-center justify-between gap-1.5">
      <span className="text-xs uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <div className="flex rounded-md border border-border bg-surface p-1">
        {currencies.map((option) => (
          <button
            key={option}
            type="button"
            className={cn(
              "h-8 rounded px-3 text-sm font-semibold text-muted transition-colors hover:text-foreground",
              activeCurrency === option && "bg-bitcoin text-black hover:text-black",
            )}
            aria-pressed={activeCurrency === option}
            onClick={() => onCurrencyChange(option)}
          >
            {option}
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

type NavSidebarProps = {
  activeTab: string;
  onTabChange: (tab: "my" | "general") => void;
  t: { my: string; general: string };
};

function NavSidebar({ activeTab, onTabChange, t }: NavSidebarProps) {
  const tabs = [
    { id: "my" as const, label: t.my, icon: User },
    { id: "general" as const, label: t.general, icon: Globe },
  ];

  return (
    <nav className="flex shrink-0 flex-row gap-1 md:w-28 md:flex-col">
      <div className="flex w-full flex-row gap-1 rounded-lg border border-border bg-surface p-1.5 md:flex-col md:p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground md:flex-none md:justify-start",
              activeTab === tab.id && "bg-bitcoin text-black hover:text-black",
            )}
            aria-pressed={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
