import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Banknote,
  BookOpenText,
  Boxes,
  Check,
  ChevronDown,
  Download,
  FileAudio,
  FileText,
  Film,
  FolderHeart,
  Image,
  Info,
  Music,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  Upload,
  Utensils,
  Wrench,
} from "lucide-react";

type FieldType = "text" | "number" | "date" | "datetime" | "textarea" | "url" | "boolean";

type FieldDef = {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
  strapiKey?: string;
};

type ModuleDef = {
  id: string;
  label: string;
  subtitle: string;
  icon: JSX.Element;
  fields: FieldDef[];
  apiPath?: string;
  seedCsv?: string;
  children?: ModuleDef[];
};

type ItemRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number | boolean;
};

const nowIso = () => new Date().toISOString();
const storagePrefix = "fengbro-remix-crud";
const settingsStorageKey = `${storagePrefix}:settings`;
const defaultStrapiUrl = import.meta.env.VITE_STRAPI_URL || "";
const defaultStrapiApiToken = import.meta.env.VITE_STRAPI_API_TOKEN || "";

const subscriptionCsv = `name,site,price,nextdate,note,account,currency,continue
小北百貨連續簽到,,0,2026-06-07,"~0607
0988
0908",,TWD,false
Proton Drive Plus 200 GB,https://drive.proton.me,5,2026-06-15,,huang1988pioneer,USD,false
蝦皮VIP,,59,2026-06-30,"台新銀行
0731
0831",abuhg17,TWD,true
ChatGPT/ＰＬＵＳ,https://chatgpt.com/#pricing,690,2026-07-04,"outlook
街口
中信
Apple Pay",gaokaolevel3iptopscorer,TWD,true
Google AI Pro,https://gemini.google.com/app,0,2026-08-08,"5TB
前4個月試用免費
650元",fengtuprinfo,TWD,false`;

const foodCsv = `name,amount,todate,photo,price,shop,photohash
小北百貨30元購物金,1,2026-06-11T00:00:00.000+00:00,,0,,
【義美】煎餅 ~08/13 ~08/25,4,2026-08-04T00:00:00.000+00:00,,0,,
【愛之味】牛奶花生,4,2027-03-04T00:00:00.000+00:00,https://www.agv.com.tw/wp-content/uploads/69691c7bdcc3ce6d5d8a1361f22d04ac.jpg,0,,
【泰山】八寶粥,5,2027-04-14T00:00:00.000+00:00,https://shoplineimg.com/64587ad406d620007ce10917/6463162e0fa8d10001cc0eb5/800x.jpg?,0,,`;

const articleCsv = `title,content,category,newDate,url1,url2,url3,file1,file1name,file1type,file2,file2name,file2type,file3,file3name,file3type
歷史價格紀錄,"KIOXIA 鎧俠 Exceria Plus G3 SSD M.2 2280 PCIe NVMe 1TB Gen4x4
https://24h.pchome.com.tw/prod/DRAHGT-A900GOJVX
曾經來到２０９０元",,2026-06-04,,,,,,,,,,,,
米斗多,"紅豆 芋頭 巧克力
1 1 1",,2026-06-01,,,,,,,,,,,,
中原豆花,"玉玉子豆花 中北路二段457號 招牌豆花 固定三配料
熊豆花 麻糬豆花 大仁五街19號 自選三配料",,2026-06-01,,,,,,,,,,,,`;

const commonCsv = `name,site01,note01,site02,note02,site03,note03,site04,note04
goldshoot0720@gmail.com,可灵AI,,即梦AI,,豆包,,Appwrite,
dailycash539get8000000@outlook.com,Appwrite,,Github,,MindVideo,,Outlook,
sjes8460105@hotmail.com,Github,,Gmail,,MindVideo,,Suno,`;

const bankCsv = `name,deposit,site,address,withdrawals,transfer,activity,card,account
兆豐銀行,1000,,,0,0,,,末五碼 52678
中華郵政,1000,,,0,0,,,末五碼 45747
台新銀行,500,https://www.taishinbank.com.tw,,5,5,https://richart.tw/TSDIB_RichartWeb/ntd-saving-currency,台新Richart VISA金融卡 1902,末五碼 57295
Xiaomi 手環9 NFC 午夜黑,316,,,0,0,,,
Supercard超級悠遊卡LOGO線條款,242,https://www.easycard.com.tw/museum?page=1,,0,0,,,`;

