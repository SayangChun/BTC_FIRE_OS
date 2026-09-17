# BTC FIRE OS

**Bitcoin-native FIRE dashboard** for long-term holders.

> **🌐 Languages**
> [English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

**Current version: 0.2.0** — [Changelog](CHANGELOG.md) · [Releases](https://github.com/SayangChun/BTC_FIRE_OS/releases)

Track your BTC portfolio in real time, calculate how close you are to Financial Independence, Retire Early (FIRE), run price scenarios, follow the AHR999 Bitcoin accumulation indicator (classic + 3D recalibrated), and plan DCA buys — all in a fast, private, zero-backend web app.

- Live market data with automatic multi-source fallback (Binance → Binance Data API mirror → mempool.space → CoinGecko)
- 100% client-side — nothing leaves your browser
- Server-side API proxy for WebDAV cloud backup (no CORS issues)
- Trilingual: 简体中文 / 繁體中文 / English

## Features

**Live Data**
- Real-time BTC/USD (and CNY) price via Binance WebSocket + 30s REST polling, with the trade stream rotating to the official `data-stream.binance.vision` mirror when the primary host is unreachable
- **Automatic source fallback** for price and daily closes: `api.binance.com` → `data-api.binance.vision` → `mempool.space` → CoinGecko, with a 5s timeout per request. The status line always tells you which source is live (`Live` / `Polling` / `Cached` / `Offline`, plus "Backup source: …" when a fallback is in use)
- **Never shows a fake price**: the last known price is cached locally and shown as `Cached` with a timestamp, and every price-derived number renders a skeleton until a real quote arrives — the placeholder is never presented as live
- AHR999 indicator dual display — **ahr999** (classic) and **ahr999-3D** (recalibrated) with fitted prices and buy suggestions (increase / normal / stop). If the 200-day average cannot be fetched, the last cached value is reused with a "last updated" timestamp and a cached-data badge
- Power Law price projections (1 / 5 / 10 year) across bear / base / bull scenarios
- USD ↔ CNY exchange rate from exchangerate-api.com with 5 min polling

**Portfolio & FIRE**
- Multi-wallet manager: add, rename, remove wallets — each with independent holdings and cost basis
- Portfolio value, weighted average cost basis, unrealized P/L (absolute + %)
- Global address top percentile — see where your stack ranks among all Bitcoin addresses
- FIRE calculator (4% rule by default, fully adjustable with quick-select 3% / 3.5% / 4% buttons)
- **Optional expected annual inflation rate** (default 2.5%, set 0 to ignore) so the target grows over time, with a today / 5y / 10y / 20y target preview
- Required BTC to reach your target + progress bar
- Other assets, annual return rate, and monthly cashflow support
- BTC units: BTC / mBTC / bits / sat (switchable, persisted globally)

**Scenarios & Planning**
- Bear / Base / Bull price scenario simulator with FIRE readiness check — **all three prices are editable** and persisted (defaults $50K / $100K / $250K, with one-click reset)
- DCA FIRE planner: set daily DCA amount, project long-term accumulation with other assets and cashflow, including the inflation-adjusted target at the projected FIRE date
- Estimated FIRE timing (years + months + projected date), or quick-try +$50 button if 40-year target isn't reached
- Accumulation chart: historical BTC price (2017 onward) with a **weighted-average cost line** (auto-hidden when it falls outside the visible range) and P/L vs cost in the tooltip, plus a range selector (ALL / 5Y / 3Y / 1Y / 6M / 3M / 1M) and brush slider

**Experience**
- Single scrollable page — 8 modules laid out in reorderable rows (no tabs)
- Pair rows place two modules side-by-side (responsive: stacked on mobile)
- Reorder rows with ↑/↓ (pair rows move together); swap sides with ↔ inside pair rows; reset to the default layout with one click
- Layout persisted to localStorage, with dismissible tip banner
- Default prioritizes personal data first (FIRE summary, portfolio, dashboard)
- **Starts empty and honest**: new installs have no holdings, with a first-run banner and a **one-click demo portfolio** (sample wallets, expenses, DCA plan) to explore every module instantly
- Currency toggle: USD ↔ CNY across all fiat displays
- BTC units: BTC / mBTC / bits / sat (unit-sensitive input: sat mode uses integers)
- Data backup/restore + reset via settings dropdown (JSON export/import)
- WebDAV cloud backup: configure server, upload/download backups via settings (proxied through API to bypass CORS)
- Fully persisted to localStorage (no login, survives refresh)
- ErrorBoundary wraps the entire app to catch rendering failures gracefully
- Dark mode only, responsive, PWA manifest included
- Fast and works offline after the first load — cached price, AHR999 average and price history keep the dashboard usable, with the data source clearly labelled
- Chart downsampled to max 420 points for smooth performance

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Production build

```bash
npm run build     # server build with static pages
npm run start     # serve the built app locally
npm run lint
```

A convenience script `start-website.bat` is included (Windows) — installs deps if needed, runs dev server, and opens the browser.

## Deploy to Vercel (recommended)

1. Push to a GitHub repo.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Next.js — deploy with zero config.
4. The API route (`/api/webdav`) runs as a serverless function, proxying WebDAV requests to bypass browser CORS restrictions.

### Deploy to GitHub Pages (static, no WebDAV)

You can still export a static version (without WebDAV cloud backup):

```bash
npm run build     # outputs to out/
```

`next.config.ts` sets `basePath`/`assetPrefix` automatically when `GITHUB_ACTIONS=true`.

## Privacy & Data

- No database, no analytics.
- All state lives in your browser's localStorage.
- Only public market data is fetched (Binance hosts, mempool.space, CoinGecko, exchangerate-api.com). The app falls back automatically if one of them is unreachable.
- WebDAV cloud backup is opt-in — credentials stored in localStorage, proxied through API (never logged).
- AdSense script is loaded for non-intrusive ad display (no personal data collected).
- Safe to use with sensitive portfolio numbers.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS with custom dark palette (radial gradient background)
- Recharts for the accumulation chart (cost line included)
- Lucide React for icons
- Pure functions in `lib/` (no React) for all calculations
- `lib/market-data.ts` — single market data access layer with ordered source fallback, request timeouts and abort support
- Client-only data hooks (`hooks/`) with graceful fallbacks and abort controllers
- One-way `usePersistentState` hook for localStorage hydration with legacy key migration
- Server-side API route for WebDAV proxy (bypasses browser CORS)

## Project Structure

```
app/
  layout.tsx          # metadata, dark html, ErrorBoundary, AdSense
  page.tsx            # main SPA ("use client"), 8 reorderable module rows, sidebar, footer version badge
  globals.css         # Tailwind directives, radial gradient, input spinner hide
  api/webdav/
    route.ts          # server-side WebDAV proxy (PROPFIND/PUT/GET/DELETE/MKCOL)
components/
  ahr999-card.tsx            # ahr999 + ahr999-3D dual indicator (with cached-data state)
  accumulation-chart.tsx     # price history chart with cost line + brush + range selector
  dashboard-metrics.tsx      # price, portfolio value, cost basis, P/L
  dca-fire-planner-card.tsx  # DCA inputs, other assets, projected FIRE timing
  fire-calculator.tsx        # monthly expenses, withdrawal rate, optional inflation, progress bar
  future-fire-card.tsx       # Power Law projections 1/5/10y
  portfolio-input.tsx        # multi-wallet manager, BTC unit selector, address top %, demo-data entry
  scenario-simulator.tsx     # bear / base / bull scenarios with editable prices
  data-settings.tsx          # export / import / demo data / reset / WebDAV cloud backup dropdown
  error-boundary.tsx         # class-based React error boundary
  logo-mark.tsx              # SVG logo
  ui/                        # minimal Card, Button, Input, Label, Skeleton
hooks/                  # use-btc-price, use-ahr999, use-btc-price-history, use-ahr999-frequency, use-exchange-rate, use-persistent-state
lib/                    # pure TS (no React): market-data, demo-data, app-info, calculations, ahr999, dca-fire, price-projection, i18n, types, mock-data, webdav
public/                 # icons + webmanifest (PWA)
```

## Commands

| Command       | Description                     |
|---------------|---------------------------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build (server + static) |
| `npm run start` | Serve the built app locally |
| `npm run lint`  | Run Next.js ESLint              |

No tests, formatter, or typecheck scripts exist. Do not add any.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Releases are tagged `vX.Y.Z` and
documented in [CHANGELOG.md](CHANGELOG.md). The version in `package.json` is injected at build time
(`next.config.ts`) and rendered in the site footer, so the tag, the changelog and the running app
always agree.

## License

Licensed under the [Apache License 2.0](LICENSE).

---

Made for Bitcoin HODLers who want to plan their exit to freedom.
