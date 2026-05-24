# BTC FIRE OS — AGENTS.md

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at `http://localhost:3000` |
| `npm run build` | Static export to `out/` |
| `npm run lint` | Only linter available (runs `next lint`) |
| `npm run start` | Serve built output locally |

No test runner, test files, or formatter config exist. Add none.

## Architecture

- **Single-page client-side app** — `app/page.tsx` is `"use client"`. All hooks in `hooks/` are `"use client"`. No server components or API routes.
- **Static export** — `next.config.ts` sets `output: "export"`, `trailingSlash: true`, and auto-configures `basePath` for GitHub Pages.
- **Path alias** — `@/*` maps to project root.
- **Two tabs** — `"my"` (portfolio + FIRE) and `"general"` (scenarios + AHR999 chart), toggled via nav sidebar in `page.tsx`.
- **State** — All user inputs persist to `localStorage` via `use-persistent-state` hook with key prefix `btc-fire-os:*`. Hydration is one-way (storage → state on mount).
- **Dark mode only** — `<html className="dark">` hardcoded. Tailwind config uses custom CSS variables for background/surface/border/muted/bitcoin colors.
- **i18n** — 3 locales (`zhCN`, `zhTW`, `en`) in `lib/i18n.ts`. Language choice persisted to localStorage. Formatting helpers in `lib/calculations.ts` use `Intl.NumberFormat`.

## Data fetching (all client-side)

| Hook | Source | Frequency |
|------|--------|-----------|
| `use-btc-price` | Binance WebSocket + REST fallback | live stream + 30s REST poll |
| `use-ahr999` | Binance daily klines API | 1h poll |
| `use-ahr999-frequency` | Binance daily klines API | on mount |
| `use-btc-price-history` | Binance daily klines API | on mount |
| `use-exchange-rate` | exchangerate-api.com | 5min poll |

Hooks mount with fallback values when API calls fail. No env vars required.

## GitHub Pages deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`: `npm ci` → `npm run build` → touch `out/.nojekyll` → upload artifact → Pages deploy. Requires Pages set to GitHub Actions source in repo settings.

## Key conventions

- **Tailwind color palette**: `background`, `surface`, `border`, `muted`, `bitcoin`, `positive`, `negative` defined in `tailwind.config.ts`.
- **UI components** in `components/ui/` (`Card`, `Button`) — simple presentational, no Radix dependency beyond `@radix-ui/react-label`.
- **Pure logic** in `lib/` — calculations, types, mock data, price projection, AHR999, DCA planning. No React imports.
- **Charts** use `recharts` (`components/accumulation-chart.tsx`).
- **No generated code, no migrations, no codegen**.
- No `.env` files exist.
