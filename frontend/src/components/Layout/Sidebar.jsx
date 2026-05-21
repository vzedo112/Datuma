import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { getUsage } from "../../services/api";
import {
  Home,
  Upload,
  BarChart3,
  History,
  Settings,
  HelpCircle,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Wordmark from "../Brand/Wordmark";
import { cn } from "../../lib/cn";

const COLLAPSED_KEY = "datuma-sidebar-collapsed";

function NavItem({ to, icon: Icon, children, onClick, end, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      title={collapsed ? children : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 text-sm rounded-md transition-colors",
          collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
          isActive
            ? "bg-brand text-brand-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [usage, setUsage] = useState(null);
  const close = () => setOpen(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      // Storage unavailable — no-op.
    }
  }, [collapsed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getUsage();
        if (!cancelled) setUsage(data);
      } catch {
        // Persistence not available — leave usage null so we render a graceful fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const used = usage?.used ?? null;
  const plan = usage?.plan ?? null;
  const planName = plan?.name ?? "Free plan";
  const planKey = plan?.key ?? "starter";
  const limit = plan?.monthlyIncluded ?? null;
  const showUpgrade = planKey === "starter" || planKey === "pro";
  const usageLabel =
    used === null
      ? limit
        ? `Up to ${limit} dashboards a month.`
        : "Unlimited dashboards."
      : limit === null
      ? `${used} dashboards this month.`
      : `${used} of ${limit} dashboards used this month.`;

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-card border border-border shadow-sm"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-64 bg-card border-r border-border transform transition-all duration-200 ease-in-out lg:translate-x-0 lg:static",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <div className="h-full flex flex-col">
          <div
            className={cn(
              "h-16 flex items-center border-b border-border",
              collapsed ? "px-2 justify-center" : "px-4 justify-between gap-2"
            )}
          >
            {!collapsed && (
              <Link to="/" className="flex items-center gap-2 min-w-0">
                <Wordmark className="text-foreground h-5 w-auto shrink-0" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden lg:inline-flex p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          <div
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden py-4",
              collapsed ? "px-2" : "px-4"
            )}
          >
            <div className="space-y-6">
              <div>
                {!collapsed && (
                  <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Workspace
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem to="/app" icon={Upload} onClick={close} end collapsed={collapsed}>
                    New upload
                  </NavItem>
                  <NavItem to="/app/dashboard" icon={BarChart3} onClick={close} collapsed={collapsed}>
                    Latest dashboard
                  </NavItem>
                  <NavItem to="/app/history" icon={History} onClick={close} collapsed={collapsed}>
                    History
                  </NavItem>
                </div>
              </div>

              <div>
                {!collapsed && (
                  <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Account
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem to="/app/settings" icon={Settings} onClick={close} collapsed={collapsed}>
                    Settings
                  </NavItem>
                  <NavItem to="/" icon={Home} onClick={close} collapsed={collapsed}>
                    Back to site
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "border-t border-border",
              collapsed ? "px-2 py-3" : "px-4 py-4"
            )}
          >
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <span
                  title={`${planName} · ${usageLabel}`}
                  className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center"
                >
                  {planName.slice(0, 3)}
                </span>
                {showUpgrade && (
                  <Link
                    to="/pricing"
                    onClick={close}
                    title="Upgrade"
                    className="text-[10px] font-medium bg-foreground text-background rounded-md px-2 py-1 hover:bg-foreground/90"
                  >
                    Pro
                  </Link>
                )}
                <a
                  href="mailto:hello@datuma.app"
                  title="Help — email hello@datuma.app"
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    {planName}
                  </p>
                  <p className="text-sm mb-3">{usageLabel}</p>
                  {showUpgrade && (
                    <Link
                      to="/pricing"
                      onClick={close}
                      className="block text-center text-xs font-medium bg-foreground text-background rounded-md py-2 hover:bg-foreground/90"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <a
                    href="mailto:hello@datuma.app"
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[65] lg:hidden"
          onClick={close}
        />
      )}
    </>
  );
}
