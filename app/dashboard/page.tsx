'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, LabelList,
  LineChart, Line, Legend,
} from 'recharts';
import type { OrderRecord } from '@/lib/google-sheets';

// ── Constants ──────────────────────────────────────────────
const PRIMARY = '#166534';
const SECONDARY = '#16a34a';
const ACCENT = '#eab308';
const NEGATIVE = '#ef4444';
const POSITIVE = '#16a34a';
const WARNING = '#f59e0b';
const BG = '#f0fdf4';
const CHART_COLORS = [PRIMARY, SECONDARY, ACCENT, '#8b5cf6', '#fb923c', '#f472b6', '#34d399', '#64748b'];

type ActivePage = 'overview' | 'product' | 'region';
type ActiveParam = 'orders' | 'quantity' | 'opex' | 'rating';

type FilterState = {
  dateFrom: string;
  dateTo: string;
  productLines: string[];
  regions: string[];
};

// ── Helpers ────────────────────────────────────────────────
function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('vi-VN');
}

function fmtDec(n: number, d = 2): string {
  return n.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%';
}

function fmtMetric(n: number, param: ActiveParam): string {
  if (param === 'orders') return fmtNum(n);
  if (param === 'quantity') return fmtNum(n);
  if (param === 'opex') return '$' + fmtDec(n);
  return fmtDec(n, 1);
}

function calcMetric(records: OrderRecord[], param: ActiveParam): number {
  if (records.length === 0) return 0;
  if (param === 'orders') return records.length;
  if (param === 'quantity') return records.reduce((s, r) => s + r.quantity, 0);
  if (param === 'opex') return records.reduce((s, r) => s + r.opex, 0);
  const sum = records.reduce((s, r) => s + r.feedbackRating, 0);
  return sum / records.length;
}

function getWeek(d: Date): string {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const wk = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `W${String(wk).padStart(2, '0')} ${d.getFullYear()}`;
}

function getMonth(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function daysAgo(base: string, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function rateColor(val: number, thresholds: [number, number]): string {
  if (val >= thresholds[0]) return POSITIVE;
  if (val >= thresholds[1]) return WARNING;
  return NEGATIVE;
}

function returnRateColor(val: number): string {
  if (val < 5) return POSITIVE;
  if (val <= 10) return WARNING;
  return NEGATIVE;
}

// ── SVG Icons ──────────────────────────────────────────────
function IconChart() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>);
}
function IconBox() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>);
}
function IconGlobe() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>);
}
function IconCalendar() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>);
}
function IconSearch() {
  return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
}
function IconCheck() {
  return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>);
}

