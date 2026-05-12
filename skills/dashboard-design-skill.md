# Dashboard Design Skill — Senior DA Standard
Version: 2.0 · AIDA Program S5-6
Mục đích: Phân tích schema → Xác định domain → Xuất Dashboard Spec đa trang, production-grade

---

## CÁCH DÙNG SKILL NÀY

Nhận input gồm: Data từ Google Sheet với thông tin kết nối trong file .env.local
Thực hiện đúng 4 bước bên dưới. Không hỏi thêm. Xuất ngay Dashboard Spec đầy đủ.

---

## BƯỚC 1 — PHÂN LOẠI DOMAIN

| Domain | Từ khoá nhận diện chính |
|---|---|
| **SALES** | revenue, doanh_thu, order, đơn, product, sản_phẩm, customer, khách, quantity, category, region, invoice, discount, price |
| **MARKETING** | campaign, channel, spend, impression, click, ctr, cpc, cpl, conversion, roas, reach, engagement, lead, ad |
| **HR** | employee, nhân_viên, department, phòng_ban, salary, lương, hire_date, tenure, gender, performance, headcount, turnover |
| **OPERATIONS** | delivery, giao_hàng, supplier, inventory, tồn_kho, warehouse, lead_time, defect, production, shipment |
| **FINANCE** | budget, ngân_sách, actual, variance, account, expense, profit, cost, transaction, cashflow, receivable |

---

## BƯỚC 2 — XÁC ĐỊNH CẤU TRÚC DỮ LIỆU

Phân loại từng cột theo vai trò:
- **DATE:** Cột ngày → trục thời gian, date range filter, time granularity
- **PRIMARY DIMENSION:** Cột text quan trọng nhất → trang riêng + donut + horizontal bar (vd: category, product, channel, department)
- **SECONDARY DIMENSION:** Cột text quan trọng thứ hai → trang riêng optional (vd: region, status, gender, campaign)
- **METRIC:** Cột số → KPI, sparkline, chart Y-axis, matrix table

---

## BƯỚC 3 — NỘI DUNG THEO DOMAIN

### SALES / BÁN HÀNG

**Primary dimension:** category / product / sản_phẩm
**Secondary dimension:** region / khu_vực / chi_nhánh

**PARAMETER options (4 metrics user chọn để đồng bộ tất cả chart):**
1. `Revenue` — SUM(revenue)
2. `Orders` — COUNT hoặc SUM(orders)
3. `AOV` — SUM(revenue) / COUNT(orders)
4. `Quantity` — SUM(quantity) nếu có cột, nếu không dùng `Revenue Growth MoM %`

