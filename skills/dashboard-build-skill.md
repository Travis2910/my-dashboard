# Dashboard Build Skill
Version: 2.0 · Project: my-dashboard · AIDA Program S5-6
Mục đích: Xây dựng dashboard hoàn chỉnh theo dashboard spec

---

## CÁCH DÙNG SKILL NÀY
Nhận input từ dashboard spec @.claude/skills/... (user đưa link spec)
Thực hiện theo yêu cầu bên dưới

> **Design system (colors, KPI structure, chart layout, page structure) → xem dashboard-design-skill.md**
> File này chỉ chứa implementation details: code templates, kiến trúc, Recharts gotchas.

---

## TECH STACK

- Framework: Next.js App Router (KHÔNG dùng Pages Router)
- Ngôn ngữ: TypeScript (KHÔNG dùng `any`)
- Styling: Tailwind CSS + inline `style={{}}` chỉ khi cần giá trị động
- Charts: Recharts (KHÔNG dùng Chart.js hay D3)
- Data source: Google Sheets API v4 qua Service Account
- Deploy: Vercel

## ENV VARS — tên phải đúng chính xác

```
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
```

---

## KIẾN TRÚC — ĐỌC KỸ TRƯỚC KHI CODE

**Toàn bộ dashboard nằm trong 4 file:**
```
/lib/google-sheets.ts          ← kết nối Sheet, type Order, cache
/app/api/data/route.ts         ← GET endpoint
/app/dashboard/page.tsx        ← TẤT CẢ: layout, sidebar, filter, chart, logic
/app/page.tsx                  ← Landing page
```

**KHÔNG tạo:**
- Separate component files trong `/components/`
- Layout file riêng `/app/dashboard/layout.tsx`
- Page riêng cho từng tab — dùng `useState` để switch page trong cùng 1 file
- React Context — state hoisted lên component gốc, pass xuống qua props

**Lý do:** Single-file approach dễ maintain, tránh prop-drilling phức tạp, phù hợp quy mô dashboard này.

---

## FILE 1 — /lib/google-sheets.ts

```typescript
import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';  // KHÔNG dùng 'use cache' — cần flag riêng

export type [TênType] = {
  // Khai báo đúng type theo schema trong spec
  // number fields: dùng parseFloat() || 0
  // text fields: row[n] ?? ''
};

async function fetchSheetData(): Promise<[TênType][]> {
  try {
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '';
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '';
    if (!privateKey || !clientEmail || !spreadsheetId) { console.error('Missing credentials'); return []; }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '[TabName]!A1:Z2000',  // ← điền từ sheet info trong build prompt
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return [];
    return rows.slice(1).map((row) => ({ /* map từng cột */ }));
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}

export const getSheetData = unstable_cache(fetchSheetData, ['sheet-data'], { revalidate: 60 });
```

**Lưu ý private key:** `.replace(/\\n/g, '\n')` — bắt buộc, thiếu sẽ lỗi auth.

---

## FILE 2 — /app/api/data/route.ts

```typescript
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  const data = await getSheetData();
  return Response.json(data);
}
```

---

## FILE 3 — /app/dashboard/page.tsx

### Skeleton tổng thể

```typescript
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
         Tooltip, PieChart, Pie, Cell, BarChart, Bar, LabelList,
         LineChart, Line, Legend } from 'recharts';
import type { [TênType] } from '@/lib/google-sheets';

// ── Constants ──────────────────────────────────────────────
const PRIMARY   = '[màu từ spec]';   // lấy từ dashboard-design-skill.md
const SECONDARY = '[màu phụ]';
const NEGATIVE  = '#ef4444';
const CHART_COLORS = [PRIMARY, SECONDARY, '#f59e0b', '#8b5cf6', '#fb923c', '#f472b6', '#34d399', '#64748b'];

type ActivePage  = 'overview' | '[page2-id]' | '[page3-id]';
type ActiveParam = '[p1]' | '[p2]' | '[p3]' | '[p4]';

// ── Pure helpers (parseDate, fmtCompact, fmtNum, fmtPct, ...) ──

// ── SVG Icon components (KHÔNG dùng emoji) ──────────────────

// ── Chart components ────────────────────────────────────────

// ── Page content sections ───────────────────────────────────
// function OverviewContent({ orders, param }) { ... }
// function DimContent({ orders, param, dim }) { ... }

// ── Sidebar ─────────────────────────────────────────────────

// ── Main Page ───────────────────────────────────────────────
export default function DashboardPage() {
  const [orders, setOrders]           = useState<[TênType][]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activePage, setActivePage]   = useState<ActivePage>('overview');
  const [activeParam, setActiveParam] = useState<ActiveParam>('[default]');
  const [filters, setFilters]         = useState<FilterState>({ ... });

  useEffect(() => {
    fetch('/api/data')                               // KHÔNG hardcode localhost
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: [TênType][]) => setOrders(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // filteredOrders = useMemo() lọc theo filters
  // Render: header + sidebar + main (loading | error | content)
}
```

### Date parsing — BẮT BUỘC kiểm tra format trong spec