// ── SparkLine ──────────────────────────────────────────────
function SparkLine({ data, color = PRIMARY }: { data: { v: number }[]; color?: string }) {
  const gid = useRef(`sg${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── KPI Card ───────────────────────────────────────────────
function KpiCard({ title, value, valueColor, sparkData, sparkColor }: {
  title: string; value: string; valueColor: string;
  sparkData: { v: number }[]; sparkColor: string;
}) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-1 flex-1" style={{ minWidth: 0 }}>
      <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{title}</p>
      <p className="text-xl font-bold" style={{ color: valueColor }}>{value}</p>
      <SparkLine data={sparkData} color={sparkColor} />
    </div>
  );
}

// ── ChartCard ──────────────────────────────────────────────
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

// ── Time Toggle ────────────────────────────────────────────
function TimeToggle({ value, onChange }: { value: 'day' | 'week' | 'month'; onChange: (v: 'day' | 'week' | 'month') => void }) {
  const opts: { k: 'day' | 'week' | 'month'; l: string }[] = [
    { k: 'day', l: 'Ngày' }, { k: 'week', l: 'Tuần' }, { k: 'month', l: 'Tháng' },
  ];
  return (
    <div className="flex gap-1">
      {opts.map(o => (
        <button key={o.k} onClick={() => onChange(o.k)}
          className="px-2 py-0.5 text-xs rounded font-medium transition-colors"
          style={{
            background: value === o.k ? PRIMARY : '#fff',
            color: value === o.k ? '#fff' : '#6b7280',
            border: `1px solid ${value === o.k ? PRIMARY : '#e2e8f0'}`,
          }}>{o.l}</button>
      ))}
    </div>
  );
}

// ── Multi-select dropdown ──────────────────────────────────
function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const allSelected = selected.length === options.length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-full text-left text-xs px-2 py-1.5 rounded border border-[#e2e8f0] bg-white text-[#111827] flex items-center justify-between gap-1">
        <span className="truncate">{allSelected ? `Tất cả ${label}` : `${selected.length} ${label}`}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-1.5 border-b border-[#e2e8f0] flex items-center gap-1">
            <IconSearch />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full text-xs outline-none" placeholder="Tìm kiếm..." />
          </div>
          <div className="p-1 flex gap-1 border-b border-[#e2e8f0]">
            <button onClick={() => onChange([...options])} className="text-[10px] text-[#166534] hover:underline">Chọn tất cả</button>
            <span className="text-[10px] text-[#d1d5db]">|</span>
            <button onClick={() => onChange([])} className="text-[10px] text-[#ef4444] hover:underline">Bỏ chọn</button>
          </div>
          {filtered.map(o => (
            <label key={o} className="flex items-center gap-2 px-2 py-1 hover:bg-[#f0fdf4] cursor-pointer text-xs">
              <span className="w-3.5 h-3.5 border rounded flex items-center justify-center"
                style={{ borderColor: selected.includes(o) ? PRIMARY : '#d1d5db', background: selected.includes(o) ? PRIMARY : '#fff' }}>
                {selected.includes(o) && <span className="text-white"><IconCheck /></span>}
              </span>
              <span className="text-[#111827]">{o}</span>
              <input type="checkbox" className="hidden" checked={selected.includes(o)}
                onChange={() => {
                  onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o]);
                }} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Heatmap helper ─────────────────────────────────────────
function heatBg(v: number, min: number, max: number, lowerBetter = false): string {
  if (max === min) return 'transparent';
  const r = (v - min) / (max - min);
  const a = (0.04 + r * 0.26).toFixed(2);
  return lowerBetter ? `rgba(239,68,68,${a})` : `rgba(22,101,52,${a})`;
}

// ── Custom Tooltip ─────────────────────────────────────────
interface TooltipPayloadItem { value: number; name: string; color: string; }
function CustomTooltip({ active, payload, label, param }: {
  active?: boolean; payload?: TooltipPayloadItem[]; label?: string; param: ActiveParam;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-lg p-2 text-xs">
      <p className="font-semibold text-[#111827] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmtMetric(p.value, param)}</p>
      ))}
    </div>
  );
}

// ── Compute sparkline by day ───────────────────────────────
function useSparkByDay(data: OrderRecord[]) {
  return useMemo(() => {
    const sorted = [...data].sort((a, b) => a.orderDate.localeCompare(b.orderDate));
    if (sorted.length === 0) return [];
    const maxD = sorted[sorted.length - 1].orderDate;
    const minD = daysAgo(maxD, 30);
    const last30 = sorted.filter(r => r.orderDate >= minD);

    const map = new Map<string, { orders: number; qty: number; opex: number; rating: number; onTime: number; returned: number }>();
    last30.forEach(r => {
      const e = map.get(r.orderDate) ?? { orders: 0, qty: 0, opex: 0, rating: 0, onTime: 0, returned: 0 };
      e.orders++;
      e.qty += r.quantity;
      e.opex += r.opex;
      e.rating += r.feedbackRating;
      if (r.deliveryStatus === 'On-Time') e.onTime++;
      if (r.isReturned) e.returned++;
      map.set(r.orderDate, e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        orders: v.orders,
        qty: v.qty,
        opex: v.opex,
        avgRating: v.orders > 0 ? v.rating / v.orders : 0,
        onTimeRate: v.orders > 0 ? (v.onTime / v.orders) * 100 : 0,
        returnRate: v.orders > 0 ? (v.returned / v.orders) * 100 : 0,
      }));
  }, [data]);
}

// ══════════════════════════════════════════════════════════════
// OVERVIEW CONTENT
// ══════════════════════════════════════════════════════════════
function OverviewContent({ data, param }: { data: OrderRecord[]; param: ActiveParam }) {
  const [timeTrend, setTimeTrend] = useState<'day' | 'week' | 'month'>('day');
  const sparkByDay = useSparkByDay(data);

  const totalOrders = data.length;
  const totalQty = data.reduce((s, r) => s + r.quantity, 0);
  const onTimeCount = data.filter(r => r.deliveryStatus === 'On-Time').length;
  const onTimeRate = totalOrders > 0 ? (onTimeCount / totalOrders) * 100 : 0;
  const returnedCount = data.filter(r => r.isReturned).length;
  const returnRate = totalOrders > 0 ? (returnedCount / totalOrders) * 100 : 0;
  const avgRating = totalOrders > 0 ? data.reduce((s, r) => s + r.feedbackRating, 0) / totalOrders : 0;

  // Product line donut
  const plData = useMemo(() => {
    const map = new Map<string, OrderRecord[]>();
    data.forEach(r => {
      const arr = map.get(r.productLine) ?? [];
      arr.push(r);
      map.set(r.productLine, arr);
    });
    const total = calcMetric(data, param);
    return Array.from(map.entries()).map(([name, recs]) => ({
      name, value: calcMetric(recs, param), pct: total > 0 ? (calcMetric(recs, param) / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [data, param]);

  // Trend data
  const trendData = useMemo(() => {
    const map = new Map<string, OrderRecord[]>();
    data.forEach(r => {
      const d = new Date(r.orderDate);
      let key = r.orderDate;
      if (timeTrend === 'week') key = getWeek(d);
      else if (timeTrend === 'month') key = getMonth(d);
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([label, recs]) => ({ label, value: calcMetric(recs, param) }));
  }, [data, param, timeTrend]);

  // Region bar
  const regionData = useMemo(() => {
    const map = new Map<string, OrderRecord[]>();
    data.forEach(r => {
      const arr = map.get(r.regionId) ?? [];
      arr.push(r);
      map.set(r.regionId, arr);
    });
    const total = calcMetric(data, param);
    return Array.from(map.entries()).map(([name, recs]) => ({
      name, value: calcMetric(recs, param), pct: total > 0 ? (calcMetric(recs, param) / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value).slice(0, 15);
  }, [data, param]);

  // Matrix table
  const matrixData = useMemo(() => {
    const map = new Map<string, OrderRecord[]>();
    data.forEach(r => {
      const m = r.orderDate.slice(0, 7);
      const arr = map.get(m) ?? [];
      arr.push(r);
      map.set(m, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a)).map(([period, recs]) => {
      const ot = recs.filter(r => r.deliveryStatus === 'On-Time').length;
      const ret = recs.filter(r => r.isReturned).length;
      return {
        period,
        orders: recs.length,
        quantity: recs.reduce((s, r) => s + r.quantity, 0),
        opex: recs.reduce((s, r) => s + r.opex, 0),
        onTimeRate: recs.length > 0 ? (ot / recs.length) * 100 : 0,
        returnRate: recs.length > 0 ? (ret / recs.length) * 100 : 0,
        avgRating: recs.length > 0 ? recs.reduce((s, r) => s + r.feedbackRating, 0) / recs.length : 0,
      };
    });
  }, [data]);

  const trendGradientId = useRef(`tg${Math.random().toString(36).slice(2, 8)}`).current;
  const otColor = rateColor(onTimeRate, [90, 75]);
  const rrColor = returnRateColor(returnRate);

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Row */}
      <div className="flex gap-3">
        <KpiCard title="Tổng Đơn Hàng" value={fmtNum(totalOrders)} valueColor="#111827"
          sparkData={sparkByDay.map(d => ({ v: d.orders }))} sparkColor={PRIMARY} />
        <KpiCard title="Tổng Số Lượng" value={fmtNum(totalQty)} valueColor="#111827"
          sparkData={sparkByDay.map(d => ({ v: d.qty }))} sparkColor={PRIMARY} />
        <KpiCard title="On-Time Rate" value={fmtPct(onTimeRate)} valueColor={otColor}
          sparkData={sparkByDay.map(d => ({ v: d.onTimeRate }))} sparkColor={otColor} />
        <KpiCard title="Return Rate" value={fmtPct(returnRate)} valueColor={rrColor}
          sparkData={sparkByDay.map(d => ({ v: d.returnRate }))} sparkColor={rrColor} />
        <KpiCard title="Avg Rating" value={fmtDec(avgRating, 1)} valueColor="#111827"
          sparkData={sparkByDay.map(d => ({ v: d.avgRating }))} sparkColor={PRIMARY} />
      </div>

      {/* Row 2: Donut 30% + Area 70% */}
      <div className="flex gap-4">
        <div style={{ width: '30%', minWidth: 0 }}>
          <ChartCard title="Product Line Breakdown">
            <div className="flex gap-2" style={{ height: 220 }}>
              <div style={{ width: '55%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={plData} innerRadius="55%" outerRadius="80%" paddingAngle={2} dataKey="value">
                      {plData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => fmtMetric(Number(v), param)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-1.5 text-xs overflow-auto" style={{ width: '45%' }}>
                {plData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="truncate text-[#111827]">{d.name}</span>
                    <span className="text-[#6b7280] ml-auto">{d.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
        <div style={{ width: '70%', minWidth: 0 }}>
          <ChartCard title={`${param === 'orders' ? 'Orders' : param === 'quantity' ? 'Quantity' : param === 'opex' ? 'OpEx' : 'Avg Rating'} Trend`}
            action={<TimeToggle value={timeTrend} onChange={setTimeTrend} />}>
            <div style={{ height: 220, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id={trendGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => fmtMetric(v, param)} />
                  <Tooltip content={<CustomTooltip param={param} />} />
                  <Area type="monotone" dataKey="value" name="Value" stroke={PRIMARY} strokeWidth={2}
                    fill={`url(#${trendGradientId})`} dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Row 3: H-Bar 40% + Matrix 60% */}
      <div className="flex gap-4">
        <div style={{ width: '40%', minWidth: 0 }}>
          <ChartCard title="Regional Comparison">
            <div style={{ height: 300, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => fmtMetric(v, param)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#111827' }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip formatter={(v: unknown) => fmtMetric(Number(v), param)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {regionData.map((_, i) => (
                      <Cell key={i} fill={PRIMARY} fillOpacity={1 - i * 0.05} />
                    ))}
                    <LabelList dataKey="value" position="right" formatter={(v: unknown) => fmtMetric(Number(v), param)}
                      style={{ fontSize: 9, fill: '#111827' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        <div style={{ width: '60%', minWidth: 0 }}>
          <ChartCard title="Performance Over Time">
            <div className="overflow-auto" style={{ maxHeight: 340 }}>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ background: PRIMARY }}>
                    {['Period', 'Orders', 'Qty', 'OpEx', 'On-Time %', 'Return %', 'Rating'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-white font-semibold text-right first:text-left" style={{ fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixData.map((row, ri) => {
                    const ords = matrixData.map(r => r.orders);
                    const qtys = matrixData.map(r => r.quantity);
                    const opxs = matrixData.map(r => r.opex);
                    return (
                      <tr key={row.period} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td className="px-2 py-1.5 text-[#111827] font-medium">{row.period}</td>
                        <td className="px-2 py-1.5 text-right text-[#111827]"
                          style={{ background: heatBg(row.orders, Math.min(...ords), Math.max(...ords)) }}>{fmtNum(row.orders)}</td>
                        <td className="px-2 py-1.5 text-right text-[#111827]"
                          style={{ background: heatBg(row.quantity, Math.min(...qtys), Math.max(...qtys)) }}>{fmtNum(row.quantity)}</td>
                        <td className="px-2 py-1.5 text-right text-[#111827]"
                          style={{ background: heatBg(row.opex, Math.min(...opxs), Math.max(...opxs)) }}>${fmtDec(row.opex)}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: rateColor(row.onTimeRate, [90, 75]) }}>{fmtPct(row.onTimeRate)}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: returnRateColor(row.returnRate) }}>{fmtPct(row.returnRate)}</td>
                        <td className="px-2 py-1.5 text-right text-[#111827]">{fmtDec(row.avgRating, 1)}</td>
                      </tr>
                    );
                  })}
                  {matrixData.length > 0 && (
                    <tr style={{ background: '#eff6ff' }}>
                      <td className="px-2 py-1.5 font-semibold text-[#111827]">Total / Avg</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#111827]">{fmtNum(matrixData.reduce((s, r) => s + r.orders, 0))}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#111827]">{fmtNum(matrixData.reduce((s, r) => s + r.quantity, 0))}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#111827]">${fmtDec(matrixData.reduce((s, r) => s + r.opex, 0))}</td>
                      <td className="px-2 py-1.5 text-right font-semibold" style={{ color: POSITIVE }}>{fmtPct(matrixData.reduce((s, r) => s + r.onTimeRate, 0) / matrixData.length)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold" style={{ color: NEGATIVE }}>{fmtPct(matrixData.reduce((s, r) => s + r.returnRate, 0) / matrixData.length)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#111827]">{fmtDec(matrixData.reduce((s, r) => s + r.avgRating, 0) / matrixData.length, 1)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DIMENSION ANALYSIS CONTENT (Product Line / Region)
// ══════════════════════════════════════════════════════════════
function DimContent({ data, param, dimKey, dimLabel }: {
  data: OrderRecord[]; param: ActiveParam; dimKey: 'productLine' | 'regionId'; dimLabel: string;
}) {
  const [timeTrend, setTimeTrend] = useState<'day' | 'week' | 'month'>('day');
  const sparkByDay = useSparkByDay(data);

  const totalOrders = data.length;
  const totalQty = data.reduce((s, r) => s + r.quantity, 0);
  const onTimeCount = data.filter(r => r.deliveryStatus === 'On-Time').length;
  const onTimeRate = totalOrders > 0 ? (onTimeCount / totalOrders) * 100 : 0;
  const returnedCount = data.filter(r => r.isReturned).length;
  const returnRate = totalOrders > 0 ? (returnedCount / totalOrders) * 100 : 0;
  const avgRating = totalOrders > 0 ? data.reduce((s, r) => s + r.feedbackRating, 0) / totalOrders : 0;
  const otColor = rateColor(onTimeRate, [90, 75]);
  const rrColor = returnRateColor(returnRate);

  const dimValues = useMemo(() => [...new Set(data.map(r => r[dimKey]))].sort(), [data, dimKey]);

  // Ranking bar
  const rankData = useMemo(() => {
    const map = new Map<string, OrderRecord[]>();
    data.forEach(r => {
      const arr = map.get(r[dimKey]) ?? [];
      arr.push(r);
      map.set(r[dimKey], arr);
    });
    const total = calcMetric(data, param);
    return Array.from(map.entries()).map(([name, recs]) => ({
      name, value: calcMetric(recs, param), pct: total > 0 ? (calcMetric(recs, param) / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [data, param, dimKey]);

  // Multi-line trend
  const multiLineData = useMemo(() => {
    const timeMap = new Map<string, Map<string, OrderRecord[]>>();
    data.forEach(r => {
      const d = new Date(r.orderDate);
      let key = r.orderDate;
      if (timeTrend === 'week') key = getWeek(d);
      else if (timeTrend === 'month') key = getMonth(d);
      if (!timeMap.has(key)) timeMap.set(key, new Map());
      const dimMap = timeMap.get(key)!;
      const arr = dimMap.get(r[dimKey]) ?? [];
      arr.push(r);
      dimMap.set(r[dimKey], arr);
    });
    return Array.from(timeMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, dimMap]) => {
      const row: Record<string, string | number> = { label };
      dimValues.forEach(dv => {
        const recs = dimMap.get(dv) ?? [];
        row[dv] = calcMetric(recs, param);
      });
      return row;
    });
  }, [data, param, dimKey, dimValues, timeTrend]);

  // Donut
  const donutData = useMemo(() => {
    const map = new Map<string, OrderRecord[]>();
    data.forEach(r => {
      const arr = map.get(r[dimKey]) ?? [];
      arr.push(r);
      map.set(r[dimKey], arr);
    });
    const total = calcMetric(data, param);
    return Array.from(map.entries()).map(([name, recs]) => ({
      name, value: calcMetric(recs, param), pct: total > 0 ? (calcMetric(recs, param) / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [data, param, dimKey]);

  // Matrix
  const matrixRows = useMemo(() => {
    const map = new Map<string, OrderRecord[]>();
    data.forEach(r => {
      const arr = map.get(r[dimKey]) ?? [];
      arr.push(r);
      map.set(r[dimKey], arr);
    });
    const totalAll = data.length;
    const totalQtyAll = data.reduce((s, r) => s + r.quantity, 0);
    return Array.from(map.entries()).map(([name, recs]) => {
      const ot = recs.filter(r => r.deliveryStatus === 'On-Time').length;
      const ret = recs.filter(r => r.isReturned).length;
      return {
        name,
        orders: recs.length,
        ordersPct: totalAll > 0 ? (recs.length / totalAll) * 100 : 0,
        quantity: recs.reduce((s, r) => s + r.quantity, 0),
        qtyPct: totalQtyAll > 0 ? (recs.reduce((s, r) => s + r.quantity, 0) / totalQtyAll) * 100 : 0,
        opex: recs.reduce((s, r) => s + r.opex, 0),
        onTimeRate: recs.length > 0 ? (ot / recs.length) * 100 : 0,
        returnRate: recs.length > 0 ? (ret / recs.length) * 100 : 0,
        avgRating: recs.length > 0 ? recs.reduce((s, r) => s + r.feedbackRating, 0) / recs.length : 0,
      };
    }).sort((a, b) => {
      if (param === 'orders') return b.orders - a.orders;
      if (param === 'quantity') return b.quantity - a.quantity;
      if (param === 'opex') return b.opex - a.opex;
      return b.avgRating - a.avgRating;
    });
  }, [data, param, dimKey]);

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Row */}
      <div className="flex gap-3">
        <KpiCard title="Tổng Đơn Hàng" value={fmtNum(totalOrders)} valueColor="#111827"
          sparkData={sparkByDay.map(d => ({ v: d.orders }))} sparkColor={PRIMARY} />
        <KpiCard title="Tổng Số Lượng" value={fmtNum(totalQty)} valueColor="#111827"
          sparkData={sparkByDay.map(d => ({ v: d.qty }))} sparkColor={PRIMARY} />
        <KpiCard title="On-Time Rate" value={fmtPct(onTimeRate)} valueColor={otColor}
          sparkData={sparkByDay.map(d => ({ v: d.onTimeRate }))} sparkColor={otColor} />
        <KpiCard title="Return Rate" value={fmtPct(returnRate)} valueColor={rrColor}
          sparkData={sparkByDay.map(d => ({ v: d.returnRate }))} sparkColor={rrColor} />
        <KpiCard title="Avg Rating" value={fmtDec(avgRating, 1)} valueColor="#111827"
          sparkData={sparkByDay.map(d => ({ v: d.avgRating }))} sparkColor={PRIMARY} />
      </div>

      {/* Row 2: H-Bar 30% + Multi-line 70% */}
      <div className="flex gap-4">
        <div style={{ width: '30%', minWidth: 0 }}>
          <ChartCard title={`${dimLabel} Ranking`}>
            <div style={{ height: 280, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankData.slice(0, 15)} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => fmtMetric(v, param)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#111827' }} tickLine={false} axisLine={false} width={65} />
                  <Tooltip formatter={(v: unknown) => fmtMetric(Number(v), param)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {rankData.slice(0, 15).map((_, i) => (
                      <Cell key={i} fill={PRIMARY} fillOpacity={1 - i * 0.05} />
                    ))}
                    <LabelList dataKey="value" position="right" formatter={(v: unknown) => fmtMetric(Number(v), param)}
                      style={{ fontSize: 9, fill: '#111827' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        <div style={{ width: '70%', minWidth: 0 }}>
          <ChartCard title={`${param === 'orders' ? 'Orders' : param === 'quantity' ? 'Quantity' : param === 'opex' ? 'OpEx' : 'Rating'} by ${dimLabel} Over Time`}
            action={<TimeToggle value={timeTrend} onChange={setTimeTrend} />}>
            <div style={{ height: 280, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={multiLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => fmtMetric(v, param)} />
                  <Tooltip content={<CustomTooltip param={param} />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {dimValues.slice(0, 8).map((dv, i) => (
                    <Line key={dv} type="monotone" dataKey={dv} name={dv}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Row 3: Donut 40% + Matrix 60% */}
      <div className="flex gap-4">
        <div style={{ width: '40%', minWidth: 0 }}>
          <ChartCard title={`${param === 'orders' ? 'Orders' : param === 'quantity' ? 'Quantity' : param === 'opex' ? 'OpEx' : 'Rating'} Share by ${dimLabel}`}>
            <div className="flex gap-2" style={{ height: 220 }}>
              <div style={{ width: '55%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData.slice(0, 8)} innerRadius="55%" outerRadius="80%" paddingAngle={2} dataKey="value">
                      {donutData.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => fmtMetric(Number(v), param)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-1.5 text-xs overflow-auto" style={{ width: '45%' }}>
                {donutData.slice(0, 8).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="truncate text-[#111827]">{d.name}</span>
                    <span className="text-[#6b7280] ml-auto">{d.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
        <div style={{ width: '60%', minWidth: 0 }}>
          <ChartCard title={`${dimLabel} Full Metrics`}>
            <div className="overflow-auto" style={{ maxHeight: 300 }}>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ background: PRIMARY }}>
                    <th className="px-2 py-1.5 text-white font-semibold text-left" style={{ fontSize: 10 }}>{dimLabel}</th>
                    <th className="px-2 py-1.5 text-white font-semibold text-right" style={{ fontSize: 10 }}>Orders</th>
                    <th className="px-2 py-1.5 text-white font-semibold text-right" style={{ fontSize: 10 }}>%</th>
                    <th className="px-2 py-1.5 text-white font-semibold text-right" style={{ fontSize: 10 }}>Qty</th>
                    <th className="px-2 py-1.5 text-white font-semibold text-right" style={{ fontSize: 10 }}>OpEx</th>
                    <th className="px-2 py-1.5 text-white font-semibold text-right" style={{ fontSize: 10 }}>On-Time</th>
                    <th className="px-2 py-1.5 text-white font-semibold text-right" style={{ fontSize: 10 }}>Return</th>
                    <th className="px-2 py-1.5 text-white font-semibold text-right" style={{ fontSize: 10 }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row, ri) => {
                    const ords = matrixRows.map(r => r.orders);
                    const qtys = matrixRows.map(r => r.quantity);
                    return (
                      <tr key={row.name} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td className="px-2 py-1.5 text-[#111827] font-medium">{row.name}</td>
                        <td className="px-2 py-1.5 text-right text-[#111827]"
                          style={{ background: heatBg(row.orders, Math.min(...ords), Math.max(...ords)) }}>{fmtNum(row.orders)}</td>
                        <td className="px-2 py-1.5 text-right text-[#6b7280]">{row.ordersPct.toFixed(1)}%</td>
                        <td className="px-2 py-1.5 text-right text-[#111827]"
                          style={{ background: heatBg(row.quantity, Math.min(...qtys), Math.max(...qtys)) }}>{fmtNum(row.quantity)}</td>
                        <td className="px-2 py-1.5 text-right text-[#111827]">${fmtDec(row.opex)}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: rateColor(row.onTimeRate, [90, 75]) }}>{fmtPct(row.onTimeRate)}</td>
                        <td className="px-2 py-1.5 text-right" style={{ color: returnRateColor(row.returnRate) }}>{fmtPct(row.returnRate)}</td>
                        <td className="px-2 py-1.5 text-right text-[#111827]">{fmtDec(row.avgRating, 1)}</td>
                      </tr>
                    );
                  })}
                  {matrixRows.length > 0 && (
                    <tr style={{ background: '#eff6ff' }}>
                      <td className="px-2 py-1.5 font-semibold text-[#111827]">Total / Avg</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#111827]">{fmtNum(matrixRows.reduce((s, r) => s + r.orders, 0))}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#6b7280]">100%</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#111827]">{fmtNum(matrixRows.reduce((s, r) => s + r.quantity, 0))}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#111827]">${fmtDec(matrixRows.reduce((s, r) => s + r.opex, 0))}</td>
                      <td className="px-2 py-1.5 text-right font-semibold" style={{ color: POSITIVE }}>{fmtPct(matrixRows.reduce((s, r) => s + r.onTimeRate, 0) / matrixRows.length)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold" style={{ color: NEGATIVE }}>{fmtPct(matrixRows.reduce((s, r) => s + r.returnRate, 0) / matrixRows.length)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-[#111827]">{fmtDec(matrixRows.reduce((s, r) => s + r.avgRating, 0) / matrixRows.length, 1)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [activeParam, setActiveParam] = useState<ActiveParam>('orders');
  const [filters, setFilters] = useState<FilterState>({ dateFrom: '', dateTo: '', productLines: [], regions: [] });
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/data')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: OrderRecord[]) => {
        setRecords(data);
        setLastUpdated(new Date().toLocaleString('vi-VN'));
        if (data.length > 0) {
          const dates = data.map(r => r.orderDate).filter(d => d).sort();
          const maxDate = dates[dates.length - 1];
          const pls = [...new Set(data.map(r => r.productLine))].sort();
          const regs = [...new Set(data.map(r => r.regionId))].sort();
          setFilters(prev => ({
            dateFrom: prev.dateFrom || daysAgo(maxDate, 30),
            dateTo: prev.dateTo || maxDate,
            productLines: prev.productLines.length > 0 ? prev.productLines : pls,
            regions: prev.regions.length > 0 ? prev.regions : regs,
          }));
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allProductLines = useMemo(() => [...new Set(records.map(r => r.productLine))].sort(), [records]);
  const allRegions = useMemo(() => [...new Set(records.map(r => r.regionId))].sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter(r =>
      r.orderDate >= filters.dateFrom &&
      r.orderDate <= filters.dateTo &&
      filters.productLines.includes(r.productLine) &&
      filters.regions.includes(r.regionId)
    );
  }, [records, filters]);

  const maxDate = useMemo(() => {
    if (records.length === 0) return '';
    return records.map(r => r.orderDate).filter(d => d).sort().pop() ?? '';
  }, [records]);

  function setDatePreset(days: number | 'ytd') {
    if (!maxDate) return;
    if (days === 'ytd') {
      setFilters(f => ({ ...f, dateFrom: maxDate.slice(0, 4) + '-01-01', dateTo: maxDate }));
    } else {
      setFilters(f => ({ ...f, dateFrom: daysAgo(maxDate, days), dateTo: maxDate }));
    }
  }

  const pageTitle = activePage === 'overview' ? 'Overview' : activePage === 'product' ? 'Product Line Analysis' : 'Regional Analysis';

  const paramOptions: { key: ActiveParam; label: string }[] = [
    { key: 'orders', label: 'Orders' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'opex', label: 'OpEx' },
    { key: 'rating', label: 'Avg Rating' },
  ];

  const navItems: { key: ActivePage; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <IconChart /> },
    { key: 'product', label: 'Product Line', icon: <IconBox /> },
    { key: 'region', label: 'Region', icon: <IconGlobe /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG }}>
      {/* ── SIDEBAR ── */}
      <aside className="flex flex-col border-r border-[#e2e8f0] bg-white" style={{ width: 220, minWidth: 220 }}>
        <div className="px-4 py-4 border-b border-[#e2e8f0]">
          <h1 className="text-sm font-bold text-[#111827] leading-tight">Voltex Performance<br />Dashboard</h1>
        </div>

        <nav className="px-2 py-3 flex flex-col gap-0.5">
          <p className="px-2 mb-1 text-[#111827] font-semibold uppercase" style={{ fontSize: 11 }}>Pages</p>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActivePage(item.key)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors w-full text-left"
              style={{
                background: activePage === item.key ? '#eff6ff' : 'transparent',
                color: activePage === item.key ? PRIMARY : '#6b7280',
              }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <hr className="border-[#e2e8f0] mx-3" />

        <div className="px-3 py-3 flex flex-col gap-3 overflow-auto flex-1">
          <p className="text-[#111827] font-semibold uppercase" style={{ fontSize: 11 }}>Filters</p>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-[#6b7280]">
              <IconCalendar />
              <span>Date Range</span>
            </div>
            <input type="date" value={filters.dateFrom}
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              className="text-xs px-2 py-1 rounded border border-[#e2e8f0] w-full" />
            <input type="date" value={filters.dateTo}
              onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              className="text-xs px-2 py-1 rounded border border-[#e2e8f0] w-full" />
            <div className="flex flex-wrap gap-1 mt-1">
              {[{ l: '7D', d: 7 }, { l: '30D', d: 30 }, { l: '3M', d: 90 }, { l: 'YTD', d: 'ytd' as const }].map(p => (
                <button key={p.l} onClick={() => setDatePreset(p.d)}
                  className="px-1.5 py-0.5 text-[10px] rounded border border-[#e2e8f0] text-[#6b7280] hover:bg-[#f1f5f9]">{p.l}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#6b7280]">Product Line</span>
            <MultiSelect label="product lines" options={allProductLines} selected={filters.productLines}
              onChange={v => setFilters(f => ({ ...f, productLines: v }))} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#6b7280]">Region</span>
            <MultiSelect label="regions" options={allRegions} selected={filters.regions}
              onChange={v => setFilters(f => ({ ...f, regions: v }))} />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e2e8f0]">
          <h2 className="text-xl font-bold text-[#111827]">{pageTitle}</h2>
          <span className="text-xs text-[#6b7280]">Last updated: {lastUpdated}</span>
        </header>

        <div className="flex items-center gap-1 px-6 py-2 bg-white border-b border-[#e2e8f0]">
          {paramOptions.map(o => (
            <button key={o.key} onClick={() => setActiveParam(o.key)}
              className="px-3 py-1 text-xs font-medium rounded-lg transition-colors"
              style={{
                background: activeParam === o.key ? PRIMARY : '#fff',
                color: activeParam === o.key ? '#fff' : '#6b7280',
                border: `1px solid ${activeParam === o.key ? PRIMARY : '#e2e8f0'}`,
              }}>{o.label}</button>
          ))}
        </div>

        <main className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#e2e8f0] rounded-full animate-spin" style={{ borderTopColor: PRIMARY }} />
                <p className="text-sm text-[#6b7280]">Loading data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-[#ef4444]">Error: {error}</p>
                <button onClick={fetchData}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg text-white"
                  style={{ background: PRIMARY }}>Retry</button>
              </div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-[#6b7280]">No data matches current filters.</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              {activePage === 'overview' && <OverviewContent data={filtered} param={activeParam} />}
              {activePage === 'product' && <DimContent data={filtered} param={activeParam} dimKey="productLine" dimLabel="Product Line" />}
              {activePage === 'region' && <DimContent data={filtered} param={activeParam} dimKey="regionId" dimLabel="Region" />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
