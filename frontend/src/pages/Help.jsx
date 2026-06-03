import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Rocket,
  CreditCard,
  ShieldCheck,
  Database,
  MessageSquare,
  Download,
  User,
  Mail,
  ArrowRight,
} from "lucide-react";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";

const CATEGORIES = [
  {
    key: "getting-started",
    icon: Rocket,
    title: "Getting started",
    blurb: "Your first upload to your first dashboard.",
    questions: [
      {
        q: "What file formats does Datuma accept?",
        a: "CSV (any delimiter — comma, semicolon, tab), .xlsx, and .xls. We auto-detect encoding and read the first sheet of Excel files. If you need additional sheets, save each as its own file or paste-into-one for now.",
      },
      {
        q: "How long does a dashboard take?",
        a: "Typically 25–35 seconds. The biggest variable is file size — anything under 100k rows is fast. Bigger files (up to the 1.2M-row plan limit) can take ~60 seconds because Claude takes longer to analyse the schema and stats.",
      },
      {
        q: "Do I need to clean my data first?",
        a: "No. Datuma flags data-quality issues (missing values, inconsistent casing, outliers) in the insights section instead of refusing to chart them. Clean data still produces better results — but raw exports work.",
      },
      {
        q: "Can I upload multiple files at once?",
        a: "Yes. Datuma reads them as related sources and produces ONE coherent brief that ties them together. Useful for e.g. orders + inventory, or two years of the same metric. The number of files per upload depends on your plan: 2 for Starter, 5 for Pro, 10 for Team, 20 for Enterprise.",
      },
      {
        q: "What's the row limit per file?",
        a: "50,000 on Starter; 1,200,000 on Pro, Team, and Enterprise. Files larger than 60 MB should be split or compressed before upload.",
      },
    ],
  },
  {
    key: "billing",
    icon: CreditCard,
    title: "Billing & plans",
    blurb: "Pricing, overage, refunds, cancelling.",
    questions: [
      {
        q: "How does Pro overage work?",
        a: "Pro includes 20 dashboards a month. Past that, every additional dashboard is €1.50 — added to your next invoice automatically. You can set a hard monthly spend cap in Settings so the meter stops when you hit your number.",
      },
      {
        q: "Where do I change my plan or cancel?",
        a: "Settings → Plan & usage → Billing portal. That opens the Stripe-hosted portal where you can upgrade, downgrade, update card, download invoices, or cancel. Cancellations take effect at the end of the billing cycle — you keep access until then.",
      },
      {
        q: "Do you offer refunds?",
        a: "If your dashboard didn't generate (an actual failure, not just a result you didn't like), email hello@datuma.app within 7 days and we'll credit it back. Otherwise we don't refund used subscription time.",
      },
      {
        q: "Can I get an invoice or VAT receipt?",
        a: "Yes. Every payment generates a Stripe invoice with your company name and VAT details. Download them from the billing portal.",
      },
      {
        q: "When are Team and Enterprise available?",
        a: "Team (multi-seat workspaces) is coming next. Enterprise (SSO, audit logs, DPA, custom contracts) is available on request — email hello@datuma.app and we'll set up a call.",
      },
    ],
  },
  {
    key: "data-privacy",
    icon: ShieldCheck,
    title: "Data & privacy",
    blurb: "Where your files go and who can see them.",
    questions: [
      {
        q: "Where is my data stored?",
        a: "Files are processed in EU data centres. Your raw rows are stored only long enough to generate the dashboard, then a representative sample is kept so chat answers can cite real numbers. Full row retention controls are coming on Pro and Enterprise plans.",
      },
      {
        q: "Does Datuma train models on my data?",
        a: "No. Your data is not used to train Claude or any other model. It's used only to produce your specific dashboard and to power the chat panel for that dashboard.",
      },
      {
        q: "Can I delete a dashboard?",
        a: "Yes. In History, click the three-dot menu on any row → Delete. This removes the dashboard, all its data, and the chat thread permanently.",
      },
      {
        q: "Can I share a dashboard with someone who doesn't have an account?",
        a: "Yes. From the dashboard, click Share → Create link. You'll get a public URL anyone can open without signing in. Revoke the link any time and it stops working immediately.",
      },
      {
        q: "Are you GDPR / SOC 2 compliant?",
        a: "Datuma processes data in line with GDPR principles. SOC 2 attestation is on the Enterprise roadmap; if you need it before purchasing, email hello@datuma.app.",
      },
    ],
  },
  {
    key: "connectors",
    icon: Database,
    title: "Connectors",
    blurb: "Getting data in from somewhere other than your laptop.",
    questions: [
      {
        q: "Can I connect to Google Drive / OneDrive / Dropbox?",
        a: "Not yet — they're on the Upload page under \"Connect a source.\" Click \"I want this\" on the ones you'd use and we'll build the most-requested first.",
      },
      {
        q: "What about Snowflake / Databricks / BigQuery?",
        a: "Also on the roadmap, same demand-signal approach. Click them on the Upload page to tell us. Enterprise customers can get a manual connector built as part of onboarding — email hello@datuma.app.",
      },
      {
        q: "Is there an API?",
        a: "A public API is coming after the connector wave. If you have a specific use case that needs API access now (e.g. embedding Datuma in your own product), email hello@datuma.app and we can give you early access.",
      },
    ],
  },
  {
    key: "chat",
    icon: MessageSquare,
    title: "Chat with your data",
    blurb: "Asking follow-up questions about a dashboard.",
    questions: [
      {
        q: "Who can use chat?",
        a: "Pro, Team, and Enterprise users. The Starter plan shows a locked preview with an upgrade prompt.",
      },
      {
        q: "How many messages can I send?",
        a: "Pro includes 200 chat messages a month, Team includes 1000, Enterprise is unlimited. Past your included quota, Pro is €0.05 per message and Team is €0.03 — subject to the same spend cap as dashboard overage.",
      },
      {
        q: "What can I actually ask?",
        a: "Anything about the data in this specific dashboard. Examples: \"Why is margin slipping in August?\" \"Who are the top 3 customers by revenue?\" \"Summarise this for a CFO in two sentences.\" Datuma will cite the actual numbers from your dataset.",
      },
      {
        q: "Does Datuma have access to other dashboards in chat?",
        a: "No. Each chat thread is scoped to the single dashboard it's attached to. We don't pull from your history or other files when answering.",
      },
    ],
  },
  {
    key: "exports",
    icon: Download,
    title: "Exports & sharing",
    blurb: "Getting the brief out of Datuma.",
    questions: [
      {
        q: "What export formats are supported?",
        a: "PDF (multi-page A4, vector-quality), PNG (full-resolution screenshot), CSV (chart data and metrics with column headers), JSON (raw dashboard structure for archival).",
      },
      {
        q: "Can I edit the dashboard before exporting?",
        a: "Renaming the dashboard works. Editing individual charts or insights doesn't yet — re-running with cleaner data is the current workflow. Inline editing is a likely Q3 feature.",
      },
      {
        q: "Why does my PDF look different from the screen?",
        a: "Exports capture the dashboard at higher resolution than your screen renders at, so it'll look sharper but the proportions stay the same. The chat panel and any update banners are intentionally excluded from exports.",
      },
    ],
  },
  {
    key: "account",
    icon: User,
    title: "Account & sign-in",
    blurb: "Email, password, deletion.",
    questions: [
      {
        q: "How do I change my email or password?",
        a: "Click your avatar (top right) → Manage account. That opens the Clerk-powered account modal where you can update any profile detail or change password.",
      },
      {
        q: "Can I sign in with Google or GitHub?",
        a: "Yes. Both are available on the sign-in and sign-up pages.",
      },
      {
        q: "How do I delete my account?",
        a: "Settings → Danger zone → Delete account. This permanently removes your dashboards, history, billing record, and personal details. It cannot be undone.",
      },
      {
        q: "What happens to my data if I cancel?",
        a: "Your account drops back to Starter at the end of the billing cycle — dashboards stay accessible but you're limited to 3 new ones a month. If you want everything deleted, follow the Delete account flow above.",
      },
    ],
  },
];

