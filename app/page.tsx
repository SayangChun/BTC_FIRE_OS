"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { Activity, Bitcoin, Gauge, Globe, Target, User } from "lucide-react";

import { BtcPriceChart } from "@/components/accumulation-chart";
import { Ahr999Card } from "@/components/ahr999-card";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { DcaFirePlannerCard } from "@/components/dca-fire-planner-card";
import { FireCalculator } from "@/components/fire-calculator";
import { FutureFireCard } from "@/components/future-fire-card";
import { LogoMark } from "@/components/logo-mark";
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
  formatPercentage,
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
import type { Ahr999Recommendation, BtcUnit, Currency, DcaPlanInput, FireResult, OtherAssetsInput } from "@/lib/types";
import { useExchangeRate } from "@/hooks/use-exchange-rate";

export default function Home() {
  const [language, setLanguage] = usePersistentState<Language>(
    "btc-fire-os:language",
    "zhCN",
    (v): v is Language => languageOptions.includes(v as Language),
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
    (v): v is string => v === "my" || v === "general",
  );
  const [currency, setCurrency] = usePersistentState<Currency>(
    "btc-fire-os:currency",
    "USD",
    (v): v is Currency => v === "USD" || v === "CNY",
  );
  const [btcUnit, setBtcUnit] = usePersistentState<BtcUnit>(
    "btc-fire-os:btc-unit",
    "BTC",
    (v): v is BtcUnit => ["BTC", "mBTC", "bits", "sat"].includes(v as string),
  );
  const { rate: cnyRate } = useExchangeRate();
  const btcPrice = useBtcPrice();
  const ahr999 = useAhr999(btcPrice.price);
  const ahr999Frequency = useAhr999Frequency();
  const btcPriceHistory = useBtcPriceHistory();
  const t = translations[language];

  const toUsd = useCallback(
    (value: number) => (currency === "CNY" ? value / cnyRate : value),
    [currency, cnyRate],
  );

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
      toUsd(monthlyExpenses),
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
      otherAssets: {
        ...otherAssets,
        currentAmount: toUsd(otherAssets.currentAmount),
      },
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
      btcGap: Math.max(fireResult.requiredBtc - btcHoldings, 0),
    };
  }, [
    averageCostBasis,
    ahr999Frequency,
    btcHoldings,
    btcPrice.price,
    dcaPlan,
    monthlyExpenses,
    otherAssets,
    toUsd,
    withdrawalRate,
  ]);

  return (
    <>
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <LogoMark className="h-12 w-12 shrink-0" />
              <div className="h-px min-w-12 flex-1 bg-gradient-to-r from-bitcoin/80 to-transparent" />
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {t.app.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {t.app.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3 lg:min-w-[37rem]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-h-12 flex-1" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-4">
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
              </div>
            </div>
          </div>
        </header>

        <FireCommandSummary
          ahr999Label={
            ahr999.status === "ready"
              ? ahr999.value.toFixed(4)
              : t.ahr999.loading
          }
          ahr999Suggestion={
            ahr999.status === "ready"
              ? getAhr999Suggestion(ahr999.recommendation, t.ahr999)
              : undefined
          }
          btcGap={model.btcGap}
          btcHoldings={btcHoldings}
          btcPrice={btcPrice.price}
          btcPriceStatus={formatPriceStatus(
            btcPrice.status,
            btcPrice.lastUpdated,
            t.app,
            language,
          )}
          btcUnit={btcUnit}
          fireResult={model.fireResult}
          t={t.summary}
        />

        <div className="space-y-5">
          <NavSidebar activeTab={activeTab} onTabChange={setActiveTab} t={t.nav} />

          {activeTab === "my" ? (
            <section className="flex-1 space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <PortfolioInput
                  averageCostBasis={averageCostBasis}
                  btcHoldings={btcHoldings}
                  btcUnit={btcUnit}
                  t={t.portfolio}
                  onAverageCostBasisChange={setAverageCostBasis}
                  onBtcHoldingsChange={setBtcHoldings}
                  onBtcUnitChange={setBtcUnit}
                />
                <DashboardMetrics metrics={model.dashboardMetrics} t={t.dashboard} />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <FireCalculator
                  key={currency}
                  currency={currency}
                  fireResult={{
                    ...model.fireResult,
                    monthlyExpenses,
                  }}
                  t={t.fire}
                  onMonthlyExpensesChange={(value) => setMonthlyExpenses(Math.round(value * 100) / 100)}
                  onWithdrawalRateChange={setWithdrawalRate}
                />
                <DcaFirePlannerCard
                  currency={currency}
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
                  <Ahr999Card ahr999={ahr999} frequency={ahr999Frequency} language={language} t={t.ahr999} />
                  <BtcPriceChart data={btcPriceHistory.data} loading={btcPriceHistory.loading} error={btcPriceHistory.error} language={language} t={t.chart} />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        <span className="italic">{t.quote}</span>
        <span className="mx-2">·</span>
        <span>Author: </span>
        <a
          href="https://x.com/Z3n7th"
          target="_blank"
          rel="noopener noreferrer"
          className="text-bitcoin transition-colors hover:text-foreground"
        >
          @Z3n7th
        </a>
      </footer>
    </>
  );
}

type LanguageSelectorProps = {
  activeLanguage: Language;
  label: string;
  onLanguageChange: (language: Language) => void;
};

type FireCommandSummaryProps = {
  ahr999Label: string;
  ahr999Suggestion?: string;
  btcGap: number;
  btcHoldings: number;
  btcPrice: number;
  btcPriceStatus: string;
  btcUnit: BtcUnit;
  fireResult: FireResult;
  t: Translation["summary"];
};

function FireCommandSummary({
  ahr999Label,
  ahr999Suggestion,
  btcGap,
  btcHoldings,
  btcPrice,
  btcPriceStatus,
  btcUnit,
  fireResult,
  t,
}: FireCommandSummaryProps) {
  const progress = Math.min(fireResult.fireProgress * 100, 100);
  const isReady = fireResult.isFireReady;

  return (
    <section className="rounded-md border border-border bg-surface p-4 shadow-soft sm:p-5">
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-stretch">
        <div className="flex min-h-72 flex-col justify-between rounded-md border border-border bg-background p-5">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded bg-bitcoin px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-black">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              {isReady ? t.readyStatus : t.stackingStatus}
            </div>
            <div className="text-sm uppercase tracking-[0.08em] text-muted">
              {t.primaryLabel}
            </div>
            <div className="mt-2 text-5xl font-semibold leading-none text-foreground sm:text-6xl">
              {formatPercentage(fireResult.fireProgress)}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-bitcoin"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryStat
              label={t.currentStack}
              value={formatBtc(btcHoldings, btcUnit)}
              subvalue={formatCurrency(btcHoldings * btcPrice, 2)}
            />
            <SummaryStat
              label={t.requiredBtc}
              value={formatBtc(fireResult.requiredBtc)}
              subvalue={formatCurrency(fireResult.requiredPortfolioValue)}
            />
            <SummaryStat
              label={t.btcGap}
              tone={btcGap > 0 ? "default" : "positive"}
              value={formatBtc(btcGap)}
              subvalue={btcGap > 0 ? formatCurrency(btcGap * btcPrice) : t.noGap}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <SignalCard
            icon={<Bitcoin className="h-4 w-4" aria-hidden="true" />}
            label={t.livePrice}
            subvalue={btcPriceStatus}
            tone="positive"
            value={formatCurrency(btcPrice, 2)}
          />
          <SignalCard
            icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
            label={t.ahr999}
            subvalue={ahr999Suggestion}
            value={ahr999Label}
          />
          <SignalCard
            icon={<Activity className="h-4 w-4" aria-hidden="true" />}
            label={t.fireTarget}
            subvalue={formatBtc(fireResult.requiredBtc)}
            value={formatCurrency(fireResult.requiredPortfolioValue)}
          />
        </div>
      </div>
    </section>
  );
}

type SummaryStatProps = {
  label: string;
  value: string;
  subvalue?: string;
  tone?: "default" | "positive";
};

function SummaryStat({ label, value, subvalue, tone = "default" }: SummaryStatProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-[0.08em] text-muted">{label}</div>
      <div
        className={cn(
          "mt-2 break-words text-lg font-semibold text-foreground",
          tone === "positive" && "text-positive",
        )}
      >
        {value}
      </div>
      {subvalue ? <div className="mt-1 text-xs text-muted">{subvalue}</div> : null}
    </div>
  );
}

type SignalCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  subvalue?: string;
  tone?: "default" | "positive";
};

function SignalCard({ icon, label, value, subvalue, tone = "default" }: SignalCardProps) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-muted">
        <span className={tone === "positive" ? "text-positive" : "text-bitcoin"}>
          {icon}
        </span>
        {label}
      </div>
      <div className="break-words text-xl font-semibold text-foreground">{value}</div>
      {subvalue ? <div className="mt-1 text-xs text-muted">{subvalue}</div> : null}
    </div>
  );
}

function LanguageSelector({
  activeLanguage,
  label,
  onLanguageChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
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
    <div className="flex items-center gap-2">
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

function getAhr999Suggestion(
  recommendation: Ahr999Recommendation,
  t: Translation["ahr999"],
) {
  if (recommendation === "increase") return t.increase;
  if (recommendation === "stop") return t.stop;
  return t.normal;
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

  return `${statusLabel} ${updatedAt}`;
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
    <nav className="flex">
      <div className="flex w-full flex-row gap-1 rounded-md border border-border bg-surface p-1.5 sm:w-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground sm:flex-none",
              activeTab === tab.id && "bg-bitcoin text-black hover:text-black",
            )}
            aria-pressed={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
