# Changelog

All notable changes to this project are documented in this file.
本文件记录项目的所有重要变更。

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

---

## [0.2.1] - 2026-09-18

### Added

- Version badge in the site footer (`vX.Y.Z`, linking to the matching release) plus Changelog and
  Releases links. The value is injected from `package.json` via `NEXT_PUBLIC_APP_VERSION`, so the
  footer, the git tag and this file can never drift apart.
- **On-chain holdings sync** (`lib/holdings-sync.ts`, `hooks/use-holdings-sync.ts`,
  `components/holdings-sync.tsx`). Bind a BTC address and its balance is read from the chain instead
  of typed by hand: every 5 minutes automatically, or on demand per address. Balances come from an
  ordered list of public Esplora explorers (`mempool.space` → `blockstream.info`), both of which send
  `Access-Control-Allow-Origin: *`, so this runs entirely in the browser — no API route, no server
  state, and no API key, private key or seed phrase is ever requested.
- `BtcWallet` gained two optional fields, `source` (`{ kind: "address", address, chain }`) and
  `lastSyncedAt`. A wallet without a `source` is hand-entered and is never auto-overwritten — which is
  also what every wallet saved by an earlier version looks like. Syncing only writes `btc`; the cost
  basis is never touched, because the chain cannot know what you paid. Unbinding keeps the last synced
  amount and switches the wallet back to manual entry.
- Address-bound wallet rows show a provenance line (address + sync state), and the portfolio module
  gains a sync panel: bind form, per-address status (last synced time, active source, invalid-address
  and unreachable-explorer errors), refresh and unbind actions, and a note on what leaves the browser.

### Changed

- Address-bound wallets render a `<Skeleton />` instead of a number while their first balance is
  being read, so a freshly bound address never flashes a misleading 0 BTC.
- Documentation sync: all three READMEs now describe multi-source market data, demo data, editable
  scenario prices, the optional inflation rate, the chart cost line and the loading skeletons;
  `AGENTS.md` reflects the current architecture (single scrollable page, shared market-data layer,
  version injection, inflation rules).

### 新增

- 网站页脚新增版本标识（`vX.Y.Z`，可点击跳转到对应发布页）以及「更新日志 / 版本发布」链接。
  版本号由 `package.json` 经 `NEXT_PUBLIC_APP_VERSION` 注入，因此页脚、git 标签与本文件始终一致。
- **链上持仓同步**（`lib/holdings-sync.ts`、`hooks/use-holdings-sync.ts`、`components/holdings-sync.tsx`）。
  绑定 BTC 地址后余额直接从链上读取，不再需要手工填写：每 5 分钟自动刷新一次，也可按地址手动刷新。
  数据来自一组公开 Esplora 浏览器（`mempool.space` → `blockstream.info`），两者都返回
  `Access-Control-Allow-Origin: *`，因此整套逻辑完全跑在浏览器里——没有 API 路由、没有服务端状态，
  也从不索取 API 密钥、私钥或助记词。
- `BtcWallet` 新增两个可选字段：`source`（`{ kind: "address", address, chain }`）与 `lastSyncedAt`。
  没有 `source` 的钱包即视为手工填写，永远不会被自动覆盖——旧版本保存的钱包也正是这个形态。
  同步只写入 `btc`，绝不改动成本价（链上无从得知你的买入价）。解除绑定会保留最后一次同步到的数量，
  并把该钱包切回手动填写。
- 地址绑定的钱包行会显示来源信息（地址 + 同步状态）；投资组合模块新增同步面板：绑定表单、
  每个地址的状态（上次同步时间、当前数据来源、地址无效/无法连接的错误）、刷新与解除绑定操作，
  以及一条说明哪些数据会离开浏览器的隐私提示。

### 变更

- 文档同步：三份 README 均更新为当前功能（多源行情降级、演示数据、可编辑情景价格、可选通胀率、
  图表成本线、加载骨架屏）；`AGENTS.md` 更新为当前架构（单页无标签、统一行情层、版本注入、通胀约定）。
