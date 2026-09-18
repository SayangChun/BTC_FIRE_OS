# BTC FIRE OS

**比特币原生的 FIRE 仪表盘** —— 专为长期持有者打造。

> **🌐 语言**
> [English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

**当前版本：0.2.1** —— [更新日志](CHANGELOG.md) · [版本发布](https://github.com/SayangChun/BTC_FIRE_OS/releases)

实时追踪你的 BTC 投资组合，计算距离财务独立、提前退休（FIRE）还有多远，运行价格场景模拟，查看 AHR999 囤比特币指标（经典版 + 3D 重校准版），并按市场区间规划定投 —— 全部在一个快速、私密、零后端的 Web 应用中完成。

- 行情数据多源自动降级（Binance → Binance Data API 镜像 → mempool.space → CoinGecko）
- 100% 客户端运行 · 数据不出浏览器
- 服务端 API 代理支持 WebDAV 云备份（无 CORS 问题）
- 三语支持：简体中文 / 繁體中文 / English

## 功能特色

**实时数据**
- 通过 Binance WebSocket + 30 秒 REST 轮询获取实时 BTC/USD（及 CNY）价格；主域名不可达时，交易流会自动轮换到官方行情镜像 `data-stream.binance.vision`
- **自动多源降级**：价格与日线数据按 `api.binance.com` → `data-api.binance.vision` → `mempool.space` → CoinGecko 顺序尝试，单请求 5 秒超时。状态行始终标明当前数据源（实时 / 轮询 / 缓存 / 离线，使用备用源时额外显示「备用数据源: …」）
- **绝不显示假价格**：上次已知价格会缓存在本地并以「缓存」状态附带时间戳展示；所有由价格推导的数值在拿到真实行情前显示骨架屏 —— 占位价永远不会被当作实时价格
- AHR999 双指标显示 —— **ahr999**（经典）和 **ahr999-3D**（重校准），含拟合价格和买入建议（加大定投 / 常规 / 停止）。若 200 日均价获取失败，会复用本地缓存值并显示「上次更新时间」与缓存数据徽标
- Power Law 价格预测（1 / 5 / 10 年），覆盖熊市 / 基准 / 牛市场景
- USD ↔ CNY 汇率（exchangerate-api.com，5 分钟轮询）

**投资组合与 FIRE**
- 多钱包管理器：添加、重命名、删除钱包 —— 每个钱包独立记录持仓和成本价
- 投资组合价值、加权平均成本基础、未实现盈亏（绝对值 + 百分比）
- 全球地址前百分比 —— 查看你的持仓在全球比特币地址中的排名
- FIRE 计算器（默认 4% 规则，完全可调，含 3% / 3.5% / 4% 快速选择按钮）
- **可选的预期年通胀率**（默认 2.5%，填 0 表示不考虑），让目标资产随时间增长，并预览当前 / 5 / 10 / 20 年所需资产
- 达成目标所需 BTC + 进度条
- 其他资产、年化收益率、月现金流支持
- BTC 单位：BTC / mBTC / bits / sat（可切换，全局持久化）

**场景与规划**
- 熊市 / 基准 / 牛市价格场景模拟器，含 FIRE 达标检查 —— **三个价格均可自行编辑**并持久化（默认 $50K / $100K / $250K，可一键恢复默认）
- DCA FIRE 规划器：设置每日定投金额，结合其他资产和现金流预测长期积累，并给出按通胀调整后的「达成时所需资产」
- 预计达成 FIRE 时间（年 + 月 + 预计日期），40 年未达标时显示快速尝试 +$50 按钮
- 累计图表：历史 BTC 价格（2017 年至今），叠加**加权平均成本线**（超出当前价格区间时自动隐藏），悬浮提示显示相对成本的盈亏；含范围选择器（全部 / 5 年 / 3 年 / 1 年 / 6 月 / 3 月 / 1 月）和刷选滑块

**使用体验**
- 单页可滚动 —— 8 个模块按可排序行排列（无标签页）
- 双栏行并排显示两个模块（响应式：移动端自动堆叠）
- 使用 ↑/↓ 调整行顺序（双栏行整体移动）；双栏行内可用 ↔ 互换左右；一键重置为默认布局
- 布局持久化到 localStorage，含可关闭的提示横幅
- 默认优先显示个人数据（FIRE 概要、投资组合、仪表盘）
- **初始状态诚实为空**：新用户没有任何持仓，首次打开会看到引导横幅，并可**一键载入演示数据**（示例钱包、支出、定投计划）快速了解所有模块
- 货币切换：USD ↔ CNY，影响所有法币显示
- BTC 单位：BTC / mBTC / bits / sat（单位敏感输入：sat 模式使用整数）
- 数据备份/恢复 + 重置（JSON 导出/导入）
- WebDAV 云备份：配置服务器地址，通过设置菜单上传/下载备份（经 API 代理，无 CORS 问题）
- 所有数据持久化到 localStorage（无需登录，刷新不丢失）
- ErrorBoundary 包裹整个应用，优雅处理渲染异常
- 仅深色模式，响应式设计，含 PWA manifest
- 首次加载后完全可离线工作 —— 缓存的价格、AHR999 均值与历史行情仍可用，且会明确标注数据来源
- 图表降采样至最多 420 个数据点，确保流畅性能

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000

### 生产构建

```bash
npm run build     # 生成包含静态页面的服务端构建
npm run start     # 本地预览构建好的应用
npm run lint
```

附带了便捷脚本 `start-website.bat`（Windows）—— 按需安装依赖、启动开发服务器并打开浏览器。

## 部署到 Vercel（推荐）

1. 推送到 GitHub 仓库。
2. 在 [vercel.com/new](https://vercel.com/new) 导入仓库。
3. Vercel 自动检测 Next.js —— 零配置部署。
4. API 路由（`/api/webdav`）作为 Serverless 函数运行，代理 WebDAV 请求以绕过浏览器 CORS 限制。

### 部署到 GitHub Pages（静态，无 WebDAV）

仍可导出静态版本（不含 WebDAV 云备份）：

```bash
npm run build     # 输出到 out/
```

`next.config.ts` 在 `GITHUB_ACTIONS=true` 时自动设置 `basePath`/`assetPrefix`。

## 隐私与数据

- 无数据库、无分析工具。
- 所有数据仅存储在你的浏览器 localStorage 中。
- 仅获取公开市场数据（Binance 各域名、mempool.space、CoinGecko、exchangerate-api.com）；任一源不可达时会自动降级。
- WebDAV 云备份为可选功能 —— 凭据存储在 localStorage，通过 API 代理转发（不记录日志）。
- 加载 AdSense 脚本用于非侵入式广告展示（不收集个人数据）。
- 可安全用于敏感的持仓数字。

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript
- Tailwind CSS 自定义深色色板（径向渐变背景）
- Recharts 用于累计图表（含成本线）
- Lucide React 图标库
- `lib/` 中的纯函数（无 React）处理所有计算
- `lib/market-data.ts` —— 统一行情访问层，内置多源顺序降级、请求超时与中止支持
- 仅客户端 hooks（`hooks/`），含优雅降级和 AbortController
- 单向 `usePersistentState` 钩子实现 localStorage 水合与遗留键迁移
- 服务端 API 路由代理 WebDAV 请求（绕过浏览器 CORS）

## 项目结构

```
app/
  layout.tsx          # metadata、dark html、ErrorBoundary、AdSense
  page.tsx            # 主 SPA（"use client"），8 个可排序模块行、侧边栏、页脚版本标识
  globals.css         # Tailwind 指令、径向渐变、输入框箭头隐藏
  api/webdav/
    route.ts          # 服务端 WebDAV 代理（PROPFIND/PUT/GET/DELETE/MKCOL）
components/
  ahr999-card.tsx            # ahr999 + ahr999-3D 双指标（含缓存数据状态）
  accumulation-chart.tsx     # 价格走势图，含成本线 + 刷选滑块 + 范围选择器
  dashboard-metrics.tsx      # 价格、组合价值、成本基础、盈亏
  dca-fire-planner-card.tsx  # DCA 输入、其他资产、预计 FIRE 时间
  fire-calculator.tsx        # 月支出、提取率、可选通胀率、进度条
  future-fire-card.tsx       # Power Law 预测 1/5/10 年
  portfolio-input.tsx        # 多钱包管理器、BTC 单位选择器、地址排名、演示数据入口
  scenario-simulator.tsx     # 熊市 / 基准 / 牛市场景（价格可编辑）
  data-settings.tsx          # 导出 / 导入 / 演示数据 / 重置 / WebDAV 云备份下拉菜单
  error-boundary.tsx         # 基于 class 的 React 错误边界
  logo-mark.tsx              # SVG 图标
  ui/                        # 极简 Card、Button、Input、Label、Skeleton
hooks/                  # use-btc-price、use-ahr999、use-btc-price-history、use-ahr999-frequency、use-exchange-rate、use-persistent-state
lib/                    # 纯 TS（无 React）：market-data、demo-data、app-info、calculations、ahr999、dca-fire、price-projection、i18n、types、mock-data、webdav
public/                 # 图标 + webmanifest（PWA）
```

## 命令

| 命令             | 描述                        |
|------------------|-----------------------------|
| `npm run dev`    | 启动开发服务器（localhost:3000） |
| `npm run build`  | 生产构建（服务端 + 静态页面）   |
| `npm run start`  | 本地预览构建好的应用          |
| `npm run lint`   | 运行 Next.js ESLint         |

不包含测试、格式化或类型检查脚本。请勿添加。

## 版本管理

本项目遵循[语义化版本](https://semver.org/lang/zh-CN/)，发布时打 `vX.Y.Z` 注解标签，并在
[CHANGELOG.md](CHANGELOG.md) 中记录变更。`package.json` 中的版本号会在构建时注入
（`next.config.ts`）并渲染到网站页脚，因此标签、更新日志与实际运行版本始终一致。

## 许可

基于 [Apache License 2.0](LICENSE) 许可。

---

为那些想要规划通往自由之路的比特币 HODLers 而制作。
