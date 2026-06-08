"use client";

import { useEffect, useRef, useState } from "react";
import { Info, Plus, Trash2, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BTC_UNITS,
  BTC_UNIT_OPTIONS,
  btcToUnit,
  calculateTotalBtc,
  calculateWeightedCostBasis,
  currencySymbol,
  formatInputNumber,
  toFixedPrecision,
  unitToBtc,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { Translation } from "@/lib/i18n";
import type { BtcUnit, BtcWallet } from "@/lib/types";

type PortfolioInputProps = {
  wallets: BtcWallet[];
  btcUnit: BtcUnit;
  t: Translation["portfolio"];
  onWalletsChange: (wallets: BtcWallet[]) => void;
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

function WalletRow({
  wallet,
  btcUnit,
  onChange,
  onRemove,
  canRemove,
  t,
}: {
  wallet: BtcWallet;
  btcUnit: BtcUnit;
  onChange: (next: BtcWallet) => void;
  onRemove: () => void;
  canRemove: boolean;
  t: Translation["portfolio"];
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label className="text-[10px] uppercase tracking-[0.06em] text-muted">{t.walletName}</Label>
        <Input
          value={wallet.name}
          onChange={(e) => onChange({ ...wallet, name: e.target.value.slice(0, 40) })}
          placeholder="Cold wallet / Exchange"
        />
      </div>

      <div className="w-full space-y-1.5 sm:w-44">
        <Label className="text-[10px] uppercase tracking-[0.06em] text-muted">{t.holdings}</Label>
        <HoldingsInput
          btcHoldings={wallet.btc}
          btcUnit={btcUnit}
          onChange={(v) => onChange({ ...wallet, btc: v })}
        />
      </div>

      <div className="w-full space-y-1.5 sm:w-40">
        <Label className="text-[10px] uppercase tracking-[0.06em] text-muted">{t.costBasis}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted">
            {currencySymbol("USD")}
          </span>
          <CostInput
            value={wallet.costBasis}
            onChange={(v) => onChange({ ...wallet, costBasis: v })}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="mt-1 flex h-9 w-9 items-center justify-center self-end rounded border border-border text-muted transition hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:mt-0"
        aria-label={t.removeWallet}
        title={t.removeWallet}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PortfolioInput({ wallets, btcUnit, t, onWalletsChange, onBtcUnitChange }: PortfolioInputProps) {
  const totalBtc = calculateTotalBtc(wallets);
  const weightedCost = calculateWeightedCostBasis(wallets);

  const addWallet = () => {
    const next: BtcWallet = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: wallets.length === 0 ? "Main" : `Wallet ${wallets.length + 1}`,
      btc: 0,
      costBasis: 0,
    };
    onWalletsChange([...wallets, next]);
  };

  const updateWallet = (id: string, nextWallet: BtcWallet) => {
    onWalletsChange(wallets.map((w) => (w.id === id ? nextWallet : w)));
  };

  const removeWallet = (id: string) => {
    if (wallets.length <= 1) {
      // keep one but zero it out
      const only = wallets[0];
      onWalletsChange([{ ...only, btc: 0, costBasis: 0 }]);
      return;
    }
    onWalletsChange(wallets.filter((w) => w.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-bitcoin" aria-hidden="true" />
          <CardTitle>{t.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unit selector */}
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.08em] text-muted">{t.btcUnit}</div>
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

        {/* TOTAL SUMMARY */}
        <div className="rounded-md border border-border bg-surface p-3">
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.06em] text-muted">{t.totalHoldings}</div>
              <div className="font-semibold tabular-nums text-foreground">
                {formatInputNumber(btcToUnit(totalBtc, btcUnit), BTC_UNITS[btcUnit].decimals)} {BTC_UNITS[btcUnit].label}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.06em] text-muted">
                {t.weightedAvgCost}
                <span className="group relative cursor-help text-muted" aria-label={t.averageCostHelp}>
                  <Info className="h-3 w-3" />
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 w-max max-w-[260px] -translate-y-1/2 rounded border border-border bg-background p-2 text-left text-xs text-foreground opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                    {t.averageCostHelp}
                  </span>
                </span>
              </div>
              <div className="font-semibold tabular-nums text-foreground">
                {currencySymbol("USD")}
                {formatInputNumber(weightedCost, 2)}
              </div>
            </div>
          </div>
        </div>

        {/* Wallets list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.08em] text-muted">
            <span>{t.wallets}</span>
            <span className="tabular-nums">{wallets.length}</span>
          </div>

          {wallets.length === 0 ? (
            <div className="rounded border border-dashed border-border p-4 text-center text-sm text-muted">
              {t.noWallets}
            </div>
          ) : (
            wallets.map((wallet) => (
              <WalletRow
                key={wallet.id}
                wallet={wallet}
                btcUnit={btcUnit}
                onChange={(next) => updateWallet(wallet.id, next)}
                onRemove={() => removeWallet(wallet.id)}
                canRemove={wallets.length > 1 || wallet.btc > 0 || wallet.costBasis > 0}
                t={t}
              />
            ))
          )}
        </div>

        <button
          type="button"
          onClick={addWallet}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-sm text-foreground transition hover:bg-surface"
        >
          <Plus className="h-4 w-4" />
          {t.addWallet}
        </button>
      </CardContent>
    </Card>
  );
}
