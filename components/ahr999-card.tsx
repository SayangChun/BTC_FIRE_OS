import { Gauge } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type { Ahr999Frequency, Ahr999Recommendation, Ahr999Result } from "@/lib/types";
import { cn } from "@/lib/utils";

type Ahr999CardProps = {
  ahr999: Ahr999Result & {
    status: "loading" | "ready" | "error";
  };
  frequency: Ahr999Frequency & {
    status: "loading" | "ready" | "error";
  };
  language: "zhCN" | "zhTW" | "en";
  t: Translation["ahr999"];
};

export function Ahr999Card({ ahr999, frequency, language, t }: Ahr999CardProps) {
  const recommendation = getRecommendationCopy(ahr999.recommendation, t);
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
              {ahr999.status === "loading" ? t.loading : ahr999.status === "error" ? t.error : "--"}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr] sm:items-center">
            <div className="rounded-md border border-border bg-background p-4">
              <div className="text-xs uppercase tracking-[0.08em] text-muted">
                {t.value}
              </div>
              <div className="mt-2 text-4xl font-semibold text-foreground">
                {ahr999.value.toFixed(4)}
              </div>
              <Ahr999PercentileBar
                value={ahr999.value}
                frequency={frequency}
                recommendation={ahr999.recommendation}
              />
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <div className="text-xs uppercase tracking-[0.08em] text-muted">
                {t.suggestion}
              </div>
              <div
                className={cn(
                  "mt-2 text-2xl font-semibold",
                  getRecommendationClass(ahr999.recommendation),
                )}
              >
                {recommendation.label}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {recommendation.detail}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
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
  const locale = language === "en" ? "en-US" : language === "zhTW" ? "zh-TW" : "zh-CN";

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

type Ahr999PercentileBarProps = {
  value: number;
  frequency: Ahr999Frequency & { status: "loading" | "ready" | "error" };
  recommendation: Ahr999Recommendation;
};

const ZONE_LOW = 0.45;
const ZONE_HIGH = 1.2;

function computePercentile(
  value: number,
  freq: { low: number; normal: number; high: number },
) {
  if (value <= 0) return 0;
  if (value <= ZONE_LOW) return freq.low * (value / ZONE_LOW);
  if (value <= ZONE_HIGH) {
    return freq.low + freq.normal * ((value - ZONE_LOW) / (ZONE_HIGH - ZONE_LOW));
  }
  return freq.low + freq.normal + freq.high * Math.min((value - ZONE_HIGH) / 0.8, 1);
}

function Ahr999PercentileBar({ value, frequency, recommendation }: Ahr999PercentileBarProps) {
  const freqReady = frequency.status === "ready" && frequency.sampleDays > 0;
  const pctLow = freqReady ? frequency.low * 100 : 33;
  const pctNormal = freqReady ? frequency.normal * 100 : 34;
  const pctHigh = freqReady ? frequency.high * 100 : 33;
  const total = pctLow + pctNormal + pctHigh;
  const pos = freqReady
    ? computePercentile(value, frequency) * 100
    : 50;

  const barColor =
    recommendation === "increase"
      ? "bg-positive"
      : recommendation === "stop"
        ? "bg-negative"
        : "bg-bitcoin";

  return (
    <div className="mt-3">
      <div className="relative h-2 overflow-hidden rounded-full bg-background">
        <div className="flex h-full" style={{ width: `${total}%` }}>
          <div className="h-full rounded-l-full bg-positive/40" style={{ width: `${(pctLow / total) * 100}%` }} />
          <div className="h-full bg-bitcoin/40" style={{ width: `${(pctNormal / total) * 100}%` }} />
          <div className="h-full rounded-r-full bg-negative/40" style={{ width: `${(pctHigh / total) * 100}%` }} />
        </div>
        <div
          className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-sm transition-all duration-300"
          style={{ left: `${Math.min(pos, 100)}%` }}
        >
          <div className={`h-full w-full rounded-sm ${barColor}`} />
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted">
        <span>0%</span>
        <span className="font-medium text-foreground">
          {Math.round(pos)}%
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}
