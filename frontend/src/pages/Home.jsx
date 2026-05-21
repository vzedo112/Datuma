import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  Gauge,
  Eye,
  LineChart,
  Layers,
} from "lucide-react";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";
import MetricCard from "../components/Dashboard/MetricCard";
import ChartPanel from "../components/Dashboard/ChartPanel";

const previewDashboard = {
  title: "Q3 Sales — Revenue & Margin Brief",
  primaryQuestion:
    "Which product categories are driving revenue, and where is margin slipping?",
  domain: "Retail sales (APAC, Q3 2025)",
  filename: "q3_orders_apac.csv",
  rowCount: 12480,
  metrics: [
    {
      label: "Total revenue",
      value: "€4.82M",
      computation: "Sum of order_total across 12,480 rows",
      trend: "up",
      trendValue: "up 8% vs Q2",
    },
    {
      label: "Avg order value",
      value: "€386",
      computation: "Mean of order_total",
    },
    {
      label: "Gross margin",
      value: "31.4%",
      computation: "Sum(revenue − cogs) ÷ Sum(revenue)",
      trend: "down",
      trendValue: "down 2.1pp vs Q2",
    },
  ],
  charts: [
    {
      type: "bar",
      title: "Revenue by product category",
      aggregation: "sum",
      bucket: "none",
      explanation:
        "Electronics + Apparel = 58% of Q3 revenue. The long tail under-indexes vs Q2.",
      data: [
        { x: "Electronics", y: 1542000 },
        { x: "Apparel", y: 1248000 },
        { x: "Home", y: 612000 },
        { x: "Beauty", y: 498000 },
        { x: "Sports", y: 384000 },
        { x: "Toys", y: 268000 },
      ],
    },
    {
      type: "line",
      title: "Weekly revenue trend",
      aggregation: "sum",
      bucket: "week",
      explanation:
        "Climbs through August, peaks W34, then softens — typical post back-to-school dip.",
      data: [
        { x: "2025-W27", y: 312000 },
        { x: "2025-W29", y: 351000 },
        { x: "2025-W31", y: 402000 },
        { x: "2025-W33", y: 462000 },
        { x: "2025-W34", y: 491000 },
        { x: "2025-W36", y: 421000 },
        { x: "2025-W38", y: 382000 },
      ],
    },
    {
      type: "pie",
      title: "Revenue share by channel",
      aggregation: "sum",
      bucket: "none",
      explanation:
        "Web direct surpassed marketplace for the first time — keep paid-search budget weighted there.",
      data: [
        { x: "Web direct", y: 2256000 },
        { x: "Marketplace", y: 1428000 },
        { x: "Retail partner", y: 786000 },
        { x: "B2B", y: 352000 },
      ],
    },
  ],
};

const verbs = ["briefed", "decoded", "explained", "answered"];

