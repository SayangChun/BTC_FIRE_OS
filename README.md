# BTC FIRE OS

A Bitcoin-native FIRE (Financial Independence, Retire Early) dashboard for long-term holders. Fetches live data from Binance and supports zhCN / zhTW / en.

## Features

- Live BTC price via Binance WebSocket + REST polling
- Portfolio value, cost basis, profit/loss, and return metrics
- FIRE calculator using the 4% withdrawal rule
- Bear/base/bull BTC price scenario simulator
- AHR999 Bitcoin hoarding indicator with zone-based recommendations
- DCA FIRE plan based on AHR999 historical zone frequencies
- Power Law price projection (1/5/10 years)
- Accumulation chart
- Trilingual support (zhCN, zhTW, en)
- Dark mode only, responsive layout
- All user inputs persisted to localStorage

## Run

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Build

```bash
npm run build    # static export → out/
npm run lint     # ESLint via next/core-web-vitals
```

## Deploy to GitHub Pages

1. Push this project to a GitHub repository.
2. On GitHub, open `Settings > Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to the `main` branch.
5. Open the deployed Pages URL shown in the workflow summary.

For a repository named `username.github.io`, the site will be served from:

```txt
https://username.github.io/
```

For a regular project repository, the site will be served from:

```txt
https://username.github.io/repository-name/
```

## Structure

```txt
app/
  globals.css
  layout.tsx
  page.tsx
components/
  accumulation-chart.tsx
  ahr999-card.tsx
  dashboard-metrics.tsx
  dca-fire-planner-card.tsx
  error-boundary.tsx
  fire-calculator.tsx
  future-fire-card.tsx
  portfolio-input.tsx
  scenario-simulator.tsx
  ui/
    button.tsx
    card.tsx
    input.tsx
    label.tsx
hooks/
  use-ahr999-frequency.ts
  use-ahr999.ts
  use-btc-price-history.ts
  use-btc-price.ts
  use-exchange-rate.ts
  use-persistent-state.ts
lib/
  ahr999.ts
  calculations.ts
  dca-fire.ts
  i18n.ts
  mock-data.ts
  price-projection.ts
  types.ts
  utils.ts
```
