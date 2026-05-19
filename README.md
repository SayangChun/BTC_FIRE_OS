# BTC FIRE OS

A minimal Bitcoin-native FIRE dashboard for long-term holders. The MVP uses local React state and mock BTC data only.

## Features

- Manual BTC holdings and average cost basis input
- Portfolio value, cost basis, profit/loss, and return metrics
- FIRE calculator using the 4% withdrawal rule
- Bear/base/bull BTC price scenario simulator
- Mock historical accumulation chart
- Responsive, data-first interface

## Run

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
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
  dashboard-metrics.tsx
  fire-calculator.tsx
  portfolio-input.tsx
  scenario-simulator.tsx
  ui/
    button.tsx
    card.tsx
    input.tsx
    label.tsx
lib/
  calculations.ts
  mock-data.ts
  types.ts
  utils.ts
```
