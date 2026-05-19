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
      <div className="text-foreground/85 leading-relaxed max-w-prose space-y-4">
        {children}
      </div>
    </section>
  );
}

export default function Terms() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <MarketingNav />

      <section className="relative pt-40 pb-12 lg:pt-48 lg:pb-16">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-6">
            Terms
          </span>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-6 leading-[0.95]">
            Terms of service
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            The rules of using Datuma. Written in plain English; the headings
            are accurate, so feel free to skip to what's relevant. Last
            updated <strong>{LAST_UPDATED}</strong>.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-[900px] mx-auto px-6 lg:px-12">
          <Section eyebrow="01" title="Agreement">
            <p>
              By creating an account, uploading a file, or using any part of
              datuma.app (the "service"), you agree to these terms. If you're
              using Datuma on behalf of an organisation, you confirm you have
              authority to bind that organisation.
            </p>
            <p>
              "We," "us," and "Datuma" refer to the operator of datuma.app,
              currently run as a sole trader. "You" means the person or
              organisation using the service.
            </p>
          </Section>

          <Section eyebrow="02" title="What the service does">
            <p>
              Datuma reads spreadsheet files you upload and generates
              dashboards from them using AI. Output is provided as-is: it's a
              starting point for analysis, not a substitute for human review.
              Decisions you make based on Datuma-generated content are your
              responsibility.
            </p>
          </Section>

          <Section eyebrow="03" title="Your account">
            <p>
              You're responsible for keeping your account credentials secure
              and for everything that happens under your account. Notify us at{" "}
              <a href="mailto:hello@datuma.app" className="underline underline-offset-4 hover:text-brand">
                hello@datuma.app
              </a>{" "}
              if you suspect unauthorised access.
            </p>
            <p>
              One account per person. Sharing a single login across multiple
              people is not permitted on paid plans — that's what seats are
              for.
            </p>
          </Section>

          <Section eyebrow="04" title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Upload data you don't have the right to use, including data
                covered by a non-disclosure agreement you'd be breaking by
                doing so.
              </li>
              <li>
                Upload personal data of people who haven't consented to its
                processing, where consent is required by law.
              </li>
              <li>
                Use the service for any unlawful purpose, including
                discrimination, harassment, or processing of data obtained
                through illegal means.
              </li>
              <li>
                Attempt to circumvent rate limits, plan quotas, or billing
                mechanisms.
              </li>
              <li>
                Reverse-engineer the service, scrape it, or attempt to extract
                source code.
              </li>
              <li>
                Use the service to build a directly competing AI dashboarding
                product.
              </li>
            </ul>
            <p>
              We may suspend or terminate accounts that violate these rules.
            </p>
          </Section>

          <Section eyebrow="05" title="Plans, billing, and overage">
            <p>
              Datuma offers a free Starter plan and paid Pro / Team plans (and
              custom Enterprise terms on request). Each plan has monthly
              usage limits described on the{" "}
              <Link to="/pricing" className="underline underline-offset-4 hover:text-brand">
                pricing page
              </Link>{" "}
              and enforced in the app.
            </p>
            <p>
              Paid plans are billed monthly or annually in advance. If you
              exceed your plan's included dashboards, additional dashboards
              are billed at the published overage rate, capped at the monthly
              spend cap you configure in Settings (default €0 — meaning no
              overage, hard-block at the included limit).
            </p>
            <p>
              You can cancel anytime from the Stripe billing portal linked in
              Settings. Cancellation takes effect at the end of the current
              billing cycle; we don't issue partial refunds for the unused
              portion unless required by law.
            </p>
            <p>
              Prices may change with at least 30 days' notice. Existing paid
              subscriptions are honoured at their current rate until renewal.
            </p>
          </Section>

          <Section eyebrow="06" title="Your data, your ownership">
            <p>
              You own everything you upload to Datuma. Generated dashboards
              are derivative works of your data, and you own those too.
            </p>
            <p>
              You grant us a limited, non-exclusive licence to process your
              data only as needed to provide the service — generate
              dashboards, store them, show them back to you, and apply your
              chosen merge operations on updates. This licence ends when you
              delete the data.
            </p>
            <p>
              We will never sell, share, or train AI models on your data. See
              our{" "}
              <Link to="/privacy" className="underline underline-offset-4 hover:text-brand">
                Privacy policy
              </Link>{" "}
              for full detail.
            </p>
          </Section>

          <Section eyebrow="07" title="AI output: limitations">
            <p>
              Dashboard content is generated by an AI model (Anthropic's
              Claude). It can produce results that are wrong, incomplete, or
              misleading, especially when the underlying data has quality
              issues. We surface a data quality report before generating to
              help you spot the obvious problems, but you should always
              double-check headline numbers and insights against your source
              data before acting on them or sharing them externally.
            </p>
            <p>
              Datuma is not a regulated reporting tool, a substitute for an
              audited BI platform, or a system of record. Don't use it as
              such.
            </p>
          </Section>

          <Section eyebrow="08" title="Service availability">
            <p>
              We aim for high availability but don't promise it. The service
              is provided "as is" and "as available." We may schedule
              maintenance windows, ship breaking changes, or experience
              outages.
            </p>
            <p>
              If a sustained outage affects your paid plan, contact us and
              we'll credit your account proportionally at our discretion.
            </p>
          </Section>

          <Section eyebrow="09" title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, Datuma's total
              liability to you for any claim arising out of or related to the
              service is limited to the amount you paid us in the 12 months
              preceding the claim, or €100, whichever is greater.
            </p>
            <p>
              We are not liable for indirect, incidental, consequential, or
              punitive damages — including lost profits, lost data, or
              business interruption — even if we were advised of the
              possibility.
            </p>
            <p>
              Some jurisdictions don't allow these limitations, so they may
              not apply to you. Your statutory rights as a consumer are not
              affected.
            </p>
          </Section>

          <Section eyebrow="10" title="Termination">
            <p>
              You may close your account at any time from Settings, which
              triggers deletion as described in the Privacy policy.
            </p>
            <p>
              We may suspend or terminate your account if you materially
              breach these terms, fail to pay, or use the service in a way
              that puts other users or our infrastructure at risk. Where
              possible we'll give you notice and a chance to cure.
            </p>
          </Section>

          <Section eyebrow="11" title="Changes to these terms">
            <p>
              We may update these terms over time. Material changes are
              announced at least 14 days in advance by email and at the top
              of this page. Continuing to use the service after the change
              date means you accept the new terms.
            </p>
          </Section>

          <Section eyebrow="12" title="Governing law">
            <p>
              These terms are governed by the laws applicable at the place of
              our operation. Disputes will, where possible, be resolved
              through direct communication first; failing that, by the courts
              competent at our place of operation, without prejudice to your
              mandatory rights as a consumer in your country of residence.
            </p>
          </Section>

          <Section eyebrow="13" title="Contact">
            <p>
              For questions about these terms, write to{" "}
              <a
                href="mailto:hello@datuma.app"
                className="underline underline-offset-4 hover:text-brand"
              >
                hello@datuma.app
              </a>
              .
            </p>
          </Section>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
