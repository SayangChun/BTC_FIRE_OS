"use client";

import { useEffect, useRef, useState } from "react";
import { Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BTC_UNITS, BTC_UNIT_OPTIONS, btcToUnit, currencySymbol, formatInputNumber, toFixedPrecision, unitToBtc } from "@/lib/calculations";
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

function HoldingsInput({
  btcHoldings,
  btcUnit,
  onChange,
}: {
  btcHoldings: number;
  btcUnit: BtcUnit;
  onChange: (value: number) => void;
}) {
  const decimals = BTC_UNITS[btcUnit].decimals;
  const displayValue = btcToUnit(btcHoldings, btcUnit);
  const [text, setText] = useState(() => formatInputNumber(displayValue, decimals));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setText(formatInputNumber(displayValue, decimals));
    }
  }, [displayValue, decimals]);

  return (
    <Input
      id="btc-holdings"
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
            onChange(unitToBtc(parsed, btcUnit));
          }
        }
      }}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => {
        isFocused.current = false;
        const parsed = parseFloat(text);
        const safe = isNaN(parsed) || parsed < 0 ? displayValue : parsed;
        const cleanText = formatInputNumber(safe, decimals);
        setText(cleanText);
        onChange(unitToBtc(safe, btcUnit));
      }}
    />
  );
}

function CostInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(() => formatInputNumber(value, 2));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setText(formatInputNumber(value, 2));
    }
  }, [value]);

  return (
    <Input
      id="average-cost"
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
        const cleanText = formatInputNumber(cleanValue, 2);
        setText(cleanText);
        onChange(cleanValue);
      }}
    />
  );
}

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
          <HoldingsInput
            btcHoldings={btcHoldings}
            btcUnit={btcUnit}
            onChange={onBtcHoldingsChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="average-cost">{t.averageCostBasis}</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted">
              {currencySymbol("USD")}
            </span>
            <CostInput
              value={averageCostBasis}
              onChange={onAverageCostBasisChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
