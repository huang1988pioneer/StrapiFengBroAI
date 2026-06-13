# StrapiFengBroAI

Remix 版鋒兄資料庫 CRUD 工作台，配合 `huang1988pioneer/Strapihuang1988pioneer`
的 Strapi content-type 欄位，並參考 `goldshoot0720/fengbroaiappwrite`
的模組與 Appwrite CSV 格式。

## 功能

- 鋒兄訂閱、食品、筆記、常用、圖片、影片、音樂、文件、播客、銀行、例行、工具、設定、關於
- 鋒兄工具子項目：鋒兄比價、手機比價、鋒兄Tube、鋒兄金融
- 每個有 Strapi collection API 的模組支援新增、編輯、刪除、搜尋
- 新增、編輯、刪除、CSV 匯入會直接寫入 Strapi 資料庫
- 只使用瀏覽器 `localStorage` 保存鋒兄設定中的 Strapi URL 與 Strapi API Token
- 支援 CSV 匯入至 Strapi 與從 Strapi 匯出 CSV，包含 Appwrite 常見的雙引號與多行備註
- 內建訂閱、食品、筆記、常用、銀行、例行的範例 CSV 資料
- 鋒兄設定極簡化為 Strapi URL、Strapi API Token
- 鋒兄設定提供「測試連線」，會用目前表單內容測試 `Subscription` API 讀取權限
- 鋒兄圖片支援上傳圖片到 Strapi Media Library，並把圖片 URL 寫入 `images` collection

## Strapi CRUD 對應

目前有對應 Strapi collection API 的選單會直接 CRUD：

- 鋒兄訂閱：`/api/subscriptions`
- 鋒兄食品：`/api/foods`
- 鋒兄筆記：`/api/articles`
- 鋒兄常用：`/api/commonaccounts`
- 鋒兄圖片：`/api/images`
- 鋒兄影片：`/api/videos`
- 鋒兄音樂：`/api/music`
- 鋒兄文件：`/api/commondocuments`
- 鋒兄播客：`/api/podcasts`
- 鋒兄銀行：`/api/banks`
- 鋒兄例行：`/api/routines`
- 鋒兄比價：`/api/tool-price-histories`

手機比價、鋒兄Tube、鋒兄金融若要真正 CRUD，需要先在 Strapi 新增對應
collection type，並在前端補上 API path。

## 圖片上傳

在鋒兄圖片選單中點 `上傳圖片`，前端會先呼叫：

```text
POST /api/upload
```

上傳成功後會自動填入：

- `名稱`
- `圖片 URL`
- `封面 URL`
- `檔案類型`
- `Hash`

再按 `建立資料`，才會新增到 Strapi 的 `/api/images` collection。

## Token 注意事項

目前版本是前端直連 Strapi 的 CRUD 原型，只有 `Strapi URL` 和
`Strapi API Token` 會存進瀏覽器 `localStorage`。EdgeOne 可以設定：

```text
VITE_STRAPI_URL=https://your-strapi-domain
VITE_STRAPI_API_TOKEN=your-test-token
```

因為 `VITE_` 變數會打包進前端 JS，正式接 Strapi 時，應改由後端環境變數或
平台 Secret 管理有寫入/刪除權限的 token。

## 開發

```bash
npm install
npm run dev
```

預設開發網址：

```text
http://127.0.0.1:5173
```

## 檢查

```bash
npm run typecheck
npm run build
```
