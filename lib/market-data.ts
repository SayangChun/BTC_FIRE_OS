/**
 * Market data access with automatic source fallback.
 *
 * Why this exists: the primary Binance host (api.binance.com) is unreachable on
 * some networks/regions, which used to leave the dashboard stuck on the
 * hardcoded placeholder price. Every read below walks an ordered list of
 * independent endpoints and returns the first usable answer, so the UI keeps
 * working and can tell the user which source it is showing.
 *
 * Pure TypeScript (no React imports) — safe to use from any hook.
 */

export type MarketSourceId =
  | "binance"
  | "binance-vision"
  | "coingecko"
  | "mempool";

/** Display names for the sources (proper nouns, not translated). */
export const MARKET_SOURCE_LABELS: Record<MarketSourceId, string> = {
  binance: "Binance",
  "binance-vision": "Binance Data API",
  coingecko: "CoinGecko",
  mempool: "mempool.space",
};

/** The default source. Anything else is surfaced in the UI as a backup source. */
export const PRIMARY_SOURCE: MarketSourceId = "binance";

export function isPrimarySource(source: MarketSourceId | null): boolean {
  return source === PRIMARY_SOURCE;
}

/** Binance REST hosts, in preferred order (api.binance.com first). */
export const BINANCE_API_BASES = [
  "https://api.binance.com",
  "https://data-api.binance.vision",
] as const;

/** Binance trade streams, in preferred order (official mirror second). */
export const BINANCE_WS_TRADE_STREAMS: readonly {
  url: string;
  source: MarketSourceId;
}[] = [
  {
    url: "wss://stream.binance.com:9443/ws/btcusdt@trade",
    source: "binance",
  },
  {
    url: "wss://data-stream.binance.vision/ws/btcusdt@trade",
    source: "binance-vision",
  },
];

/** Per-request timeout so one unreachable host cannot stall the whole chain. */
const REQUEST_TIMEOUT_MS = 5_000;

export type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

type SpotPriceSource = {
  id: MarketSourceId;
  url: string;
  parse: (payload: unknown) => number | null;
};

const BINANCE_TICKER_PATH = "/api/v3/ticker/price?symbol=BTCUSDT";

/**
 * Spot price endpoints, tried in order. The first two are Binance hosts; the
 * last two are independent third parties so a Binance-wide block/outage still
 * yields a usable price. Order after Binance is by observed reliability:
 * mempool.space is Bitcoin-native with generous rate limits, CoinGecko's free
 * tier is rate-limited and sometimes unreachable, so it goes last.
 */
const SPOT_PRICE_SOURCES: readonly SpotPriceSource[] = [
  {
    id: "binance",
    url: `https://api.binance.com${BINANCE_TICKER_PATH}`,
    parse: (payload) => toPositiveNumber((payload as { price?: string })?.price),
  },
  {
    id: "binance-vision",
    url: `https://data-api.binance.vision${BINANCE_TICKER_PATH}`,
    parse: (payload) => toPositiveNumber((payload as { price?: string })?.price),
  },
  {
    id: "mempool",
    url: "https://mempool.space/api/v1/prices",
    parse: (payload) => toPositiveNumber((payload as { USD?: number })?.USD),
  },
  {
    id: "coingecko",
    url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    parse: (payload) =>
      toPositiveNumber(
        (payload as { bitcoin?: { usd?: number } })?.bitcoin?.usd,
      ),
  },
];

const COINGECKO_MARKET_CHART = (days: number) =>
  `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`;

export type SpotQuote = {
  price: number;
  source: MarketSourceId;
};

/**
 * Fetch a BTC/USD spot price, walking the source list in order.
 * `preferred` (a source that answered before) is tried first so a blocked
 * primary host is not re-probed on every poll.
 */
export async function fetchSpotPrice(
  signal?: AbortSignal,
  preferred?: MarketSourceId | null,
): Promise<SpotQuote> {
  const sources = orderByPreference([...SPOT_PRICE_SOURCES], preferred, (s) => s.id);
  let lastError: unknown = null;

  for (const source of sources) {
    if (signal?.aborted) throw abortError();
    try {
      const payload = await fetchJson(source.url, signal);
      const price = source.parse(payload);
      if (price !== null) {
        return { price, source: source.id };
      }
      lastError = new Error(`Unexpected payload from ${source.id}`);
    } catch (err) {
      if (signal?.aborted) throw abortError();
      lastError = err;
    }
  }

  throw lastError ?? new Error("No spot price source available");
}

