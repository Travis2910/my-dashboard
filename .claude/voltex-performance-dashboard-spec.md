╔══════════════════════════════════════════════════════════════════╗
║  DASHBOARD SPEC — Voltex Performance Dashboard · Domain: OPERATIONS · v2.0  ║
╚══════════════════════════════════════════════════════════════════╝

━━━ DATA SCHEMA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Order_ID              :  text    →  ID (không dùng trực tiếp)
  Customer_ID           :  text    →  ID
  Payment_ID            :  text    →  DIM (phương thức thanh toán)
  Shipping_ID           :  text    →  DIM (đơn vị vận chuyển)
  Region_ID             :  text    →  SECONDARY_DIM
  Return_ID             :  text    →  DIM
  Product_ID            :  text    →  PRIMARY_DIM (extract product line: VTX-AU, VTX-LP, VTX-SP...)
  Order_Date            :  date    →  DATE (YYYY-MM-DD)
  Order_DateTime        :  datetime → (chi tiết, không dùng trục chính)
  Order_ConfirmedDateTime : datetime
  Warehouse_PackingDateTime : datetime
  Shipping_PickupDateTime   : datetime
  Shipping_OutForDeliveryDateTime : datetime
  Delivery_PromisedDateTime : datetime
  Delivery_ActualDateTime   : datetime
  Order_Status          :  text    →  DIM (Completed, Cancelled, ...)
  Return_RequestDateTime : text/datetime
  Order_Quantity        :  number  →  METRIC (dấu phẩy thập phân)
  Order_Discount        :  number  →  METRIC (dấu phẩy thập phân)
  Order_OpEx            :  number  →  METRIC (chi phí vận hành, dấu phẩy thập phân)
  Order_ReturnCost      :  number  →  METRIC (chi phí hoàn trả, dấu phẩy thập phân)
  Feedback_Rating       :  number  →  METRIC (1-5)
  Feedback_Sentiment    :  text    →  DIM (Positive/Negative/Neutral)
  Is_Returned           :  text    →  DIM (True/False)
  Delivery_Status       :  text    →  DIM (On-Time/Late)
  Customer_Age          :  number  →  METRIC

  Primary Dimension  : Product Line (extracted from Product_ID prefix, e.g. VTX-AU, VTX-LP, VTX-SP)
  Secondary Dimension: Region_ID
  Date Column        : Order_Date

━━━ PAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Page 1: Overview  (mặc định khi load)
  Page 2: Product Line Analysis
  Page 3: Regional Analysis — Tạo (Region_ID có ≥ 3 giá trị: R01-R20)

━━━ LAYOUT FRAMEWORK (toàn bộ pages) ━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────┐
  │  HEADER: Voltex Performance Dashboard       🕐 Last Updated  │
  ├─────────────┬────────────────────────────────────────────────┤
  │  SIDEBAR    │                                                │
  │  ─────────  │          PAGE CONTENT AREA                    │
  │  Overview   │  ┌──────────────────────────────────────────┐ │
  │  Product    │  │ PARAMETER: Orders | Quantity | OpEx |    │ │
  │  Region     │  │           Avg Rating                      │ │
  │  ─────────  │  └──────────────────────────────────────────┘ │
  │  FILTERS:   │                                                │
  │  Date       │  Row 1: [5 KPI Cards with sparklines]         │
  │  Product ▾  │                                                │
  │  Region ▾   │  Row 2: [Donut 30%] | [Area Chart 70%]       │
  │             │                                                │
  │             │  Row 3: [H-Bar 40%] | [Matrix Table 60%]     │
  └─────────────┴────────────────────────────────────────────────┘

  Sidebar width: ~220px, fixed, không scroll cùng content.

