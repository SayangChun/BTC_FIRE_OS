"use client";

import { Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currencySymbol } from "@/lib/calculations";
import type { Translation } from "@/lib/i18n";

type PortfolioInputProps = {
  btcHoldings: number;
  averageCostBasis: number;
  t: Translation["portfolio"];
  onBtcHoldingsChange: (value: number) => void;
  onAverageCostBasisChange: (value: number) => void;
};

export function PortfolioInput({
  btcHoldings,
  averageCostBasis,
  t,
  onBtcHoldingsChange,
  onAverageCostBasisChange,
}: PortfolioInputProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="btc-holdings">{t.btcHoldings}</Label>
          <Input
            id="btc-holdings"
            inputMode="decimal"
            min="0"
            step="0.0001"
            type="number"
            value={btcHoldings}
            onChange={(event) =>
              onBtcHoldingsChange(Number(event.target.value))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="average-cost">{t.averageCostBasis}</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted">
              {currencySymbol("USD")}
            </span>
            <Input
              id="average-cost"
              className="pl-7"
              inputMode="decimal"
              min="0"
              step="100"
              type="number"
              value={averageCostBasis}
              onChange={(event) =>
                onAverageCostBasisChange(Number(event.target.value))
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
