/**
 * On-chain balance lookup for user-supplied BTC addresses.
 *
 * Why this exists: a hand-typed holdings number goes stale the moment you buy,
 * sell or move coins, which silently corrupts every FIRE projection on the
 * dashboard. Binding an address lets the app refresh that number itself.
 *
 * Read-only by design — we never ask for a private key, a seed phrase or an
 * exchange API secret. The address is the only thing that leaves the browser,
 * and it is sent to public block explorers over plain GET requests.
 *
 * Both endpoints below are Esplora instances that answer with
 * `Access-Control-Allow-Origin: *`, so this runs entirely client-side: no API
 * route, no server-side state, nothing to leak. Ordered list + first usable
 * answer, same philosophy as lib/market-data.ts.
 *
 * Pure TypeScript (no React imports) — safe to use from any hook.
 */

export type AddressSourceId = "mempool" | "blockstream";

/** Display names for the sources (proper nouns, not translated). */
export const ADDRESS_SOURCE_LABELS: Record<AddressSourceId, string> = {
  mempool: "mempool.space",
  blockstream: "Blockstream",
};

/** Esplora instances, in preferred order. Both speak the identical API. */
const ESPLORA_SOURCES: readonly { id: AddressSourceId; base: string }[] = [
  { id: "mempool", base: "https://mempool.space/api" },
  { id: "blockstream", base: "https://blockstream.info/api" },
];

/** Per-request timeout so one unreachable explorer cannot stall the refresh. */
const REQUEST_TIMEOUT_MS = 8_000;

const SATS_PER_BTC = 100_000_000;

/** Base58 P2PKH (`1…`) and P2SH (`3…`) — legacy and wrapped segwit. */
const LEGACY_ADDRESS_RE = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

/** Bech32 / bech32m (`bc1…`) — native segwit v0 and taproot, lowercase per BIP-173. */
const BECH32_ADDRESS_RE = /^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{11,71}$/;

/** Thrown when an address is malformed — the UI shows a "check the address" hint. */
export class InvalidAddressError extends Error {
  constructor(address: string) {
    super(`Not a valid Bitcoin address: ${address}`);
    this.name = "InvalidAddressError";
  }
}

/**
 * Trim whitespace and fold an all-caps bech32 address to lowercase.
 * BIP-173 forbids mixed case, but wallets and QR scanners routinely hand back
 * `BC1…`, and rejecting it would be pedantic rather than safe.
 */
export function normalizeAddress(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
  return /^bc1/i.test(trimmed) ? trimmed.toLowerCase() : trimmed;
}

/**
 * Format check only (charset, prefix, length).
 *
 * The Base58/bech32 checksum is deliberately *not* verified here: doing it
 * properly means shipping SHA-256 and bech32 implementations for no extra
 * safety, because the explorer validates the checksum anyway and answers with
 * HTTP 400 — which we surface as `InvalidAddressError` below.
 */
export function isValidBitcoinAddress(value: string): boolean {
  const address = normalizeAddress(value);
  return LEGACY_ADDRESS_RE.test(address) || BECH32_ADDRESS_RE.test(address);
}

/** Middle-truncated address for tight UI (`bc1qab…7x9k`). */
export function formatAddressShort(
  address: string,
  lead = 6,
  tail = 4,
): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export type AddressBalance = {
  address: string;
  /** Confirmed + unconfirmed, in BTC. This is the number a wallet row shows. */
  btc: number;
  confirmedBtc: number;
  /** Incoming coins still sitting in the mempool. Zero for a quiet address. */
  unconfirmedBtc: number;
  txCount: number;
  source: AddressSourceId;
};

type EsploraAddressStats = {
  funded_txo_sum?: number;
  spent_txo_sum?: number;
  tx_count?: number;
};

type EsploraAddressPayload = {
  chain_stats?: EsploraAddressStats;
  mempool_stats?: EsploraAddressStats;
};

/**
 * Read the balance of a single address, walking the explorer list in order.
 * Throws `InvalidAddressError` for a malformed address (no point retrying that
 * against a second explorer) and a plain `Error` when every source failed.
 */
export async function fetchAddressBalance(
  address: string,
): Promise<AddressBalance> {
  const normalized = normalizeAddress(address);
  if (!isValidBitcoinAddress(normalized)) {
    throw new InvalidAddressError(address);
  }

  let lastError: unknown = null;

  for (const source of ESPLORA_SOURCES) {
    try {
      const payload = await fetchJson(`${source.base}/address/${normalized}`);
      const balance = parseEsploraAddress(normalized, payload, source.id);
      if (balance) return balance;
      lastError = new Error(`Unexpected payload from ${source.id}`);
    } catch (err) {
      // A malformed address is the caller's problem, not the explorer's —
      // do not burn a second request on it.
      if (err instanceof InvalidAddressError) throw err;
      lastError = err;
    }
  }

  throw lastError ?? new Error("No address balance source available");
}

function parseEsploraAddress(
  address: string,
  payload: unknown,
  source: AddressSourceId,
): AddressBalance | null {
  const data = payload as EsploraAddressPayload | null;
  const chain = data?.chain_stats;
  const mempool = data?.mempool_stats;

  const confirmedSats = netSats(chain);
  if (confirmedSats === null) return null;

  // An address can legitimately receive coins that are still unconfirmed; the
  // spent side of mempool_stats covers outgoing spends, so the net delta is
  // what the user actually controls right now.
  const unconfirmedSats = netSats(mempool) ?? 0;
  const totalSats = confirmedSats + unconfirmedSats;
  if (totalSats < 0) return null;

  return {
    address,
    btc: totalSats / SATS_PER_BTC,
    confirmedBtc: confirmedSats / SATS_PER_BTC,
    unconfirmedBtc: unconfirmedSats / SATS_PER_BTC,
    txCount: (chain?.tx_count ?? 0) + (mempool?.tx_count ?? 0),
    source,
  };
}

/** funded − spent, or null when the payload is not a usable stats object. */
function netSats(stats: EsploraAddressStats | undefined): number | null {
  if (!stats) return null;
  const funded = stats.funded_txo_sum;
  const spent = stats.spent_txo_sum;
  if (!isFiniteSats(funded) || !isFiniteSats(spent)) return null;
  return funded - spent;
}

function isFiniteSats(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.status === 400) {
      // Both Esplora instances answer 400 for a bad checksum.
      throw new InvalidAddressError(url.split("/address/")[1] ?? url);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
