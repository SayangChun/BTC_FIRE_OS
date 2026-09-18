"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toSatPrecision } from "@/lib/calculations";
import {
  fetchAddressBalance,
  formatAddressShort,
  InvalidAddressError,
  isValidBitcoinAddress,
  normalizeAddress,
  type AddressBalance,
  type AddressSourceId,
} from "@/lib/holdings-sync";
import type { BtcWallet } from "@/lib/types";

/**
 * How often bound addresses are re-read.
 *
 * Deliberately slow: on-chain balances move far slower than the spot price, and
 * every refresh hits a public explorer that asks for no API key and rate-limits
 * generously. The manual refresh button covers the impatient case.
 */
export const HOLDINGS_SYNC_INTERVAL_MS = 5 * 60 * 1000;

/** Why a refresh failed — mapped to a translated string by the UI. */
export type SyncErrorReason = "invalid" | "network";

export type BindResult =
  | { ok: true; walletId: string }
  | { ok: false; reason: "invalid" | "duplicate" };

export type HoldingsSyncController = {
  /** Wallet ids with a balance refresh in flight. */
  syncingIds: string[];
  /** walletId → failure reason, cleared as soon as that wallet syncs again. */
  errors: Record<string, SyncErrorReason>;
  /** walletId → explorer that answered the last successful refresh. */
  sources: Record<string, AddressSourceId>;
  syncAll: () => void;
  syncOne: (walletId: string) => void;
  bindAddress: (address: string, name: string) => BindResult;
  /** Drops the address but keeps the last known BTC as a manual number. */
  unbind: (walletId: string) => void;
};

type SyncOutcome =
  | { id: string; balance: AddressBalance }
  | { id: string; error: SyncErrorReason };

function createWalletId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Keeps address-bound wallets in sync with the chain.
 *
 * Contract worth remembering: syncing only ever writes `btc` and
 * `lastSyncedAt`. It never touches `costBasis` (the chain cannot know what you
 * paid) and never touches a wallet without a `source`, so hand-typed holdings
 * are safe.
 */
export function useHoldingsSync(
  wallets: BtcWallet[],
  setWallets: (next: BtcWallet[]) => void,
): HoldingsSyncController {
  const walletsRef = useRef(wallets);
  walletsRef.current = wallets;
  const setWalletsRef = useRef(setWallets);
  setWalletsRef.current = setWallets;

  const [syncingIds, setSyncingIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, SyncErrorReason>>({});
  const [sources, setSources] = useState<Record<string, AddressSourceId>>({});

  // Lets the newest run own the spinner: an older run that resolves late must
  // not clear the "syncing" state of a refresh that is still in flight.
  const runTokenRef = useRef(0);

  const runSync = useCallback(async (targets: BtcWallet[]) => {
    const list = targets.flatMap((wallet) =>
      wallet.source?.kind === "address"
        ? [{ id: wallet.id, address: wallet.source.address }]
        : [],
    );
    if (list.length === 0) return;

    const token = ++runTokenRef.current;
    setSyncingIds(list.map((target) => target.id));

    const settled = await Promise.all<SyncOutcome>(
      list.map(async ({ id, address }) => {
        try {
          return { id, balance: await fetchAddressBalance(address) };
        } catch (err) {
          return {
            id,
            error: err instanceof InvalidAddressError ? "invalid" : "network",
          };
        }
      }),
    );

    const byId = new Map(settled.map((outcome) => [outcome.id, outcome]));

    setWalletsRef.current(
      walletsRef.current.map((wallet) => {
        const outcome = byId.get(wallet.id);
        if (!outcome || !("balance" in outcome)) return wallet;
        return {
          ...wallet,
          btc: toSatPrecision(outcome.balance.btc),
          lastSyncedAt: new Date().toISOString(),
        };
      }),
    );

    setErrors((prev) => {
      const next = { ...prev };
      for (const outcome of settled) {
        if ("balance" in outcome) delete next[outcome.id];
        else next[outcome.id] = outcome.error;
      }
      return next;
    });

    setSources((prev) => {
      const next = { ...prev };
      for (const outcome of settled) {
        if ("balance" in outcome) next[outcome.id] = outcome.balance.source;
      }
      return next;
    });

    if (runTokenRef.current === token) {
      setSyncingIds([]);
    }
  }, []);

  const syncAll = useCallback(() => {
    void runSync(walletsRef.current);
  }, [runSync]);

  const syncOne = useCallback(
    (walletId: string) => {
      void runSync(walletsRef.current.filter((wallet) => wallet.id === walletId));
    },
    [runSync],
  );

  const bindAddress = useCallback(
    (address: string, name: string): BindResult => {
      const normalized = normalizeAddress(address);
      if (!isValidBitcoinAddress(normalized)) {
        return { ok: false, reason: "invalid" };
      }

      const current = walletsRef.current;
      const alreadyBound = current.some(
        (wallet) =>
          wallet.source?.kind === "address" &&
          wallet.source.address === normalized,
      );
      if (alreadyBound) return { ok: false, reason: "duplicate" };

      const id = createWalletId();
      const wallet: BtcWallet = {
        id,
        name: name.trim().slice(0, 40) || formatAddressShort(normalized),
        btc: 0,
        costBasis: 0,
        source: { kind: "address", address: normalized, chain: "bitcoin" },
      };

      // Flag it as in-flight *before* it renders so the row shows a placeholder
      // rather than a misleading 0 BTC for the first second. The auto-refresh
      // effect keys off the bound-address list, so it picks this wallet up on
      // the next render — no fetch needs to be kicked off here.
      setSyncingIds((prev) => [...prev, id]);
      setWalletsRef.current([...current, wallet]);

      return { ok: true, walletId: id };
    },
    [],
  );

  const unbind = useCallback((walletId: string) => {
    setWalletsRef.current(
      walletsRef.current.map((wallet) => {
        if (wallet.id !== walletId) return wallet;
        // Drop the source and the sync timestamp but keep the last synced
        // amount, so unbinding never silently zeroes someone's holdings.
        return {
          id: wallet.id,
          name: wallet.name,
          btc: wallet.btc,
          costBasis: wallet.costBasis,
        };
      }),
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[walletId];
      return next;
    });
    setSources((prev) => {
      const next = { ...prev };
      delete next[walletId];
      return next;
    });
  }, []);

  // Re-run whenever the set of bound addresses changes (first bind, unbind,
  // address edit) and then on a fixed interval. Keying off a derived string —
  // not the wallets array — keeps a sync from retriggering itself, since every
  // successful sync writes a new wallets array.
  const addressKey = useMemo(
    () =>
      wallets
        .flatMap((wallet) =>
          wallet.source?.kind === "address"
            ? [`${wallet.id}:${wallet.source.address}`]
            : [],
        )
        .join("|"),
    [wallets],
  );

  useEffect(() => {
    if (!addressKey) return;

    void runSync(walletsRef.current);
    const timer = setInterval(() => {
      void runSync(walletsRef.current);
    }, HOLDINGS_SYNC_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [addressKey, runSync]);

  return {
    syncingIds,
    errors,
    sources,
    syncAll,
    syncOne,
    bindAddress,
    unbind,
  };
}
