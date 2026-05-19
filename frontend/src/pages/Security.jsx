import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Server,
  Eye,
  Database,
  Mail,
} from "lucide-react";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";

const pillars = [
  {
    Icon: Server,
    title: "Where your data lives",
    body: "Application data is stored on EU-located managed Postgres. Authentication metadata is held by Clerk (EU + US). Payment data is held by Stripe under PCI DSS Level 1. Files you upload never leave our EU servers except for a 30-row representative sample and column-level statistics sent to the Anthropic Claude API to generate the dashboard.",
  },
  {
    Icon: Lock,
    title: "How it's protected",
    body: "All traffic is encrypted in transit with TLS. Data at rest is encrypted by our hosting provider. Authentication is handled by Clerk with industry-standard session management and rotating tokens. Payment details are tokenised by Stripe — Datuma never sees a card number.",
  },
  {
    Icon: Eye,
    title: "Who can see what",
    body: "Your dashboards are private by default and visible only to your account. You can mint a public share link for any dashboard; that link is the only way someone outside your account can view it, and you can revoke it at any time from the dashboard view.",
  },
  {
    Icon: Database,
    title: "Retention & deletion",
    body: "You can delete individual dashboards from your history at any time. Deleting your account purges your dashboards, account metadata, and usage records within 30 days, and from backups within 90 days. Server logs retain for 30 days.",
  },
  {
    Icon: ShieldCheck,
    title: "What we don't do",
    body: "We don't sell or share data. We don't run third-party advertising trackers. We don't use your uploaded files to train AI models — Anthropic's standard API policy is not to train on inputs, and we don't store your data anywhere outside the providers listed above.",
  },
];

const faqs = [
  {
    q: "Do you have SOC 2 or ISO 27001?",
    a: "Not yet. Datuma is in early-stage beta and a formal audit isn't on the runway today. If your organisation requires either to move forward, email us at hello@datuma.app — we'll be transparent about our timeline and what compensating controls are in place.",
  },
  {
    q: "Is Datuma GDPR-compliant?",
    a: "Datuma is operated from within the EU and processes data on EU-located infrastructure. Users have the right to access, correct, export, and delete their data — most of which is available in-app, and the rest by emailing hello@datuma.app. See the Privacy policy for the full detail.",
  },
  {
    q: "Can I get a Data Processing Agreement (DPA)?",
    a: "Yes. Email hello@datuma.app with a request and we'll send our standard DPA. We're happy to red-line reasonable changes.",
  },
  {
    q: "What data does Anthropic see?",
    a: "When you generate a dashboard, we send Anthropic's Claude API the column schema, pre-computed column statistics (counts, means, distributions), and a representative 30-row sample from your data — never the full file. The API call is processed under Anthropic's standard terms; they do not use API inputs to train models.",
  },
  {
    q: "How do you handle a security incident?",
    a: "If we discover a security incident affecting your data, we'll notify you within 72 hours of confirming it, with what we know about scope and mitigation. Our security contact is hello@datuma.app for both reports and questions.",
  },
  {
    q: "Can I report a vulnerability?",
    a: "Yes — please email hello@datuma.app with reproduction steps. We respond to security reports as a priority and won't take action against good-faith research that doesn't disrupt the service or other users.",
  },
];

export default function Security() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <MarketingNav />

      <section className="relative pt-40 pb-12 lg:pt-48 lg:pb-16">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
            Security & trust
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight mb-6 leading-[0.95]">
            How we treat
            <br />
            <span className="text-muted-foreground">your data.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            The short version: it's yours, it stays in the EU, it's never sold
            or shared, and you can delete it. The longer version is below.
          </p>
        </div>
      </section>

      <section className="relative pb-16 lg:pb-24">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 rounded-xl overflow-hidden">
            {pillars.map(({ Icon, title, body }) => (
              <div key={title} className="bg-background p-7 lg:p-8">
                <div className="inline-flex p-2.5 rounded-md border border-foreground/15 mb-5">
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <h2 className="font-display text-xl lg:text-2xl tracking-tight mb-3">
                  {title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 lg:py-24 border-t border-foreground/10">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
            Subprocessors
          </span>
          <h2 className="font-display text-3xl lg:text-4xl tracking-tight mb-8 leading-tight">
            Who processes your data, and why.
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-accent/40 text-foreground">
                <tr>
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-5 py-3">
                    Provider
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-5 py-3">
                    Purpose
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-5 py-3 hidden md:table-cell">
                    Region
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-5 py-4 font-medium">Anthropic</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    AI model that generates dashboard content from a 30-row
                    sample + column statistics.
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                    US
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium">Clerk</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    Authentication, account management, session tokens.
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                    EU + US
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium">Stripe</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    Subscriptions, billing, invoicing, payment processing.
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                    Global (PCI DSS L1)
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium">Hosting provider</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    Application servers and managed Postgres for dashboards
                    and account data.
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                    EU
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Each subprocessor handles data on Datuma's behalf under their own
            data processing terms. We don't share data with anyone outside
            this list.
          </p>
        </div>
      </section>

      <section className="relative py-16 lg:py-24 border-t border-foreground/10">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-12">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
                FAQ
              </span>
              <h2 className="font-display text-3xl lg:text-4xl tracking-tight leading-tight">
                Common security questions.
              </h2>
            </div>
            <div className="lg:col-span-2 space-y-px bg-foreground/10 rounded-xl overflow-hidden border border-foreground/10">
              {faqs.map((f) => (
                <details key={f.q} className="group bg-background">
                  <summary className="cursor-pointer list-none flex items-center justify-between p-6 hover:bg-accent/40 transition-colors">
                    <span className="font-medium pr-4">{f.q}</span>
                    <span className="text-2xl text-muted-foreground group-open:rotate-45 transition-transform shrink-0">
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed text-sm">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="rounded-2xl border border-foreground/15 p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="p-3 rounded-lg border border-foreground/15 shrink-0">
                <Mail className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-display text-2xl lg:text-3xl tracking-tight mb-2">
                  Security questions or vulnerability reports?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Email{" "}
                  <a
                    href="mailto:hello@datuma.app"
                    className="underline underline-offset-4 hover:text-brand text-foreground"
                  >
                    hello@datuma.app
                  </a>{" "}
                  — we respond to security messages as a priority.
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link
                to="/privacy"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-foreground/20 hover:bg-foreground/5 text-sm"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-foreground/20 hover:bg-foreground/5 text-sm"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
