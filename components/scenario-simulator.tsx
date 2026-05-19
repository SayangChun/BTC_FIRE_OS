import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatBtc,
  formatCurrency,
  formatPercentage,
} from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";
import type { ScenarioResult } from "@/lib/types";

type ScenarioSimulatorProps = {
  scenarios: ScenarioResult[];
  t: Translation["scenarios"];
};

export function ScenarioSimulator({ scenarios, t }: ScenarioSimulatorProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
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
                <div className="text-lg font-semibold">
                  {formatCurrency(scenario.price)}
                </div>
                <div
                  className={`text-sm font-medium ${
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
      </CardContent>
    </Card>
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
