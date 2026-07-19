# BTC FIRE OS

**比特币原生的 FIRE 仪表盘** —— 专为长期持有者打造。

> **🌐 语言**
> [English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

实时追踪你的 BTC 投资组合，计算距离财务独立、提前退休（FIRE）还有多远，运行价格场景模拟，查看 AHR999 囤比特币指标（经典版 + 3D 重校准版），并按市场区间规划定投 —— 全部在一个快速、私密、零后端的 Web 应用中完成。

- 来自币安的实时数据（价格 + AHR999）
- 100% 客户端运行 · 数据不出浏览器
- 静态导出 → 可在 GitHub Pages 上运行，无需服务器
- 三语支持：简体中文 / 繁體中文 / English

## 功能特色

**实时数据**
- 通过 Binance WebSocket + 30 秒 REST 轮询获取实时 BTC/USD（及 CNY）价格，显示连接状态（实时 / 轮询 / 离线）
- AHR999 双指标显示 —— **ahr999**（经典）和 **ahr999-3D**（重校准），含拟合价格和买入建议（加大定投 / 常规 / 停止）
- Power Law 价格预测（1 / 5 / 10 年），覆盖熊市 / 基准 / 牛市场景
- USD ↔ CNY 汇率（exchangerate-api.com，5 分钟轮询）

**投资组合与 FIRE**
- 多钱包管理器：添加、重命名、删除钱包 —— 每个钱包独立记录持仓和成本价
- 投资组合价值、加权平均成本基础、未实现盈亏（绝对值 + 百分比）
- 全球地址前百分比 —— 查看你的持仓在全球比特币地址中的排名
- FIRE 计算器（默认 4% 规则，完全可调，含 3% / 3.5% / 4% 快速选择按钮）
- 达成目标所需 BTC + 进度条
- 其他资产、年化收益率、月现金流支持
- BTC 单位：BTC / mBTC / bits / sat（可切换，全局持久化）

**场景与规划**
- 熊市（$50K）/ 基准（$100K）/ 牛市（$250K）价格场景模拟器，含 FIRE 达标检查
- DCA FIRE 规划器：设置每日定投金额，结合其他资产和现金流预测长期积累
- 预计达成 FIRE 时间（年 + 月 + 预计日期），40 年未达标时显示快速尝试 +$50 按钮
- 累计图表：历史 BTC 价格（2017 年至今）叠加你的持仓，范围选择器（全部 / 5 年 / 3 年 / 1 年 / 6 月 / 3 月 / 1 月）和刷选滑块

**使用体验**
- 单页可滚动 —— 8 个模块按可排序行排列（无标签页）
- 双栏行并排显示两个模块（响应式：移动端自动堆叠）
- 使用 ↑/↓ 调整行顺序（双栏行整体移动）；双栏行内可用 ↔ 互换左右
- 布局持久化到 localStorage，含可关闭的提示横幅
- 默认优先显示个人数据（FIRE 概要、投资组合、仪表盘）
- 货币切换：USD ↔ CNY，影响所有法币显示
- BTC 单位：BTC / mBTC / bits / sat（单位敏感输入：sat 模式使用整数）
- 数据备份/恢复 + 重置（JSON 导出/导入）
- 所有数据持久化到 localStorage（无需登录，刷新不丢失）
- ErrorBoundary 包裹整个应用，优雅处理渲染异常
- 仅深色模式，响应式设计，含 PWA manifest
- 首次加载后完全可离线工作（实时价格更新除外）
- 图表降采样至最多 420 个数据点，确保流畅性能

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

附带了便捷脚本 `start-website.bat`（Windows）—— 按需安装依赖、启动开发服务器并打开浏览器。

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

- 无服务器、无数据库、无分析工具。
- 所有数据仅存储在你的浏览器 localStorage 中。
- 仅获取公开市场数据（Binance + exchangerate-api.com）。
- 加载 AdSense 脚本用于非侵入式广告展示（不收集个人数据）。
- 可安全用于敏感的持仓数字。

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript
- Tailwind CSS 自定义深色色板（径向渐变背景）
- Recharts 用于累计图表
- Lucide React 图标库
- `lib/` 中的纯函数（无 React）处理所有计算
- 仅客户端 hooks（`hooks/`），含优雅降级和 AbortController
- 单向 `usePersistentState` 钩子实现 localStorage 水合与遗留键迁移

## 项目结构

```
app/
  layout.tsx          # metadata、dark html、ErrorBoundary、AdSense
  page.tsx            # 主 SPA（"use client"），8 个可排序模块行、侧边栏、所有状态通过 usePersistentState
  globals.css         # Tailwind 指令、径向渐变、输入框箭头隐藏
components/
  ahr999-card.tsx            # ahr999 + ahr999-3D 双指标
  accumulation-chart.tsx     # 价格走势图，含刷选滑块 + 范围选择器
  dashboard-metrics.tsx      # 价格、组合价值、成本基础、盈亏
  dca-fire-planner-card.tsx  # DCA 输入、其他资产、预计 FIRE 时间
  fire-calculator.tsx        # 月支出、提取率、进度条
  future-fire-card.tsx       # Power Law 预测 1/5/10 年
  portfolio-input.tsx        # 多钱包管理器、BTC 单位选择器、地址排名
  scenario-simulator.tsx     # 熊市 / 基准 / 牛市场景
  data-settings.tsx          # 导出 / 导入 / 重置下拉菜单
  error-boundary.tsx         # 基于 class 的 React 错误边界
  logo-mark.tsx              # SVG 图标
  ui/                        # 极简 Card、Button、Input、Label
hooks/                  # use-btc-price (WS+REST)、use-ahr999、use-btc-price-history、use-exchange-rate、use-persistent-state
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

基于 [Apache License 2.0](LICENSE) 许可。

---

为那些想要规划通往自由之路的比特币 HODLers 而制作。