const routineCsv = `name,note,lastdate1,lastdate2,lastdate3,link,photo
鋒兄理髮,,2026-05-18T00:00:00.000+00:00,2026-02-04T00:00:00.000+00:00,,,
鋒兄手機,Samsung Galaxy A56 5G (12G/256G),2026-01-02T00:00:00.000+00:00,,,,https://storage.googleapis.com/landtop_prod/productimage/3544/image/e63b19d17156868403c6645dc5572ca3.png
鋒兄眼鏡,"13500元
非凡比眼鏡",2025-09-03T00:00:00.000+00:00,,,,`;

const settingsCsv = `name,strapiUrl,apiToken,note
Strapi,${defaultStrapiUrl},${defaultStrapiApiToken},"可用 VITE_STRAPI_URL 與 VITE_STRAPI_API_TOKEN 從部署環境預填"`;

const subscriptionFields: FieldDef[] = [
  { key: "name", label: "名稱", required: true },
  { key: "site", label: "網站", type: "url" },
  { key: "price", label: "價格", type: "number" },
  { key: "nextdate", label: "下次日期", type: "date" },
  { key: "note", label: "備註", type: "textarea" },
  { key: "account", label: "帳號" },
  { key: "currency", label: "幣別", placeholder: "TWD" },
  { key: "continue", label: "持續", type: "boolean", strapiKey: "iscontinue" },
];

const mediaFields: FieldDef[] = [
  { key: "title", label: "標題", required: true },
  { key: "url", label: "連結", type: "url" },
  { key: "category", label: "分類" },
  { key: "date", label: "日期", type: "date" },
  { key: "note", label: "備註", type: "textarea" },
];

const imageFields: FieldDef[] = [
  { key: "name", label: "名稱", required: true },
  { key: "file", label: "圖片 URL", type: "url" },
  { key: "filetype", label: "檔案類型" },
  { key: "note", label: "備註", type: "textarea" },
  { key: "ref", label: "來源/參考", type: "url" },
  { key: "category", label: "分類" },
  { key: "hash", label: "Hash" },
  { key: "cover", label: "封面 URL", type: "url" },
];

