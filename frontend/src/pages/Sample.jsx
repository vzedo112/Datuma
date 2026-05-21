import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import DashboardView from "../components/Dashboard/DashboardView";
import MarketingNav from "../components/Layout/MarketingNav";

// Hardcoded sample dashboard. This renders without any API/auth so cold
// prospects from outreach can see real output in 5 seconds without signing up.
// Update the JSON below to swap the sample.

// Minimal but realistic rows so the drill-down UX is demoable on /sample.
// Columns chosen to match what the charts/metrics reference.
const SAMPLE_SCHEMA = [
  { name: "order_id", type: "numeric" },
  { name: "order_date", type: "date" },
  { name: "channel", type: "category" },
  { name: "category", type: "category" },
  { name: "region", type: "category" },
  { name: "quantity", type: "numeric" },
  { name: "order_total", type: "numeric" },
];

const Q3_ROWS = [
  { order_id: 10001, order_date: "2025-07-02", channel: "Web direct", category: "Electronics", region: "Singapore", quantity: 1, order_total: 189 },
  { order_id: 10002, order_date: "2025-07-02", channel: "Marketplace", category: "Apparel", region: "Sydney", quantity: 2, order_total: 122.4 },
  { order_id: 10003, order_date: "2025-07-03", channel: "Retail partner", category: "Home", region: "Tokyo", quantity: 1, order_total: 142 },
  { order_id: 10004, order_date: "2025-07-04", channel: "Web direct", category: "Beauty", region: "Hong Kong", quantity: 3, order_total: 126 },
  { order_id: 10005, order_date: "2025-07-05", channel: "Marketplace", category: "Electronics", region: "Sydney", quantity: 1, order_total: 279.65 },
  { order_id: 10006, order_date: "2025-07-07", channel: "Web direct", category: "Sports", region: "Singapore", quantity: 1, order_total: 55 },
  { order_id: 10007, order_date: "2025-07-08", channel: "B2B", category: "Electronics", region: "Melbourne", quantity: 12, order_total: 854.4 },
  { order_id: 10008, order_date: "2025-07-09", channel: "Marketplace", category: "Apparel", region: "Tokyo", quantity: 1, order_total: 148 },
  { order_id: 10009, order_date: "2025-07-10", channel: "Web direct", category: "Toys", region: "Singapore", quantity: 2, order_total: 76 },
  { order_id: 10013, order_date: "2025-07-15", channel: "Web direct", category: "Apparel", region: "Melbourne", quantity: 1, order_total: 274.55 },
  { order_id: 10020, order_date: "2025-07-26", channel: "Marketplace", category: "Electronics", region: "Melbourne", quantity: 1, order_total: 404.1 },
  { order_id: 10024, order_date: "2025-08-01", channel: "B2B", category: "Electronics", region: "Sydney", quantity: 5, order_total: 1156 },
  { order_id: 10026, order_date: "2025-08-04", channel: "Retail partner", category: "Home", region: "Hong Kong", quantity: 1, order_total: 178 },
  { order_id: 10031, order_date: "2025-08-12", channel: "Marketplace", category: "Apparel", region: "Hong Kong", quantity: 2, order_total: 98.6 },
  { order_id: 10032, order_date: "2025-08-13", channel: "B2B", category: "Electronics", region: "Tokyo", quantity: 10, order_total: 632 },
  { order_id: 10036, order_date: "2025-08-19", channel: "Marketplace", category: "Electronics", region: "Hong Kong", quantity: 1, order_total: 197.1 },
  { order_id: 10040, order_date: "2025-08-27", channel: "B2B", category: "Home", region: "Melbourne", quantity: 4, order_total: 982.6 },
  { order_id: 10042, order_date: "2025-08-30", channel: "Retail partner", category: "Apparel", region: "Tokyo", quantity: 1, order_total: 318 },
  { order_id: 10045, order_date: "2025-09-04", channel: "Web direct", category: "Electronics", region: "Melbourne", quantity: 1, order_total: 179 },
  { order_id: 10048, order_date: "2025-09-10", channel: "B2B", category: "Electronics", region: "Singapore", quantity: 3, order_total: 737.55 },
];

