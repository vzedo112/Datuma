import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Home,
  Upload,
  BarChart3,
  History,
  Settings,
  HelpCircle,
  Menu,
  Database,
} from "lucide-react";
import { cn } from "../../lib/cn";

function NavItem({ to, icon: Icon, children, onClick, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
          isActive
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-card border border-border shadow-sm"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <Menu className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:w-64",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <Link
            to="/"
            className="h-16 px-6 flex items-center border-b border-border"
          >
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-foreground" />
              <span className="text-xl font-display tracking-tight">Datuma</span>
              <span className="text-[10px] text-muted-foreground font-mono mt-1">™</span>
            </div>
          </Link>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              <div>
                <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Workspace
                </div>
                <div className="space-y-1">
                  <NavItem to="/app" icon={Upload} onClick={close} end>
                    New upload
                  </NavItem>
                  <NavItem to="/app/dashboard" icon={BarChart3} onClick={close}>
                    Latest dashboard
                  </NavItem>
                  <NavItem to="/app/history" icon={History} onClick={close}>
                    History
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Account
                </div>
                <div className="space-y-1">
                  <NavItem to="/app/settings" icon={Settings} onClick={close}>
                    Settings
                  </NavItem>
                  <NavItem to="/" icon={Home} onClick={close}>
                    Back to site
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-border">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Free plan
              </p>
              <p className="text-sm mb-3">
                2 of 5 dashboards used this month.
              </p>
              <Link
                to="/pricing"
                onClick={close}
                className="block text-center text-xs font-medium bg-foreground text-background rounded-md py-2 hover:bg-foreground/90"
              >
                Upgrade
              </Link>
            </div>
            <div className="mt-3 space-y-1">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </button>
            </div>
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
