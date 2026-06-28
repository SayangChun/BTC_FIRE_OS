"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  currencySymbol,
  formatBtc,
  formatCurrency,
  formatInputNumber,
  formatPercentage,
  toFixedPrecision,
} from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type {
  Currency,
  DcaFireProjection,
  DcaPlanInput,
  OtherAssetsInput,
} from "@/lib/types";

type DcaFirePlannerCardProps = {
  currency?: Currency;
  plan: DcaPlanInput;
  otherAssets: OtherAssetsInput;
  projection: DcaFireProjection;
  language: "zhCN" | "zhTW" | "en";
  t: Translation["dcaPlanner"];
  onPlanChange: (plan: DcaPlanInput) => void;
  onOtherAssetsChange: (otherAssets: OtherAssetsInput) => void;
};

export function DcaFirePlannerCard({
  currency = "USD",
  plan,
  otherAssets,
  projection,
  language,
  t,
  onPlanChange,
  onOtherAssetsChange,
}: DcaFirePlannerCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted">{t.description}</p>

        <div className="max-w-sm">
          <DcaInput
            id="daily-dca"
            label={t.dailyAmount}
            value={plan.dailyAmount}
            onChange={(value) => onPlanChange({ dailyAmount: value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DcaInput
            currency={currency}
            id="other-assets"
            label={t.otherAssets}
            value={otherAssets.currentAmount}
            onChange={(value) =>
              onOtherAssetsChange({
                ...otherAssets,
                currentAmount: Math.round(value * 100) / 100,
              })
            }
          />
          <DcaInput
            currency={currency}
            id="other-assets-cashflow"
            label={t.monthlyCashflow}
            value={otherAssets.monthlyCashflow ?? 0}
            onChange={(value) =>
              onOtherAssetsChange({
                ...otherAssets,
                monthlyCashflow: Math.round(value * 100) / 100,
              })
            }
          />
          <ReturnRateInput
            label={t.otherAssetsReturn}
            value={otherAssets.annualReturnRate}
            onChange={(rate) => onOtherAssetsChange({ ...otherAssets, annualReturnRate: rate })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PlanMetric
            label={t.combinedValue}
            value={formatCurrency(projection.currentCombinedValue)}
          />
          <PlanMetric
            label={t.combinedFireProgress}
            value={formatPercentage(projection.currentCombinedFireProgress)}
          />
          <PlanMetric
            label={t.expectedDaily}
            value={formatCurrency(projection.expectedDailyDca)}
          />
          <PlanMetric
            label={t.expectedMonthly}
            value={formatCurrency(projection.expectedMonthlyDca)}
          />
          <PlanMetric
            label={t.fireGap}
            value={formatCurrency(projection.currentFireGapValue)}
          />
          <PlanMetric
            label={t.fireGapBtc}
            value={formatBtc(projection.currentFireGapBtc)}
          />
        </div>

        <div className="rounded-md border border-border bg-background p-4">
          <div className="text-xs uppercase tracking-[0.08em] text-muted">
            {t.estimatedFireTime}
          </div>
          <div className="mt-2 text-2xl font-semibold text-foreground">
            {projection.projectedFireYears
              ? formatFireTime(projection.projectedFireYears, t.years, t.months)
              : t.notReached}
          </div>
           <p className="mt-2 text-sm leading-6 text-muted">
             {projection.projectedFireDate
               ? `${t.estimatedDate} ${formatDate(
                   projection.projectedFireDate,
                   language,
                 )}`
               : t.notReachedDetail}
           </p>
             {!projection.projectedFireYears && (
               <div className="mt-3">
                 <div className="mb-1.5 text-xs uppercase tracking-[0.08em] text-muted">快速尝试</div>
                 <div className="flex flex-wrap gap-2">
                   <button
                     type="button"
                     className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-surface"
                     onClick={() =>
                       onPlanChange({
                         dailyAmount: Math.round((plan.dailyAmount + 50) * 100) / 100,
                       })
                     }
                   >
                     定投 +50
                   </button>
                 </div>
               </div>
             )}
           {projection.projectedFireDate ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <SmallStat
                label={t.btcAtFire}
                value={
                  projection.projectedBtcAtFire
                    ? formatBtc(projection.projectedBtcAtFire)
                    : "--"
                }
              />
              <SmallStat
                label={t.otherAssetsAtFire}
                value={
                  projection.projectedOtherAssetsAtFire
                    ? formatCurrency(projection.projectedOtherAssetsAtFire)
                    : "--"
                }
              />
              <SmallStat
                label={t.totalAtFire}
                value={
                  projection.projectedValueAtFire
                    ? formatCurrency(projection.projectedValueAtFire)
                    : "--"
                }
              />
            </div>
          ) : null}

        </div>
      </CardContent>
    </Card>
  );
}

type DcaInputProps = {
  currency?: Currency;
  id: string;
  label: string;
  value: number;
  step?: string;
  onChange: (value: number) => void;
};

function DcaInput({ currency = "USD", id, label, value, onChange }: DcaInputProps) {
  const [text, setText] = useState(() => formatInputNumber(value, 2));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setText(formatInputNumber(value, 2));
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted">
          {currencySymbol(currency)}
        </span>
        <Input
          id={id}
          className="pl-7"
          inputMode="decimal"
          type="text"
          value={text}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
            setText(raw);
            if (raw !== "") {
              const parsed = parseFloat(raw);
              if (!isNaN(parsed) && parsed >= 0) {
                onChange(parsed);
              }
            }
          }}
          onFocus={() => { isFocused.current = true; }}
          onBlur={() => {
            isFocused.current = false;
            const parsed = parseFloat(text);
            const safe = isNaN(parsed) || parsed < 0 ? value : parsed;
            const cleanValue = toFixedPrecision(safe, 2);
            setText(formatInputNumber(cleanValue, 2));
            onChange(cleanValue);
          }}
        />
      </div>
    </div>
  );
}

function ReturnRateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (rate: number) => void;
}) {
  const displayValue = toFixedPrecision(value * 100, 1);
  const [text, setText] = useState(() => formatInputNumber(displayValue, 1));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setText(formatInputNumber(displayValue, 1));
    }
  }, [displayValue]);

  return (
    <div className="space-y-2">
      <Label htmlFor="other-assets-return">{label}</Label>
      <Input
        id="other-assets-return"
        inputMode="decimal"
        type="text"
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
          setText(raw);
          if (raw !== "") {
            const parsed = parseFloat(raw);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
              onChange(parsed / 100);
            }
          }
        }}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => {
          isFocused.current = false;
          const parsed = parseFloat(text);
          const safe = isNaN(parsed) || parsed < 0 || parsed > 100 ? displayValue : parsed;
          const cleanValue = toFixedPrecision(safe, 1);
          setText(formatInputNumber(cleanValue, 1));
          onChange(cleanValue / 100);
        }}
      />
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="text-xs uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-2 break-words text-lg font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

function formatFireTime(years: number, yearLabel: string, monthLabel: string) {
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  if (m === 12) { return `${y + 1}${yearLabel}`; }
  return m > 0 ? `${y}${yearLabel}${m}${monthLabel}` : `${y}${yearLabel}`;
}

function formatDate(date: Date, language: DcaFirePlannerCardProps["language"]) {
  const locale = language === "en" ? "en-US" : language === "zhTW" ? "zh-TW" : "zh-CN";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
  }).format(date);
}