const Q2_ROWS = [
  { order_id: 9501, order_date: "2025-04-03", channel: "Web direct", category: "Electronics", region: "Singapore", quantity: 1, order_total: 178 },
  { order_id: 9502, order_date: "2025-04-09", channel: "Marketplace", category: "Apparel", region: "Sydney", quantity: 1, order_total: 88 },
  { order_id: 9510, order_date: "2025-04-22", channel: "B2B", category: "Electronics", region: "Melbourne", quantity: 8, order_total: 712 },
  { order_id: 9515, order_date: "2025-05-02", channel: "Web direct", category: "Beauty", region: "Hong Kong", quantity: 2, order_total: 84 },
  { order_id: 9520, order_date: "2025-05-14", channel: "Retail partner", category: "Home", region: "Tokyo", quantity: 1, order_total: 165 },
];

const sampleDashboard = {
  title: "Q3 retail — revenue, margin & channel mix",
  primaryQuestion:
    "Which categories drove Q3 revenue, and where is margin slipping fastest?",
  domain: "Retail sales · APAC · Jul–Sep 2025",
  datasets: [
    { name: "Q3 orders", filename: "q3_orders_apac.csv", rowCount: 12480 },
    { name: "Q2 orders", filename: "q2_orders_apac.csv", rowCount: 11210 },
  ],
  metrics: [
    {
      label: "Q3 revenue",
      value: "€4.82M",
      computation: "Sum of order_total across 12,480 Q3 rows",
      trend: "up",
      trendValue: "+8% vs Q2",
      datasetName: "Q3 orders",
    },
    {
      label: "Avg order value",
      value: "€386",
      computation: "Mean of order_total",
      trend: "up",
      trendValue: "+4% vs Q2",
      datasetName: "Q3 orders",
    },
    {
      label: "Gross margin",
      value: "31.4%",
      computation: "Sum(revenue − cogs) ÷ Sum(revenue)",
      trend: "down",
      trendValue: "-2.1pp vs Q2",
      datasetName: "Q3 orders",
    },
    {
      label: "Orders",
      value: "12,480",
      computation: "Count of distinct order_id",
      trend: "up",
      trendValue: "+11% vs Q2",
      datasetName: "Q3 orders",
    },
    {
      label: "Return rate",
      value: "4.2%",
      computation: "Returns ÷ Orders",
      trend: "down",
      trendValue: "-0.6pp vs Q2",
      datasetName: "Q3 orders",
    },
  ],
  charts: [
    {
      type: "bar",
      title: "Revenue by product category",
      aggregation: "sum",
      bucket: "none",
      xAxis: "category",
      yAxis: "order_total",
      explanation:
        "Electronics + Apparel = 58% of Q3 revenue. The long tail under-indexes vs Q2 by ~6%.",
      datasetName: "Q3 orders",
      data: [
        { x: "Electronics", y: 1542000 },
        { x: "Apparel", y: 1248000 },
        { x: "Home", y: 612000 },
        { x: "Beauty", y: 498000 },
        { x: "Sports", y: 384000 },
        { x: "Toys", y: 268000 },
        { x: "Other", y: 268000 },
      ],
    },
    {
      type: "line",
      title: "Weekly revenue trend",
      aggregation: "sum",
      bucket: "week",
      explanation:
        "Climbs through August, peaks W34, then softens — typical post back-to-school dip.",
      datasetName: "Q3 orders",
      data: [
        { x: "2025-W27", y: 312000 },
        { x: "2025-W28", y: 328000 },
        { x: "2025-W29", y: 351000 },
        { x: "2025-W30", y: 378000 },
        { x: "2025-W31", y: 402000 },
        { x: "2025-W32", y: 432000 },
        { x: "2025-W33", y: 462000 },
        { x: "2025-W34", y: 491000 },
        { x: "2025-W35", y: 446000 },
        { x: "2025-W36", y: 421000 },
        { x: "2025-W37", y: 405000 },
        { x: "2025-W38", y: 382000 },
      ],
    },
    {
      type: "pie",
      title: "Revenue share by channel",
      aggregation: "sum",
      bucket: "none",
      xAxis: "channel",
      yAxis: "order_total",
      explanation:
        "Web direct surpassed marketplace for the first time — keep paid-search weighted there.",
      datasetName: "Q3 orders",
      data: [
        { x: "Web direct", y: 2256000 },
        { x: "Marketplace", y: 1428000 },
        { x: "Retail partner", y: 786000 },
        { x: "B2B", y: 352000 },
      ],
    },
    {
      type: "bar",
      title: "Gross margin by category (Q3)",
      aggregation: "avg",
      bucket: "none",
      xAxis: "category",
      yAxis: "order_total",
      explanation:
        "Beauty and Home held margin. Electronics and Apparel dropped 3+ pp — promo-heavy quarter.",
      datasetName: "Q3 orders",
      data: [
        { x: "Beauty", y: 42.1 },
        { x: "Home", y: 38.5 },
        { x: "Toys", y: 33.0 },
        { x: "Sports", y: 30.2 },
        { x: "Apparel", y: 27.4 },
        { x: "Electronics", y: 25.8 },
      ],
    },
  ],
  // Source rows for drill-down. Real production dashboards carry these
  // via analysisContext too — they're the data Datuma actually saw.
  analysisContext: {
    datasets: [
      {
        name: "Q3 orders",
        filename: "q3_orders_apac.csv",
        rowCount: Q3_ROWS.length,
        schema: SAMPLE_SCHEMA,
        rows: Q3_ROWS,
      },
      {
        name: "Q2 orders",
        filename: "q2_orders_apac.csv",
        rowCount: Q2_ROWS.length,
        schema: SAMPLE_SCHEMA,
        rows: Q2_ROWS,
      },
    ],
  },
  insights: [
    {
      title: "Margin compression is concentrated in two categories",
      body: "Electronics (-3.4pp) and Apparel (-3.1pp) account for ~80% of the gross-margin drop. Revenue grew in both, but only because of deeper discounting. If promo intensity holds into Q4, margin lands ~30% even with revenue up.",
      datasetName: "Q3 orders",
    },
    {
      title: "Web direct overtook marketplace — first time in eight quarters",
      body: "Web direct hit 46.8% share vs 29.6% on marketplace. The shift is steady, not a one-week blip. Operationally: paid-search budget weighted to direct is paying off; marketplace SKU breadth might be over-invested.",
      datasetName: "Q3 orders",
    },
    {
      title: "Q3 vs Q2: orders up 11%, revenue up 8% — AOV diluted by mix",
      body: "More orders coming from lower-AOV categories (Beauty, Sports). Not a problem on its own, but it explains why revenue growth lags order growth. Watch the trend into Q4 holiday — if dilution continues with promo-heavy Electronics, margin pressure compounds.",
      datasetName: "comparison",
    },
  ],
};

export default function Sample() {
  return (
    <main className="min-h-screen bg-background">
      <MarketingNav />
      <div className="pt-28 lg:pt-32 px-6">
        <div className="max-w-[1400px] mx-auto mb-6">
          <div className="rounded-xl border border-foreground/15 bg-card px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-brand mb-1">
                Sample
              </p>
              <p className="text-sm text-foreground/80">
                This is what Datuma generates from real spreadsheets. Upload yours
                and get one in 30 seconds.
              </p>
            </div>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 transition-colors shrink-0"
            >
              Try it on your own file
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <DashboardView dashboard={sampleDashboard} />
      </div>
    </main>
  );
}
