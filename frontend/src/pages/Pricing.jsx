import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";
import { cn } from "../lib/cn";
import { startCheckout } from "../services/api";
import { isClerkConfigured } from "../lib/auth";

const plans = [
  {
    key: "starter",
    name: "Starter",
    description: "For one-off curiosity and side projects.",
    monthly: 0,
    annual: 0,
    cta: "Start free",
    href: "/app",
    features: [
      "3 dashboards per month",
      "Up to 50,000 rows per upload",
      "Up to 2 datasets per dashboard",
      "Data quality report on every upload",
      "Saved history & re-runs",
      "CSV + Excel uploads",
      "PDF + PNG export",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "For analysts, founders, and freelancers.",
    monthly: 20,
    annual: 17,
    meter: "Includes 20 dashboards · €1.50 each after",
    cta: "Get started",
    href: "/app",
    popular: true,
    features: [
      "Everything in Starter",
      "20 dashboards included each month",
      "€1.50 per additional dashboard",
      "Set a hard monthly spend cap",
      "Up to 1.2M rows per upload",
      "Up to 5 datasets per dashboard",
      "Email support, 1 business day",
    ],
  },
  {
    key: "team",
    name: "Team",
    description: "For small teams sharing a workspace.",
    monthly: 99,
    annual: 83,
    meter: "Includes 100 dashboards · €1.00 each after",
    cta: "Get started",
    href: "/app",
    comingSoon: true,
    features: [
      "Everything in Pro",
      "Up to 5 seats",
      "100 dashboards included each month",
      "€1.00 per additional dashboard",
      "Up to 10 datasets per dashboard",
      "Shared workspace + role permissions",
      "Custom branding on exports",
      "Priority email support",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "For finance ops, BI teams, and compliance-heavy orgs.",
    monthly: null,
    annual: null,
    cta: "Talk to sales",
    href: "mailto:hello@datuma.app",
    comingSoon: true,
    features: [
      "Everything in Team",
      "Unlimited seats, dashboards, and datasets",
      "EU/US data residency",
      "SSO + SCIM provisioning",
      "Audit logs · DPA · SOC 2",
      "Dedicated success manager",
    ],
  },
];

function Header() {
  return (
    <section className="relative pt-40 pb-16 lg:pt-48 lg:pb-20">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
          Pricing
        </span>
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight mb-6 leading-[0.95]">
          Simple, transparent
          <br />
          <span className="text-stroke">pricing</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Start free, upgrade when one of your dashboards saves a meeting. Cancel any time.
        </p>
      </div>
    </section>
  );
}

function Toggle({ annual, setAnnual }) {
  return (
    <div className="flex items-center gap-4 mb-12">
      <span className={cn("text-sm", !annual ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
      <button
        onClick={() => setAnnual(!annual)}
        className="relative w-14 h-7 bg-foreground/10 rounded-full p-1 hover:bg-foreground/20 transition-colors"
        aria-label="Toggle billing period"
      >
        <span
          className={cn(
            "block w-5 h-5 bg-foreground rounded-full transition-transform duration-300",
            annual ? "translate-x-7" : "translate-x-0"
          )}
        />
      </button>
      <span className={cn("text-sm", annual ? "text-foreground" : "text-muted-foreground")}>Annual</span>
      {annual && (
        <span className="ml-2 px-2 py-1 bg-foreground text-background text-xs font-mono">
          Save 17%
        </span>
      )}
    </div>
  );
}

function Plans({ annual }) {
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleCta = async (p) => {
    setError(null);

    // Coming-soon plans are non-interactive; button is rendered disabled.
    if (p.comingSoon) return;

    // Starter = just go to the app (sign-in flow handled by route gating).
    if (p.key === "starter") {
      navigate("/app");
      return;
    }
    // Enterprise = mailto.
    if (p.key === "enterprise") {
      window.location.href = p.href;
      return;
    }
    // Pro / Team — need to be signed in to checkout.
    if (!isClerkConfigured) {
      navigate("/app");
      return;
    }
    try {
      setLoadingKey(p.key);
      const { url } = await startCheckout({
        plan: p.key,
        interval: annual ? "annual" : "monthly",
      });
      window.location.href = url;
    } catch (err) {
      setLoadingKey(null);
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 401) {
        navigate("/sign-up");
        return;
      }
      setError(
        data?.error ||
          err?.message ||
          "Couldn't start checkout. Try again in a moment."
      );
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
          {error}
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10 border border-foreground/10 rounded-xl overflow-hidden">
      {plans.map((p, idx) => (
        <div
          key={p.name}
          className={cn(
            "relative p-8 lg:p-10 bg-background flex flex-col",
            p.popular && "md:-my-px md:py-12 lg:py-14 bg-card ring-2 ring-foreground ring-inset"
          )}
        >
          <div className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="font-mono text-xs text-muted-foreground">
                {String(idx + 1).padStart(2, "0")}
              </span>
              {p.popular && (
                <span className="px-2 py-0.5 bg-brand text-brand-foreground text-[10px] font-mono uppercase tracking-widest rounded">
                  Most Popular
                </span>
              )}
              {p.comingSoon && (
                <span className="px-2 py-0.5 bg-foreground/10 text-foreground text-[10px] font-mono uppercase tracking-widest rounded">
                  Coming Soon
                </span>
              )}
            </div>
            <h3 className="font-display text-3xl">{p.name}</h3>
            <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
          </div>

          <div className="mb-8 pb-8 border-b border-foreground/10">
            {p.monthly !== null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl lg:text-6xl">
                    €{annual ? p.annual : p.monthly}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {p.meter && (
                  <p className="mt-3 text-xs font-mono text-muted-foreground">
                    {p.meter}
                  </p>
                )}
              </>
            ) : (
              <span className="font-display text-4xl">Custom</span>
            )}
          </div>

          <ul className="space-y-3 mb-10 flex-1">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => handleCta(p)}
            disabled={loadingKey === p.key || p.comingSoon}
            className={cn(
              "w-full py-3.5 inline-flex items-center justify-center gap-2 text-sm font-medium transition-all group rounded-md",
              p.comingSoon
                ? "border border-foreground/10 bg-foreground/5 text-muted-foreground cursor-not-allowed"
                : p.popular
                ? "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-wait"
                : "border border-foreground/20 hover:border-foreground hover:bg-foreground/5 disabled:opacity-60 disabled:cursor-wait"
            )}
          >
            {p.comingSoon ? (
              "Coming soon"
            ) : loadingKey === p.key ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                {p.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      ))}
      </div>
    </>
  );
}

const faqs = [
  {
    q: "How does the Pro overage work?",
    a: "Pro includes 20 dashboards each month. Beyond that, each additional dashboard is €1.50, billed at the end of the cycle. You can set a hard monthly spend cap — once you hit it, uploads pause until next month or until you raise it.",
  },
  {
    q: "Can I upload multiple files at once?",
    a: "Yes. Datuma excels at blending multi-dataset files. You can drop multiple files into the analyzer and it will identify relationships across them.",
  },
  {
    q: "What file types can I upload?",
    a: "CSV (any delimiter), .xlsx, and .xls. We auto-detect the encoding and the first sheet of Excel files.",
  },
  {
    q: "Where does my data go?",
    a: "Files are processed in EU data centres and never sold or shared. Pro and Enterprise plans add retention controls so you can purge any upload on demand.",
  },
  {
    q: "Is there a row limit?",
    a: "Starter is capped at 50,000 rows per upload (across all files). Pro and Enterprise handle up to 1.2 million rows. Files larger than 60 MB should be compressed or split first.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the dashboard in two clicks. Your account drops back to Starter at the end of the billing period.",
  },
  {
    q: "Can I combine multiple spreadsheets in one dashboard?",
    a: "Yes. Drop several files into the same upload and Datuma treats each as a named dataset. Claude sees all schemas, sample rows, and stats together — so insights can compare across files when that's what matters. File caps by plan: Starter 2, Pro 5, Team 10, Enterprise 20.",
  },
  {
    q: "What does the data quality check do?",
    a: "Before Claude sees your data, Datuma runs a read-only pre-flight: missing values per column, duplicate rows, inconsistent date formats, columns with mixed data types, and outliers more than 3 standard deviations from the mean. You see a report, then decide whether to proceed or go fix your file. We never modify your data.",
  },
];

function FAQ() {
  return (
    <section className="relative py-24 lg:py-32 border-t border-foreground/10">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
              FAQ
            </span>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight">
              Common questions.
            </h2>
          </div>
          <div className="lg:col-span-2 space-y-px bg-foreground/10 rounded-xl overflow-hidden border border-foreground/10">
            {faqs.map((f) => (
              <details key={f.q} className="group bg-background">
                <summary className="cursor-pointer list-none flex items-center justify-between p-6 hover:bg-accent/50 transition-colors">
                  <span className="font-medium">{f.q}</span>
                  <span className="text-2xl text-muted-foreground group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <MarketingNav />
      <Header />
      <section className="pb-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <Toggle annual={annual} setAnnual={setAnnual} />
          <Plans annual={annual} />
          <p className="mt-10 text-center text-sm text-muted-foreground">
            All plans include automatic updates, HTTPS, and GDPR-compliant storage.
          </p>
        </div>
      </section>
      <FAQ />
      <MarketingFooter />
    </main>
  );
}