function flattenQuestions(categories) {
  const out = [];
  for (const cat of categories) {
    for (const q of cat.questions) {
      out.push({ ...q, categoryKey: cat.key, categoryTitle: cat.title });
    }
  }
  return out;
}

function fuzzy(haystack, needle) {
  if (!needle) return true;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return true;
  // Match any of the search words appearing somewhere — keeps a single
  // typo from killing the whole query without needing a real fuzzy lib.
  return n.split(/\s+/).every((token) => h.includes(token));
}

export default function Help() {
  const [query, setQuery] = useState("");

  const flat = useMemo(() => flattenQuestions(CATEGORIES), []);
  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    return flat.filter((q) => fuzzy(`${q.q} ${q.a} ${q.categoryTitle}`, query));
  }, [flat, query]);

  return (
    <main className="relative min-h-screen overflow-x-hidden flex flex-col">
      <MarketingNav />

      <section className="relative pt-36 pb-12 lg:pt-44">
        <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none" />
        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-4">
            Help center
          </span>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-4 leading-[0.95]">
            Answers to the questions
            <br />
            <span className="text-muted-foreground">most people ask first.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
            Browse by category below, or search for whatever you're stuck on. Still no
            answer? Email{" "}
            <a
              href="mailto:hello@datuma.app"
              className="text-brand hover:text-brand-hover underline underline-offset-4"
            >
              hello@datuma.app
            </a>{" "}
            and a human will reply within one business day.
          </p>

          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the help center…"
              className="w-full bg-card border border-border rounded-full pl-11 pr-4 h-12 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
        </div>
      </section>

      <section className="relative pb-24 flex-1">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          {filtered ? (
            <SearchResults items={filtered} query={query} onClear={() => setQuery("")} />
          ) : (
            <CategoryGrid />
          )}
        </div>
      </section>

      <ContactCta />

      <MarketingFooter />
    </main>
  );
}

