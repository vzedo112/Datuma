import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";
import { cn } from "../lib/cn";

const plans = [
  {
    name: "Starter",
    description: "For one-off curiosity and side projects.",
    monthly: 0,
    annual: 0,
    cta: "Start free",
    href: "/app",
    features: [
      "3 dashboards per month",
      "Up to 50,000 rows per file",
      "CSV + Excel uploads",
      "PDF + PNG export",
    ],
  },
  {
    name: "Pro",
    description: "For analysts, founders, and freelancers.",
    monthly: 20,
    annual: 17,
    meter: "Includes 20 dashboards · €1.50 each after",
    cta: "Get started",
    href: "/app",
    popular: true,
    features: [
      "1 seat",
      "20 dashboards included each month",
      "€1.50 per additional dashboard",
      "Set a hard monthly spend cap",
      "Up to 1.2M rows per file",
      "Saved history & re-runs",
      "Email support, 1 business day",
    ],
  },
  {
    name: "Team",
    description: "For small teams sharing a workspace.",
    monthly: 99,
    annual: 83,
    meter: "Includes 100 dashboards · €1.00 each after",
    cta: "Get started",
    href: "/app",
    features: [
      "Up to 5 seats",
      "100 dashboards included each month",
      "€1.00 per additional dashboard",
      "Shared workspace + role permissions",
      "Custom branding on exports",
      "Up to 1.2M rows per file",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    description: "For finance ops, BI teams, and compliance-heavy orgs.",
    monthly: null,
    annual: null,
    cta: "Talk to sales",
    href: "#",
    features: [
      "Everything in Team",
      "Unlimited seats + dashboards",
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
  return (
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

          <Link
            to={p.href}
            className={cn(
              "w-full py-3.5 inline-flex items-center justify-center gap-2 text-sm font-medium transition-all group rounded-md",
              p.popular
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "border border-foreground/20 hover:border-foreground hover:bg-foreground/5"
            )}
          >
            {p.cta}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      ))}
    </div>
  );
}

const faqs = [
  {
    q: "How does the Pro overage work?",
    a: "Pro includes 20 dashboards each month. Beyond that, each additional dashboard is €1.50, billed at the end of the cycle. You can set a hard monthly spend cap — once you hit it, uploads pause until next month or until you raise it.",
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
    a: "Starter is capped at 50,000 rows per file. Pro and Enterprise handle up to 1.2 million rows. Files larger than 60 MB should be compressed or split first.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the dashboard in two clicks. Your account drops back to Starter at the end of the billing period.",
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
