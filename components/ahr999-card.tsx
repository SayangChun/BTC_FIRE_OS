import { Gauge } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type { Ahr999Recommendation, Ahr999Result } from "@/lib/types";
import { cn } from "@/lib/utils";

type Ahr999CardProps = {
  ahr999: Ahr999Result & {
    status: "loading" | "ready" | "error";
  };
  language: "zhCN" | "zhTW" | "en";
  t: Translation["ahr999"];
};

export function Ahr999Card({ ahr999, language, t }: Ahr999CardProps) {
  const recommendation = getRecommendationCopy(ahr999.recommendation, t);
  const recommendation3d = getRecommendationCopy(ahr999.recommendation3d, t);
  const isReady = ahr999.status === "ready" && ahr999.value > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-bitcoin" aria-hidden="true" />
            <CardTitle>{t.title}</CardTitle>
          </div>
          <span className="rounded bg-background px-2 py-1 text-xs font-semibold text-bitcoin">
            {t.subtitle}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReady ? (
          <div className="rounded-md border border-border bg-background p-4">
            <div className="py-8 text-center text-sm text-muted">
              {ahr999.status === "loading"
                ? t.loading
                : ahr999.status === "error"
                  ? t.error
                  : "--"}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <IndicatorPanel
              label={t.labelClassic}
              value={ahr999.value}
              fittedLabel={t.fittedPrice}
              fittedValue={
                ahr999.fittedPrice > 0
                  ? formatCurrency(ahr999.fittedPrice)
                  : "--"
              }
              recommendationLabel={recommendation.label}
              recommendationDetail={recommendation.detail}
              recommendation={ahr999.recommendation}
              suggestionLabel={t.suggestion}
            />
            <IndicatorPanel
              label={t.label3d}
              value={ahr999.value3d}
              fittedLabel={t.fittedPrice3d}
              fittedValue={
                ahr999.fittedPrice3d > 0
                  ? formatCurrency(ahr999.fittedPrice3d)
                  : "--"
              }
              recommendationLabel={recommendation3d.label}
              recommendationDetail={recommendation3d.detail}
              recommendation={ahr999.recommendation3d}
              suggestionLabel={t.suggestion}
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SmallStat
            label={t.average200Day}
            value={
              ahr999.average200DayPrice > 0
                ? formatCurrency(ahr999.average200DayPrice)
                : "--"
            }
          />
          <SmallStat
            label={t.fittedPrice}
            value={
              ahr999.fittedPrice > 0 ? formatCurrency(ahr999.fittedPrice) : "--"
            }
          />
          <SmallStat
            label={t.fittedPrice3d}
            value={
              ahr999.fittedPrice3d > 0
                ? formatCurrency(ahr999.fittedPrice3d)
                : "--"
            }
          />
          <SmallStat
            label={t.updated}
            value={
              ahr999.lastUpdated
                ? formatTime(ahr999.lastUpdated, language)
                : "--"
            }
          />
        </div>

        <p className="text-xs leading-5 text-muted">{t.methodology}</p>
      </CardContent>
    </Card>
  );
}

type IndicatorPanelProps = {
  label: string;
  value: number;
  fittedLabel: string;
  fittedValue: string;
  recommendationLabel: string;
  recommendationDetail: string;
  recommendation: Ahr999Recommendation;
  suggestionLabel: string;
};

function IndicatorPanel({
  label,
  value,
  fittedLabel,
  fittedValue,
  recommendationLabel,
  recommendationDetail,
  recommendation,
  suggestionLabel,
}: IndicatorPanelProps) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="text-xs font-semibold tracking-[0.08em] text-bitcoin">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
        {value.toFixed(4)}
      </div>
      <div className="mt-2 text-xs text-muted">
        {fittedLabel}:{" "}
        <span className="font-medium text-foreground">{fittedValue}</span>
      </div>
      <div className="mt-3 text-xs uppercase tracking-[0.08em] text-muted">
        {suggestionLabel}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold sm:text-xl",
          getRecommendationClass(recommendation),
        )}
      >
        {recommendationLabel}
      </div>
      <p className="mt-1 text-sm leading-6 text-muted">{recommendationDetail}</p>
    </div>
  );
}

type SmallStatProps = {
  label: string;
  value: string;
};

function SmallStat({ label, value }: SmallStatProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

function getRecommendationCopy(
  recommendation: Ahr999Recommendation,
  t: Translation["ahr999"],
) {
  if (recommendation === "increase") {
    return {
      label: t.increase,
      detail: t.increaseDetail,
    };
  }

  if (recommendation === "stop") {
    return {
      label: t.stop,
      detail: t.stopDetail,
    };
  }

  return {
    label: t.normal,
    detail: t.normalDetail,
  };
}

function getRecommendationClass(recommendation: Ahr999Recommendation) {
  if (recommendation === "increase") {
    return "text-positive";
  }

  if (recommendation === "stop") {
    return "text-negative";
  }

  return "text-bitcoin";
}

function formatTime(date: Date, language: Ahr999CardProps["language"]) {
  const locale =
    language === "en" ? "en-US" : language === "zhTW" ? "zh-TW" : "zh-CN";

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}