```typescript
// Nếu date format là M/D/YYYY (vd: "11/30/2023"):
function parseDate(s: string): Date {
  const p = s.split('/');
  if (p.length === 3) return new Date(+p[2], +p[0] - 1, +p[1]);
  return new Date(s);
}
// Nếu date format là YYYY-MM-DD: dùng new Date(s) trực tiếp
```

---

## COMPONENT CODE TEMPLATES

*Màu sắc, layout, cấu trúc page → xem dashboard-design-skill.md. Phần này chỉ chứa code implementation.*

### SparkLine

```typescript
function SparkLine({ data, color = PRIMARY }: { data: { v: number }[]; color?: string }) {
  const gid = `sg${color.replace(/[^0-9a-f]/gi, '')}`;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#${gid})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### ChartCard

```typescript
function ChartCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}
```

### DonutChart — Recharts width fix

```typescript
// Bắt buộc wrap ResponsiveContainer trong div có width rõ ràng để tránh lỗi width=-1
<div className="flex gap-4 h-48">
  <div style={{ width: '55%', minWidth: 0 }}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} innerRadius="55%" outerRadius="80%" paddingAngle={2} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
  {/* legend list bên phải: bullet + tên + % */}
</div>
```

### MatrixTable — heatBg function

```typescript
function heatBg(v: number, min: number, max: number, lowerBetter = false): string {
  if (max === min) return 'transparent';
  const r = (v - min) / (max - min);
  const a = (0.04 + r * 0.26).toFixed(2);
  // PRIMARY_RGB = RGB của PRIMARY color (vd #039c78 → 3,156,120)
  return lowerBetter ? `rgba(239,68,68,${a})` : `rgba([PRIMARY_RGB],${a})`;
}
```

---

## RECHARTS — FLEX LAYOUT FIX

**Tất cả flex children chứa Recharts PHẢI có `minWidth: 0`** — thiếu sẽ lỗi `width=-1`:

```typescript
// Row 2: 30/70 split
<div style={{ width: '30%', minWidth: 0 }}> ... </div>
<div style={{ width: '70%', minWidth: 0 }}> ... </div>

// Row 3: 40/60 split
<div style={{ width: '40%', minWidth: 0 }}> ... </div>
<div style={{ width: '60%', minWidth: 0 }}> ... </div>
```

*Tỷ lệ 30/70 và 40/60 cùng vị trí chart từng row → xem dashboard-design-skill.md.*

---

## FILE 4 — /app/page.tsx (Landing)

```typescript
import Link from 'next/link';
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <div className="text-center space-y-6 px-6">
        <h1 className="text-4xl font-bold text-[#111827]">[Tên Dashboard]</h1>
        <p className="text-[#64748b]">[Mô tả ngắn]</p>
        <Link href="/dashboard"
          className="inline-block px-10 py-3 rounded-lg text-lg font-semibold text-white shadow-md"
          style={{ background: PRIMARY }}>
          Xem Dashboard →
        </Link>
      </div>
    </main>
  );
}
```

---

## QUY TẮC BẮT BUỘC

**Luôn làm:**
- Xử lý 3 trạng thái: loading spinner / error message + retry button / data
- Tất cả filtering xử lý client-side trên `filteredOrders` từ `useMemo`
- Date default filter: 30 ngày gần nhất (set sau khi fetch xong, dựa trên maxDate trong data)
- Ghi rõ đường dẫn file trước mỗi đoạn code
- Kiểm tra date format trong spec trước khi code hàm parseDate

**Không bao giờ:**
- Hardcode `http://localhost:3000` — dùng `/api/data`
- Để lộ credentials trong code
- Dùng emoji trong UI — dùng SVG icon
- Dùng `any` trong TypeScript
- Tạo file trong `/skills/` hay `/components/` — tất cả vào `page.tsx`

**Khi gặp lỗi TypeScript với Recharts:**
- `LabelList formatter`: `(v: unknown) => fmtMetric(Number(v), param)`
- `Tooltip formatter`: `(v: unknown, name: unknown) => [fmtMetric(Number(v), param), String(name)]`
- `Tooltip content` prop: khai báo interface rõ ràng thay vì dùng default types

---

## BƯỚC CUỐI — VERIFY TRÊN DEV SERVER

Sau khi viết xong toàn bộ code, bắt buộc chạy dev server và kiểm tra trước khi báo done.

```bash
npm run dev
```

**Checklist (dùng browser/playwright):**

1. **TypeScript build** — không có lỗi type (check terminal output)
2. **Landing page** `/` — render đúng, nút "Xem Dashboard" hoạt động
3. **Data load** — dashboard hiển thị data (không kẹt loading, không có error banner)
4. **KPI Row** — 5 card hiển thị đủ số + sparkline, không có chart trống
5. **Filter** — date range, dropdown filter lọc đúng data
6. **PARAMETER bar** — switch param → tất cả chart cập nhật
7. **Page navigation** — switch giữa các page (Overview / Dim pages) không lỗi
8. **Recharts warnings** — không có `width=-1` trong browser console
9. **Responsive** — không có chart bị overflow hay collapse

Nếu phát hiện lỗi, fix trước khi report done. Không báo "xong" khi chưa qua checklist này.