**5 KPI Cards:**
| # | Tên Card | Giá trị | Sparkline | Value color |
|---|---|---|---|---|
| 1 | Tổng Doanh Thu | SUM(revenue) | Area+gradient: revenue theo ngày, 30 ngày gần nhất | Black (#111827) |
| 2 | Tổng Đơn Hàng | COUNT(orders) | Area+gradient: orders theo ngày, 30 ngày | Black (#111827) |
| 3 | Net Profit | SUM(net_profit) | Area+gradient: net_profit theo ngày, 30 ngày | Xanh lá nếu ≥ 0, đỏ nếu âm |
| 4 | Profit Margin | net_profit / revenue × 100% | Area+gradient: margin% theo ngày, 30 ngày | Xanh lá nếu > 0, đỏ nếu âm |
| 5 | Tỷ Lệ Hoàn Trả | return_count / orders × 100% | Area+gradient: return% theo ngày, 30 ngày | < 5% xanh · 5–10% vàng · > 10% đỏ |

**Quy tắc sparkline KPI (áp dụng cho tất cả domains):**
- Tất cả sparkline dùng **AreaChart** (line + gradient fill bên dưới) — không dùng BarChart
- **Cùng x-range**: tất cả 5 card phải dùng cùng 1 window thời gian (30 ngày gần nhất theo ngày)
- Gradient fill: `stopOpacity 0.25 → 0` (top → bottom)
- Màu sparkline khớp với màu value text của card (teal cho neutral, xanh/đỏ cho semantic)

**Pages:**
- **Page 1:** Overview
- **Page 2:** Product / Category Analysis
- **Page 3:** Regional Analysis (nếu có cột region)

---

### MARKETING

**Primary dimension:** channel / kênh
**Secondary dimension:** campaign / chiến_dịch

**PARAMETER options:**
1. `Spend` — SUM(spend)
2. `Conversions` — SUM(conversions/lead)
3. `CTR` — AVG(ctr)
4. `ROAS` — SUM(revenue)/SUM(spend) nếu có revenue, nếu không dùng `CPL` = spend/conversions

**5 KPI Cards:**
| # | Tên Card | Giá trị | Sparkline | Value color |
|---|---|---|---|---|
| 1 | Tổng Chi Phí | SUM(spend) | Area+gradient: spend theo ngày, 30 ngày gần nhất | Black (#111827) |
| 2 | Tổng Conversion | SUM(conversions) | Area+gradient: conversions theo ngày, 30 ngày | Black (#111827) |
| 3 | CPL | spend/conversions | Area+gradient: CPL theo ngày, 30 ngày | Đỏ nếu tăng, xanh nếu giảm |
| 4 | CTR Trung Bình | AVG(ctr) | Area+gradient: CTR% theo ngày, 30 ngày | Xanh nếu > benchmark, đỏ nếu thấp |
| 5 | ROAS | revenue/spend | Area+gradient: ROAS theo ngày, 30 ngày | Xanh nếu > 1, đỏ nếu < 1 |

**Quy tắc sparkline:** Tất cả 5 card dùng cùng 30-ngày window. Area+gradient, không dùng Bar.

**Pages:** Overview · Channel Analysis · Campaign Analysis (optional)

---

### HR / NHÂN SỰ

**Primary dimension:** department / phòng_ban
**Secondary dimension:** gender / status

**PARAMETER options:**
1. `Headcount` — COUNT(employee)
2. `Avg Salary` — AVG(salary)
3. `Avg Tenure` — AVG(tenure)
4. `Turnover Rate` — COUNT(resigned)/COUNT(all) % nếu có status

**5 KPI Cards:**
| # | Tên Card | Giá trị | Sparkline | Value color |
|---|---|---|---|---|
| 1 | Tổng Nhân Viên | COUNT(employee) | Area+gradient: headcount theo tháng, 12 tháng gần nhất | Black (#111827) |
| 2 | Lương Trung Bình | AVG(salary) | Area+gradient: avg salary theo tháng, 12 tháng | Black (#111827) |
| 3 | Thâm Niên TB | AVG(tenure in years) | Area+gradient: avg tenure theo tháng, 12 tháng | Black (#111827) |
| 4 | Tỷ Lệ Nghỉ Việc | resigned/total × 100% | Area+gradient: turnover% theo tháng, 12 tháng | < 5% xanh · 5–10% vàng · > 10% đỏ |
| 5 | Tuyển Mới | COUNT(hire trong kỳ) | Area+gradient: new hires theo tháng, 12 tháng | Black (#111827) |

**Quy tắc sparkline:** Data HR thường monthly → dùng 12-tháng window cho cả 5 card. Area+gradient, không dùng Bar.

**Pages:** Overview · Department Analysis · Gender/Status Analysis (optional)

---

### OPERATIONS / VẬN HÀNH

**Primary dimension:** supplier / category
**Secondary dimension:** status / warehouse

**PARAMETER options:**
1. `Order Count` — COUNT(orders)
2. `On-time Rate` — % giao đúng hạn
3. `Avg Lead Time` — AVG(lead_time)
4. `Defect Rate` — % lỗi (nếu có cột)

**5 KPI Cards:**
| # | Tên Card | Giá trị | Sparkline | Value color |
|---|---|---|---|---|
| 1 | Tổng Đơn Hàng | COUNT(orders) | Area+gradient: orders theo ngày, 30 ngày gần nhất | Black (#111827) |
| 2 | On-time Rate | on_time / total × 100% | Area+gradient: on-time% theo ngày, 30 ngày | Xanh nếu > 90%, vàng > 75%, đỏ nếu thấp hơn |
| 3 | Avg Lead Time | AVG(lead_time in days) | Area+gradient: lead time theo ngày, 30 ngày | Đỏ nếu tăng, xanh nếu giảm |
| 4 | Defect Rate | defects / total × 100% | Area+gradient: defect% theo ngày, 30 ngày | < 2% xanh · 2–5% vàng · > 5% đỏ |
| 5 | Active Suppliers | COUNT DISTINCT(supplier) | Area+gradient: supplier count theo tháng, 12 tháng | Black (#111827) |

**Quy tắc sparkline:** Tất cả 5 card dùng cùng 30-ngày window. Area+gradient, không dùng Bar.

**Pages:** Overview · Supplier Analysis · Product/Category Analysis (optional)

---

### FINANCE / TÀI CHÍNH

**Primary dimension:** category / account / loại_chi_phí
**Secondary dimension:** department / type

**PARAMETER options:**
1. `Actual` — SUM(actual)
2. `Budget` — SUM(budget)
3. `Variance (Δ)` — SUM(actual - budget)
4. `Variance %` — (actual-budget)/budget × 100

**5 KPI Cards:**
| # | Tên Card | Giá trị | Sparkline | Value color |
|---|---|---|---|---|
| 1 | Tổng Thực Chi | SUM(actual) | Area+gradient: actual theo tháng, 12 tháng gần nhất | Black (#111827) |
| 2 | Tổng Ngân Sách | SUM(budget) | Area+gradient: budget theo tháng, 12 tháng | Black (#111827) |
| 3 | Variance | SUM(actual - budget) | Area+gradient: variance theo tháng, 12 tháng | Xanh nếu dương (tiết kiệm), đỏ nếu âm (vượt) |
| 4 | % Thực Hiện NS | actual/budget × 100% | Area+gradient: % theo tháng, 12 tháng | Xanh nếu ≤ 100%, đỏ nếu > 100% |
| 5 | Mục Vượt Budget | COUNT(items where actual > budget) | Area+gradient: count theo tháng, 12 tháng | Đỏ nếu > 0 |

**Quy tắc sparkline:** Data Finance thường monthly → dùng 12-tháng window cho cả 5 card. Area+gradient, không dùng Bar.

**Pages:** Overview · Category Analysis · Department Analysis (optional)

---

## BƯỚC 4 — XUẤT DASHBOARD SPEC THEO FORMAT CHUẨN

Sau khi hoàn thành spec, thực hiện **2 việc theo thứ tự**:

**1. In spec ra chat** để user review.

**2. Lưu file** theo quy tắc sau:

- Tên file: `.claude/[tên-dashboard]-spec.md`
  - Tên lấy từ tên dashboard trong spec, viết thường, thay space/dấu bằng dấu gạch ngang
  - Ví dụ: "TechWorld E-Commerce" → `.claude/techworld-ecommerce-spec.md`
  - Ví dụ: "HR Analytics 2024" → `.claude/hr-analytics-2024-spec.md`

- **Nếu file chưa tồn tại** → tạo mới

- **Nếu file đã tồn tại** (đang update spec của cùng dashboard) → ghi đè

- **Nếu đang làm spec cho dataset mới** nhưng tên trùng với file cũ → hỏi user trước khi ghi đè

- Sau khi lưu, thông báo đường dẫn file: `✓ Đã lưu spec tại .claude/[tên-file]`

Khi output, dùng chính xác format sau. Điền đầy đủ tất cả sections, không bỏ section nào:

```
╔══════════════════════════════════════════════════════════════════╗
║  DASHBOARD SPEC — [TÊN] · Domain: [DOMAIN] · v1.0              ║
╚══════════════════════════════════════════════════════════════════╝

━━━ DATA SCHEMA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [tên_cột]  :  [date | text | number]  →  [DATE / PRIMARY_DIM / SECONDARY_DIM / METRIC]
  ...

  Primary Dimension  : [tên cột]
  Secondary Dimension: [tên cột]
  Date Column        : [tên cột]

━━━ PAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Page 1: Overview  (mặc định khi load)
  Page 2: [Tên — Primary Dimension Analysis]
  Page 3: [Tên] HOẶC "Không tạo — lý do: ..."

━━━ LAYOUT FRAMEWORK (toàn bộ pages) ━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────┐
  │  HEADER: [Tên Dashboard]                    🕐 Last Updated  │
  ├─────────────┬────────────────────────────────────────────────┤
  │  SIDEBAR    │                                                │
  │  ─────────  │          PAGE CONTENT AREA                    │
  │  📊 Overview│  ┌──────────────────────────────────────────┐ │
  │  📦 [Page2] │  │ PARAMETER: [M1] | [M2] | [M3] | [M4]    │ │
  │  🗺 [Page3] │  └──────────────────────────────────────────┘ │
  │  ─────────  │                                                │
  │  FILTERS:   │  Row 1: [5 KPI Cards with sparklines]         │
  │  📅 Date    │                                                │
  │  [Dim1] ▾   │  Row 2: [Chart A 30%] | [Chart B 70%]        │
  │  [Dim2] ▾   │                                                │
  │             │  Row 3: [Chart C 40%] | [Chart D 60%]        │
  └─────────────┴────────────────────────────────────────────────┘

  Sidebar width: ~220px, fixed, không scroll cùng content.

━━━ PARAMETER (METRIC SELECTOR) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  UI: Button group ngang, 4 nút, hiện ở trên content area tất cả pages.
  Active button: màu primary, chữ trắng. Inactive: nền trắng, viền xám.
  Khi đổi metric → cập nhật đồng thời tất cả chart có ghi "→ PARAM".

  Option 1: [Tên]  ·  Công thức: [...]  ·  Format: [VNĐ / số / %]
  Option 2: [Tên]  ·  Công thức: [...]  ·  Format: [...]
  Option 3: [Tên]  ·  Công thức: [...]  ·  Format: [...]
  Option 4: [Tên]  ·  Công thức: [...]  ·  Format: [...]
  Default: Option 1

━━━ PAGE 1: OVERVIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌── ROW 1: 5 KPI CARDS ───────────────────────────────────────┐
  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
  │  │KPI 1 │ │KPI 2 │ │KPI 3 │ │KPI 4 │ │KPI 5 │             │
  │  │[val] │ │[val] │ │[val] │ │[val] │ │[val] │             │
  │  │∿∿∿∿∿│ │∿∿∿∿∿│ │∿∿∿∿∿│ │∿∿∿∿∿│ │∿∿∿∿∿│             │
  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
  └──────────────────────────────────────────────────────────── ┘

  Quy tắc chung cho tất cả 5 card:
    · Sparkline: AreaChart (line + gradient fill) — KHÔNG dùng BarChart hay Flat indicator
    · Gradient fill: stopOpacity 0.25 → 0 (top → bottom)
    · Tất cả 5 card phải dùng CÙNG time window: daily data → 30 ngày, monthly data → 12 tháng
    · Value color: Black (#111827) cho neutral metrics · Semantic color (xanh/vàng/đỏ) cho rate/margin

  Card 1: [Tên]
    Giá trị: [công thức]  ·  Format: [...]  ·  Value color: Black
    Sparkline: Area+gradient · [metric] theo [day/month] · [30 ngày / 12 tháng] gần nhất

  Card 2: [Tên]
    Giá trị: [công thức]  ·  Format: [...]  ·  Value color: Black
    Sparkline: Area+gradient · [metric] theo [day/month] · cùng window Card 1

  Card 3: [Tên]
    Giá trị: [công thức]  ·  Format: [...]  ·  Value color: Black
    Sparkline: Area+gradient · [metric] theo [day/month] · cùng window Card 1

  Card 4: [Tên — thường là margin / rate / efficiency]
    Giá trị: [công thức]  ·  Format: %  ·  Value color: [semantic xanh/vàng/đỏ]
    Sparkline: Area+gradient · [metric%] theo [day/month] · cùng window Card 1 · màu sparkline = màu value

  Card 5: [Tên — thường là rate / count có ý nghĩa tốt/xấu]
    Giá trị: [công thức]  ·  Format: [% hoặc số]  ·  Value color: [semantic xanh/vàng/đỏ]
    Sparkline: Area+gradient · [metric] theo [day/month] · cùng window Card 1 · màu sparkline = màu value

  ┌── ROW 2: 2 BIỂU ĐỒ ─────────────────────────────────────── ┐

  Chart A — Donut (30%)
    Tiêu đề: "[Primary Dim] Breakdown"
    Dữ liệu: GROUP BY [primary_dim_col], [metric] → PARAM
    Style:
      · Donut hole 60%
      · Legend bên phải, hiện tên + %
      · Tooltip hover: tên + value + % of total
      · Màu: palette [n màu] theo thứ tự chart colour sequence

  Chart B — Area Chart với Gradient Fill (70%)
    Tiêu đề: "[Metric] Trend"  ·  metric → PARAM
    Dữ liệu: X = [date_col], Y = [metric] → PARAM
    Style:
      · Line màu primary, dày 2px
      · Fill: LinearGradient — primary colour opacity 0.4 → transparent (top → bottom)
      · Dot hiện khi hover · Tooltip: ngày + giá trị format đẹp
      · Trục Y bắt đầu từ 0 · Trục X label gọn (chỉ hiện ngày/tháng không hiện năm nếu cùng năm)
    Time Toggle: Button group "Ngày / Tuần / Tháng" nằm phía trên chart
      · Khi chọn "Tuần" → GROUP BY week · Khi chọn "Tháng" → GROUP BY month

  ┌── ROW 3: 2 BIỂU ĐỒ ─────────────────────────────────────── ┐

  Chart C — Horizontal Bar (40%)
    Tiêu đề: "[Secondary Dim] Comparison"
    Dữ liệu: GROUP BY [secondary_dim_col], [metric] → PARAM
    Style:
      · Sorted descending (cao nhất trên cùng)
      · Bar màu primary với opacity giảm dần theo rank (rank 1 đậm nhất)
      · Label giá trị hiện tại cuối bar, format đẹp
      · Tooltip: tên + value + % of total

  Chart D — Time Comparison Matrix Table (60%)
    Tiêu đề: "Performance Over Time"
    Cấu trúc:
      · Cột 0: Kỳ thời gian (Month YYYY hoặc Week WXX)
      · Cột 1→n: [tất cả metric names từ PARAMETER + thêm các metric phụ nếu có]
      · Row cuối: Total / Average
    Style:
      · Header: nền màu primary, chữ trắng, bold
      · Heatmap per column: cell cao nhất = màu primary opacity 0.3, thấp nhất = màu negative opacity 0.2
      · Cột số căn phải · Alternating row nền trắng / xám nhạt
      · Sorted: kỳ mới nhất ở trên cùng

━━━ PAGE 2: [TÊN PRIMARY DIMENSION] ANALYSIS ━━━━━━━━━━━━━━━━━━━

  ┌── ROW 1: 5 KPI CARDS ───────────────────────────────────────┐
  Tương tự Overview Row 1.
  Scope: Khi filter primary dimension đang chọn "All" → hiện tổng.
         Khi filter chọn 1 giá trị cụ thể → hiện riêng giá trị đó.
  (Code: lọc data theo giá trị filter trước khi tính KPI)

  ┌── ROW 2: 2 BIỂU ĐỒ ─────────────────────────────────────── ┐

  Chart A — Horizontal Bar (30%)
    Tiêu đề: "[Primary Dim] Ranking"
    Dữ liệu: Mỗi giá trị của primary_dim = 1 bar · metric → PARAM
    Style: Sorted desc · Label cuối bar · Gradient opacity by rank

  Chart B — Multi-line Chart (70%)
    Tiêu đề: "[Metric] by [Primary Dim] Over Time"
    Dữ liệu: X = time, Y = metric → PARAM · Mỗi giá trị primary_dim = 1 đường
    Style:
      · Mỗi line màu khác nhau từ chart colour sequence
      · Legend phía dưới chart, click vào legend để show/hide line
      · Hover tooltip dọc: hiện tất cả values của tất cả lines tại điểm thời gian đó
    Time Toggle: Ngày / Tuần / Tháng (giống Overview Chart B)

  ┌── ROW 3: 2 BIỂU ĐỒ ─────────────────────────────────────── ┐

  Chart C — Donut (40%)
    Tiêu đề: "[Metric] Share by [Primary Dim]"
    Dữ liệu: GROUP BY primary_dim · metric → PARAM
    Style: Giống Overview Chart A

  Chart D — Comparison Matrix Table (60%)
    Tiêu đề: "[Primary Dim] Full Metrics"
    Cấu trúc:
      · Cột 0: [Primary Dim] — mỗi giá trị = 1 hàng
      · Cột 1→n: [Tất cả metrics] | % of Total | vs Prev Period (Δ%)
      · Row cuối: Total / Average
    Style: Heatmap per column · Sorted theo PARAM metric, descending

━━━ PAGE 3: [TÊN SECONDARY DIMENSION] ANALYSIS ━━━━━━━━━━━━━━━━━

  [QUYẾT ĐỊNH: Tạo / Không tạo]
  Tạo khi: secondary dimension có ≥ 3 giá trị phân biệt và có ý nghĩa phân tích.
  Không tạo khi: chỉ có 2 giá trị (vd: gender M/F → dùng filter thay vì tạo page riêng).

  Nếu tạo: Cấu trúc giống Page 2, thay primary_dim bằng secondary_dim.

━━━ SIDEBAR FILTERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Filter 1 — Date Range
    Nguồn: cột [date_col]
    UI: Calendar picker + presets: "7 ngày" / "30 ngày" / "3 tháng" / "Năm nay" / "Tuỳ chỉnh"
    Mặc định: 30 ngày gần nhất

  Filter 2 — [Primary Dimension]
    Nguồn: DISTINCT values từ cột [primary_dim_col]
    UI: Multi-select dropdown · có ô search · nút "Chọn tất cả" / "Bỏ chọn tất cả"
    Mặc định: Tất cả

  Filter 3 — [Secondary Dimension]
    Nguồn: DISTINCT values từ cột [secondary_dim_col]
    UI: Multi-select dropdown
    Mặc định: Tất cả

━━━ MÀU SẮC THEO DOMAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  SALES:      Primary #039c78 · Secondary #0ea5e9 · Accent #f59e0b · BG #f8fafc
  MARKETING:  Primary #6d28d9 · Secondary #8b5cf6 · Accent #f97316 · BG #faf5ff
  HR:         Primary #0f766e · Secondary #14b8a6 · Accent #6366f1 · BG #f0fdfa
  OPERATIONS: Primary #166534 · Secondary #16a34a · Accent #eab308 · BG #f0fdf4
  FINANCE:    Primary #1e40af · Secondary #0369a1 · Accent #059669 · BG #f0f9ff

  Negative (giảm/lỗi/vượt budget): #ef4444 (Red)
  Positive (tăng/lãi):              #16a34a (Green)
  Card surface: #ffffff · Card border: #e2e8f0

  Chart colour sequence (multi-series):
  [Primary, Secondary, Accent, #8b5cf6, #fb923c, #f472b6, #34d399, #64748b]

━━━ TYPOGRAPHY & COLOR STANDARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Áp dụng thống nhất cho tất cả domains:

  | Element | Color | Weight | Size |
  |---|---|---|---|
  | Dashboard title (header) | #111827 (black) | bold | text-xl |
  | Chart card title | #111827 (black) | semibold | text-sm |
  | KPI callout value (neutral) | #111827 (black) | bold | text-xl |
  | KPI callout value (semantic) | #16a34a / #ef4444 tùy giá trị | bold | text-xl |
  | Sidebar section labels | #111827 (black) | semibold | 11px uppercase |
  | Table data cells (number) | #111827 (black) | normal | text-xs |
  | Table data cells (secondary %) | #6b7280 (gray) | normal | text-xs |
  | Table header | white | semibold | 10px |

  Table matrix:
  · Header row: nền PRIMARY, chữ trắng
  · Heatmap positive: rgba(PRIMARY_RGB, 0.04–0.30) — tính từ min/max của cột
  · Heatmap negative (return rate, defect): rgba(239,68,68, 0.04–0.30)
  · Total/Avg row: nền #eff6ff (blue-50), text #111827
  · Alternating rows: trắng / #f8fafc

  Sidebar active nav item: nền #eff6ff, chữ PRIMARY
  Flexbox chart containers: luôn thêm `minWidth: 0` để Recharts đo đúng kích thước

━━━ GHI CHÚ & CẢNH BÁO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Điền đầy đủ:]
  - Cột thiếu so với ideal → ảnh hưởng chart nào → phương án thay thế
  - KPI không tính được → lý do → cách bổ sung sau
  - Page không tạo → lý do
  - Lưu ý data format: date phải là YYYY-MM-DD, số không có dấu phẩy đơn vị, ...

╔══════════════════════════════════════════════════════════════════╗
║  END OF SPEC                                                    ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## QUY TẮC BẮT BUỘC

1. **Output đầy đủ** — Không bỏ section nào, kể cả khi data đơn giản.
2. **PARAMETER là bắt buộc** — 4 options, dù phải tính derived metric.
3. **Sparkline là bắt buộc cho mỗi KPI** — Ghi rõ loại, nguồn data, số điểm.
4. **Matrix table luôn có heatmap** — Đây là yếu tố phân biệt pro với amateur.
5. **Ưu tiên cột thật** — Không có cột lý tưởng? Đề xuất chart thay thế + ghi vào GHI CHÚ.
6. **Màu đúng domain** — Không chọn màu ngẫu nhiên, không default xanh dương generic.
7. **Page 3 ra quyết định rõ ràng** — "Tạo" hoặc "Không tạo" kèm lý do.
8. **Chạy ngay** — Có đủ tên cột là phân tích luôn, không hỏi thêm.
