# BTC FIRE OS

**比特幣原生的 FIRE 儀表板** —— 專為長期持有者打造。

> **🌐 語言**
> [English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

即時追蹤你的 BTC 投資組合，計算距離財務獨立、提前退休（FIRE）還有多遠，運行價格情境模擬，查看 AHR999 囤比特幣指標（經典版 + 3D 重校準版），並按市場區間規劃定投 —— 全部在一個快速、私密、零後端的 Web 應用中完成。

- 來自幣安的即時資料（價格 + AHR999）
- 100% 客戶端執行 · 資料不出瀏覽器
- 伺服器端 API 代理支援 WebDAV 雲端備份（無 CORS 問題）
- 三語支援：简体中文 / 繁體中文 / English

## 功能特色

**即時資料**
- 透過 Binance WebSocket + 30 秒 REST 輪詢取得即時 BTC/USD（及 CNY）價格，顯示連線狀態（即時 / 輪詢 / 離線）
- AHR999 雙指標顯示 —— **ahr999**（經典）和 **ahr999-3D**（重校準），含擬合價格和買入建議（加大定投 / 常規 / 停止）
- Power Law 價格預測（1 / 5 / 10 年），覆蓋熊市 / 基準 / 牛市情境
- USD ↔ CNY 匯率（exchangerate-api.com，5 分鐘輪詢）

**投資組合與 FIRE**
- 多錢包管理器：新增、重新命名、刪除錢包 —— 每個錢包獨立記錄持倉和成本價
- 投資組合價值、加權平均成本基礎、未實現損益（絕對值 + 百分比）
- 全球地址前百分比 —— 查看你的持倉在全球比特幣地址中的排名
- FIRE 計算器（預設 4% 規則，完全可調，含 3% / 3.5% / 4% 快速選擇按鈕）
- 達成目標所需 BTC + 進度條
- 其他資產、年化收益率、月現金流支援
- BTC 單位：BTC / mBTC / bits / sat（可切換，全域持久化）

**情境與規劃**
- 熊市（$50K）/ 基準（$100K）/ 牛市（$250K）價格情境模擬器，含 FIRE 達標檢查
- DCA FIRE 規劃器：設定每日定投金額，結合其他資產和現金流預測長期累積
- 預計達成 FIRE 時間（年 + 月 + 預計日期），40 年未達標時顯示快速嘗試 +$50 按鈕
- 累計圖表：歷史 BTC 價格（2017 年至今）疊加你的持倉，範圍選擇器（全部 / 5 年 / 3 年 / 1 年 / 6 月 / 3 月 / 1 月）和刷選滑塊

**使用體驗**
- 單頁可捲動 —— 8 個模組按可排序列排列（無標籤頁）
- 雙欄列並排顯示兩個模組（響應式：行動端自動堆疊）
- 使用 ↑/↓ 調整列順序（雙欄列整體移動）；雙欄列內可用 ↔ 互換左右
- 版面持久化到 localStorage，含可關閉的提示橫幅
- 預設優先顯示個人資料（FIRE 概要、投資組合、儀表板）
- 貨幣切換：USD ↔ CNY，影響所有法幣顯示
- BTC 單位：BTC / mBTC / bits / sat（單位敏感輸入：sat 模式使用整數）
- 資料備份/還原 + 重置（JSON 匯出/匯入）
- WebDAV 雲端備份：設定伺服器位址，透過設定選單上傳/下載備份（經 API 代理，無 CORS 問題）
- 所有資料持久化到 localStorage（無需登入，重新整理不遺失）
- ErrorBoundary 包裹整個應用，優雅處理渲染異常
- 僅深色模式，響應式設計，含 PWA manifest
- 首次載入後完全可離線工作（即時價格更新除外）
- 圖表降取樣至最多 420 個資料點，確保流暢效能

## 快速開始

```bash
npm install
npm run dev
```

打開 http://localhost:3000

### 生產構建

```bash
npm run build     # 生成包含靜態頁面的伺服器端構建
npm run start     # 本地預覽構建好的應用
npm run lint
```

附帶了便捷腳本 `start-website.bat`（Windows）—— 按需安裝依賴、啟動開發伺服器並開啟瀏覽器。

## 部署到 Vercel（推薦）

1. 推送到 GitHub 倉庫。
2. 在 [vercel.com/new](https://vercel.com/new) 匯入倉庫。
3. Vercel 自動偵測 Next.js —— 零配置部署。
4. API 路由（`/api/webdav`）作為 Serverless 函數運行，代理 WebDAV 請求以繞過瀏覽器 CORS 限制。

### 部署到 GitHub Pages（靜態，無 WebDAV）

仍可匯出靜態版本（不含 WebDAV 雲端備份）：

```bash
npm run build     # 輸出到 out/
```

`next.config.ts` 在 `GITHUB_ACTIONS=true` 時自動設定 `basePath`/`assetPrefix`。

## 隱私與資料

- 無資料庫、無分析工具。
- 所有資料僅儲存在你的瀏覽器 localStorage 中。
- 僅取得公開市場資料（Binance + exchangerate-api.com）。
- WebDAV 雲端備份為可選功能 —— 憑證儲存在 localStorage，透過 API 代理轉發（不記錄日誌）。
- 載入 AdSense 腳本用於非侵入式廣告展示（不收集個人資料）。
- 可安全用於敏感的持倉數字。

## 技術棧

- Next.js 15（App Router）+ React 19 + TypeScript
- Tailwind CSS 自訂深色色板（徑向漸變背景）
- Recharts 用於累計圖表
- Lucide React 圖示庫
- `lib/` 中的純函數（無 React）處理所有計算
- 僅用戶端 hooks（`hooks/`），含優雅降級和 AbortController
- 單向 `usePersistentState` 鉤子實現 localStorage 水合與遺留鍵遷移
- 伺服器端 API 路由代理 WebDAV 請求（繞過瀏覽器 CORS）

## 專案結構

```
app/
  layout.tsx          # metadata、dark html、ErrorBoundary、AdSense
  page.tsx            # 主 SPA（"use client"），8 個可排序模組列、側邊欄、所有狀態透過 usePersistentState
  globals.css         # Tailwind 指令、徑向漸變、輸入框箭頭隱藏
  api/webdav/
    route.ts          # 伺服器端 WebDAV 代理（PROPFIND/PUT/GET/DELETE/MKCOL）
components/
  ahr999-card.tsx            # ahr999 + ahr999-3D 雙指標
  accumulation-chart.tsx     # 價格走勢圖，含刷選滑塊 + 範圍選擇器
  dashboard-metrics.tsx      # 價格、組合價值、成本基礎、損益
  dca-fire-planner-card.tsx  # DCA 輸入、其他資產、預計 FIRE 時間
  fire-calculator.tsx        # 月支出、提取率、進度條
  future-fire-card.tsx       # Power Law 預測 1/5/10 年
  portfolio-input.tsx        # 多錢包管理器、BTC 單位選擇器、位址排名
  scenario-simulator.tsx     # 熊市 / 基準 / 牛市情境
  data-settings.tsx          # 匯出 / 匯入 / 重置 / WebDAV 雲端備份下拉選單
  error-boundary.tsx         # 基於 class 的 React 錯誤邊界
  logo-mark.tsx              # SVG 圖示
  ui/                        # 極簡 Card、Button、Input、Label
hooks/                  # use-btc-price (WS+REST)、use-ahr999、use-btc-price-history、use-exchange-rate、use-persistent-state
lib/                    # 純計算（無 React）：calculations、ahr999、dca-fire、price-projection、i18n、types、mock-data、webdav
public/                 # 圖示 + webmanifest（PWA）
```

## 命令

| 命令             | 描述                         |
|------------------|------------------------------|
| `npm run dev`    | 啟動開發伺服器（localhost:3000）  |
| `npm run build`  | 生產構建（伺服器端 + 靜態頁面）   |
| `npm run start`  | 本地預覽構建好的應用           |
| `npm run lint`   | 執行 Next.js ESLint          |

不包含測試、格式化或型別檢查腳本。請勿新增。

## 許可

基於 [Apache License 2.0](LICENSE) 許可。

---

為那些想要規劃通往自由之路的比特幣 HODLers 而製作。