function HeroFragments({ visible }) {
  // A small sparkline SVG for the trend fragment.
  const sparkPoints = "0,28 12,22 24,24 36,16 48,18 60,10 72,12 84,4";

  return (
    <div className="hidden lg:block absolute right-8 xl:right-16 top-1/2 -translate-y-1/2 w-[440px] h-[480px] pointer-events-none">
      <style>{`
        @keyframes float-a { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-10px) rotate(-3deg); } }
        @keyframes float-b { 0%,100% { transform: translateY(0) rotate(2.5deg); } 50% { transform: translateY(-7px) rotate(2.5deg); } }
        @keyframes float-c { 0%,100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-12px) rotate(-1.5deg); } }
        @keyframes float-d { 0%,100% { transform: translateY(0) rotate(3deg); } 50% { transform: translateY(-8px) rotate(3deg); } }
        @keyframes draw-spark { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
      `}</style>

      {/* Metric chip — top left */}
      <div
        className={`absolute top-4 left-0 transition-all duration-700 delay-[400ms] ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ animation: visible ? "float-a 7s ease-in-out infinite" : "none" }}
      >
        <div className="rounded-xl border border-foreground/15 bg-background shadow-[0_12px_30px_-18px_rgba(20,17,13,0.35)] px-4 py-3 w-[200px]">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
            Total revenue
          </p>
          <p className="font-display text-2xl tracking-tight leading-none">€4.82M</p>
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-700">
            <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
            up 8% vs Q2
          </p>
        </div>
      </div>

      {/* Q chip — top right */}
      <div
        className={`absolute top-2 right-0 transition-all duration-700 delay-[550ms] ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ animation: visible ? "float-b 8s ease-in-out infinite 0.4s" : "none" }}
      >
        <div className="rounded-xl border border-foreground/15 bg-background shadow-[0_12px_30px_-18px_rgba(20,17,13,0.35)] px-4 py-3 w-[220px]">
          <p className="font-mono text-[9px] uppercase tracking-widest text-brand mb-1.5">
            Q
          </p>
          <p className="text-[13px] leading-snug text-foreground">
            Which categories drove margin this quarter?
          </p>
        </div>
      </div>

      {/* Sparkline card — middle */}
      <div
        className={`absolute top-[200px] left-12 transition-all duration-700 delay-[700ms] ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ animation: visible ? "float-c 9s ease-in-out infinite 0.8s" : "none" }}
      >
        <div className="rounded-xl border border-foreground/15 bg-background shadow-[0_12px_30px_-18px_rgba(20,17,13,0.35)] px-4 py-3 w-[230px]">
          <div className="flex items-baseline justify-between mb-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Weekly revenue
            </p>
            <p className="text-[10px] font-mono text-emerald-700">+18%</p>
          </div>
          <svg viewBox="0 0 84 32" className="w-full h-8" preserveAspectRatio="none">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground"
              style={{
                strokeDasharray: 200,
                animation: visible ? "draw-spark 1.6s ease-out 0.9s forwards" : "none",
                strokeDashoffset: visible ? undefined : 200,
              }}
            />
          </svg>
        </div>
      </div>

      {/* Dataset pill — bottom right */}
      <div
        className={`absolute bottom-8 right-4 transition-all duration-700 delay-[850ms] ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ animation: visible ? "float-d 7.5s ease-in-out infinite 1.2s" : "none" }}
      >
        <div className="rounded-xl border border-foreground/15 bg-background shadow-[0_12px_30px_-18px_rgba(20,17,13,0.35)] px-4 py-3 w-[210px]">
          <div className="flex items-center gap-2 mb-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-foreground/70" strokeWidth={1.7} />
            <span className="font-mono text-[10px] text-muted-foreground truncate">
              q3_orders.csv
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            12,480 rows · 14 cols
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-mono uppercase tracking-widest">
              clean
            </span>
            <span className="text-[10px] text-muted-foreground">no issues found</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const [visible, setVisible] = useState(false);
  const [verbIdx, setVerbIdx] = useState(0);

  useEffect(() => setVisible(true), []);
  useEffect(() => {
    const id = setInterval(() => setVerbIdx((p) => (p + 1) % verbs.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-30 pointer-events-none" />
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[820px] lg:h-[820px] rounded-full bg-gradient-to-br from-foreground/5 via-foreground/0 to-foreground/10 blur-3xl pointer-events-none" />

      <HeroFragments visible={visible} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40 w-full">
        <div
          className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span className="w-8 h-px bg-foreground/30" />
            For finance, ops & founders
          </span>
        </div>

        <h1
          className={`text-[clamp(2.75rem,11vw,9.5rem)] font-display leading-[0.92] tracking-tight mb-12 transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="block">Data,</span>
          <span className="block">
            <span className="relative inline-block">
              <span key={verbIdx} className="inline-flex">
                {verbs[verbIdx].split("").map((char, i) => (
                  <span
                    key={`${verbIdx}-${i}`}
                    className="inline-block animate-char-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-3 bg-brand/30" />
            </span>
            <span className="text-muted-foreground">.</span>
          </span>
        </h1>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p
            className={`text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            Drop a CSV, Excel file, or multiple files to blend them. Datuma reads your data like a senior analyst would
            and hands you a one-page dashboard with the numbers, the trends, and
            the things worth a meeting.
          </p>

          <div
            className={`flex flex-col sm:flex-row items-start gap-3 transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <Link
              to="/app"
              className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-8 h-14 rounded-full text-base group"
            >
              Upload your first file
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/sample"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-full text-base border border-foreground/20 hover:bg-foreground/5"
            >
              See it work
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`absolute bottom-16 left-0 right-0 transition-opacity duration-700 delay-500 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex gap-16 animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-16">
              {[
                /* { value: "30 sec", label: "to first insight", company: "AVERAGE" }, */
                /* { value: "1.2M", label: "rows per upload", company: "MAX FILE" }, */
                /* { value: "0", label: "SQL written", company: "EVER" }, */
                /* { value: "94%", label: "of users skip Excel", company: "AFTER 1 WK" }, */
              ].map((s) => (
                <div key={`${s.company}-${k}`} className="flex items-baseline gap-4">
                  <span className="text-4xl lg:text-5xl font-display">{s.value}</span>
                  <span className="text-sm text-muted-foreground">
                    {s.label}
                    <span className="block font-mono text-[10px] tracking-widest mt-1">{s.company}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  const [visible, setVisible] = useState(false);
  const [chartIdx, setChartIdx] = useState(0);
  const ref = useRef(null);
  const total = previewDashboard.charts.length;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setChartIdx((p) => (p + 1) % total);
    }, 4500);
    return () => clearInterval(id);
  }, [visible, total]);

  const activeChart = previewDashboard.charts[chartIdx];

  return (
    <section
      id="example"
      ref={ref}
      className="relative py-20 lg:py-28 border-t border-foreground/10"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-10 lg:mb-12 max-w-3xl">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5">
            <span className="w-8 h-px bg-foreground/30" />
            What you get
          </span>
          <h2
            className={`text-4xl lg:text-5xl font-display tracking-tight transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            A one-page brief,
            <span className="text-muted-foreground"> every time.</span>
          </h2>
        </div>

        <div
          className={`relative rounded-2xl border border-foreground/15 bg-background overflow-hidden shadow-[0_24px_60px_-30px_rgba(20,17,13,0.25)] transition-all duration-1000 delay-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-foreground/10 bg-card">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
            </div>
            <div className="ml-2 flex-1 flex justify-center">
              <span className="font-mono text-[11px] text-muted-foreground tracking-tight px-3 py-1 rounded-md bg-background border border-foreground/10">
                datuma.app / dashboard / {previewDashboard.filename}
              </span>
            </div>
            <div className="w-12 hidden sm:block" />
          </div>

          {/* Dashboard content */}
          <div className="p-5 sm:p-6">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-xl lg:text-2xl tracking-tight mb-1">
                  {previewDashboard.title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-brand mr-2">
                    Q
                  </span>
                  {previewDashboard.primaryQuestion}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-muted-foreground shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent">
                  <FileSpreadsheet className="w-3 h-3" />
                  {previewDashboard.filename}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-accent">
                  {previewDashboard.rowCount.toLocaleString()} rows
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {previewDashboard.metrics.map((m, i) => (
                <MetricCard key={i} {...m} />
              ))}
            </div>

            {/* Cycling chart slot */}
            <div className="relative">
              <div
                key={chartIdx}
                className="animate-fade-up"
              >
                <ChartPanel chart={activeChart} primary />
              </div>
            </div>

            {/* Dot indicators */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {previewDashboard.charts.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setChartIdx(i)}
                  aria-label={`Show chart ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === chartIdx
                      ? "w-8 bg-foreground"
                      : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                  }`}
                />
              ))}
              <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {activeChart.type} · {activeChart.aggregation}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            Run one on your own file
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    number: "01",
    title: "Drop in any spreadsheet",
    description:
      "CSV, XLSX, transactional or pre-aggregated. Datuma figures out the schema, types, and what each column actually means.",
    icon: FileSpreadsheet,
  },
  {
    number: "02",
    title: "AI reads it like an analyst",
    description:
      "Claude looks at samples and statistics, identifies the domain, and picks the one business question your data can answer best.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Numbers, charts, calls-to-make",
    description:
      "You get headline metrics, three or four charts, and plain-English insights — anomalies, trends, things to investigate.",
    icon: LineChart,
  },
  {
    number: "04",
    title: "Built for non-technical readers",
    description:
      "No jargon, no axes left unlabelled. Every chart explains itself. Forward it to a CFO without rewriting anything.",
    icon: Eye,
  },
  {
    number: "05",
    title: "Combine spreadsheets in one brief",
    description:
      "Upload multiple files into a single dashboard. Datuma names them, treats each as a tab, and writes insights that compare across them when it matters.",
    icon: Layers,
  },
  {
    number: "06",
    title: "We catch the inconsistencies first",
    description:
      "Before any AI runs, Datuma flags blanks, duplicate rows, mixed-type columns, inconsistent date formats, and outliers — read-only, so your file stays untouched.",
    icon: ShieldCheck,
  },
];

function Features() {
  return (
    <section id="product" className="relative py-24 lg:py-32 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            What it does
          </span>
          <h2 className="text-4xl lg:text-6xl font-display tracking-tight">
            Everything an analyst does.
            <br />
            <span className="text-muted-foreground">In thirty seconds.</span>
          </h2>
        </div>

        <div>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.number}
                className="group flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-20 border-b border-foreground/10"
              >
                <div className="shrink-0">
                  <span className="font-mono text-xs tracking-widest text-muted-foreground">{f.number}</span>
                </div>
                <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-3xl lg:text-4xl font-display mb-4 group-hover:translate-x-2 transition-transform duration-500">
                      {f.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                      {f.description}
                    </p>
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <div className="w-48 h-40 border border-foreground/15 rounded-lg flex items-center justify-center bg-card/40 hover-lift">
                      <Icon className="w-16 h-16 text-foreground/70" strokeWidth={1} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "Step 01", title: "Upload your files", body: "Drag one or more CSV or Excel sheets into the workspace. Up to 1.2M rows per file. No mapping, no setup." },
    { n: "Step 02", title: "Datuma reads them", body: "We profile the columns, compute medians/distributions, sample rows, and brief our analyst model with everything it needs." },
    { n: "Step 03", title: "Data quality check", body: "Read-only pre-flight: blanks, duplicates, inconsistent date formats, mixed-type columns, outliers. You decide whether to proceed." },
    { n: "Step 04", title: "You get a dashboard", body: "Headline metrics, charts that answer the right question, and written insights you can forward — including cross-file comparisons when you upload more than one sheet." },
  ];

  return (
    <section id="how" className="relative py-24 lg:py-32 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-20">
          <span className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            How it works
          </span>
          <h2 className="text-4xl lg:text-6xl font-display tracking-tight max-w-3xl">
            Three steps. No template,
            <br />
            <span className="text-muted-foreground">no spreadsheet rituals.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10 border border-foreground/10 rounded-xl overflow-hidden">
          {steps.map((s) => (
            <div key={s.n} className="bg-background p-6 lg:p-8">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                {s.n}
              </span>
              <h3 className="font-display text-2xl lg:text-[1.75rem] mt-3 mb-4 leading-tight">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { icon: ShieldCheck, label: "Files never leave EU servers" },
    { icon: Gauge, label: "p50 dashboard in 28s" },
    { icon: Eye, label: "You own every byte" },
  ];

  return (
    <section className="relative py-24 lg:py-32 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-3 gap-12">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.label} className="flex items-start gap-4">
                <div className="p-3 border border-foreground/15 rounded-lg">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <p className="text-lg leading-relaxed pt-2">{it.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="relative border border-foreground rounded-2xl overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-25 pointer-events-none" />
          <div className="relative z-10 px-8 lg:px-16 py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
              <div className="flex-1">
                <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-6 leading-[0.95]">
                  Stop staring at spreadsheets.
                </h2>
                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Your first three dashboards are free. No credit card. No setup call.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-8 h-14 rounded-full group"
                >
                  Try Datuma free
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-full border border-foreground/20 hover:bg-foreground/5"
                >
                  See pricing
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-foreground/15" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-foreground/15" />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <MarketingNav />
      <Hero />
      <Showcase />
      <Features />
      <HowItWorks />
      <Trust />
      <Cta />
      <MarketingFooter />
    </main>
  );
}
