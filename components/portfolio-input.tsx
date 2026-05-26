"use client";

import { Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BTC_UNITS, BTC_UNIT_OPTIONS, btcToUnit, currencySymbol, unitToBtc } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { Translation } from "@/lib/i18n";
import type { BtcUnit } from "@/lib/types";

type PortfolioInputProps = {
  btcHoldings: number;
  btcUnit: BtcUnit;
  averageCostBasis: number;
  t: Translation["portfolio"];
  onBtcHoldingsChange: (value: number) => void;
  onAverageCostBasisChange: (value: number) => void;
  onBtcUnitChange: (unit: BtcUnit) => void;
};

export function PortfolioInput({
  btcHoldings,
  btcUnit,
  averageCostBasis,
  t,
  onBtcHoldingsChange,
  onAverageCostBasisChange,
  onBtcUnitChange,
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
          <div className="flex items-center justify-between">
            <Label htmlFor="btc-holdings">{t.btcHoldings}</Label>
            <div className="flex rounded-md border border-border bg-surface p-0.5">
              {BTC_UNIT_OPTIONS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  className={cn(
                    "h-7 rounded px-2 text-xs font-medium text-muted transition-colors hover:text-foreground",
                    btcUnit === unit && "bg-bitcoin text-black hover:text-black",
                  )}
                  aria-pressed={btcUnit === unit}
                  onClick={() => onBtcUnitChange(unit)}
                >
                  {BTC_UNITS[unit].label}
                </button>
              ))}
            </div>
          </div>
          <Input
            id="btc-holdings"
            inputMode="decimal"
            min="0"
            step={BTC_UNITS[btcUnit].step}
            type="number"
            value={btcToUnit(btcHoldings, btcUnit)}
            onChange={(event) =>
              onBtcHoldingsChange(unitToBtc(Number(event.target.value), btcUnit))
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