const modules: ModuleDef[] = [
  { id: "subscription", label: "鋒兄訂閱", subtitle: "續訂、扣款與提醒", icon: <Archive />, fields: subscriptionFields, apiPath: "subscriptions", seedCsv: subscriptionCsv },
  {
    id: "food",
    label: "鋒兄食品",
    subtitle: "食品與商品庫存",
    icon: <Utensils />,
    apiPath: "foods",
    seedCsv: foodCsv,
    fields: [
      { key: "name", label: "名稱", required: true },
      { key: "amount", label: "庫存數量", type: "number" },
      { key: "todate", label: "到期日", type: "datetime" },
      { key: "photo", label: "照片", type: "url" },
      { key: "price", label: "價格", type: "number" },
      { key: "shop", label: "商店" },
      { key: "photohash", label: "照片 Hash" },
    ],
  },
  {
    id: "article",
    label: "鋒兄筆記",
    subtitle: "文章、連結與附件",
    icon: <BookOpenText />,
    apiPath: "articles",
    seedCsv: articleCsv,
    fields: [
      { key: "title", label: "標題", required: true },
      { key: "content", label: "內容", type: "textarea" },
      { key: "category", label: "分類" },
      { key: "newDate", label: "日期", type: "date", strapiKey: "newdate" },
      { key: "url1", label: "連結 1", type: "url" },
      { key: "url2", label: "連結 2", type: "url" },
      { key: "url3", label: "連結 3", type: "url" },
      { key: "file1", label: "檔案 1" },
      { key: "file1name", label: "檔名 1" },
      { key: "file1type", label: "類型 1" },
      { key: "file2", label: "檔案 2" },
      { key: "file2name", label: "檔名 2" },
      { key: "file2type", label: "類型 2" },
      { key: "file3", label: "檔案 3" },
      { key: "file3name", label: "檔名 3" },
      { key: "file3type", label: "類型 3" },
    ],
  },
  {
    id: "common",
    label: "鋒兄常用",
    subtitle: "常用帳號與網站",
    icon: <FolderHeart />,
    apiPath: "commonaccounts",
    seedCsv: commonCsv,
    fields: [
      { key: "name", label: "帳號", required: true },
      ...Array.from({ length: 6 }, (_, index) => index + 1).flatMap((num) => [
        { key: `site${String(num).padStart(2, "0")}`, label: `網站 ${num}` },
        { key: `note${String(num).padStart(2, "0")}`, label: `備註 ${num}` },
      ]),
    ],
  },
  { id: "image", label: "鋒兄圖片", subtitle: "圖片素材庫", icon: <Image />, fields: imageFields, apiPath: "images" },
  { id: "video", label: "鋒兄影片", subtitle: "影片與頻道", icon: <Film />, fields: mediaFields, apiPath: "videos" },
  { id: "music", label: "鋒兄音樂", subtitle: "歌曲與歌詞", icon: <Music />, fields: mediaFields, apiPath: "music" },
  { id: "document", label: "鋒兄文件", subtitle: "文件與檔案", icon: <FileText />, fields: mediaFields, apiPath: "commondocuments" },
  { id: "podcast", label: "鋒兄播客", subtitle: "播客清單", icon: <FileAudio />, fields: mediaFields, apiPath: "podcasts" },
  {
    id: "bank",
    label: "鋒兄銀行",
    subtitle: "銀行與電子票證",
    icon: <Banknote />,
    apiPath: "banks",
    seedCsv: bankCsv,
    fields: [
      { key: "name", label: "名稱", required: true },
      { key: "deposit", label: "存款/餘額", type: "number" },
      { key: "site", label: "網站", type: "url" },
      { key: "address", label: "地址" },
      { key: "withdrawals", label: "提款", type: "number" },
      { key: "transfer", label: "轉帳", type: "number" },
      { key: "activity", label: "活動", type: "url" },
      { key: "card", label: "卡片/電子票證" },
      { key: "account", label: "帳號" },
    ],
  },
  {
    id: "routine",
    label: "鋒兄例行",
    subtitle: "例行採買與保養",
    icon: <RefreshCcw />,
    apiPath: "routines",
    seedCsv: routineCsv,
    fields: [
      { key: "name", label: "名稱", required: true },
      { key: "note", label: "備註", type: "textarea" },
      { key: "lastdate1", label: "日期 1", type: "datetime" },
      { key: "lastdate2", label: "日期 2", type: "datetime" },
      { key: "lastdate3", label: "日期 3", type: "datetime" },
      { key: "link", label: "連結", type: "url" },
      { key: "photo", label: "照片", type: "url" },
    ],
  },
  {
    id: "tools",
    label: "鋒兄工具",
    subtitle: "工具入口與子功能",
    icon: <Wrench />,
    fields: mediaFields,
    children: [
      { id: "price", label: "鋒兄比價", subtitle: "價格追蹤", icon: <PackagePlus />, fields: mediaFields, apiPath: "tool-price-histories" },
      { id: "phone-price", label: "手機比價", subtitle: "手機規格價格", icon: <Boxes />, fields: mediaFields },
      { id: "tube", label: "鋒兄Tube", subtitle: "影音搜尋", icon: <Film />, fields: mediaFields },
      { id: "finance", label: "鋒兄金融", subtitle: "金融資訊", icon: <Banknote />, fields: mediaFields },
    ],
  },
  {
    id: "settings",
    label: "鋒兄設定",
    subtitle: "Strapi URL 與 API Token",
    icon: <Settings />,
    seedCsv: settingsCsv,
    fields: [
      { key: "name", label: "設定名稱", required: true },
      { key: "strapiUrl", label: "Strapi URL", type: "url" },
      { key: "apiToken", label: "Strapi API Token", type: "textarea" },
      { key: "note", label: "備註", type: "textarea" },
    ],
  },
  {
    id: "about",
    label: "鋒兄關於",
    subtitle: "專案說明",
    icon: <Info />,
    fields: [
      { key: "title", label: "標題", required: true },
      { key: "content", label: "內容", type: "textarea" },
      { key: "url", label: "連結", type: "url" },
    ],
  },
];

const moduleMap = new Map(flattenModules(modules).map((item) => [item.id, item]));

