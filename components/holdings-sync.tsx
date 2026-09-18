"use client";

import { useEffect, useState } from "react";
import { Link2, LoaderCircle, RefreshCw, ShieldCheck, TriangleAlert, Unlink } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BTC_UNITS, formatHoldings } from "@/lib/calculations";
import { ADDRESS_SOURCE_LABELS, formatAddressShort, type AddressSourceId } from "@/lib/holdings-sync";
import type { BindResult, SyncErrorReason } from "@/hooks/use-holdings-sync";
import type { Language, Translation } from "@/lib/i18n";
import type { BtcUnit, BtcWallet } from "@/lib/types";

const LOCALE_TAGS: Record<Language, string> = {
  zhCN: "zh-CN",
  zhTW: "zh-TW",
  en: "en-US",
};

function formatSyncTime(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(LOCALE_TAGS[language], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type HoldingsSyncProps = {
  wallets: BtcWallet[];
  btcUnit: BtcUnit;
  language: Language;
  t: Translation["portfolio"]["sync"];
  syncingIds: string[];
  errors: Record<string, SyncErrorReason>;
  sources: Record<string, AddressSourceId>;
  onBind: (address: string, name: string) => BindResult;
  onUnbind: (walletId: string) => void;
  onSyncAll: () => void;
  onSyncOne: (walletId: string) => void;
};

/**
 * Bind BTC addresses so their balance is read from the chain instead of typed
 * by hand. Rendered inside the portfolio card, right under the wallet list —
 * the two are one workflow: this panel is how a wallet gets its number.
 */
export function HoldingsSync({
  wallets,
  btcUnit,
  language,
  t,
  syncingIds,
  errors,
  sources,
  onBind,
  onUnbind,
  onSyncAll,
  onSyncOne,
}: HoldingsSyncProps) {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState<"invalid" | "duplicate" | null>(null);
  // Timestamps are formatted with the browser locale/timezone, so they must not
  // appear in the statically prerendered HTML — that would be a hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const bound = wallets.filter((wallet) => wallet.source?.kind === "address");
  const isBusy = syncingIds.length > 0;

  const handleBind = () => {
    const result = onBind(address, name);
    if (!result.ok) {
      setFeedback(result.reason);
      return;
    }
    setAddress("");
    setName("");
    setFeedback(null);
  };

  const statusLine = (wallet: BtcWallet) => {
    const syncing = syncingIds.includes(wallet.id);
    if (syncing) {
      return (
        <span className="flex items-center gap-1.5 text-muted">
          <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden="true" />
          {t.syncing}
        </span>
      );
    }

    const error = errors[wallet.id];
    if (error) {
      return (
        <span className="flex items-center gap-1.5 text-negative">
          <TriangleAlert className="h-3 w-3" aria-hidden="true" />
          {error === "invalid" ? t.syncFailedInvalid : t.syncFailedNetwork}
        </span>
      );
    }

    if (!wallet.lastSyncedAt || !mounted) {
      return <span className="text-muted">{t.neverSynced}</span>;
    }

    const source = sources[wallet.id];
    return (
      <span className="text-muted">
        {t.lastSynced} · {formatSyncTime(wallet.lastSyncedAt, language)}
        {source ? ` · ${ADDRESS_SOURCE_LABELS[source]}` : ""}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-bitcoin" aria-hidden="true" />
            <CardTitle>{t.title}</CardTitle>
          </div>
          {bound.length > 0 ? (
            <button
              type="button"
              onClick={onSyncAll}
              disabled={isBusy}
              className="inline-flex h-8 items-center gap-1.5 rounded border border-border px-2.5 text-xs text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.syncAll}
            </button>
          ) : null}
        </div>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-md border border-border bg-background p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <div className="space-y-1.5">
              <Label
                htmlFor="btc-address"
                className="text-[10px] uppercase tracking-[0.06em] text-muted"
              >
                {t.addressLabel}
              </Label>
              <Input
                id="btc-address"
                className="font-mono text-xs"
                value={address}
                spellCheck={false}
                autoComplete="off"
                placeholder={t.addressPlaceholder}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (feedback) setFeedback(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="btc-address-name"
                className="text-[10px] uppercase tracking-[0.06em] text-muted"
              >
                {t.nameLabel}
              </Label>
              <Input
                id="btc-address-name"
                value={name}
                placeholder={t.namePlaceholder}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
              />
            </div>
          </div>

          {feedback ? (
            <p className="text-xs text-negative">
              {feedback === "invalid" ? t.invalidAddress : t.duplicateAddress}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleBind}
            disabled={address.trim() === ""}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-bitcoin px-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {t.bind}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.08em] text-muted">
            <span>{t.boundList}</span>
            <span className="tabular-nums">{bound.length}</span>
          </div>

          {bound.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-background p-4 text-center text-xs leading-relaxed text-muted">
              {t.empty}
            </p>
          ) : (
            <ul className="space-y-2">
              {bound.map((wallet) => {
                const syncing = syncingIds.includes(wallet.id);
                return (
                  <li
                    key={wallet.id}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Link2
                            className="h-3.5 w-3.5 shrink-0 text-bitcoin"
                            aria-hidden="true"
                          />
                          <span
                            className="truncate font-mono text-xs text-foreground"
                            title={wallet.source?.address}
                          >
                            {wallet.source ? formatAddressShort(wallet.source.address, 10, 6) : ""}
                          </span>
                        </div>
                        <div className="truncate text-[11px] text-muted">{wallet.name}</div>
                      </div>

                      <div className="text-right">
                        {syncing ? (
                          <Skeleton className="ml-auto h-5 w-24" />
                        ) : (
                          <div className="font-semibold tabular-nums text-foreground">
                            {formatHoldings(wallet.btc, btcUnit)} {BTC_UNITS[btcUnit].label}
                          </div>
                        )}
                        <div className="mt-0.5 text-[11px]">{statusLine(wallet)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onSyncOne(wallet.id)}
                        disabled={syncing}
                        className="inline-flex h-7 items-center gap-1.5 rounded border border-border px-2 text-[11px] text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RefreshCw className="h-3 w-3" aria-hidden="true" />
                        {t.syncNow}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUnbind(wallet.id)}
                        title={t.unbindHint}
                        className="inline-flex h-7 items-center gap-1.5 rounded border border-border px-2 text-[11px] text-muted transition hover:bg-surface hover:text-foreground"
                      >
                        <Unlink className="h-3 w-3" aria-hidden="true" />
                        {t.unbind}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" aria-hidden="true" />
          {t.privacy}
        </p>
      </CardContent>
    </Card>
  );
}
