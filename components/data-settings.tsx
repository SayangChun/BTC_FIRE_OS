"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, Settings, Upload } from "lucide-react";
import type { Language } from "@/lib/i18n";
import type { DcaPlanInput, OtherAssetsInput } from "@/lib/types";

type SettingsTranslation = {
  exportData: string;
  importData: string;
  importBody: string;
  invalidFile: string;
  importSuccess: string;
  resetData: string;
  resetConfirm: string;
};

type DataSettingsProps = {
  t: SettingsTranslation;
  language: Language;
};

export function DataSettings({ t, language }: DataSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleExport = useCallback(() => {
    const keyMap: Record<string, string> = {
      language: "btc-fire-os:language",
      currency: "btc-fire-os:currency",
      btcUnit: "btc-fire-os:btc-unit",
      btcHoldings: "btc-fire-os:btc-holdings",
      averageCostBasis: "btc-fire-os:average-cost-basis",
      monthlyExpenses: "btc-fire-os:monthly-expenses",
      withdrawalRate: "btc-fire-os:withdrawal-rate",
      dcaPlan: "btc-fire-os:dca-plan",
      otherAssets: "btc-fire-os:other-assets",
    };

    const raw: Record<string, unknown> = {
      version: 1,
      exportedAt: new Date().toISOString(),
    };

    for (const [field, storageKey] of Object.entries(keyMap)) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        try {
          raw[field] = JSON.parse(stored);
        } catch {
          /* skip malformed */
        }
      }
    }

    const blob = new Blob([JSON.stringify(raw, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `btc-fire-os-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !data.exportedAt) {
          alert(t.invalidFile);
          return;
        }

        const labels = fieldLabels[language];
        const fields = [
          { key: "language", label: labels.language },
          { key: "currency", label: labels.currency },
          { key: "btcUnit", label: labels.btcUnit },
          { key: "btcHoldings", label: labels.btcHoldings },
          { key: "averageCostBasis", label: labels.averageCostBasis },
          { key: "monthlyExpenses", label: labels.monthlyExpenses },
          { key: "withdrawalRate", label: labels.withdrawalRate },
          { key: "dcaPlan", label: labels.dcaPlan },
          { key: "otherAssets", label: labels.otherAssets },
        ];

        const lines: string[] = [];
        for (const { key, label } of fields) {
          const val = data[key];
          if (val === undefined) continue;
          lines.push(`• ${label}: ${formatFieldValue(key, val)}`);
        }

        if (lines.length === 0) {
          alert(t.invalidFile);
          return;
        }

        if (!confirm(t.importBody.replace("{fields}", lines.join("\n")))) return;

        const keyMap: Record<string, string> = {
          language: "btc-fire-os:language",
          currency: "btc-fire-os:currency",
          btcUnit: "btc-fire-os:btc-unit",
          btcHoldings: "btc-fire-os:btc-holdings",
          averageCostBasis: "btc-fire-os:average-cost-basis",
          monthlyExpenses: "btc-fire-os:monthly-expenses",
          withdrawalRate: "btc-fire-os:withdrawal-rate",
          dcaPlan: "btc-fire-os:dca-plan",
          otherAssets: "btc-fire-os:other-assets",
        };

        for (const [field, storageKey] of Object.entries(keyMap)) {
          if (data[field] !== undefined) {
            localStorage.setItem(storageKey, JSON.stringify(data[field]));
          }
        }

        alert(t.importSuccess);
        window.location.reload();
      } catch {
        alert(t.invalidFile);
      }
    };
    input.click();
    setIsOpen(false);
  }, [t, language]);

  const handleReset = useCallback(() => {
    if (!confirm(t.resetConfirm)) return;

    const keyMap: Record<string, string> = {
      btcHoldings: "btc-fire-os:btc-holdings",
      averageCostBasis: "btc-fire-os:average-cost-basis",
      monthlyExpenses: "btc-fire-os:monthly-expenses",
      withdrawalRate: "btc-fire-os:withdrawal-rate",
      dcaPlan: "btc-fire-os:dca-plan",
      otherAssets: "btc-fire-os:other-assets",
    };

    const defaults: Record<string, unknown> = {
      btcHoldings: 1.2,
      averageCostBasis: 42_000,
      monthlyExpenses: 4_500,
      withdrawalRate: 0.04,
      dcaPlan: { lowDailyAmount: 100, normalDailyAmount: 30, highDailyAmount: 0 },
      otherAssets: { currentAmount: 0, annualReturnRate: 0.04, monthlyCashflow: 0 },
    };

    for (const [field, storageKey] of Object.entries(keyMap)) {
      if (field in defaults) {
        localStorage.setItem(storageKey, JSON.stringify(defaults[field]));
      }
    }

    window.location.reload();
  }, [t]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded text-muted transition-colors hover:bg-surface hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-md border border-border bg-surface shadow-soft">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-background"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 shrink-0 text-muted" />
            {t.exportData}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-background"
            onClick={handleImport}
          >
            <Upload className="h-4 w-4 shrink-0 text-muted" />
            {t.importData}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-background"
            onClick={handleReset}
          >
            <RefreshCw className="h-4 w-4 shrink-0 text-muted" />
            {t.resetData}
          </button>
        </div>
      )}
    </div>
  );
}

const fieldLabels: Record<Language, Record<string, string>> = {
  zhCN: {
    language: "语言",
    currency: "货币",
    btcUnit: "BTC 单位",
    btcHoldings: "BTC 持仓",
    averageCostBasis: "平均成本",
    monthlyExpenses: "每月支出",
    withdrawalRate: "提取率",
    dcaPlan: "DCA 定投",
    otherAssets: "其他资产",
  },
  zhTW: {
    language: "語言",
    currency: "貨幣",
    btcUnit: "BTC 單位",
    btcHoldings: "BTC 持倉",
    averageCostBasis: "平均成本",
    monthlyExpenses: "每月支出",
    withdrawalRate: "提取率",
    dcaPlan: "DCA 定投",
    otherAssets: "其他資產",
  },
  en: {
    language: "Language",
    currency: "Currency",
    btcUnit: "BTC Unit",
    btcHoldings: "BTC Holdings",
    averageCostBasis: "Cost Basis",
    monthlyExpenses: "Monthly Expenses",
    withdrawalRate: "Withdrawal Rate",
    dcaPlan: "DCA Plan",
    otherAssets: "Other Assets",
  },
};

function formatFieldValue(field: string, value: unknown): string {
  switch (field) {
    case "language": {
      const names: Record<string, string> = {
        zhCN: "简体中文",
        zhTW: "繁體中文",
        en: "English",
      };
      return names[value as string] ?? String(value);
    }
    case "withdrawalRate":
      return `${((value as number) * 100).toFixed(1)}%`;
    case "dcaPlan": {
      const p = value as DcaPlanInput;
      return `${formatNumber(p.lowDailyAmount)} / ${formatNumber(p.normalDailyAmount)} / ${formatNumber(p.highDailyAmount)}`;
    }
    case "otherAssets": {
      const a = value as OtherAssetsInput;
      const cf = (a as any).monthlyCashflow ?? 0;
      return `${formatNumber(a.currentAmount)} +${formatNumber(cf)}/mo (${(a.annualReturnRate * 100).toFixed(1)}%)`;
    }
    default:
      return String(value);
  }
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
