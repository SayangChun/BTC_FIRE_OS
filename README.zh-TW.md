# BTC FIRE OS

**比特幣原生的 FIRE 儀表板** —— 專為長期持有者打造。

> **🌐 語言**
> [English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

即時追蹤你的 BTC 投資組合，計算距離財務獨立、提前退休（FIRE）還有多遠，運行價格情境模擬，查看 AHR999 囤比特幣指標，並按市場區間規劃定投 —— 全部在一個快速、私密、零後端的 Web 應用中完成。

- 來自幣安的即時資料（價格 + AHR999）
- 100% 客戶端執行 · 資料不出瀏覽器
- 靜態匯出 → 可在 GitHub Pages 上執行，無需伺服器
- 三語支援：简体中文 / 繁體中文 / English

## 功能特色

**即時資料**
- 透過 Binance WebSocket + 30 秒 REST 輪詢取得即時 BTC/USD（及 CNY）價格
- AHR999 指標 + 歷史區間頻率（鏈上風格的囤幣指標）
- Power Law 價格預測（1 / 5 / 10 年）

**投資組合與 FIRE**
- 多錢包支援（新增/重新命名/刪除錢包）
- 投資組合價值、成本基礎、未實現損益（絕對值 + 百分比）
- FIRE 計算器（預設 4% 規則，完全可調）
- 達成目標所需 BTC + 進度條
- 其他資產、年化收益、月現金流支援
- BTC 單位：BTC / mBTC / bits / sat（可切換，持久化）

**情境與規劃**
- 熊市 / 基準 / 牛市價格情境模擬器
- DCA FIRE 規劃器：針對 AHR999「低 / 正常 / 高」區間設定不同的每日定投金額
- 累計圖表（歷史價格 + 你的持倉隨時間變化）

**使用體驗**
- 單頁可捲動 —— 模組按列排列（無標籤頁）
- 兩個小模組（如儀表板 + AHR999、情境 + 未來預測）並排顯示
- 使用 ↑/↓ 調整列順序（雙欄列整體移動）
- 雙欄列內可透過 ↔ 按鈕互換左右（順序儲存到 localStorage）
- 預設優先顯示個人資料
- 貨幣切換：USD ↔ CNY
- BTC 單位：BTC / mBTC / bits / sat（可切換）
- 資料備份/還原 + 重置（JSON 匯出/匯入）
- 所有資料持久化到 localStorage（無需登入，重新整理不遺失）
- 僅深色模式，響應式設計，支援 PWA 安裝
- 首次載入後完全可離線工作（即時價格更新除外）

## 快速開始

```bash
npm install
npm run dev
```

打開 http://localhost:3000

### 生產構建（靜態）

```bash
npm run build     # 輸出到 out/
npm run start     # 本地預覽匯出的站點
npm run lint
```

## 部署到 GitHub Pages（免費，無後端）

1. 推送到 GitHub 倉庫。
2. 進入 **Settings → Pages**。
3. 將 **Source** 設定為 "GitHub Actions"。
4. 推送到 `main` 分支。使用 `npm run build` 構建（輸出到 `out/`）並部署靜態檔案。

站點將可訪問：
- `https://<user>.github.io/`（使用者/組織站點）
- `https://<user>.github.io/<repo>/`（專案站點）

`next.config.ts` 在 `GITHUB_ACTIONS=true` 時自動設定 `basePath`/`assetPrefix`（僅專案站點）。倉庫中不包含工作流程檔案。

## 隱私與資料

- 無伺服器、無資料庫、無分析、無 Cookie。
- 所有資料僅儲存在你的瀏覽器 localStorage 中。
- 僅取得公開市場資料（Binance + exchangerate-api.com）。
- 可安全用於敏感的持倉數字。

## 技術棧

- Next.js 15（App Router）+ React 19 + TypeScript
- Tailwind CSS（自訂深色色板）
- Recharts 用於累計圖表
- `lib/` 中的純函數（無 React）處理所有計算
- 僅客戶端的 hooks（`hooks/`），含優雅降級

詳見 `AGENTS.md` 瞭解完整架構說明、資料獲取細節和約定（對貢獻者和 AI 編碼助手有用）。

## 專案結構

```
app/
  layout.tsx          # metadata、dark html、ErrorBoundary、AdSense
  page.tsx            # 主 SPA（"use client"），單頁可排序模組，所有狀態使用 usePersistentState
  globals.css
components/
  ahr999-card.tsx
  accumulation-chart.tsx
  dashboard-metrics.tsx
  dca-fire-planner-card.tsx
  fire-calculator.tsx
  future-fire-card.tsx
  portfolio-input.tsx   # 多錢包管理器
  scenario-simulator.tsx
  data-settings.tsx     # 匯出 / 匯入 / 重置
  error-boundary.tsx
  logo-mark.tsx
  ui/                   # 極簡 Card、Button、Input、Label
hooks/                  # use-btc-price (WS+REST)、use-ahr999*、use-btc-price-history、use-exchange-rate、use-persistent-state
lib/                    # 純計算（無 React）：calculations、ahr999、dca-fire、price-projection、i18n、types、mock-data
public/                 # 圖示 + webmanifest（PWA）
```

## 命令

| 命令             | 描述                         |
|------------------|------------------------------|
| `npm run dev`    | 啟動開發伺服器（localhost:3000）  |
| `npm run build`  | 靜態匯出到 `out/`             |
| `npm run start`  | 本地預覽構建好的 `out/`       |
| `npm run lint`   | 執行 Next.js ESLint          |

不包含測試、格式化或型別檢查腳本。請勿新增。

## 許可

本專案是開源專案。如需重新散佈，請自行新增 `LICENSE` 檔案。

---

為那些想要規劃通往自由之路的比特幣 HODLers 而製作。
