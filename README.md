# BTC FIRE OS

**Bitcoin-native FIRE dashboard** for long-term holders.

> **🌐 Languages**
> [English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

Track your BTC portfolio in real time, calculate how close you are to Financial Independence, Retire Early (FIRE), run price scenarios, follow the AHR999 Bitcoin accumulation indicator (classic + 3D recalibrated), and plan DCA buys — all in a fast, private, zero-backend web app.

- Live data from Binance (price + AHR999)
- 100% client-side • nothing leaves your browser
- Static export → works on GitHub Pages with no server
- Trilingual: 简体中文 / 繁體中文 / English

## Features

**Live Data**
- Real-time BTC/USD (and CNY) price via Binance WebSocket + 30s REST fallback with connection status (live / polling / offline)
- AHR999 indicator dual display — **ahr999** (classic) and **ahr999-3D** (recalibrated) with fitted prices and buy suggestions (increase / normal / stop)
- Power Law price projections (1 / 5 / 10 year) across bear / base / bull scenarios
- USD ↔ CNY exchange rate from exchangerate-api.com with 5 min polling

**Portfolio & FIRE**
- Multi-wallet manager: add, rename, remove wallets — each with independent holdings and cost basis
- Portfolio value, weighted average cost basis, unrealized P/L (absolute + %)
- Global address top percentile — see where your stack ranks among all Bitcoin addresses
- FIRE calculator (4% rule by default, fully adjustable with quick-select 3% / 3.5% / 4% buttons)
- Required BTC to reach your target + progress bar
- Other assets, annual return rate, and monthly cashflow support
- BTC units: BTC / mBTC / bits / sat (switchable, persisted globally)

**Scenarios & Planning**
- Bear ($50K) / Base ($100K) / Bull ($250K) price scenario simulator with FIRE readiness check
- DCA FIRE planner: set daily DCA amount, project long-term accumulation with other assets and cashflow
- Estimated FIRE timing (years + months + projected date), or quick-try +$50 button if 40-year target isn't reached
- Accumulation chart: historical BTC price (2017 onward) with your holdings overlay, range selector (ALL / 5Y / 3Y / 1Y / 6M / 3M / 1M), and brush slider

**Experience**
- Single scrollable page — 8 modules laid out in reorderable rows (no tabs)
- Pair rows place two modules side-by-side (responsive: stacked on mobile)
- Reorder rows with ↑/↓ (pair rows move together); swap sides with ↔ inside pair rows
- Layout persisted to localStorage, with dismissible tip banner
- Default prioritizes personal data first (FIRE summary, portfolio, dashboard)
- Currency toggle: USD ↔ CNY across all fiat displays
- BTC units: BTC / mBTC / bits / sat (unit-sensitive input: sat mode uses integers)
- Data backup/restore + reset via settings dropdown (JSON export/import)
- Fully persisted to localStorage (no login, survives refresh)
- ErrorBoundary wraps the entire app to catch rendering failures gracefully
- Dark mode only, responsive, PWA manifest included
- Fast and works completely offline after first load (except live price updates)
- Chart downsampled to max 420 points for smooth performance

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Production build (static)

```bash
npm run build     # outputs to out/
npm run start     # serve the exported site locally
npm run lint
```

A convenience script `start-website.bat` is included (Windows) — installs deps if needed, runs dev server, and opens the browser.

## Deploy to GitHub Pages (free, no backend)

1. Push to a GitHub repo.
2. Go to **Settings → Pages**.
3. Set **Source** to "GitHub Actions".
4. Push to `main`. Build with `npm run build` (outputs to `out/`) and deploy the static files.

The site will be available at:
- `https://<user>.github.io/` (user/org site)
- `https://<user>.github.io/<repo>/` (project site)

`next.config.ts` sets `basePath`/`assetPrefix` automatically when `GITHUB_ACTIONS=true` (project sites only). No workflow file is included in the repo.

## Privacy & Data

- No server, no database, no analytics.
- All state lives in your browser's localStorage.
- Only public market data is fetched (Binance + exchangerate-api.com).
- AdSense script is loaded for non-intrusive ad display (no personal data collected).
- Safe to use with sensitive portfolio numbers.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS with custom dark palette (radial gradient background)
- Recharts for the accumulation chart
- Lucide React for icons
- Pure functions in `lib/` (no React) for all calculations
- Client-only data hooks (`hooks/`) with graceful fallbacks and abort controllers
- One-way `usePersistentState` hook for localStorage hydration with legacy key migration

## Project Structure

```
app/
  layout.tsx          # metadata, dark html, ErrorBoundary, AdSense
  page.tsx            # main SPA ("use client"), 8 reorderable module rows, sidebar, all state via usePersistentState
  globals.css         # Tailwind directives, radial gradient, input spinner hide
components/
  ahr999-card.tsx            # ahr999 + ahr999-3D dual indicator
  accumulation-chart.tsx     # price history chart with brush + range selector
  dashboard-metrics.tsx      # price, portfolio value, cost basis, P/L
  dca-fire-planner-card.tsx  # DCA inputs, other assets, projected FIRE timing
  fire-calculator.tsx        # monthly expenses, withdrawal rate, progress bar
  future-fire-card.tsx       # Power Law projections 1/5/10y
  portfolio-input.tsx        # multi-wallet manager, BTC unit selector, address top %
  scenario-simulator.tsx     # bear / base / bull scenarios
  data-settings.tsx          # export / import / reset dropdown
  error-boundary.tsx         # class-based React error boundary
  logo-mark.tsx              # SVG logo
  ui/                        # minimal Card, Button, Input, Label
hooks/                  # use-btc-price (WS+REST), use-ahr999, use-btc-price-history, use-exchange-rate, use-persistent-state
lib/                    # pure calculations (no React): calculations, ahr999, dca-fire, price-projection, i18n, types, mock-data
public/                 # icons + webmanifest (PWA)
```

## Commands

| Command       | Description                     |
|---------------|---------------------------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Static export to `out/`       |
| `npm run start` | Serve the built `out/` locally |
| `npm run lint`  | Run Next.js ESLint              |

No tests, formatter, or typecheck scripts exist. Do not add any.

## License

Licensed under the [Apache License 2.0](LICENSE).

---

Made for Bitcoin HODLers who want to plan their exit to freedom.
