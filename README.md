# StrapiFengBroAI

Remix 版鋒兄資料庫 CRUD 工作台，配合 `huang1988pioneer/Strapihuang1988pioneer`
的 Strapi content-type 欄位，並參考 `goldshoot0720/fengbroaiappwrite`
的模組與 Appwrite CSV 格式。

## 功能

- 鋒兄訂閱、食品、筆記、常用、圖片、影片、音樂、文件、播客、銀行、例行、工具、設定、關於
- 鋒兄工具子項目：鋒兄比價、手機比價、鋒兄Tube、鋒兄金融
- 每個模組支援新增、編輯、刪除、搜尋
- 使用瀏覽器 `localStorage` 保存資料
- 支援 CSV 匯入與匯出，包含 Appwrite 常見的雙引號與多行備註
- 內建訂閱、食品、筆記、常用、銀行、例行的範例 CSV 資料

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
