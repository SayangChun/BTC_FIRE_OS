import { Telescope } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatBtc,
  formatCurrency,
  formatPercentage,
} from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type {
  PriceProjectionPoint,
  PriceProjectionScenario,
} from "@/lib/types";

type FutureFireCardProps = {
  points: PriceProjectionPoint[];
  currentRequiredBtc: number;
  firstFireYear: number | null;
  t: Translation["future"];
};

export function FutureFireCard({
  points,
  currentRequiredBtc,
  firstFireYear,
  t,
}: FutureFireCardProps) {
  const tenYearBase = points.find(
    (point) => point.year === 10 && point.scenario === "base",
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Telescope className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted">{t.description}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat
            label={t.currentRequiredBtc}
            value={formatBtc(currentRequiredBtc)}
          />
          <SummaryStat
            label={t.tenYearRequiredBtc}
            value={tenYearBase ? formatBtc(tenYearBase.requiredBtcForFire) : "--"}
          />
          <SummaryStat
            label={t.baseFireTiming}
            value={firstFireYear ? `${firstFireYear} ${t.years}` : t.notReached}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-1">
          {[1, 5, 10].map((year) => {
            const basePoint = points.find(
              (p) => p.year === year && p.scenario === "base",
            );
            return (
            <div
              key={year}
              className="rounded-md border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {year} {t.yearsLater}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs uppercase tracking-[0.08em] text-muted">
                    {t.modelBased}
                  </span>
                  {basePoint ? (
                    <span className="text-xs text-muted">
                      {formatCurrency(basePoint.projectedPortfolioValue)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {points
                  .filter((point) => point.year === year)
                  .map((point) => (
                    <ProjectionScenario key={`${year}-${point.scenario}`} point={point} t={t} />
                  ))}
              </div>
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

type SummaryStatProps = {
  label: string;
  value: string;
};

function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="text-xs uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-2 break-words text-lg font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

function ProjectionScenario({
  point,
  t,
}: {
  point: PriceProjectionPoint;
  t: Translation["future"];
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {getScenarioLabel(point.scenario, t)}
        </span>
        <span
          className={
            point.isFireReady
              ? "text-sm font-medium text-positive"
              : "text-sm font-medium text-muted"
          }
        >
          {point.isFireReady ? t.fireReady : t.notYet}
        </span>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <Row label={t.projectedPrice} value={formatCurrency(point.projectedPrice)} />
        <Row label={t.projectedBtc} value={formatBtc(point.projectedBtc)} />
        <Row label={t.requiredBtc} value={formatBtc(point.requiredBtcForFire)} />
        <Row label={t.fireProgress} value={formatPercentage(point.fireProgress)} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function getScenarioLabel(
  scenario: PriceProjectionScenario,
  t: Translation["future"],
) {
  if (scenario === "bear") {
    return t.bear;
  }

  if (scenario === "bull") {
    return t.bull;
  }

  return t.base;
}
