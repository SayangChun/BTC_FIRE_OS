# BTC FIRE OS — AGENTS.md

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at `http://localhost:3000` |
| `npm run build` | Static export to `out/` |
| `npm run lint` | Only linter (`next lint`) |
| `npm run start` | Serve built `out/` locally |

No test runner, formatter, or typecheck script exists. Do not add any.

## Architecture

- **SPA only** — `app/page.tsx` is `"use client"`. All `hooks/` are client-only. No server components or API routes.
- **Static export** — `next.config.ts`: `output: "export"`, `trailingSlash: true`. `basePath`/`assetPrefix` are set only in GitHub Actions for project sites.
- **Path alias** — `@/*` → repo root (tsconfig.json).
- **Three tabs** — `"general"` (AHR999 + chart), `"my"` (portfolio + FIRE), `"plan"` (DCA planner + scenarios + future). Toggled in `NavSidebar` (page.tsx:717).
- **State** — All inputs use `usePersistentState` with `btc-fire-os:*` keys. One-way hydration: always render from caller `initialValue`, apply storage in effects only.
- **Wallets are source of truth** — `wallets: BtcWallet[]`. Legacy `btc-holdings` / `average-cost-basis` keys are deleted on load (page.tsx:195, use-persistent-state.ts:51).
- **Dark only** — `<html className="dark">` hardcoded in layout.tsx.
- **i18n** — `lib/i18n.ts` (zhCN / zhTW / en). Choice persisted. Formatting in `lib/calculations.ts`.

## Data fetching (client-side only)

| Hook | Source | Frequency |
|------|--------|-----------|
| `use-btc-price` | Binance WS + REST fallback | live + 30s poll |
| `use-ahr999` | Binance daily klines (200d avg) | 1h poll |
| `use-ahr999-frequency` | Binance daily klines | on mount + 1h |
| `use-btc-price-history` | Binance klines (2017-08 onward) | on mount (12h localStorage cache) |
| `use-exchange-rate` | exchangerate-api.com | 5min poll |

All use `cache: "no-store"`, abort controllers, and mount with fallbacks. No env vars.

## Deployment

`npm run build` → `out/`. No `.github/workflows` directory exists. Any CI / Pages deploy must be supplied externally.

## Conventions

- `lib/` = pure TS (no React imports).
- `components/ui/` = minimal presentational (only `@radix-ui/react-label` beyond that).
- Charts: `recharts`.
- No generated code, migrations, or codegen.
- No `.env` files.
- Custom Tailwind colors defined directly in `tailwind.config.ts` (no CSS vars for the palette).