- 地址绑定的钱包在首次读取余额期间以 `<Skeleton />` 占位，避免刚绑定就闪出一个误导性的 0 BTC。

---

## [0.2.0] - 2026-09-17

First tagged release. Everything below is backwards compatible: existing wallets, expenses and
settings are preserved, and every new option has a sensible default.

### Added

- **Market data fallback layer** (`lib/market-data.ts`). Spot price is fetched from an ordered list
  of independent sources with a 5s per-request timeout: `api.binance.com` → `data-api.binance.vision`
  → `mempool.space` → CoinGecko. Daily closes use the two Binance hosts → CoinGecko market chart.
  The first source that answers becomes "sticky" (one request per poll instead of four), and the
  primary is re-probed every 20 polls so a temporary block does not pin the app to a fallback.
- **WebSocket fallback**: the trade stream rotates between `stream.binance.com:9443` and the official
  market-data mirror `data-stream.binance.vision`.
- **Source transparency in the UI**: the price status line now reports the active source
  (e.g. "Polling · Backup source: Binance Data API"), and a `cached` state is shown when the last
  known price is displayed (`btc-fire-os:last-price:v1`).
- **AHR999 `stale` state**: when the 200-day average cannot be fetched, the last cached value is
  used (`btc-fire-os:ahr999-average200:v1`, or derived from the cached daily history) together with a
  "last updated" timestamp and a cached-data badge, instead of an empty card.
- **One-click demo data** (`lib/demo-data.ts`): a realistic sample portfolio (0.6 BTC, weighted cost
  $38,310), expenses, DCA plan, other assets and inflation rate — available from the first-run
  banner, the portfolio empty state, and the Settings menu.
- **Editable scenario prices**: bear / base / bull prices are user-editable, persisted in
  `btc-fire-os:scenario-prices`, with a reset-to-defaults action.
- **Cost line on the price chart**: the weighted average cost basis is drawn as a dashed reference
  line (automatically hidden when it falls outside the visible price range, so the price axis is
  never distorted), and the tooltip shows profit/loss versus cost.
- **Optional inflation in the FIRE calculator**: an expected annual inflation rate (0 disables it)
  with a today / 5y / 10y / 20y target preview.
- **"Required at FIRE" metric** in the DCA planner: the inflation-adjusted target at the projected
  FIRE date.
- **Skeleton loading states** (`components/ui/skeleton.tsx`) for every price-derived number.
- **"Reset to default layout"** button in the module list header (previously only reachable from the
  desktop-only sidebar, so it was unreachable on mobile).

### Changed

- New installs now start with **no holdings** instead of a hardcoded 1.2 BTC portfolio. Existing
  users' stored wallets are never touched.
- The DCA FIRE projection now grows its target with inflation, matching the Future FIRE Forecast.
  Previously the two modules disagreed about the FIRE date.
- Inflation is a single user setting (`btc-fire-os:inflation-rate`, default 2.5%) shared by the FIRE
  target preview, the Future FIRE Forecast (which now states its assumption) and the DCA planner.
- The price history chart and the AHR999 frequency stats now use the shared fallback chain.
- Scenario prices and the inflation rate are included in export / import / WebDAV backups.

### Fixed

- Networks that block `api.binance.com` no longer leave the dashboard stuck on the placeholder
  `$100,000` with "Offline".
- The placeholder price is never rendered as a real number — price-derived values show a skeleton
  until a genuine quote arrives.
- The DCA planner no longer reports an unrealistically early FIRE date (it ignored inflation).
- `hooks/use-ahr999-frequency.ts` no longer hardcodes a single Binance host.

### New localStorage keys

`btc-fire-os:last-price:v1`, `btc-fire-os:ahr999-average200:v1`, `btc-fire-os:scenario-prices`,
`btc-fire-os:inflation-rate`, `btc-fire-os:onboarding-dismissed`. No migration is required; each key
is created on first use and all are optional.

### 新增

