import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, Eye } from "lucide-react";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";

const principles = [
  {
    Icon: Eye,
    title: "Transparency over magic",
    body: "Every chart explains itself. Every transformation is reversible. We never silently mutate your data — if we detect an overlap, a duplicate, or a schema drift, we surface it before doing anything about it.",
  },
  {
    Icon: ShieldCheck,
    title: "Read-only by default",
    body: "Datuma reads your files; it never writes to them. When you update an existing dashboard, original revisions stay in your history forever. There's always a way back.",
  },
  {
    Icon: Sparkles,
    title: "Briefings, not dumps",
    body: "A senior analyst doesn't hand you 40 charts. They pick the one question worth answering and show their work. We try to do the same — fewer outputs, sharper signal.",
  },
];

export default function About() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <MarketingNav />

      <section className="relative pt-40 pb-16 lg:pt-48 lg:pb-24">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
            About
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight mb-8 leading-[0.95]">
            Built for the people
            <br />
            <span className="text-muted-foreground">drowning in exports.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Most companies don't have a BI team. They have a finance manager
            with a folder full of CSVs and a 2pm meeting. Datuma exists for
            them.
          </p>
        </div>
      </section>

      <section className="relative py-20 border-t border-foreground/10">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-4">
                The problem
              </span>
              <h2 className="font-display text-3xl lg:text-4xl tracking-tight mb-6 leading-tight">
                Operational data is messy.
              </h2>
              <div className="space-y-4 text-foreground/85 leading-relaxed max-w-prose">
                <p>
                  Real business data doesn't arrive as clean snapshots. It
                  arrives as weekly exports, incremental dumps, partial
                  refreshes, and "the same report but with three new
                  columns." Spreadsheets pile up. Numbers contradict each
                  other. A meeting starts in twenty minutes.
                </p>
                <p>
                  Existing BI tools assume you have a data team to model the
                  warehouse, a budget for licensing, and three weeks to
                  configure a dashboard. Most companies have none of those.
                </p>
              </div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-4">
                The bet
              </span>
              <h2 className="font-display text-3xl lg:text-4xl tracking-tight mb-6 leading-tight">
                An analyst, on tap.
              </h2>
              <div className="space-y-4 text-foreground/85 leading-relaxed max-w-prose">
                <p>
                  A senior analyst can take a single CSV, sniff out the
                  domain in thirty seconds, and tell you the one question
                  worth asking of it. That skill is now cheap and instant.
                </p>
                <p>
                  Datuma packages that skill. Drop a file — or several — and
                  you get a one-page brief: headline metrics, the charts
                  that answer the right question, and plain-English
                  insights you can forward without rewriting. No SQL, no
                  setup, no mapping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 border-t border-foreground/10">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
            Principles
          </span>
          <h2 className="font-display text-3xl lg:text-5xl tracking-tight mb-16 leading-tight max-w-3xl">
            What we won't compromise on.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 rounded-xl overflow-hidden">
            {principles.map(({ Icon, title, body }) => (
              <div key={title} className="bg-background p-8 lg:p-10">
                <div className="inline-flex p-3 rounded-lg border border-foreground/15 mb-6">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl tracking-tight mb-4">
                  {title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 border-t border-foreground/10">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-4">
                Where we are
              </span>
              <h2 className="font-display text-3xl lg:text-4xl tracking-tight leading-tight">
                Beta, on purpose.
              </h2>
            </div>
            <div className="lg:col-span-2">
              <div className="space-y-4 text-foreground/85 leading-relaxed max-w-prose">
                <p>
                  Datuma is in invite-only beta. We're working with a small
                  group of operators across finance, ops, and pharma to make
                  sure the product holds up against real, messy, recurring
                  data — not the clean demo CSVs that BI tools pretend
                  exist.
                </p>
                <p>
                  Want to be one of those testers? Email{" "}
                  <a
                    href="mailto:hello@datuma.app"
                    className="underline underline-offset-4 hover:text-brand"
                  >
                    hello@datuma.app
                  </a>{" "}
                  with a sentence on what you'd use it for.
                </p>
                <p>
                  Once the beta closes, we'll open up at the prices on the{" "}
                  <Link
                    to="/pricing"
                    className="underline underline-offset-4 hover:text-brand"
                  >
                    pricing page
                  </Link>
                  . No surprise rollovers — beta accounts get clean upgrade
                  paths.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="relative border border-foreground rounded-2xl overflow-hidden">
            <div className="absolute inset-0 grid-lines opacity-25 pointer-events-none" />
            <div className="relative z-10 px-8 lg:px-16 py-14 lg:py-20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="flex-1">
                <h2 className="font-display text-3xl lg:text-5xl tracking-tight mb-4 leading-[0.95]">
                  Try it on your own messy data.
                </h2>
                <p className="text-muted-foreground max-w-lg leading-relaxed">
                  Three dashboards on the house, no card needed.
                </p>
              </div>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-8 h-14 rounded-full group whitespace-nowrap"
              >
                Upload your first file
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
