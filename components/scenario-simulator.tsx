"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatBtc,
  formatCurrency,
  formatPercentage,
  toFixedPrecision,
} from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import { DEFAULT_SCENARIO_PRICES } from "@/lib/mock-data";
import type { BtcScenarioPrices, ScenarioResult } from "@/lib/types";

type ScenarioSimulatorProps = {
  scenarios: ScenarioResult[];
  /** User-editable, persisted scenario prices. */
  prices: BtcScenarioPrices;
  t: Translation["scenarios"];
  onPricesChange: (next: BtcScenarioPrices) => void;
};

const SCENARIO_KEYS: (keyof BtcScenarioPrices)[] = ["bear", "base", "bull"];

const NAME_TO_KEY: Record<ScenarioResult["name"], keyof BtcScenarioPrices> = {
  Bear: "bear",
  Base: "base",
  Bull: "bull",
};

export function ScenarioSimulator({
  scenarios,
  prices,
  t,
  onPricesChange,
}: ScenarioSimulatorProps) {
  const isDefault = SCENARIO_KEYS.every(
    (key) => prices[key] === DEFAULT_SCENARIO_PRICES[key],
  );

  const handlePriceChange = useCallback(
    (key: keyof BtcScenarioPrices, value: number) => {
      onPricesChange({ ...prices, [key]: value });
    },
    [prices, onPricesChange],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-bitcoin" aria-hidden="true" />
            <CardTitle>{t.title}</CardTitle>
          </div>
          {!isDefault ? (
            <button
              type="button"
              onClick={() => onPricesChange({ ...DEFAULT_SCENARIO_PRICES })}
              className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-muted transition-colors hover:border-bitcoin/50 hover:text-foreground"
              title={t.resetPrices}
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">{t.resetPrices}</span>
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.name}
            className="rounded-md border border-border bg-background p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {scenario.name === "Bear" ? (
                    <TrendingDown
                      className="h-4 w-4 text-negative"
                      aria-hidden="true"
                    />
                  ) : (
                    <TrendingUp
                      className="h-4 w-4 text-positive"
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="font-semibold">{getScenarioName(scenario.name, t)}</h3>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {getScenarioDescription(scenario.name, t)}
                </p>
              </div>
              <div className="text-right">
                <ScenarioPriceInput
                  value={scenario.price}
                  label={t.priceLabel}
                  onChange={(value) =>
                    handlePriceChange(NAME_TO_KEY[scenario.name], value)
                  }
                />
                <div
                  className={`mt-1 text-sm font-medium ${
                    scenario.isFireReady ? "text-positive" : "text-muted"
                  }`}
                >
                  {scenario.isFireReady ? t.fireReady : t.notYet}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ScenarioStat
                label={t.projectedValue}
                value={formatCurrency(scenario.projectedPortfolioValue)}
              />
              <ScenarioStat
                label={t.fireProgress}
                value={formatPercentage(scenario.fireProgress)}
              />
              <ScenarioStat
                label={scenario.btcGap > 0 ? t.btcNeeded : t.btcSurplus}
                value={formatBtc(Math.abs(scenario.btcGap))}
              />
            </div>
          </div>
        ))}

        <p className="text-xs leading-5 text-muted">{t.priceHint}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Editable scenario price. Keeps a local text buffer while focused (so partial
 * input like "5" or "50000." is not clobbered) and commits on every valid
 * keystroke, which makes the results update live.
 */
function ScenarioPriceInput({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(() => formatPrice(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setText(formatPrice(value));
    }
  }, [value]);

  return (
    <div className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-2 text-sm text-muted">
        $
      </span>
      <Input
        className="h-9 w-32 pl-6 text-right tabular-nums"
        inputMode="decimal"
        type="text"
        value={text}
        aria-label={label}
        title={label}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
          setText(raw);
          if (raw !== "") {
            const parsed = parseFloat(raw);
            if (!isNaN(parsed) && parsed >= 0) {
              onChange(toFixedPrecision(parsed, 2));
            }
          }
        }}
        onFocus={() => {
          isFocused.current = true;
        }}
        onBlur={() => {
          isFocused.current = false;
          const parsed = parseFloat(text);
          const safe = isNaN(parsed) || parsed < 0 ? value : parsed;
          setText(formatPrice(safe));
          onChange(toFixedPrecision(safe, 2));
        }}
      />
    </div>
  );
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    Number.isFinite(value) ? value : 0,
  );
}

function getScenarioName(
  name: ScenarioResult["name"],
  t: Translation["scenarios"],
) {
  if (name === "Bear") {
    return t.bear;
  }

  if (name === "Bull") {
    return t.bull;
  }

  return t.base;
}

function getScenarioDescription(
  name: ScenarioResult["name"],
  t: Translation["scenarios"],
) {
  if (name === "Bear") {
    return t.bearDescription;
  }

  if (name === "Bull") {
    return t.bullDescription;
  }

  return t.baseDescription;
}

type ScenarioStatProps = {
  label: string;
  value: string;
};

function ScenarioStat({ label, value }: ScenarioStatProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
