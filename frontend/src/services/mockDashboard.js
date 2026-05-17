const mockDashboard = {
  filename: "q3_orders_apac.csv",
  rowCount: 12480,
  dashboard: {
    domain: "Retail sales transactions across APAC region (Q3 2025)",
    primaryQuestion: "Which product categories and channels are driving the most revenue, and where is margin slipping?",
    title: "APAC Q3 Sales — Revenue & Margin Brief",
    metrics: [
      {
        label: "Total revenue",
        computation: "Sum of order_total across all 12,480 rows",
        value: "€4.82M",
      },
      {
        label: "Avg order value",
        computation: "Mean of order_total",
        value: "€386",
        trend: "up",
        trendValue: "up 8% vs Q2 (€357)",
      },
      {
        label: "Gross margin",
        computation: "Sum(revenue − cogs) ÷ Sum(revenue)",
        value: "31.4%",
        trend: "down",
        trendValue: "down 2.1pp vs Q2 (33.5%)",
      },
      {
        label: "Active SKUs",
        computation: "Distinct product_id count",
        value: "1,284",
      },
      {
        label: "Repeat customer rate",
        computation: "Customers with >1 order ÷ all customers",
        value: "42%",
      },
    ],
    charts: [
      {
        type: "bar",
        title: "Revenue by product category",
        xAxis: "category",
        yAxis: "order_total",
        aggregation: "sum",
        bucket: "none",
        explanation:
          "Electronics and Apparel together account for ~58% of Q3 revenue. The long tail (Home, Beauty, Sports) under-indexes vs. Q2.",
        data: [
          { x: "Electronics", y: 1542000 },
          { x: "Apparel", y: 1248000 },
          { x: "Home", y: 612000 },
          { x: "Beauty", y: 498000 },
          { x: "Sports", y: 384000 },
          { x: "Toys", y: 268000 },
          { x: "Books", y: 162000 },
        ],
      },
      {
        type: "line",
        title: "Daily revenue trend (Q3)",
        xAxis: "order_date",
        yAxis: "order_total",
        aggregation: "sum",
        bucket: "week",
        explanation:
          "Weekly revenue climbs sharply through August, peaks W34, then softens in early September — typical post back-to-school dip.",
        data: [
          { x: "2025-W27", y: 312000 },
          { x: "2025-W28", y: 328000 },
          { x: "2025-W29", y: 351000 },
          { x: "2025-W30", y: 374000 },
          { x: "2025-W31", y: 402000 },
          { x: "2025-W32", y: 438000 },
          { x: "2025-W33", y: 462000 },
          { x: "2025-W34", y: 491000 },
          { x: "2025-W35", y: 455000 },
          { x: "2025-W36", y: 421000 },
          { x: "2025-W37", y: 398000 },
          { x: "2025-W38", y: 382000 },
          { x: "2025-W39", y: 376000 },
        ],
      },
      {
        type: "pie",
        title: "Revenue share by channel",
        xAxis: "channel",
        yAxis: "order_total",
        aggregation: "sum",
        bucket: "none",
        explanation:
          "Direct web is now the majority channel; marketplace fell 6pp QoQ as Amazon SEA fees rose. Worth a margin re-evaluation.",
        data: [
          { x: "Web direct", y: 2256000 },
          { x: "Marketplace", y: 1428000 },
          { x: "Retail partner", y: 786000 },
          { x: "B2B", y: 352000 },
        ],
      },
      {
        type: "bar",
        title: "Avg margin % by category",
        xAxis: "category",
        yAxis: "margin_pct",
        aggregation: "avg",
        bucket: "none",
        explanation:
          "Beauty and Books carry the highest unit margin, but their revenue share is small. Apparel margin compressed to 26%.",
        data: [
          { x: "Books", y: 48.2 },
          { x: "Beauty", y: 44.6 },
          { x: "Home", y: 36.1 },
          { x: "Toys", y: 33.4 },
          { x: "Electronics", y: 29.8 },
          { x: "Apparel", y: 26.0 },
          { x: "Sports", y: 24.7 },
        ],
      },
    ],
    insights: [
      {
        severity: "warning",
        title: "Apparel margin slipping below 27%",
        description:
          "Apparel revenue is up 11% QoQ but margin dropped from 31% to 26% — the discounting cadence in late August coincided with the dip. Worth reviewing the Aug 18–28 promo elasticity before extending it to Q4.",
      },
      {
        severity: "success",
        title: "Web direct now the majority channel",
        description:
          "Direct.com revenue (€2.26M) surpassed marketplace (€1.43M) for the first time. Acquisition cost on direct is also 32% lower — keep paid-search budget weighted there.",
      },
      {
        severity: "info",
        title: "1,284 active SKUs — long-tail review overdue",
        description:
          "The bottom 60% of SKUs contribute under 8% of revenue. A pruning round before the Q4 inventory rebuild would free working capital and warehouse slots.",
      },
    ],
  },
};

export default mockDashboard;
