import { ArrowDownRight, ArrowUpRight, Bitcoin, CircleDollarSign } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatPercentage,
} from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type { DashboardMetrics } from "@/lib/types";

type DashboardMetricsProps = {
  metrics: DashboardMetrics;
  t: Translation["dashboard"];
};

export function DashboardMetrics({ metrics, t }: DashboardMetricsProps) {
  const isProfit = metrics.profitLoss >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bitcoin className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            icon={<Bitcoin className="h-4 w-4" aria-hidden="true" />}
            label={t.btcPrice}
            value={formatCurrency(metrics.currentBtcPrice)}
          />
          <Metric
            icon={<CircleDollarSign className="h-4 w-4" aria-hidden="true" />}
            label={t.portfolioValue}
            value={formatCurrency(metrics.portfolioValue)}
          />
          <Metric
            label={t.costBasis}
            value={formatCurrency(metrics.costBasis)}
          />
          <Metric
            icon={
              isProfit ? (
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              )
            }
            label={t.profitLoss}
            tone={isProfit ? "positive" : "negative"}
            value={`${formatCurrency(metrics.profitLoss)} (${formatPercentage(
              metrics.profitLossPercentage,
            )})`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type MetricProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: "default" | "positive" | "negative";
};

function Metric({ label, value, icon, tone = "default" }: MetricProps) {
  const toneClass =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : "text-foreground";

  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-muted">
        {icon}
        {label}
      </div>
      <div className={`break-words text-xl font-semibold ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}
