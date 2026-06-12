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
};

type ModuleDef = {
  id: string;
  label: string;
  subtitle: string;
  icon: JSX.Element;
  fields: FieldDef[];
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

const settingsCsv = `name,environment,appUrl,strapiUrl,appwriteEndpoint,projectId,apiTokenName,apiToken,readToken,writeToken,enabled,note
Production,production,https://strapifengbroai-dplipoaywwkn.edgeone.dev,https://strapihuang1988pioneer.example.com,https://cloud.appwrite.io/v1,,EdgeOne Deploy Token,,,true,"正式 token 不建議存瀏覽器 localStorage"
Local,development,http://127.0.0.1:5173,http://127.0.0.1:1337,http://127.0.0.1/v1,,Local Dev Token,,,true,"本機開發用設定"`;

const subscriptionFields: FieldDef[] = [
  { key: "name", label: "名稱", required: true },
  { key: "site", label: "網站", type: "url" },
  { key: "price", label: "價格", type: "number" },
  { key: "nextdate", label: "下次日期", type: "date" },
  { key: "note", label: "備註", type: "textarea" },
  { key: "account", label: "帳號" },
  { key: "currency", label: "幣別", placeholder: "TWD" },
  { key: "continue", label: "持續", type: "boolean" },
];

const mediaFields: FieldDef[] = [
  { key: "title", label: "標題", required: true },
  { key: "url", label: "連結", type: "url" },
  { key: "category", label: "分類" },
  { key: "date", label: "日期", type: "date" },
  { key: "note", label: "備註", type: "textarea" },
];

const modules: ModuleDef[] = [
  { id: "subscription", label: "鋒兄訂閱", subtitle: "續訂、扣款與提醒", icon: <Archive />, fields: subscriptionFields, seedCsv: subscriptionCsv },
  {
    id: "food",
    label: "鋒兄食品",
    subtitle: "食品與商品庫存",
    icon: <Utensils />,
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
    seedCsv: articleCsv,
    fields: [
      { key: "title", label: "標題", required: true },
      { key: "content", label: "內容", type: "textarea" },
      { key: "category", label: "分類" },
      { key: "newDate", label: "日期", type: "date" },
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
    seedCsv: commonCsv,
    fields: [
      { key: "name", label: "帳號", required: true },
      ...Array.from({ length: 6 }, (_, index) => index + 1).flatMap((num) => [
        { key: `site${String(num).padStart(2, "0")}`, label: `網站 ${num}` },
        { key: `note${String(num).padStart(2, "0")}`, label: `備註 ${num}` },
      ]),
    ],
  },
  { id: "image", label: "鋒兄圖片", subtitle: "圖片素材庫", icon: <Image />, fields: mediaFields },
  { id: "video", label: "鋒兄影片", subtitle: "影片與頻道", icon: <Film />, fields: mediaFields },
  { id: "music", label: "鋒兄音樂", subtitle: "歌曲與歌詞", icon: <Music />, fields: mediaFields },
  { id: "document", label: "鋒兄文件", subtitle: "文件與檔案", icon: <FileText />, fields: mediaFields },
  { id: "podcast", label: "鋒兄播客", subtitle: "播客清單", icon: <FileAudio />, fields: mediaFields },
  {
    id: "bank",
    label: "鋒兄銀行",
    subtitle: "銀行與電子票證",
    icon: <Banknote />,
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
      { id: "price", label: "鋒兄比價", subtitle: "價格追蹤", icon: <PackagePlus />, fields: mediaFields },
      { id: "phone-price", label: "手機比價", subtitle: "手機規格價格", icon: <Boxes />, fields: mediaFields },
      { id: "tube", label: "鋒兄Tube", subtitle: "影音搜尋", icon: <Film />, fields: mediaFields },
      { id: "finance", label: "鋒兄金融", subtitle: "金融資訊", icon: <Banknote />, fields: mediaFields },
    ],
  },
  {
    id: "settings",
    label: "鋒兄設定",
    subtitle: "App URL 與 API Tokens",
    icon: <Settings />,
    seedCsv: settingsCsv,
    fields: [
      { key: "name", label: "設定名稱", required: true },
      { key: "environment", label: "環境", placeholder: "production" },
      { key: "appUrl", label: "App URL", type: "url" },
      { key: "strapiUrl", label: "Strapi URL", type: "url" },
      { key: "appwriteEndpoint", label: "Appwrite Endpoint", type: "url" },
      { key: "projectId", label: "Project ID" },
      { key: "apiTokenName", label: "API Token 名稱" },
      { key: "apiToken", label: "API Token", type: "textarea" },
      { key: "readToken", label: "Read Token", type: "textarea" },
      { key: "writeToken", label: "Write Token", type: "textarea" },
      { key: "enabled", label: "啟用", type: "boolean" },
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
  const [activeId, setActiveId] = useState("subscription");
  const activeModule = moduleMap.get(activeId) ?? modules[0];
  const [recordsByModule, setRecordsByModule] = useState<Record<string, ItemRecord[]>>({});
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [toast, setToast] = useState("已準備 Remix CRUD 工作台");

  useEffect(() => {
    const next: Record<string, ItemRecord[]> = {};
    for (const moduleDef of flattenModules(modules)) {
      const key = storageKey(moduleDef.id);
      const saved = window.localStorage.getItem(key);
      if (saved) {
        next[moduleDef.id] = JSON.parse(saved) as ItemRecord[];
      } else if (moduleDef.seedCsv) {
        next[moduleDef.id] = rowsToRecords(parseCsv(moduleDef.seedCsv), moduleDef);
      } else {
        next[moduleDef.id] = [];
      }
    }
    setRecordsByModule(next);
  }, []);

  useEffect(() => {
    setEditingId(null);
    setDraft(getEmptyDraft(activeModule));
    setSearch("");
  }, [activeModule.id]);

  const records = recordsByModule[activeModule.id] ?? [];
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

  function persist(moduleId: string, nextRecords: ItemRecord[]) {
    setRecordsByModule((prev) => ({ ...prev, [moduleId]: nextRecords }));
    window.localStorage.setItem(storageKey(moduleId), JSON.stringify(nextRecords));
  }

  function saveRecord() {
    const missing = activeModule.fields.find((field) => field.required && !String(draft[field.key] ?? "").trim());
    if (missing) {
      setToast(`請先填寫 ${missing.label}`);
      return;
    }

    const normalized = normalizeDraft(draft, activeModule);
    if (editingId) {
      persist(
        activeModule.id,
        records.map((record) =>
          record.id === editingId
            ? { ...record, ...normalized, updatedAt: nowIso() }
            : record,
        ),
      );
      setToast(`已更新 ${getRecordTitle(normalized, activeModule)}`);
    } else {
      const created: ItemRecord = {
        id: crypto.randomUUID(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        ...normalized,
      };
      persist(activeModule.id, [created, ...records]);
      setToast(`已新增 ${getRecordTitle(created, activeModule)}`);
    }

    setEditingId(null);
    setDraft(getEmptyDraft(activeModule));
  }

  function editRecord(record: ItemRecord) {
    setEditingId(record.id);
    setDraft(Object.fromEntries(activeModule.fields.map((field) => [field.key, record[field.key] ?? ""])));
  }

  function deleteRecord(id: string) {
    const target = records.find((record) => record.id === id);
    persist(activeModule.id, records.filter((record) => record.id !== id));
    setToast(`已刪除 ${target ? getRecordTitle(target, activeModule) : "資料"}`);
  }

  function resetSeed() {
    const next = activeModule.seedCsv ? rowsToRecords(parseCsv(activeModule.seedCsv), activeModule) : [];
    persist(activeModule.id, next);
    setToast(`已重設 ${activeModule.label} 範例資料`);
  }

  async function importCsv(file: File) {
    const text = await file.text();
    const imported = rowsToRecords(parseCsv(text), activeModule);
    persist(activeModule.id, [...imported, ...records]);
    setToast(`已匯入 ${imported.length} 筆 CSV 至 ${activeModule.label}`);
    if (fileRef.current) fileRef.current.value = "";
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
              重設範例
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
                <button type="button" className="tool-button" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} />
                  匯入 CSV
                </button>
                <button type="button" className="tool-button" onClick={exportCsv}>
                  <Download size={16} />
                  匯出 CSV
                </button>
              </div>
            </div>

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
                Local
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
              <button className="primary-button" type="button" onClick={saveRecord}>
                {editingId ? "儲存修改" : "建立資料"}
              </button>
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

function storageKey(moduleId: string) {
  return `${storagePrefix}:${moduleId}`;
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