━━━ PARAMETER (METRIC SELECTOR) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  UI: Button group ngang, 4 nút, hiện ở trên content area tất cả pages.
  Active button: màu primary (#166534), chữ trắng. Inactive: nền trắng, viền xám.
  Khi đổi metric → cập nhật đồng thời tất cả chart có ghi "→ PARAM".

  Option 1: Orders         ·  Công thức: COUNT(rows)                ·  Format: số nguyên
  Option 2: Quantity       ·  Công thức: SUM(Order_Quantity)        ·  Format: số nguyên
  Option 3: OpEx           ·  Công thức: SUM(Order_OpEx)            ·  Format: $ (2 decimals)
  Option 4: Avg Rating     ·  Công thức: AVG(Feedback_Rating)       ·  Format: số (1 decimal)
  Default: Option 1

━━━ PAGE 1: OVERVIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Quy tắc chung cho tất cả 5 card:
    · Sparkline: AreaChart (line + gradient fill) — KHÔNG dùng BarChart hay Flat indicator
    · Gradient fill: stopOpacity 0.25 → 0 (top → bottom)
    · Tất cả 5 card phải dùng CÙNG time window: 30 ngày gần nhất (daily data)
    · Value color: Black (#111827) cho neutral metrics · Semantic color (xanh/vàng/đỏ) cho rate

  Card 1: Tổng Đơn Hàng
    Giá trị: COUNT(rows)  ·  Format: số nguyên  ·  Value color: Black (#111827)
    Sparkline: Area+gradient · orders theo ngày · 30 ngày gần nhất · màu #166534

  Card 2: Tổng Số Lượng
    Giá trị: SUM(Order_Quantity)  ·  Format: số nguyên  ·  Value color: Black (#111827)
    Sparkline: Area+gradient · quantity theo ngày · cùng window Card 1 · màu #166534

  Card 3: On-Time Rate
    Giá trị: COUNT(Delivery_Status='On-Time') / COUNT(all) × 100%  ·  Format: %
    Value color: > 90% xanh (#16a34a) · 75-90% vàng (#f59e0b) · < 75% đỏ (#ef4444)
    Sparkline: Area+gradient · on-time% theo ngày · cùng window · màu = màu value

  Card 4: Return Rate
    Giá trị: COUNT(Is_Returned='True') / COUNT(all) × 100%  ·  Format: %
    Value color: < 5% xanh · 5-10% vàng · > 10% đỏ
    Sparkline: Area+gradient · return% theo ngày · cùng window · màu = màu value

  Card 5: Avg Rating
    Giá trị: AVG(Feedback_Rating)  ·  Format: 1 decimal  ·  Value color: Black (#111827)
    Sparkline: Area+gradient · avg rating theo ngày · cùng window · màu #166534

  Row 2: Donut (30%) + Area (70%)
  Row 3: H-Bar (40%) + Matrix (60%)
  (Cấu trúc giống spec v1 nhưng với metrics mới)

━━━ MÀU SẮC THEO DOMAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OPERATIONS: Primary #166534 · Secondary #16a34a · Accent #eab308 · BG #f0fdf4

  Negative: #ef4444 (Red)
  Positive: #16a34a (Green)
  Warning:  #f59e0b (Amber)
  Card surface: #ffffff · Card border: #e2e8f0

  Chart colour sequence:
  [#166534, #16a34a, #eab308, #8b5cf6, #fb923c, #f472b6, #34d399, #64748b]

━━━ GHI CHÚ & CẢNH BÁO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Số thập phân trong Sheet dùng dấu phẩy (,) → cần replace ',' thành '.' khi parse
  - Không có cột revenue/price → không tính doanh thu, dùng Order_Quantity và Order_OpEx thay thế
  - Product_ID format: VTX-XX-NNN → extract prefix VTX-XX làm product line
  - Region_ID có ~20 giá trị (R01-R20) → Page 3 hợp lệ
  - DateTime columns có thể dùng để tính lead time (delivery - order)

╔══════════════════════════════════════════════════════════════════╗
║  END OF SPEC                                                    ║
╚══════════════════════════════════════════════════════════════════╝
