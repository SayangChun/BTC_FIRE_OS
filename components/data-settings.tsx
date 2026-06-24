"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, Settings, Upload } from "lucide-react";
import type { Language } from "@/lib/i18n";
import type { BtcWallet, DcaPlanInput, OtherAssetsInput } from "@/lib/types";

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
  label?: string;
};

export function DataSettings({ t, language, label }: DataSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Always resolve a translated label so switching language updates the button text immediately
  const resolvedLabel = label ?? (
    language === "en" ? "Settings" :
    language === "zhTW" ? "設置" : "设置"
  );

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
      wallets: "btc-fire-os:wallets",
      // legacy single values kept for backward compat with older installs
      btcHoldings: "btc-fire-os:btc-holdings",
      averageCostBasis: "btc-fire-os:average-cost-basis",
      monthlyExpenses: "btc-fire-os:monthly-expenses",
      withdrawalRate: "btc-fire-os:withdrawal-rate",
      dcaPlan: "btc-fire-os:dca-plan",
      otherAssets: "btc-fire-os:other-assets",
    };

    const raw: Record<string, unknown> = {
      version: 2,
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
          { key: "wallets", label: labels.wallets },
          // legacy
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
          wallets: "btc-fire-os:wallets",
          // legacy single values (will be migrated on next load if wallets missing)
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

        // Legacy conversion inside the imported file itself (for immediate use)
        if (!data.wallets && (data.btcHoldings !== undefined || data.averageCostBasis !== undefined)) {
          const legacyWallet: BtcWallet = {
            id: "imported-legacy",
            name: "Main",
            btc: typeof data.btcHoldings === "number" ? data.btcHoldings : 0,
            costBasis: typeof data.averageCostBasis === "number" ? data.averageCostBasis : 0,
          };
          localStorage.setItem("btc-fire-os:wallets", JSON.stringify([legacyWallet]));
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
      wallets: "btc-fire-os:wallets",
      monthlyExpenses: "btc-fire-os:monthly-expenses",
      withdrawalRate: "btc-fire-os:withdrawal-rate",
      dcaPlan: "btc-fire-os:dca-plan",
      otherAssets: "btc-fire-os:other-assets",
    };

    const defaults: Record<string, unknown> = {
      wallets: [{ id: "default", name: "Main", btc: 1.2, costBasis: 42_000 }],
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

    // clean legacy single-value keys on reset
    localStorage.removeItem("btc-fire-os:btc-holdings");
    localStorage.removeItem("btc-fire-os:average-cost-basis");

    window.location.reload();
  }, [t]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1 rounded border border-border bg-surface py-px text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={resolvedLabel}
      >
        <Settings className="h-3 w-3" />
        <span>{resolvedLabel}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 bottom-full z-50 mb-1 min-w-44 overflow-hidden rounded-md border border-border bg-surface shadow-soft">
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
    wallets: "多钱包持仓",
    btcHoldings: "BTC 持仓（旧版）",
    averageCostBasis: "平均成本（旧版）",
    monthlyExpenses: "每月支出",
    withdrawalRate: "提取率",
    dcaPlan: "DCA 定投",
    otherAssets: "其他资产",
  },
  zhTW: {
    language: "語言",
    currency: "貨幣",
    btcUnit: "BTC 單位",
    wallets: "多錢包持倉",
    btcHoldings: "BTC 持倉（舊版）",
    averageCostBasis: "平均成本（舊版）",
    monthlyExpenses: "每月支出",
    withdrawalRate: "提取率",
    dcaPlan: "DCA 定投",
    otherAssets: "其他資產",
  },
  en: {
    language: "Language",
    currency: "Currency",
    btcUnit: "BTC Unit",
    wallets: "Multi-wallet holdings",
    btcHoldings: "BTC Holdings (legacy)",
    averageCostBasis: "Cost Basis (legacy)",
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
      return `${((value as number) * 100).toFixed(2)}%`;
    case "dcaPlan": {
      const p = value as DcaPlanInput;
      return `${formatNumber(p.lowDailyAmount)} / ${formatNumber(p.normalDailyAmount)} / ${formatNumber(p.highDailyAmount)}`;
    }
    case "otherAssets": {
      const a = value as OtherAssetsInput;
      const cf = (a as any).monthlyCashflow ?? 0;
      return `${formatNumber(a.currentAmount)} +${formatNumber(cf)}/mo (${(a.annualReturnRate * 100).toFixed(1)}%)`;
    }
    case "wallets": {
      const ws = value as BtcWallet[];
      if (!Array.isArray(ws) || ws.length === 0) return "0 wallets";
      const total = ws.reduce((s, w) => s + (w.btc || 0), 0);
      return `${ws.length} wallet(s), total ${formatNumber(total)} BTC`;
    }
    default:
      return String(value);
  }
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
