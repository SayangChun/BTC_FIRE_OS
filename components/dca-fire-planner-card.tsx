"use client";

import { CalendarClock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatBtc,
  formatCurrency,
  formatPercentage,
} from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type {
  Ahr999Frequency,
  DcaFireProjection,
  DcaPlanInput,
  OtherAssetsInput,
} from "@/lib/types";

type DcaFirePlannerCardProps = {
  plan: DcaPlanInput;
  otherAssets: OtherAssetsInput;
  frequency: Ahr999Frequency & { status: "loading" | "ready" | "error" };
  projection: DcaFireProjection;
  language: "zhCN" | "zhTW" | "en";
  t: Translation["dcaPlanner"];
  onPlanChange: (plan: DcaPlanInput) => void;
  onOtherAssetsChange: (otherAssets: OtherAssetsInput) => void;
};

export function DcaFirePlannerCard({
  plan,
  otherAssets,
  frequency,
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

        <div className="grid gap-4 md:grid-cols-3">
          <DcaInput
            id="low-dca"
            label={t.lowAmount}
            value={plan.lowDailyAmount}
            onChange={(value) => onPlanChange({ ...plan, lowDailyAmount: value })}
          />
          <DcaInput
            id="normal-dca"
            label={t.normalAmount}
            value={plan.normalDailyAmount}
            onChange={(value) =>
              onPlanChange({ ...plan, normalDailyAmount: value })
            }
          />
          <DcaInput
            id="high-dca"
            label={t.highAmount}
            value={plan.highDailyAmount}
            onChange={(value) => onPlanChange({ ...plan, highDailyAmount: value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DcaInput
            id="other-assets"
            label={t.otherAssets}
            value={otherAssets.currentAmount}
            onChange={(value) =>
              onOtherAssetsChange({ ...otherAssets, currentAmount: value })
            }
          />
          <DcaInput
            id="other-assets-return"
            label={t.otherAssetsReturn}
            value={Number((otherAssets.annualReturnRate * 100).toFixed(2))}
            step="0.1"
            onChange={(value) =>
              onOtherAssetsChange({
                ...otherAssets,
                annualReturnRate: value / 100,
              })
            }
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SmallStat
            label={t.lowFrequency}
            value={frequency.status === "ready" ? formatPercentage(frequency.low) : "--"}
          />
          <SmallStat
            label={t.normalFrequency}
            value={
              frequency.status === "ready" ? formatPercentage(frequency.normal) : "--"
            }
          />
          <SmallStat
            label={t.highFrequency}
            value={frequency.status === "ready" ? formatPercentage(frequency.high) : "--"}
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
              ? `${projection.projectedFireYears.toFixed(1)} ${t.years}`
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
          <p className="mt-2 text-xs leading-5 text-muted">
            {frequency.status === "ready"
              ? `${t.sampleDays}: ${frequency.sampleDays}`
              : frequency.status === "loading"
                ? t.loading
                : t.error}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type DcaInputProps = {
  id: string;
  label: string;
  value: number;
  step?: string;
  onChange: (value: number) => void;
};

function DcaInput({ id, label, value, step = "1", onChange }: DcaInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        min="0"
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
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

function formatDate(date: Date, language: DcaFirePlannerCardProps["language"]) {
  const locale = language === "en" ? "en-US" : language === "zhTW" ? "zh-TW" : "zh-CN";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
  }).format(date);
}
