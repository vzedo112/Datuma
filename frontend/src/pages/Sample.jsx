import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import DashboardView from "../components/Dashboard/DashboardView";
import MarketingNav from "../components/Layout/MarketingNav";

// Hardcoded sample dashboard. This renders without any API/auth so cold
// prospects from outreach can see real output in 5 seconds without signing up.
// Update the JSON below to swap the sample.
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
