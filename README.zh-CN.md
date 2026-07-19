# BTC FIRE OS

**比特币原生的 FIRE 仪表盘** —— 专为长期持有者打造。

> **🌐 语言**
> [English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

实时追踪你的 BTC 投资组合，计算距离财务独立、提前退休（FIRE）还有多远，运行价格场景模拟，查看 AHR999 囤比特币指标，并按市场区间规划定投 —— 全部在一个快速、私密、零后端的 Web 应用中完成。

- 来自币安的实时数据（价格 + AHR999）
- 100% 客户端运行 · 数据不出浏览器
- 静态导出 → 可在 GitHub Pages 上运行，无需服务器
- 三语支持：简体中文 / 繁體中文 / English

## 功能特色

**实时数据**
- 通过 Binance WebSocket + 30 秒 REST 轮询获取实时 BTC/USD（及 CNY）价格
- AHR999 指标 + 历史区间频率（链上风格的囤币指标）
- Power Law 价格预测（1 / 5 / 10 年）

**投资组合与 FIRE**
- 多钱包支持（添加/重命名/删除钱包）
- 投资组合价值、成本基础、未实现盈亏（绝对值 + 百分比）
- FIRE 计算器（默认 4% 规则，完全可调）
- 达成目标所需 BTC + 进度条
- 其他资产、年化收益、月现金流支持
- BTC 单位：BTC / mBTC / bits / sat（可切换，持久化）

**场景与规划**
- 熊市 / 基准 / 牛市价格场景模拟器
- DCA FIRE 规划器：针对 AHR999「低 / 正常 / 高」区间设置不同的每日定投金额
- 累计图表（历史价格 + 你的持仓随时间变化）

**使用体验**
- 单页可滚动 —— 模块按行排列（无标签页）
- 两个小模块（如仪表盘 + AHR999、场景 + 未来预测）并排显示
- 使用 ↑/↓ 调整行顺序（双栏行整体移动）
- 双栏行内可通过 ↔ 按钮互换左右（顺序保存到 localStorage）
- 默认优先显示个人数据
- 货币切换：USD ↔ CNY
- BTC 单位：BTC / mBTC / bits / sat（可切换）
- 数据备份/恢复 + 重置（JSON 导出/导入）
- 所有数据持久化到 localStorage（无需登录，刷新不丢失）
- 仅深色模式，响应式设计，支持 PWA 安装
- 首次加载后完全可离线工作（实时价格更新除外）

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000

### 生产构建（静态）

```bash
npm run build     # 输出到 out/
npm run start     # 本地预览导出的站点
npm run lint
```

## 部署到 GitHub Pages（免费，无后端）

1. 推送到 GitHub 仓库。
2. 进入 **Settings → Pages**。
3. 将 **Source** 设置为 "GitHub Actions"。
4. 推送到 `main` 分支。使用 `npm run build` 构建（输出到 `out/`）并部署静态文件。

站点将可访问：
- `https://<user>.github.io/`（用户/组织站点）
- `https://<user>.github.io/<repo>/`（项目站点）

`next.config.ts` 在 `GITHUB_ACTIONS=true` 时自动设置 `basePath`/`assetPrefix`（仅项目站点）。仓库中不包含工作流文件。

## 隐私与数据

- 无服务器、无数据库、无分析、无 Cookie。
- 所有数据仅存储在你的浏览器 localStorage 中。
- 仅获取公开市场数据（Binance + exchangerate-api.com）。
- 可安全用于敏感的持仓数字。

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript
- Tailwind CSS（自定义深色色板）
- Recharts 用于累计图表
- `lib/` 中的纯函数（无 React）处理所有计算
- 仅客户端的 hooks（`hooks/`），含优雅降级

详见 `AGENTS.md` 了解完整架构说明、数据获取细节和约定（对贡献者和 AI 编码助手有用）。

## 项目结构

```
app/
  layout.tsx          # metadata、dark html、ErrorBoundary、AdSense
  page.tsx            # 主 SPA（"use client"），单页可排序模块，所有状态使用 usePersistentState
  globals.css
components/
  ahr999-card.tsx
  accumulation-chart.tsx
  dashboard-metrics.tsx
  dca-fire-planner-card.tsx
  fire-calculator.tsx
  future-fire-card.tsx
  portfolio-input.tsx   # 多钱包管理器
  scenario-simulator.tsx
  data-settings.tsx     # 导出 / 导入 / 重置
  error-boundary.tsx
  logo-mark.tsx
  ui/                   # 极简 Card、Button、Input、Label
hooks/                  # use-btc-price (WS+REST)、use-ahr999*、use-btc-price-history、use-exchange-rate、use-persistent-state
lib/                    # 纯计算（无 React）：calculations、ahr999、dca-fire、price-projection、i18n、types、mock-data
public/                 # 图标 + webmanifest（PWA）
```

## 命令

| 命令             | 描述                        |
|------------------|-----------------------------|
| `npm run dev`    | 启动开发服务器（localhost:3000） |
| `npm run build`  | 静态导出到 `out/`            |
| `npm run start`  | 本地预览构建好的 `out/`      |
| `npm run lint`   | 运行 Next.js ESLint         |

不包含测试、格式化或类型检查脚本。请勿添加。

## 许可

本项目是开源项目。如需重新分发，请自行添加 `LICENSE` 文件。

---

为那些想要规划通往自由之路的比特币 HODLers 而制作。
