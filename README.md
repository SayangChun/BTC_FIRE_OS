# BTC FIRE OS

**Bitcoin-native FIRE dashboard** for long-term holders.

Track your BTC portfolio in real time, calculate how close you are to Financial Independence, Retire Early (FIRE), run price scenarios, follow the AHR999 Bitcoin accumulation indicator, and plan DCA buys by market zone — all in a fast, private, zero-backend web app.

- Live data from Binance (price + AHR999)
- 100% client-side • nothing leaves your browser
- Static export → works on GitHub Pages with no server
- Trilingual: 简体中文 / 繁體中文 / English

## Features

**Live Data**
- Real-time BTC/USD (and CNY) price via Binance WebSocket + 30s REST fallback
- AHR999 indicator + historical zone frequency (on-chain style hoarding metric)
- Power Law price projections (1 / 5 / 10 year)

**Portfolio & FIRE**
- Multi-wallet support (add/rename/remove wallets)
- Portfolio value, cost basis, unrealized P/L (absolute + %)
- FIRE calculator (4% rule by default, fully adjustable)
- Required BTC to reach your target + progress bar
- Other assets, annual returns, and monthly cashflow support
- BTC units: BTC / mBTC / bits / sat (switchable, persisted)

**Scenarios & Planning**
- Bear / Base / Bull price scenario simulator
- DCA FIRE planner: set different daily buy amounts for AHR999 “low / normal / high” zones
- Accumulation chart (historical price + your holdings over time)

**Experience**
- Three tabs: “通用” (AHR999 + chart), “我的资产” (multi-wallet portfolio + FIRE), “投资计划” (DCA planner + scenarios + future projections)
- Currency toggle: USD ↔ CNY
- BTC units: BTC / mBTC / bits / sat (switchable)
- Data backup/restore + reset via settings (JSON export/import)
- Fully persisted to localStorage (no login, survives refresh)
- Dark mode only, responsive, PWA-installable
- Fast and works completely offline after first load (except live price updates)

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

## Deploy to GitHub Pages (free, no backend)

1. Push to a GitHub repo.
2. Go to **Settings → Pages**.
3. Set **Source** to “GitHub Actions”.
4. Push to `main`. Build with `npm run build` (outputs to `out/`) and deploy the static files.

The site will be available at:
- `https://<user>.github.io/` (user/org site)
- `https://<user>.github.io/<repo>/` (project site)

`next.config.ts` sets `basePath`/`assetPrefix` automatically when `GITHUB_ACTIONS=true` (project sites only). No workflow file is included in the repo.

## Privacy & Data

- No server, no database, no analytics, no cookies.
- All state lives in your browser’s localStorage.
- Only public market data is fetched (Binance + exchangerate-api.com).
- Safe to use with sensitive portfolio numbers.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS with custom dark palette
- Recharts for the accumulation chart
- Pure functions in `lib/` (no React) for all calculations
- Client-only data hooks (`hooks/`) with graceful fallbacks

See `AGENTS.md` for full architecture notes, data-fetching details, and conventions (useful for contributors and AI coding agents).

## Project Structure

```
app/
  layout.tsx          # metadata, dark html, ErrorBoundary, AdSense
  page.tsx            # main SPA (“use client”), tab routing + state
  globals.css
components/
  ahr999-card.tsx
  accumulation-chart.tsx
  dashboard-metrics.tsx
  dca-fire-planner-card.tsx
  fire-calculator.tsx
  future-fire-card.tsx
  portfolio-input.tsx   # multi-wallet manager
  scenario-simulator.tsx
  data-settings.tsx     # export / import / reset
  error-boundary.tsx
  logo-mark.tsx
  ui/                   # minimal Card, Button, Input, Label
hooks/                  # use-btc-price (WS+REST), use-ahr999*, use-btc-price-history, use-exchange-rate, use-persistent-state
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

This project is open source. Add a `LICENSE` file if you fork it for redistribution.

---

Made for Bitcoin HODLers who want to plan their exit to freedom.
