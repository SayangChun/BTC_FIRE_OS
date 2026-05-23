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
        {ahr999.status === "error" ? (
          <div className="rounded-md border border-border bg-background p-4 text-sm text-negative">
            {t.error}
          </div>
        ) : null}

        {ahr999.status === "loading" ? (
          <div className="rounded-md border border-border bg-background p-4 text-sm text-muted">
            {t.loading}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-md border border-border bg-background p-4">
            <div className="text-xs uppercase tracking-[0.08em] text-muted">
              {t.value}
            </div>
            <div className="mt-2 text-4xl font-semibold text-foreground">
              {isReady ? ahr999.value.toFixed(2) : "--"}
            </div>
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
              {isReady ? recommendation.label : "--"}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              {isReady ? recommendation.detail : t.loading}
            </p>
          </div>
        </div>

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