- **行情多源降级层**（`lib/market-data.ts`）：现货价格按顺序尝试多个独立数据源，单请求 5 秒超时
  （`api.binance.com` → `data-api.binance.vision` → `mempool.space` → CoinGecko）；日线使用 Binance
  双域名 → CoinGecko market chart。首个成功的源会被记住（每次轮询只发一个请求），并每 20 次轮询回探
  主源，避免临时故障把应用永久钉在备用源上。
- **WebSocket 降级**：交易流在 `stream.binance.com:9443` 与官方行情镜像 `data-stream.binance.vision`
  之间轮换。
- **数据源可见**：价格状态行会显示当前数据源（如「轮询更新 · 备用数据源: Binance Data API」）；
  使用上次已知价格时显示 `cached` 状态（`btc-fire-os:last-price:v1`）。
- **AHR999 新增 `stale` 状态**：200 日均价获取失败时，改用本地缓存的最近成功值
  （`btc-fire-os:ahr999-average200:v1`，或从已缓存的日线历史现算），并显示「上次更新时间」与缓存徽标，
  不再出现空白卡片。
- **一键演示数据**（`lib/demo-data.ts`）：一组合理的示例持仓（0.6 BTC、加权成本 $38,310）、支出、
  定投计划、其他资产与通胀率 —— 可从首次使用横幅、投资组合空状态、设置菜单三处载入。
- **情景价格可编辑**：熊/基/牛三个价格可自行修改，持久化到 `btc-fire-os:scenario-prices`，并提供恢复默认。
- **价格走势图成本线**：以虚线绘制加权平均成本（超出当前可视价格区间时自动隐藏，避免拉伸价格轴），
  悬浮提示显示相对成本的盈亏。
- **FIRE 计算器可选通胀率**：可填预期年通胀率（0 表示不考虑），并预览当前 / 5 / 10 / 20 年所需资产。
- **定投计划新增「达成时所需资产」**：按通胀调整后的目标金额。
- **骨架屏**（`components/ui/skeleton.tsx`）：所有由价格推导的数值在拿到真实行情前显示骨架。
- **「重置为默认布局」按钮**：移到模块列表顶部（此前只在桌面侧边栏里，移动端无法触达）。

### 变更

- 新用户默认**不再有持仓**（此前硬编码 1.2 BTC 假持仓）；已有用户的本地钱包数据不受影响。
- 定投 FIRE 预测改为按通胀放大目标，与「未来 FIRE 预测」口径一致 —— 此前两个模块给出的 FIRE 时间互相矛盾。
- 通胀率统一为单一设置（`btc-fire-os:inflation-rate`，默认 2.5%），同时作用于 FIRE 目标预览、
  未来预测（会显式标注该假设）与定投计划。
- 历史价格图与 AHR999 频率统计改为共用同一条降级链。
- 情景价格与通胀率纳入导出 / 导入 / WebDAV 备份。

### 修复

- 无法访问 `api.binance.com` 的网络不再卡在占位价 `$100,000` 与「连接离线」。
- 占位价格不再被当作真实数字展示 —— 相关数值在拿到真实行情前显示骨架。
- 定投计划不再给出偏乐观的 FIRE 时间（此前忽略了通胀）。
- `hooks/use-ahr999-frequency.ts` 不再硬编码单个 Binance 域名。

### 新增的 localStorage 键

`btc-fire-os:last-price:v1`、`btc-fire-os:ahr999-average200:v1`、`btc-fire-os:scenario-prices`、
`btc-fire-os:inflation-rate`、`btc-fire-os:onboarding-dismissed`。无需迁移，均为首次使用时创建的可选项。

---

## [0.1.0] - 2026-05-19

Initial development version (untagged).
初始开发版本（未打标签）。

[0.2.1]: https://github.com/SayangChun/BTC_FIRE_OS/releases/tag/v0.2.1
[0.2.0]: https://github.com/SayangChun/BTC_FIRE_OS/releases/tag/v0.2.0
