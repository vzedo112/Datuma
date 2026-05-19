import { Link } from "react-router-dom";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";

const LAST_UPDATED = "19 May 2026";

function Section({ eyebrow, title, children }) {
  return (
    <section className="py-10 border-b border-foreground/10 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
        {eyebrow}
      </span>
      <h2 className="font-display text-2xl lg:text-3xl tracking-tight mb-5">
        {title}
      </h2>
      <div className="prose-style text-foreground/85 leading-relaxed max-w-prose space-y-4">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <MarketingNav />

      <section className="relative pt-40 pb-12 lg:pt-48 lg:pb-16">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
            Privacy
          </span>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-6 leading-[0.95]">
            Privacy policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Plain-English summary of what data Datuma collects, how it's used,
            who it's shared with, and what control you have over it. Last
            updated <strong>{LAST_UPDATED}</strong>.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <Section eyebrow="01" title="What this is">
            <p>
              Datuma is an AI-powered analytics service. You upload spreadsheet
              files and we generate dashboards from them. This policy explains
              how we handle the information you give us in the course of doing
              that.
            </p>
            <p>
              "We," "us," and "Datuma" refer to the operator of datuma.app,
              currently run as a sole trader. "You" means the person or
              organisation using the service.
            </p>
          </Section>

          <Section eyebrow="02" title="What we collect">
            <p>
              <strong>Account information.</strong> Name and email address,
              provided by you when you sign up via our authentication provider
              (Clerk). We don't store your password — Clerk does.
            </p>
            <p>
              <strong>Billing information.</strong> If you subscribe to a paid
              plan, our payment provider (Stripe) collects and stores your
              payment details. We never see your card number. We do see the
              billing email, country, and last four digits of the card so we
              can support your account.
            </p>
            <p>
              <strong>File contents.</strong> When you upload a CSV or Excel
              file, the rows are parsed in memory on our servers, profiled for
              statistics, and sent in part (a representative 30-row sample plus
              column-level statistics) to Anthropic's Claude API to generate
              your dashboard. The full row set is then aggregated into chart
              data and stored alongside the generated dashboard so future
              updates can append against it.
            </p>
            <p>
              <strong>Dashboards.</strong> Generated dashboards (title, charts,
              metrics, insights, dataset metadata, and the underlying row data
              up to 25,000 rows per dataset) are stored on your account so you
              can revisit and update them.
            </p>
            <p>
              <strong>Operational data.</strong> Standard server logs
              (timestamps, IP addresses, user-agent strings) for security and
              debugging. Plan and usage counts so we can enforce quotas and
              bill overage correctly.
            </p>
          </Section>

          <Section eyebrow="03" title="What we DON'T do">
            <p>
              We don't sell your data. We don't share your uploaded files with
              other Datuma users. We don't train AI models on your data — the
              Claude API is used in inference mode only, and Anthropic's
              standard policy is not to use API inputs for training.
            </p>
            <p>
              We don't run analytics trackers that follow you around the
              internet. We don't use cookies for ad targeting.
            </p>
          </Section>

          <Section eyebrow="04" title="Where your data lives">
            <p>
              Your files, dashboards, and account data are stored on
              EU-located infrastructure. Specifically: application data in
              managed Postgres hosted in the European Union; authentication
              metadata at Clerk (whose servers are in the EU and US — see
              their policy); billing data at Stripe (international, but PCI
              compliant).
            </p>
            <p>
              When we call the Anthropic Claude API to generate a dashboard,
              the request travels to Anthropic's API endpoints. We pass only
              the representative sample and statistics, not your full file. The
              API call may be processed outside the EU.
            </p>
          </Section>

          <Section eyebrow="05" title="Who we share with">
            <p>
              Datuma uses a small, deliberate set of third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Clerk</strong> — handles sign-in, authentication, and
                account management.
              </li>
              <li>
                <strong>Stripe</strong> — handles subscriptions, payment
                processing, and invoicing.
              </li>
              <li>
                <strong>Anthropic (Claude)</strong> — the AI model that reads
                your data sample and writes your dashboard.
              </li>
              <li>
                <strong>Our hosting provider</strong> — provides compute and
                database infrastructure in the EU.
              </li>
            </ul>
            <p>
              Each of these processes data on our behalf under their own data
              processing agreements. We don't sell or share data with any
              party not listed above.
            </p>
          </Section>

          <Section eyebrow="06" title="How long we keep it">
            <p>
              Account and dashboard data is retained for as long as your
              account is active. You can delete individual dashboards at any
              time from your history. Deleting your account permanently
              removes your dashboards, usage records, and account metadata
              within 30 days; backups are purged within 90 days.
            </p>
            <p>
              Server logs are retained for 30 days and then deleted unless
              they're part of an active security investigation.
            </p>
          </Section>

          <Section eyebrow="07" title="Your rights (GDPR + general)">
            <p>
              You have the right to access your data, correct it, export it,
              and request its deletion. Most of this is available directly in
              the app — view your dashboards, edit your account, delete what
              you want, or click "Delete account" in Settings to nuke
              everything.
            </p>
            <p>
              For anything you can't do yourself — a Data Processing Agreement
              for your company, a formal data export, a deletion request that
              spans systems — email{" "}
              <a
                href="mailto:hello@datuma.app"
                className="underline underline-offset-4 hover:text-brand"
              >
                hello@datuma.app
              </a>{" "}
              and we'll respond within 30 days.
            </p>
          </Section>

          <Section eyebrow="08" title="Security">
            <p>
              All traffic to Datuma is encrypted in transit (HTTPS/TLS).
              Stored data is encrypted at rest by our hosting provider.
              Authentication is handled by Clerk with industry-standard
              session management. Payment data never touches our servers —
              it's tokenised by Stripe.
            </p>
            <p>
              We're a small team and we don't have SOC 2 or ISO 27001 today.
              If your organisation requires those, talk to us about your
              timeline and we'll be transparent about where we are.
            </p>
          </Section>

          <Section eyebrow="09" title="Children">
            <p>
              Datuma isn't intended for users under 18. If we discover we've
              collected data from a minor, we'll delete it.
            </p>
          </Section>

          <Section eyebrow="10" title="Changes to this policy">
            <p>
              When we change this policy materially, we'll update the "last
              updated" date at the top and notify active users by email at
              least 14 days before the change takes effect.
            </p>
          </Section>

          <Section eyebrow="11" title="Contact">
            <p>
              Questions, requests, or concerns about how Datuma handles your
              data:{" "}
              <a
                href="mailto:hello@datuma.app"
                className="underline underline-offset-4 hover:text-brand"
              >
                hello@datuma.app
              </a>
              .
            </p>
            <p>
              See also our{" "}
              <Link to="/terms" className="underline underline-offset-4 hover:text-brand">
                Terms of Service
              </Link>{" "}
              and our{" "}
              <Link to="/security" className="underline underline-offset-4 hover:text-brand">
                Security overview
              </Link>
              .
            </p>
          </Section>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
