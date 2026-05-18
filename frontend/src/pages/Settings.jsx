import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  User,
  Bell,
  AlertOctagon,
  ArrowUpRight,
  LogOut,
  Trash2,
  Mail,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { getUsage, openBillingPortal } from "../services/api";
import { isClerkConfigured } from "../lib/auth";
import ClerkAccountSection from "../components/Settings/ClerkAccountSection";

function Section({ icon: Icon, title, eyebrow, children, action }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="px-5 lg:px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-accent">
          <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="font-display text-xl tracking-tight">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-5 lg:p-6">{children}</div>
    </section>
  );
}

function Row({ label, value, action }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          {label}
        </p>
        <div className="text-sm truncate">{value}</div>
      </div>
      {action}
    </div>
  );
}

function Toggle({ label, description, defaultChecked = false }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-b-0 cursor-pointer">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <span className="relative inline-block w-10 h-6 shrink-0">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-foreground/15 peer-checked:bg-foreground transition-colors" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export default function Settings() {
  const [usage, setUsage] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getUsage();
        if (!cancelled) setUsage(data);
      } catch {
        // Persistence not available — leave null and the section renders defaults.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const plan = usage?.plan;
  const planName = plan?.name ?? "Starter";
  const planKey = plan?.key ?? "starter";
  const included = plan?.monthlyIncluded;
  const used = usage?.used ?? 0;
  const usageRatio =
    Number.isFinite(included) && included > 0
      ? Math.min(used / included, 1)
      : 0;
  const remainingLabel =
    !Number.isFinite(included) || included === null
      ? "Unlimited dashboards"
      : used >= included
      ? plan?.overageEuros
        ? `Over your monthly include — €${plan.overageEuros.toFixed(2)} per extra dashboard.`
        : "You've hit this month's limit. Upgrade to continue."
      : `${included - used} dashboard${included - used === 1 ? "" : "s"} left this month.`;

  const openPortal = async () => {
    try {
      setPortalLoading(true);
      setError(null);
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setPortalLoading(false);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Couldn't open the billing portal."
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
          Settings
        </span>
        <h1 className="font-display text-4xl lg:text-5xl tracking-tight">
          Your account
        </h1>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Section
          icon={CreditCard}
          eyebrow="Billing"
          title="Plan & usage"
          action={
            planKey === "starter" || planKey === "pro" ? (
              <Link
                to="/pricing"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 transition-colors"
              >
                Upgrade
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : null
          }
        >
          <Row
            label="Current plan"
            value={
              <span className="inline-flex items-center gap-2">
                <span className="font-medium">{planName}</span>
                {planKey === "starter" && (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-accent rounded">
                    Free
                  </span>
                )}
                {(planKey === "pro" || planKey === "team") && (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-brand text-brand-foreground rounded">
                    Active
                  </span>
                )}
              </span>
            }
          />
          <Row
            label="Dashboards used this month"
            value={
              Number.isFinite(included) && included !== null
                ? `${used} of ${included}`
                : `${used}`
            }
          />

          {Number.isFinite(included) && included > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="h-2 rounded-full bg-accent overflow-hidden">
                <div
                  className="h-full bg-brand transition-all"
                  style={{ width: `${usageRatio * 100}%` }}
                />
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-2">
                {remainingLabel}
              </p>
            </div>
          )}

          {(planKey === "pro" || planKey === "team") && (
            <div className="mt-5 pt-5 border-t border-border flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Manage subscription</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Change plan, update card, download invoices, or cancel — via Stripe.
                </p>
              </div>
              <button
                type="button"
                onClick={openPortal}
                disabled={portalLoading}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors disabled:opacity-60"
              >
                {portalLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
                Billing portal
              </button>
            </div>
          )}
        </Section>

        <Section icon={User} eyebrow="Profile" title="Who you are">
          {isClerkConfigured ? (
            <ClerkAccountSection />
          ) : (
            <p className="text-sm text-muted-foreground">
              Clerk is not configured in this environment, so profile details aren't
              available yet.
            </p>
          )}
        </Section>

        <Section icon={Bell} eyebrow="Notifications" title="Email me when">
          <Toggle
            label="A dashboard finishes generating"
            description="Useful for large files that take >30 seconds."
            defaultChecked
          />
          <Toggle
            label="My monthly usage hits 80%"
            description="So you can upgrade before hitting the overage rate."
            defaultChecked
          />
          <Toggle
            label="Datuma ships a new feature"
            description="Roughly once a month. We don't spam."
          />
        </Section>

        <Section icon={Mail} eyebrow="Support" title="Need a hand?">
          <p className="text-sm text-muted-foreground mb-4">
            Drop us a line and we'll get back within one business day.
          </p>
          <a
            href="mailto:hello@datuma.app"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            hello@datuma.app
          </a>
        </Section>

        <Section icon={AlertOctagon} eyebrow="Danger zone" title="Account actions">
          {isClerkConfigured ? (
            <ClerkDangerActions />
          ) : (
            <DangerFallback />
          )}
        </Section>
      </div>
    </div>
  );
}

// --- Danger zone (Clerk-aware) ---

function ClerkDangerActions() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleDelete = async () => {
    if (!user) return;
    if (
      !window.confirm(
        "Permanently delete your Datuma account? This removes all saved dashboards. This can't be undone."
      )
    )
      return;
    try {
      await user.delete();
      window.location.href = "/";
    } catch (err) {
      window.alert(err?.message || "Couldn't delete account.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
        <div className="min-w-0">
          <p className="text-sm font-medium">Sign out</p>
          <p className="text-xs text-muted-foreground mt-1">
            End this session on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut(() => (window.location.href = "/"))}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-rose-700">Delete account</p>
          <p className="text-xs text-muted-foreground mt-1">
            Permanently removes your dashboards, history, and billing record.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-rose-200 bg-rose-50 text-rose-800 text-sm hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </>
  );
}

function DangerFallback() {
  return (
    <p className="text-sm text-muted-foreground">
      Clerk isn't configured — sign-out and account deletion live behind it.
    </p>
  );
}