function CategoryGrid() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="space-y-10 lg:space-y-14">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <section key={cat.key} id={cat.key}>
            <header className="mb-5 flex items-start gap-4">
              <div className="p-2 rounded-lg border border-border bg-card shrink-0">
                <Icon className="w-4 h-4" strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="font-display text-2xl lg:text-3xl tracking-tight">
                  {cat.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{cat.blurb}</p>
              </div>
            </header>

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {cat.questions.map((q, i) => {
                const id = `${cat.key}-${i}`;
                const open = openId === id;
                return (
                  <FaqItem
                    key={id}
                    question={q.q}
                    answer={q.a}
                    open={open}
                    onToggle={() => setOpenId(open ? null : id)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SearchResults({ items, query, onClear }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} result{items.length === 1 ? "" : "s"} for "
          <span className="text-foreground">{query}</span>"
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/20 bg-card/40 p-10 text-center">
          <p className="font-display text-2xl tracking-tight mb-2">
            Nothing matches that.
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
            Try a shorter or different phrase, or just email us.
          </p>
          <a
            href="mailto:hello@datuma.app"
            className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-5 h-10 rounded-full text-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            hello@datuma.app
          </a>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {items.map((q, i) => {
            const id = `${q.categoryKey}-${i}`;
            const open = openId === id;
            return (
              <FaqItem
                key={id}
                question={q.q}
                answer={q.a}
                categoryTitle={q.categoryTitle}
                open={open}
                onToggle={() => setOpenId(open ? null : id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FaqItem({ question, answer, categoryTitle, open, onToggle }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 lg:px-6 py-4 text-left hover:bg-accent/40 transition-colors"
        aria-expanded={open}
      >
        <span>
          {categoryTitle && (
            <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {categoryTitle}
            </span>
          )}
          <span className="font-medium">{question}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 lg:px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

function ContactCta() {
  return (
    <section className="relative py-20 border-t border-foreground/10">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div className="rounded-2xl border border-foreground bg-card overflow-hidden relative">
          <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none" />
          <div className="relative px-8 lg:px-12 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
                Still stuck?
              </span>
              <h2 className="font-display text-3xl lg:text-4xl tracking-tight mb-3">
                Email us.
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                A human (usually the founder) reads every message and replies within one
                business day.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <a
                href="mailto:hello@datuma.app"
                className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-12 rounded-full text-sm font-medium group"
              >
                <Mail className="w-4 h-4" />
                hello@datuma.app
              </a>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-foreground/20 hover:bg-foreground/5 text-sm group"
              >
                See pricing
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
