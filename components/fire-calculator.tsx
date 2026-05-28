"use client";

import { useState } from "react";
import { Flame } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  currencySymbol,
  formatBtc,
  formatCurrency,
  formatPercentage,
} from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type { Currency, FireResult } from "@/lib/types";

type FireCalculatorProps = {
  currency?: Currency;
  fireResult: FireResult;
  t: Translation["fire"];
  onMonthlyExpensesChange: (value: number) => void;
  onWithdrawalRateChange: (value: number) => void;
};

export function FireCalculator({
  currency = "USD",
  fireResult,
  t,
  onMonthlyExpensesChange,
  onWithdrawalRateChange,
}: FireCalculatorProps) {
  const [expenseText, setExpenseText] = useState(() => String(fireResult.monthlyExpenses));

  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
    setExpenseText(raw);
    if (raw !== "") {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed >= 0) {
        onMonthlyExpensesChange(parsed);
      }
    }
  };

  const handleExpenseBlur = () => {
    const parsed = parseFloat(expenseText);
    if (isNaN(parsed) || parsed < 0) {
      setExpenseText(fireResult.monthlyExpenses.toFixed(2));
    } else {
      setExpenseText(parsed.toFixed(2));
    }
  };

  const progress = Math.min(fireResult.fireProgress * 100, 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="monthly-expenses">{t.monthlyExpenses}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted">
                {currencySymbol(currency)}
              </span>
              <Input
                id="monthly-expenses"
                className="pl-7"
                inputMode="decimal"
                type="text"
                value={expenseText}
                onChange={handleExpenseChange}
                onBlur={handleExpenseBlur}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal-rate">{t.withdrawalRate}</Label>
            <Input
              id="withdrawal-rate"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.1"
              type="number"
              value={Number((fireResult.withdrawalRate * 100).toFixed(2))}
              onChange={(event) =>
                onWithdrawalRateChange(Number(event.target.value) / 100)
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{t.fireProgress}</span>
            <span className="font-semibold">
              {formatPercentage(fireResult.fireProgress)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-bitcoin"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FireStat
            label={t.annualExpenses}
            value={formatCurrency(fireResult.annualExpenses)}
          />
          <FireStat
            label={t.requiredPortfolio}
            value={formatCurrency(fireResult.requiredPortfolioValue)}
          />
          <FireStat label={t.requiredBtc} value={formatBtc(fireResult.requiredBtc)} />
          <FireStat
            label={t.withdrawalRate}
            value={formatPercentage(fireResult.withdrawalRate)}
          />
          <FireStat
            label={t.status}
            tone={fireResult.isFireReady ? "positive" : "default"}
            value={fireResult.isFireReady ? t.ready : t.stacking}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type FireStatProps = {
  label: string;
  value: string;
  tone?: "default" | "positive";
};

function FireStat({ label, value, tone = "default" }: FireStatProps) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="text-xs uppercase tracking-[0.08em] text-muted">{label}</div>
      <div
        className={`mt-2 break-words text-lg font-semibold ${
          tone === "positive" ? "text-positive" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
