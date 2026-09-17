# BTC FIRE OS — AGENTS.md

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at `http://localhost:3000` |
| `npm run build` | Production build (server + static pages) |
| `npm run lint` | Only linter (`next lint`) |
| `npm run start` | Serve the production build locally |

No test runner, formatter, or typecheck script exists. Do not add any.

## Architecture

- **SPA only** — `app/page.tsx` is `"use client"`. All `hooks/` are client-only. No server components.
- **Single scrollable page, no tabs** — 8 modules (`dashboard`, `ahr999`, `portfolio`, `fire`, `dca`, `scenario`, `future`, `chart`) rendered as reorderable rows (`ModuleList` in page.tsx). Pair rows hold two modules side-by-side and can be swapped; the layout persists under `btc-fire-os:module-rows:v2`.
- **API proxy** — `app/api/webdav/route.ts` proxies WebDAV requests server-side to bypass browser CORS.
- **Path alias** — `@/*` → repo root (tsconfig.json).
- **State** — All inputs use `usePersistentState` with `btc-fire-os:*` keys. One-way hydration: always render from caller `initialValue`, apply storage in effects only.
- **Wallets are source of truth** — `wallets: BtcWallet[]`. Legacy `btc-holdings` / `average-cost-basis` keys are deleted on load (page.tsx:195, use-persistent-state.ts:51). `DEFAULT_WALLETS` is intentionally **empty** — new installs start with no holdings and are offered demo data (`lib/demo-data.ts`) instead.
- **Dark only** — `<html className="dark">` hardcoded in layout.tsx.
- **i18n** — `lib/i18n.ts` (zhCN / zhTW / en). Any new string must be added to all three languages, or `t.x.y` union access fails to typecheck. Choice persisted. Formatting in `lib/calculations.ts`.
- **Version** — single source is `package.json`. `next.config.ts` reads it and injects `NEXT_PUBLIC_APP_VERSION`; `lib/app-info.ts` exposes it plus the repo/changelog URLs; the site footer renders it. Bump the version only when cutting a release (see `CHANGELOG.md`).

## Data fetching (client-side only)

All market data goes through **`lib/market-data.ts`** — never fetch a Binance URL directly from a hook.

| Hook | Source (in fallback order) | Frequency |
|------|---------------------------|-----------|
| `use-btc-price` | Binance WS (`stream.binance.com` → `data-stream.binance.vision`) + spot REST (`api.binance.com` → `data-api.binance.vision` → `mempool.space` → CoinGecko) | live + 30s poll |
| `use-ahr999` | daily closes (`api.binance.com` → `data-api.binance.vision` → CoinGecko market chart), 200d average | 1h poll |
| `use-ahr999-frequency` | same daily-close chain | on mount + 1h |
| `use-btc-price-history` | Binance klines via `fetchKlines` (2017-08 onward, sticky base host) | on mount (12h localStorage cache) |
| `use-exchange-rate` | exchangerate-api.com | 5min poll |

- Every request has a 5s timeout (`lib/market-data.ts`), `cache: "no-store"`, and abort controllers.
- The working source is remembered ("sticky") and the primary is re-probed every 20 polls; the REST poll is rate-limited to one attempt per 10s so a failing WS reconnect loop cannot hammer the APIs.
- `hooks/use-btc-price.ts` exposes `source`, `usingFallbackSource` and `isPlaceholder`. **Any number derived from the BTC price must render a `<Skeleton />` while `isPlaceholder` is true** — the hardcoded `$100,000` placeholder must never be shown as a live value.
- `hooks/use-ahr999.ts` exposes `status: "loading" | "ready" | "stale" | "error"`. `stale` means "restored from local cache" and must keep rendering the value together with its last-updated time.
- Cached keys: `btc-fire-os:last-price:v1`, `btc-fire-os:ahr999-average200:v1`, `btc-fire-os:btc-price-history:v1`.
- The only env var is `NEXT_PUBLIC_APP_VERSION`, injected by `next.config.ts`. No `.env` files.

## Domain rules

- **Inflation is one global assumption** — `btc-fire-os:inflation-rate` (default `DEFAULT_ANNUAL_INFLATION_RATE = 0.025` in `lib/calculations.ts`). Anything that grows a target over time must use `inflateValue()` and must be applied in **both** `buildPriceProjection` and `projectDcaFire`; otherwise the Future FIRE Forecast and the DCA planner disagree about the FIRE date (this bug has been fixed once already).
- Scenario prices are user-editable and persisted (`btc-fire-os:scenario-prices`); defaults live in `lib/mock-data.ts` (`DEFAULT_SCENARIO_PRICES`, `buildScenarios`).
- Export / import / WebDAV backups enumerate keys explicitly in `components/data-settings.tsx` — a new persisted key must be added to every key map, the field-label maps and the reset defaults.

## Deployment

`npm run build` produces a server build with static pages. Deploy to Vercel or any Node.js host (API routes require a server). Pushing to `main` triggers the Vercel production deploy.

## Conventions

- `lib/` = pure TS (no React imports).
- `components/ui/` = minimal presentational (only `@radix-ui/react-label` beyond that). Loading placeholders use `components/ui/skeleton.tsx`.
- Charts: `recharts` (cost line uses `ReferenceLine` with `ifOverflow="discard"`; keep downsampling at ≤420 points).
- No generated code, migrations, or codegen.
- Custom Tailwind colors defined directly in `tailwind.config.ts` (no CSS vars for the palette).
- Release flow: bump `package.json` → update `CHANGELOG.md` (bilingual) → commit → annotated tag `vX.Y.Z` → push branch + tag.