export default function Index() {
  const fileRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState("subscription");
  const activeModule = moduleMap.get(activeId) ?? modules[0];
  const [recordsByModule, setRecordsByModule] = useState<Record<string, ItemRecord[]>>({});
  const [settings, setSettings] = useState<ItemRecord>(() => getDefaultSettingsRecord());
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<{ label: string; current: number; total: number } | null>(null);
  const [toast, setToast] = useState("已準備 Remix CRUD 工作台");

  useEffect(() => {
    const saved = window.localStorage.getItem(settingsStorageKey);
    if (saved) {
      setSettings({ ...getDefaultSettingsRecord(), ...(JSON.parse(saved) as ItemRecord) });
    }
  }, []);

  useEffect(() => {
    setEditingId(null);
    setDraft(activeModule.id === "settings" ? settingsToDraft(settings) : getEmptyDraft(activeModule));
    setSearch("");
    if (activeModule.id !== "settings") void loadRecords(activeModule);
  }, [activeModule.id, settings.strapiUrl, settings.apiToken]);

  const records = activeModule.id === "settings" ? [settings] : recordsByModule[activeModule.id] ?? [];
  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      activeModule.fields.some((field) =>
        String(record[field.key] ?? "").toLowerCase().includes(query),
      ),
    );
  }, [activeModule.fields, records, search]);

  const stats = useMemo(() => {
    const total = records.length;
    const numericTotal = records.reduce((sum, record) => {
      const price = Number(record.price ?? record.deposit ?? record.amount ?? 0);
      return Number.isFinite(price) ? sum + price : sum;
    }, 0);
    return { total, numericTotal };
  }, [records]);

  function setModuleRecords(moduleId: string, nextRecords: ItemRecord[]) {
    setRecordsByModule((prev) => ({ ...prev, [moduleId]: nextRecords }));
  }

  function saveSettings(nextSettings: ItemRecord) {
    setSettings(nextSettings);
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(nextSettings));
  }

  async function loadRecords(moduleDef = activeModule) {
    if (moduleDef.id === "settings") return;
    if (!moduleDef.apiPath) {
      setModuleRecords(moduleDef.id, []);
      setToast(`${moduleDef.label} 尚未設定 Strapi collection API 路徑`);
      return;
    }
    if (!hasStrapiConfig(settings)) {
      setModuleRecords(moduleDef.id, []);
      setToast("請先到鋒兄設定填寫 Strapi URL 和 Strapi API Token");
      return;
    }

    setLoading(true);
    try {
      const payload = await strapiRequest(settings, moduleDef.apiPath, "GET");
      setModuleRecords(moduleDef.id, strapiListToRecords(payload, moduleDef));
      setToast(`已從 Strapi 載入 ${moduleDef.label}`);
    } catch (error) {
      setModuleRecords(moduleDef.id, []);
      setToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function saveRecord() {
    const missing = activeModule.fields.find((field) => field.required && !String(draft[field.key] ?? "").trim());
    if (missing) {
      setToast(`請先填寫 ${missing.label}`);
      return;
    }

    const normalized = normalizeDraft(draft, activeModule);
    if (activeModule.id === "settings") {
      const nextSettings = {
        ...settings,
        ...normalized,
        id: "settings",
        updatedAt: nowIso(),
      };
      saveSettings(nextSettings);
      setEditingId(null);
      setDraft(settingsToDraft(nextSettings));
      setToast("已儲存 Strapi URL / API Token");
      return;
    }

    if (!activeModule.apiPath) {
      setToast(`${activeModule.label} 尚未設定 Strapi collection API 路徑，無法新增到資料庫`);
      return;
    }
    if (!hasStrapiConfig(settings)) {
      setToast("請先到鋒兄設定填寫 Strapi URL 和 Strapi API Token");
      return;
    }

    setLoading(true);
    if (editingId) {
      try {
        const target = records.find((record) => record.id === editingId);
        await strapiRequest(settings, `${activeModule.apiPath}/${target?._strapiId ?? editingId}`, "PUT", toStrapiData(normalized, activeModule));
        await loadRecords(activeModule);
        setToast(`已更新 Strapi：${getRecordTitle(normalized, activeModule)}`);
      } catch (error) {
        setToast(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await strapiRequest(settings, activeModule.apiPath, "POST", toStrapiData(normalized, activeModule));
        await loadRecords(activeModule);
        setToast(`已新增至 Strapi：${getRecordTitle(normalized, activeModule)}`);
      } catch (error) {
        setToast(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    setEditingId(null);
    setDraft(getEmptyDraft(activeModule));
  }

  function editRecord(record: ItemRecord) {
    setEditingId(record.id);
    setDraft(Object.fromEntries(activeModule.fields.map((field) => [field.key, record[field.key] ?? ""])));
  }

  async function deleteRecord(id: string) {
    const target = records.find((record) => record.id === id);
    if (activeModule.id === "settings") {
      if (!window.confirm("確定要清空 Strapi URL / API Token 設定嗎？")) return;
      const nextSettings = getDefaultSettingsRecord();
      saveSettings(nextSettings);
      setDraft(settingsToDraft(nextSettings));
      setToast("已清空 Strapi 設定");
      return;
    }
    if (!activeModule.apiPath || !target) return;
    const title = getRecordTitle(target, activeModule);
    if (!window.confirm(`確定要從 Strapi 刪除「${title}」嗎？\n\n此操作無法復原。`)) return;

    setLoading(true);
    try {
      await strapiRequest(settings, `${activeModule.apiPath}/${target._strapiId ?? id}`, "DELETE");
      await loadRecords(activeModule);
      setToast(`已從 Strapi 刪除 ${target ? getRecordTitle(target, activeModule) : "資料"}`);
    } catch (error) {
      setToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function resetSeed() {
    if (activeModule.id === "settings") {
      const nextSettings = getDefaultSettingsRecord();
      saveSettings(nextSettings);
      setDraft(settingsToDraft(nextSettings));
      setToast("已重設 Strapi URL / API Token 預設值");
      return;
    }
    if (!activeModule.seedCsv) {
      await loadRecords(activeModule);
      return;
    }
    await importRows(parseCsv(activeModule.seedCsv), activeModule, "範例資料");
  }

  async function importCsv(file: File) {
    const text = await file.text();
    await importRows(parseCsv(text), activeModule, file.name);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function importRows(rows: Record<string, string>[], moduleDef: ModuleDef, label: string) {
    if (moduleDef.id === "settings") {
      const imported = rowsToRecords(rows, moduleDef)[0];
      if (imported) {
        saveSettings({ ...settings, ...imported, id: "settings", updatedAt: nowIso() });
        setToast(`已匯入 Strapi 設定：${label}`);
      }
      return;
    }
    if (!moduleDef.apiPath) {
      setToast(`${moduleDef.label} 尚未設定 Strapi collection API 路徑，無法匯入資料庫`);
      return;
    }
    if (!hasStrapiConfig(settings)) {
      setToast("請先到鋒兄設定填寫 Strapi URL 和 Strapi API Token");
      return;
    }

    setLoading(true);
    setImportProgress({ label, current: 0, total: rows.length });
    try {
      for (const [index, row] of rows.entries()) {
        const normalized = normalizeDraft(row, moduleDef);
        await strapiRequest(settings, moduleDef.apiPath, "POST", toStrapiData(normalized, moduleDef));
        const current = index + 1;
        setImportProgress({ label, current, total: rows.length });
        setToast(`正在匯入 ${moduleDef.label}：${current} / ${rows.length}`);
      }
      await loadRecords(moduleDef);
      setToast(`已匯入 ${rows.length} 筆 CSV 至 Strapi：${moduleDef.label}`);
    } catch (error) {
      setToast(getErrorMessage(error));
    } finally {
      setImportProgress(null);
      setLoading(false);
    }
  }

  async function testStrapiConnection() {
    const testSettings = activeModule.id === "settings"
      ? { ...settings, ...normalizeDraft(draft, activeModule), id: "settings", updatedAt: nowIso() }
      : settings;

    if (!hasStrapiConfig(testSettings)) {
      setToast("請先填寫 Strapi URL 和 Strapi API Token");
      return;
    }

    setLoading(true);
    try {
      const payload = await strapiRequest(testSettings, "subscriptions", "GET");
      const count = Array.isArray((payload as { data?: unknown })?.data)
        ? (payload as { data: unknown[] }).data.length
        : 0;
      setToast(`Strapi 連線成功：Subscription API 可讀取，目前回傳 ${count} 筆`);
    } catch (error) {
      setToast(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function uploadImageFile(file: File) {
    if (!hasStrapiConfig(settings)) {
      setToast("請先到鋒兄設定填寫 Strapi URL 和 Strapi API Token");
      return;
    }

    setLoading(true);
    setToast(`正在上傳圖片：${file.name}`);
    try {
      const uploaded = await strapiUploadFile(settings, file);
      const url = getStrapiAssetUrl(settings, String(uploaded.url ?? ""));
      setDraft((prev) => ({
        ...prev,
        name: String(prev.name || file.name.replace(/\.[^.]+$/, "")),
        file: url,
        cover: url,
        filetype: String(uploaded.mime ?? file.type ?? ""),
        hash: String(uploaded.hash ?? ""),
      }));
      setToast(`圖片上傳成功：${file.name}`);
    } catch (error) {
      setToast(getErrorMessage(error));
    } finally {
      setLoading(false);
      if (imageUploadRef.current) imageUploadRef.current.value = "";
    }
  }

  function exportCsv() {
    const csv = toCsv(records, activeModule.fields.map((field) => field.key));
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `appwrite-${activeModule.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast(`已匯出 ${records.length} 筆 ${activeModule.label}`);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">鋒</div>
          <div>
            <h1>鋒兄資料庫</h1>
            <p>Remix CRUD Console</p>
          </div>
        </div>
        <nav className="nav-list" aria-label="鋒兄模組">
          {modules.map((item) => (
            <NavItem key={item.id} item={item} activeId={activeId} onSelect={setActiveId} />
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyeline">配合 Strapihuang1988pioneer，參考 fengbroaiappwrite</p>
            <h2>{activeModule.label}</h2>
            <p>{activeModule.subtitle}</p>
          </div>
          <div className="top-actions">
            <button className="ghost-button" type="button" onClick={resetSeed}>
              <RefreshCcw size={16} />
              {activeModule.id === "settings" ? "重設設定" : activeModule.seedCsv ? "匯入範例" : "重新載入"}
            </button>
            <button className="primary-button" type="button" onClick={() => setDraft(getEmptyDraft(activeModule))}>
              <Plus size={16} />
              新增
            </button>
          </div>
        </header>

        <section className="stats-strip" aria-label="資料統計">
          <Metric label="資料筆數" value={String(stats.total)} />
          <Metric label="數值合計" value={formatNumber(stats.numericTotal)} />
          <Metric label="欄位數" value={String(activeModule.fields.length)} />
          <Metric label="CSV" value="匯入 / 匯出" />
        </section>

        <section className="content-grid">
          <div className="table-panel">
            <div className="toolbar">
              <label className="search-box">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`搜尋 ${activeModule.label}`}
                />
              </label>
              <div className="toolbar-actions">
                <input
                  ref={fileRef}
                  className="file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importCsv(file);
                  }}
                />
                <button type="button" className="tool-button" onClick={() => fileRef.current?.click()} disabled={loading}>
                  <Upload size={16} />
                  匯入 CSV
                </button>
                <button type="button" className="tool-button" onClick={exportCsv} disabled={loading}>
                  <Download size={16} />
                  匯出 CSV
                </button>
              </div>
            </div>
            {importProgress ? (
              <div className="import-progress" role="status" aria-live="polite">
                <div className="import-progress-label">
                  <span>匯入 {importProgress.label}</span>
                  <strong>{importProgress.current} / {importProgress.total}</strong>
                </div>
                <div className="import-progress-track">
                  <div
                    className="import-progress-bar"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {activeModule.fields.slice(0, 6).map((field) => (
                      <th key={field.key}>{field.label}</th>
                    ))}
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.length ? (
                    visibleRecords.map((record) => (
                      <tr key={record.id}>
                        {activeModule.fields.slice(0, 6).map((field) => (
                          <td key={field.key}>{renderCell(record[field.key], field)}</td>
                        ))}
                        <td>
                          <div className="row-actions">
                            <button type="button" onClick={() => editRecord(record)} aria-label="編輯">
                              <Pencil size={15} />
                            </button>
                            <button type="button" onClick={() => deleteRecord(record.id)} aria-label="刪除">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeModule.fields.slice(0, 6).length + 1} className="empty-cell">
                        尚無資料，請新增或匯入 CSV。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="editor-panel">
            <div className="editor-head">
              <div>
                <h3>{editingId ? "編輯資料" : "新增資料"}</h3>
                <p>{activeModule.label} 欄位會跟 CSV 表頭一致保存。</p>
              </div>
              <span className="status-pill">
                <Check size={14} />
                {activeModule.id === "settings" ? "Local" : "Strapi"}
              </span>
            </div>

            <div className="form-grid">
              {activeModule.fields.map((field) => (
                <label key={field.key} className={field.type === "textarea" ? "field field-wide" : "field"}>
                  <span>{field.label}</span>
                  <FieldInput
                    field={field}
                    value={draft[field.key] ?? ""}
                    onChange={(value) => setDraft((prev) => ({ ...prev, [field.key]: value }))}
                  />
                </label>
              ))}
            </div>

            <div className="editor-actions">
              {activeModule.id === "image" ? (
                <>
                  <input
                    ref={imageUploadRef}
                    className="file-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImageFile(file);
                    }}
                  />
                  <button className="tool-button" type="button" onClick={() => imageUploadRef.current?.click()} disabled={loading}>
                    <Upload size={16} />
                    上傳圖片
                  </button>
                </>
              ) : null}
              <button className="primary-button" type="button" onClick={saveRecord} disabled={loading}>
                {loading ? "處理中..." : editingId ? "儲存修改" : "建立資料"}
              </button>
              {activeModule.id === "settings" ? (
                <button className="tool-button" type="button" onClick={testStrapiConnection} disabled={loading}>
                  測試連線
                </button>
              ) : null}
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDraft(getEmptyDraft(activeModule));
                }}
              >
                清空
              </button>
            </div>

            <div className="csv-note">
              <strong>Appwrite CSV 相容</strong>
              <span>支援雙引號、多行備註、UTF-8 BOM 匯出，方便與既有 Appwrite CSV 往返。</span>
            </div>
          </aside>
        </section>

        <p className="toast" role="status">{toast}</p>
      </section>
    </main>
  );
}

function NavItem({
  item,
  activeId,
  onSelect,
}: {
  item: ModuleDef;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(item.id === "tools");
  const active = item.id === activeId || Boolean(item.children?.some((child) => child.id === activeId));
  return (
    <div>
      <button
        className={`nav-item ${active ? "active" : ""}`}
        type="button"
        onClick={() => (item.children ? setOpen((value) => !value) : onSelect(item.id))}
      >
        <span className="nav-icon">{item.icon}</span>
        <span>
          <strong>{item.label}</strong>
          <small>{item.subtitle}</small>
        </span>
        {item.children ? <ChevronDown className={open ? "chevron open" : "chevron"} size={15} /> : null}
      </button>
      {item.children && open ? (
        <div className="subnav">
          {item.children.map((child) => (
            <button
              key={child.id}
              className={`subnav-item ${child.id === activeId ? "active" : ""}`}
              type="button"
              onClick={() => onSelect(child.id)}
            >
              {child.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}) {
  if (field.type === "textarea") {
    return <textarea value={String(value)} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} rows={4} />;
  }
  if (field.type === "boolean") {
    return (
      <select value={String(value || false)} onChange={(event) => onChange(event.target.value === "true")}>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  return (
    <input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : field.type === "url" ? "url" : "text"}
      value={String(value)}
      placeholder={field.placeholder}
      onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
    />
  );
}

function flattenModules(items: ModuleDef[]): ModuleDef[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenModules(item.children) : [])]);
}

function getDefaultSettingsRecord(): ItemRecord {
  return {
    id: "settings",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    name: "Strapi",
    strapiUrl: defaultStrapiUrl,
    apiToken: defaultStrapiApiToken,
    note: "Strapi URL 與 Strapi API Token 是唯一保存在瀏覽器的設定。",
  };
}

function settingsToDraft(settings: ItemRecord) {
  return {
    name: String(settings.name ?? "Strapi"),
    strapiUrl: String(settings.strapiUrl ?? ""),
    apiToken: String(settings.apiToken ?? ""),
    note: String(settings.note ?? ""),
  };
}

function hasStrapiConfig(settings: ItemRecord) {
  return Boolean(String(settings.strapiUrl ?? "").trim() && String(settings.apiToken ?? "").trim());
}

async function strapiRequest(settings: ItemRecord, path: string, method: "GET" | "POST" | "PUT" | "DELETE", data?: Record<string, unknown>) {
  const baseUrl = String(settings.strapiUrl ?? "").replace(/\/+$/, "");
  const token = String(settings.apiToken ?? "").trim();
  const url = `${baseUrl}/api/${path}${method === "GET" ? "?pagination[pageSize]=100" : ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify({ data }) : undefined,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = errorBody?.error?.message ? `：${errorBody.error.message}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`Strapi ${method} /api/${path} 失敗 (${response.status})${detail}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function strapiUploadFile(settings: ItemRecord, file: File) {
  const baseUrl = String(settings.strapiUrl ?? "").replace(/\/+$/, "");
  const token = String(settings.apiToken ?? "").trim();
  const formData = new FormData();
  formData.append("files", file);

  const response = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = errorBody?.error?.message ? `：${errorBody.error.message}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`Strapi 圖片上傳失敗 (${response.status})${detail}`);
  }

  const uploaded = await response.json();
  const firstFile = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  if (!firstFile?.url) throw new Error("Strapi 圖片上傳成功但沒有回傳 URL");
  return firstFile as Record<string, unknown>;
}

function getStrapiAssetUrl(settings: ItemRecord, url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = String(settings.strapiUrl ?? "").replace(/\/+$/, "");
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

function strapiListToRecords(payload: unknown, moduleDef: ModuleDef): ItemRecord[] {
  const list = Array.isArray((payload as { data?: unknown })?.data) ? (payload as { data: unknown[] }).data : [];
  return list.map((entry) => strapiEntryToRecord(entry, moduleDef));
}

function strapiEntryToRecord(entry: unknown, moduleDef: ModuleDef): ItemRecord {
  const source = entry as Record<string, unknown>;
  const attributes = (source.attributes && typeof source.attributes === "object" ? source.attributes : source) as Record<string, unknown>;
  const strapiId = String(source.documentId ?? source.id ?? crypto.randomUUID());
  const mapped = Object.fromEntries(
    moduleDef.fields.map((field) => {
      const value = attributes[field.strapiKey ?? field.key] ?? "";
      return [field.key, coerceFieldValue(value, field)];
    }),
  );

  return {
    id: strapiId,
    _strapiId: strapiId,
    createdAt: String(attributes.createdAt ?? ""),
    updatedAt: String(attributes.updatedAt ?? ""),
    ...mapped,
  };
}

function toStrapiData(record: Record<string, string | number | boolean>, moduleDef: ModuleDef) {
  return Object.fromEntries(
    moduleDef.fields.map((field) => [field.strapiKey ?? field.key, toStrapiFieldValue(record[field.key], field)]),
  );
}

function toStrapiFieldValue(value: string | number | boolean | undefined, field: FieldDef) {
  if ((field.type === "date" || field.type === "datetime") && String(value ?? "").trim() === "") {
    return null;
  }
  return value ?? "";
}

function coerceFieldValue(value: unknown, field: FieldDef) {
  if (field.type === "number") return Number(value || 0);
  if (field.type === "boolean") return value === true || value === "true";
  return String(value ?? "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Strapi 操作失敗";
}

function getEmptyDraft(moduleDef: ModuleDef) {
  return Object.fromEntries(moduleDef.fields.map((field) => [field.key, field.type === "number" ? 0 : field.type === "boolean" ? false : ""]));
}

function normalizeDraft(draft: Record<string, string | number | boolean>, moduleDef: ModuleDef) {
  return Object.fromEntries(
    moduleDef.fields.map((field) => {
      const value = draft[field.key];
      if (field.type === "number") return [field.key, Number(value || 0)];
      if (field.type === "boolean") return [field.key, value === true || value === "true"];
      return [field.key, String(value ?? "")];
    }),
  );
}

function rowsToRecords(rows: Record<string, string>[], moduleDef: ModuleDef): ItemRecord[] {
  return rows.map((row) => {
    const normalized = normalizeDraft(row, moduleDef);
    return {
      id: crypto.randomUUID(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...normalized,
    };
  });
}

function getRecordTitle(record: Record<string, unknown>, moduleDef: ModuleDef) {
  const preferred = ["name", "title"].find((key) => record[key]);
  if (preferred) return String(record[preferred]);
  return `${moduleDef.label}資料`;
}

function renderCell(value: string | number | boolean, field: FieldDef) {
  if (field.type === "boolean") return value ? "true" : "false";
  if (field.type === "url" && value) {
    return (
      <a href={String(value)} target="_blank" rel="noreferrer">
        {String(value)}
      </a>
    );
  }
  return String(value ?? "") || "-";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(value);
}

function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  const headers = rows.shift()?.map((header) => header.replace(/^\uFEFF/, "").trim()) ?? [];
  return rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
  );
}

function toCsv(records: ItemRecord[], headers: string[]) {
  const lines = [headers.join(",")];
  for (const record of records) {
    lines.push(headers.map((header) => escapeCsv(record[header])).join(","));
  }
  return lines.join("\n");
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