export type KlineQuery = {
  interval: string;
  limit: number;
  startTime?: number;
};

export type KlinesResult = {
  klines: BinanceKline[];
  base: string;
};

/** Fetch klines from the first reachable Binance host. */
export async function fetchKlines(
  query: KlineQuery,
  signal?: AbortSignal,
  preferredBase?: string | null,
): Promise<KlinesResult> {
  const bases = orderByPreference([...BINANCE_API_BASES], preferredBase, (b) => b);
  let lastError: unknown = null;

  for (const base of bases) {
    if (signal?.aborted) throw abortError();
    try {
      return await fetchKlinesFromBase(base, query, signal);
    } catch (err) {
      if (signal?.aborted) throw abortError();
      lastError = err;
    }
  }

  throw lastError ?? new Error("No kline source available");
}

export type DailyClose = {
  date: Date;
  close: number;
};

export type DailyCloses = {
  points: DailyClose[];
  source: MarketSourceId;
};

/**
 * Fetch the most recent daily closes for BTC/USD.
 * Binance hosts first, then CoinGecko's market chart as a last resort.
 */
export async function fetchDailyCloses(
  limit: number,
  signal?: AbortSignal,
): Promise<DailyCloses> {
  let lastError: unknown = null;

  for (const base of BINANCE_API_BASES) {
    if (signal?.aborted) throw abortError();
    const source: MarketSourceId = base.includes("binance.vision")
      ? "binance-vision"
      : "binance";
    try {
      const { klines } = await fetchKlinesFromBase(
        base,
        { interval: "1d", limit },
        signal,
      );
      const points = klines
        .map((kline) => ({ date: new Date(kline[0]), close: Number(kline[4]) }))
        .filter(isValidClose);
      if (points.length > 0) {
        return { points, source };
      }
      lastError = new Error(`Empty klines from ${base}`);
    } catch (err) {
      if (signal?.aborted) throw abortError();
      lastError = err;
    }
  }

  try {
    const payload = await fetchJson(COINGECKO_MARKET_CHART(limit), signal);
    const prices = (payload as { prices?: [number, number][] })?.prices ?? [];
    const points = prices
      .map((entry) => ({ date: new Date(entry[0]), close: Number(entry[1]) }))
      .filter(isValidClose)
      .slice(-limit);
    if (points.length > 0) {
      return { points, source: "coingecko" };
    }
  } catch (err) {
    if (signal?.aborted) throw abortError();
    lastError = err;
  }

  throw lastError ?? new Error("No daily close source available");
}

async function fetchKlinesFromBase(
  base: string,
  query: KlineQuery,
  signal?: AbortSignal,
): Promise<KlinesResult> {
  const params = new URLSearchParams({
    symbol: "BTCUSDT",
    interval: query.interval,
    limit: String(query.limit),
  });
  if (query.startTime !== undefined) {
    params.set("startTime", String(query.startTime));
  }

  const payload = await fetchJson(`${base}/api/v3/klines?${params}`, signal);
  if (!Array.isArray(payload)) {
    throw new Error(`Unexpected klines payload from ${base}`);
  }

  return { klines: payload as BinanceKline[], base };
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener("abort", onOuterAbort);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}

function orderByPreference<T, K>(
  list: T[],
  preferred: K | null | undefined,
  keyOf: (item: T) => K,
): T[] {
  if (preferred === null || preferred === undefined) return list;
  const index = list.findIndex((item) => keyOf(item) === preferred);
  if (index <= 0) return list;
  return [list[index], ...list.slice(0, index), ...list.slice(index + 1)];
}

function toPositiveNumber(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  return isPositive(parsed) ? parsed : null;
}

function isValidClose(point: DailyClose): boolean {
  return (
    point.date instanceof Date &&
    !Number.isNaN(point.date.getTime()) &&
    isPositive(point.close)
  );
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

export function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "AbortError"
  );
}
