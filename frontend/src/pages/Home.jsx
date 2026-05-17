import { useEffect, useState } from "react";
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
} from "lucide-react";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";

const verbs = ["briefed", "decoded", "explained", "answered"];

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
          <span className="block">Spreadsheets,</span>
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
              <span className="absolute -bottom-2 left-0 right-0 h-3 bg-foreground/10" />
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
            Drop a CSV or Excel file. Datuma reads it like a senior analyst would
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
            <a
              href="#how"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-full text-base border border-foreground/20 hover:bg-foreground/5"
            >
              See it work
            </a>
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
                { value: "30 sec", label: "to first insight", company: "AVERAGE" },
                { value: "1.2M", label: "rows per upload", company: "MAX FILE" },
                { value: "0", label: "SQL written", company: "EVER" },
                { value: "94%", label: "of users skip Excel", company: "AFTER 1 WK" },
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
            Everything a junior analyst does.
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
    { n: "Step 01", title: "Upload your file", body: "Drag a CSV or Excel sheet into the workspace. Up to 1.2M rows. No mapping, no setup." },
    { n: "Step 02", title: "Datuma reads it", body: "We profile the columns, compute medians/distributions, sample rows, and brief our analyst model with everything it needs." },
    { n: "Step 03", title: "You get a dashboard", body: "Headline metrics, charts that answer the right question, and written insights you can forward." },
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

        <div className="grid md:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 rounded-xl overflow-hidden">
          {steps.map((s) => (
            <div key={s.n} className="bg-background p-8 lg:p-10">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                {s.n}
              </span>
              <h3 className="font-display text-2xl lg:text-3xl mt-3 mb-4">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
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
      <Features />
      <HowItWorks />
      <Trust />
      <Cta />
      <MarketingFooter />
    </main>
  );
}
