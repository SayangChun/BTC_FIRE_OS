"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Activity, Bitcoin, Gauge, GripVertical, Target } from "lucide-react";

import { BtcPriceChart } from "@/components/accumulation-chart";
import { Ahr999Card } from "@/components/ahr999-card";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { DcaFirePlannerCard } from "@/components/dca-fire-planner-card";
import { FireCalculator } from "@/components/fire-calculator";
import { FutureFireCard } from "@/components/future-fire-card";
import { LogoMark } from "@/components/logo-mark";
import { PortfolioInput } from "@/components/portfolio-input";
import { DataSettings } from "@/components/data-settings";
import { ScenarioSimulator } from "@/components/scenario-simulator";
import {
  calculateCostBasis,
  calculateFireTarget,
  calculatePortfolioValue,
  calculateProfitLoss,
  calculateProfitLossPercentage,
  calculateScenarioResults,
  calculateTotalBtc,
  calculateWeightedCostBasis,
  convertCurrency,
  formatBtc,
  formatCurrency,
  formatPercentage,
  toFixedPrecision,
  toSatPrecision,
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
import type { Ahr999Recommendation, BtcUnit, BtcWallet, Currency, DcaPlanInput, FireResult, OtherAssetsInput } from "@/lib/types";

const DEFAULT_WALLETS: BtcWallet[] = [
  {
    id: "default",
    name: "Main",
    btc: 1.2,
    costBasis: 42_000,
  },
];
import { useExchangeRate } from "@/hooks/use-exchange-rate";

// Module identifiers for the single-page reorderable layout.
// Personal/portfolio-related modules first by default.
const MODULE_IDS = ["portfolio", "dashboard", "fire", "dca", "ahr999", "chart", "scenario", "future"] as const;
type ModuleId = (typeof MODULE_IDS)[number];

type ModuleRow =
  | { kind: "single"; id: ModuleId }
  | { kind: "pair"; left: ModuleId; right: ModuleId };

const DEFAULT_ROWS: readonly ModuleRow[] = [
  // 最顶部并排：FIRE计算器（左） + 投资组合输入（右）
  { kind: "pair", left: "fire", right: "portfolio" },
  { kind: "pair", left: "dashboard", right: "ahr999" },
  // 动态定投 FIRE 计划（左） + 场景模拟（右）并排
  { kind: "pair", left: "dca", right: "scenario" },
  // 未来 FIRE 预测 单独一行，放在上面并排模块的下方
  { kind: "single", id: "future" },
  { kind: "single", id: "chart" },
];

function isModuleRow(v: unknown): v is ModuleRow {
  if (!v || typeof v !== "object") return false;
  const r = v as any;
  if (r.kind === "single") {
    return typeof r.id === "string" && (MODULE_IDS as readonly string[]).includes(r.id);
  }
  if (r.kind === "pair") {
    return (
      typeof r.left === "string" &&
      typeof r.right === "string" &&
      (MODULE_IDS as readonly string[]).includes(r.left) &&
      (MODULE_IDS as readonly string[]).includes(r.right)
    );
  }
  return false;
}

function getFlatModules(rows: ModuleRow[]): ModuleId[] {
  const out: ModuleId[] = [];
  for (const r of rows) {
    if (r.kind === "single") out.push(r.id);
    else { out.push(r.left, r.right); }
  }
  return out;
}

export default function Home() {
  const [language, setLanguage] = usePersistentState<Language>(
    "btc-fire-os:language",
    "zhCN",
    (v): v is Language => languageOptions.includes(v as Language),
  );
  const [wallets, setWallets] = usePersistentState<BtcWallet[]>(
    "btc-fire-os:wallets",
    DEFAULT_WALLETS,
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
    monthlyCashflow: 0,
    },
  );
  // Versioned key + auto-migration so existing users immediately see the new layout:
  // Top row = FIRE计算器 (left) + 投资组合输入 (right)
  const [moduleRows, setModuleRows] = usePersistentState<ModuleRow[]>(
    "btc-fire-os:module-rows:v2",
    [...DEFAULT_ROWS],
    (v): v is ModuleRow[] => Array.isArray(v) && v.every(isModuleRow),
  );

  // One-time migration: if saved rows don't start with (fire left + portfolio right), force the new default.
  // Also nuke any data under the very old key.
  useEffect(() => {
    try {
      localStorage.removeItem("btc-fire-os:module-rows");
      localStorage.removeItem("btc-fire-os:module-order");
    } catch {}

    const first = moduleRows[0];
    const isCorrectTop =
      first &&
      first.kind === "pair" &&
      first.left === "fire" &&
      first.right === "portfolio";

    if (!isCorrectTop) {
      // Only update if it actually differs (avoid render loops)
      if (JSON.stringify(moduleRows) !== JSON.stringify(DEFAULT_ROWS)) {
        setModuleRows([...DEFAULT_ROWS]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  // Derived totals from multi-wallet source of truth
  const btcHoldings = calculateTotalBtc(wallets);
  const averageCostBasis = calculateWeightedCostBasis(wallets);

  const setWalletsClean = useCallback((next: BtcWallet[]) => {
    const cleaned = next.map((w) => ({
      ...w,
      btc: toSatPrecision(w.btc),
      costBasis: toFixedPrecision(w.costBasis, 2),
    }));
    setWallets(cleaned);
  }, [setWallets]);

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

  // One-time migration from legacy single-value storage + sanitize floats in wallets.
  // We treat the "btc-fire-os:wallets" array as the single source of truth.
  // Legacy "btc-holdings"/"average-cost-basis" keys (from pre-multi-wallet versions) are cleaned up
  // as soon as a wallets array exists, to prevent old data from ever overwriting current holdings.
  const didInitWalletsRef = useRef(false);
  useEffect(() => {
    if (didInitWalletsRef.current) return;

    try {
      const walletsRaw = localStorage.getItem("btc-fire-os:wallets");
      const hasWalletsEntry = walletsRaw !== null;
      let currentWallets: BtcWallet[] = hasWalletsEntry ? (JSON.parse(walletsRaw) as BtcWallet[]) : [];

      const hasLegacyHoldings = localStorage.getItem("btc-fire-os:btc-holdings") !== null;
      const hasLegacyCost = localStorage.getItem("btc-fire-os:average-cost-basis") !== null;
      const hasLegacy = hasLegacyHoldings || hasLegacyCost;

      // Only migrate from legacy when there is genuinely no wallets array yet.
      // We no longer overwrite an existing wallets entry just because its numbers happen to match the old default (1.2 / 42000).
      // This prevents "我的持仓数据无法保存 / 每次重载都回退到很久之前的数据" when legacy keys contain ancient values.
      if ((!hasWalletsEntry || currentWallets.length === 0) && hasLegacy) {
        const oldBtcRaw = localStorage.getItem("btc-fire-os:btc-holdings");
        const oldCostRaw = localStorage.getItem("btc-fire-os:average-cost-basis");
        const oldBtc = oldBtcRaw ? toSatPrecision(JSON.parse(oldBtcRaw)) : 0;
        const oldCost = oldCostRaw ? toFixedPrecision(JSON.parse(oldCostRaw), 2) : 0;

        if (oldBtc > 0 || oldCost > 0) {
          const migrated: BtcWallet[] = [
            {
              id: "migrated",
              name: "Main",
              btc: oldBtc || 0,
              costBasis: oldCost || 0,
            },
          ];
          setWallets(migrated);
          // Write immediately so the key exists for the cleanup below on this load.
          try {
            localStorage.setItem("btc-fire-os:wallets", JSON.stringify(migrated));
          } catch {}
        }
      } else if (hasWalletsEntry && Array.isArray(currentWallets) && currentWallets.length > 0) {
        // Sanitize any noisy floats in previously saved wallets (one-time)
        const cleaned = currentWallets.map((w) => ({
          ...w,
          btc: toSatPrecision(w.btc),
          costBasis: toFixedPrecision(w.costBasis, 2),
        }));
        if (JSON.stringify(cleaned) !== JSON.stringify(currentWallets)) {
          setWallets(cleaned);
          try {
            localStorage.setItem("btc-fire-os:wallets", JSON.stringify(cleaned));
          } catch {}
        }
      }

      // Now that wallets (array) is the source of truth, nuke the legacy single-value keys.
      // This is the key fix: future loads will never see hasLegacy + try to migrate old numbers over current holdings.
      if (localStorage.getItem("btc-fire-os:wallets") !== null) {
        localStorage.removeItem("btc-fire-os:btc-holdings");
        localStorage.removeItem("btc-fire-os:average-cost-basis");
      }
    } catch {
      // ignore corrupt storage
    }

    didInitWalletsRef.current = true;

    // Scalar sanitization for other fields (compare against the initial render value which is the caller's default;
    // the usePersistentState restore effect has already put the real persisted value into state for these).
    const cleanedMonthly = toFixedPrecision(monthlyExpenses, 2);
    if (cleanedMonthly !== monthlyExpenses) {
      setMonthlyExpenses(cleanedMonthly);
    }
    const cleanedRate = toFixedPrecision(withdrawalRate, 6);
    if (cleanedRate !== withdrawalRate) {
      setWithdrawalRate(cleanedRate);
    }
    const cleanedPlan: DcaPlanInput = {
      lowDailyAmount: toFixedPrecision(dcaPlan.lowDailyAmount, 2),
      normalDailyAmount: toFixedPrecision(dcaPlan.normalDailyAmount, 2),
      highDailyAmount: toFixedPrecision(dcaPlan.highDailyAmount, 2),
    };
    if (
      cleanedPlan.lowDailyAmount !== dcaPlan.lowDailyAmount ||
      cleanedPlan.normalDailyAmount !== dcaPlan.normalDailyAmount ||
      cleanedPlan.highDailyAmount !== dcaPlan.highDailyAmount
    ) {
      setDcaPlan(cleanedPlan);
    }
    const incomingCashflow = typeof (otherAssets as any).monthlyCashflow === "number" ? (otherAssets as any).monthlyCashflow : 0;
    const cleanedOther: OtherAssetsInput = {
      currentAmount: toFixedPrecision(otherAssets.currentAmount, 2),
      annualReturnRate: toFixedPrecision(otherAssets.annualReturnRate, 4),
      monthlyCashflow: toFixedPrecision(incomingCashflow, 2),
    };
    if (
      cleanedOther.currentAmount !== otherAssets.currentAmount ||
      cleanedOther.annualReturnRate !== otherAssets.annualReturnRate ||
      cleanedOther.monthlyCashflow !== incomingCashflow
    ) {
      setOtherAssets(cleanedOther);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        monthlyCashflow: toUsd(
          typeof (otherAssets as any).monthlyCashflow === "number" ? (otherAssets as any).monthlyCashflow : 0,
        ),
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

  const flatModules = useMemo(() => getFlatModules(moduleRows), [moduleRows]);

  const scrollToModule = useCallback((id: ModuleId) => {
    const el = document.getElementById(`module-${id}`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const absoluteTop = window.pageYOffset + rect.top - 80;
      window.scrollTo({ top: absoluteTop, behavior: "smooth" });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
    <main className="min-h-screen px-4 pt-0 pb-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[104rem] gap-6">
        {/* Left sticky navigation — width fits the longest label exactly (additive, no main-content shrink) */}
        <aside className="hidden w-fit shrink-0 lg:block">
          <div className="sticky top-6 flex h-[calc(100vh-2.5rem)] flex-col">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-2 rounded px-1 py-1 text-left transition hover:opacity-80"
              aria-label="返回顶部"
            >
              <LogoMark className="h-8 w-8 shrink-0" />
              <span className="text-lg font-semibold tracking-[0.06em] text-foreground">BTC FIRE OS</span>
            </button>

            {/* Scrollable module list */}
            <div className="mt-3 flex-1 overflow-auto">
              <nav className="space-y-1 text-sm">
                {flatModules.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToModule(id)}
                    className="block w-full whitespace-nowrap rounded py-1 text-left text-muted transition hover:bg-surface hover:text-foreground"
                  >
                    {(() => {
                      switch (id) {
                        case "portfolio": return t.portfolio.title;
                        case "dashboard": return t.dashboard.title;
                        case "fire": return t.fire.title;
                        case "dca": return t.dcaPlanner.title;
                        case "ahr999": return t.ahr999.title;
                        case "chart": return t.chart.title;
                        case "scenario": return t.scenarios.title;
                        case "future": return t.future.title;
                        default: return id;
                      }
                    })()}
                  </button>
                ))}
              </nav>
            </div>

            {/* Bottom controls — width matches sidebar (longest title above), height only slightly taller than text */}
            <div className="mt-auto space-y-1 border-t border-border pt-2 pb-0.5">
              <LanguageSelector
                activeLanguage={language}
                label={t.app.language}
                onLanguageChange={setLanguage}
                compact
              />
              <CurrencySelector
                activeCurrency={currency}
                label={t.app.currency}
                onCurrencyChange={setCurrency}
                compact
              />
              <DataSettings t={t.settings} language={language} label={t.app.settings} />
            </div>
          </div>
        </aside>

        {/* Main content area — keeps the EXACT same max-width as before (max-w-7xl), nav is extra */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-7xl space-y-4 pt-6">
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

            {/* Single-page module layout with rows.
            - "pair" rows: two small modules side-by-side (left/right swap allowed).
            - Up/down moves the entire row (pair stays together).
            - Personal data prioritized by default. */}
            <ModuleList
              rows={moduleRows}
              onRowsChange={setModuleRows}
              headerLabel={t.modules?.header ?? "全部模块（从上到下）"}
              resetLabel={t.modules?.reset ?? "重置顺序"}
              renderModule={(id) => {
            const content = (() => {
              switch (id) {
                case "portfolio":
                  return (
                    <PortfolioInput
                      wallets={wallets}
                      btcUnit={btcUnit}
                      t={t.portfolio}
                      onWalletsChange={setWalletsClean}
                      onBtcUnitChange={setBtcUnit}
                    />
                  );
                case "dashboard":
                  return <DashboardMetrics metrics={model.dashboardMetrics} t={t.dashboard} />;
                case "fire":
                  return (
                    <FireCalculator
                      key={currency}
                      currency={currency}
                      fireResult={{
                        ...model.fireResult,
                        monthlyExpenses,
                      }}
                      t={t.fire}
                      onMonthlyExpensesChange={(value) => setMonthlyExpenses(toFixedPrecision(value, 2))}
                      onWithdrawalRateChange={setWithdrawalRate}
                    />
                  );
                case "dca":
                  return (
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
                  );
                case "ahr999":
                  return (
                    <Ahr999Card ahr999={ahr999} frequency={ahr999Frequency} language={language} t={t.ahr999} />
                  );
                case "chart":
                  return (
                    <BtcPriceChart
                      data={btcPriceHistory.data}
                      loading={btcPriceHistory.loading}
                      error={btcPriceHistory.error}
                      language={language}
                      t={t.chart}
                    />
                  );
                case "scenario":
                  return <ScenarioSimulator scenarios={model.scenarioResults} t={t.scenarios} />;
                case "future":
                  return (
                    <FutureFireCard
                      currentRequiredBtc={model.fireResult.requiredBtc}
                      firstFireYear={model.firstFireYear}
                      points={model.futureFireProjection}
                      t={t.future}
                    />
                  );
                default:
                  return null;
              }
            })();
            return (
              <div id={`module-${id}`}>
                {content}
              </div>
            );
          }}
          getModuleLabel={(id) => {
            switch (id) {
              case "portfolio":
                return t.portfolio.title;
              case "dashboard":
                return t.dashboard.title;
              case "fire":
                return t.fire.title;
              case "dca":
                return t.dcaPlanner.title;
              case "ahr999":
                return t.ahr999.title;
              case "chart":
                return t.chart.title;
              case "scenario":
                return t.scenarios.title;
              case "future":
                return t.future.title;
              default:
                return id;
            }
           }}
         />
          </div>
        </div>
      </div>
    </main>
    <footer className="border-t border-border py-6 text-center text-sm text-muted">
        <span className="italic">{t.quote}</span>
        <span className="mx-2">·</span>
        <span>Author: </span>
        <a
          href="https://x.com/SayangChun"
          target="_blank"
          rel="noopener noreferrer"
          className="text-bitcoin transition-colors hover:text-foreground"
        >
          @SayangChun
        </a>
      </footer>
    </>
  );
}

type LanguageSelectorProps = {
  activeLanguage: Language;
  label: string;
  onLanguageChange: (language: Language) => void;
  compact?: boolean;
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
  compact,
}: LanguageSelectorProps) {
  return (
    <div className={cn("flex w-full items-center", compact && "gap-0")}>
      {!compact && (
        <span className="text-xs uppercase tracking-[0.08em] text-muted">
          {label}
        </span>
      )}
      <div className="flex w-full rounded-md border border-border bg-surface p-px">
        {languageOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={cn(
              "flex-1 rounded px-1.5 py-px text-xs font-semibold text-muted transition-colors hover:text-foreground",
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
  compact?: boolean;
};

function CurrencySelector({
  activeCurrency,
  label,
  onCurrencyChange,
  compact,
}: CurrencySelectorProps & { compact?: boolean }) {
  const currencies: Currency[] = ["USD", "CNY"];

  return (
    <div className={cn("flex w-full items-center", compact && "gap-0")}>
      {!compact && (
        <span className="text-xs uppercase tracking-[0.08em] text-muted">
          {label}
        </span>
      )}
      <div className="flex w-full rounded-md border border-border bg-surface p-px">
        {currencies.map((option) => (
          <button
            key={option}
            type="button"
            className={cn(
              "flex-1 rounded px-1.5 py-px text-xs font-semibold text-muted transition-colors hover:text-foreground",
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

// ------------------------------
// Reorderable single-page modules (rows)
// ------------------------------

type ModuleListProps = {
  rows: ModuleRow[];
  onRowsChange: (next: ModuleRow[]) => void;
  renderModule: (id: ModuleId) => ReactNode;
  getModuleLabel: (id: ModuleId) => string;
  headerLabel: string;
  resetLabel: string;
};

function ModuleList({ rows, onRowsChange, renderModule, getModuleLabel, headerLabel, resetLabel }: ModuleListProps) {
  const moveRow = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= rows.length || from === to) return;
      const next = [...rows];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onRowsChange(next);
    },
    [rows, onRowsChange],
  );

  const swapPair = useCallback(
    (rowIndex: number) => {
      const r = rows[rowIndex];
      if (!r || r.kind !== "pair") return;
      const next = [...rows];
      next[rowIndex] = { kind: "pair", left: r.right, right: r.left };
      onRowsChange(next);
    },
    [rows, onRowsChange],
  );

  const reset = useCallback(() => {
    onRowsChange([...DEFAULT_ROWS]);
  }, [onRowsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.08em] text-muted">
        <span>{headerLabel}</span>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-border px-2 py-1 text-[10px] hover:text-foreground"
        >
          {resetLabel}
        </button>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => {
          if (row.kind === "single") {
            return (
              <div key={`row-${index}-${row.id}`} className="group/row relative rounded-md border border-border bg-surface">
                <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-medium text-foreground">{getModuleLabel(row.id)}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => moveRow(index, index - 1)}
                      disabled={index === 0}
                      className="rounded border border-border px-1.5 py-0.5 disabled:opacity-40"
                      aria-label="上移"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(index, index + 1)}
                      disabled={index === rows.length - 1}
                      className="rounded border border-border px-1.5 py-0.5 disabled:opacity-40"
                      aria-label="下移"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className="p-4">{renderModule(row.id)}</div>
              </div>
            );
          }

          // pair row
          return (
            <div key={`row-${index}-${row.left}-${row.right}`} className="group relative rounded-md border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-medium text-foreground">
                    {getModuleLabel(row.left)} + {getModuleLabel(row.right)}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => swapPair(index)}
                    className="rounded border border-border px-1.5 py-0.5"
                    aria-label="左右交换"
                    title="左右交换"
                  >
                    ↔
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(index, index - 1)}
                    disabled={index === 0}
                    className="rounded border border-border px-1.5 py-0.5 disabled:opacity-40"
                    aria-label="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(index, index + 1)}
                    disabled={index === rows.length - 1}
                    className="rounded border border-border px-1.5 py-0.5 disabled:opacity-40"
                    aria-label="下移"
                  >
                    ↓
                  </button>
                </div>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div className="min-w-0">{renderModule(row.left)}</div>
                <div className="min-w-0">{renderModule(row.right)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
