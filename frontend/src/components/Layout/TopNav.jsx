import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronRight } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { isClerkConfigured } from "../../lib/auth";
import { clerkAppearance } from "../../lib/clerkAppearance";

const labels = {
  "/app": "New upload",
  "/app/dashboard": "Dashboard",
  "/app/history": "History",
  "/app/settings": "Settings",
};

export default function TopNav() {
  const { pathname } = useLocation();
  const label = labels[pathname] ?? pathname.replace("/app/", "");

  return (
    <nav className="px-4 sm:px-6 flex items-center justify-between bg-card border-b border-border h-full">
      <div className="hidden sm:flex items-center text-sm space-x-1 truncate max-w-[400px] pl-8 lg:pl-0">
        <Link to="/app" className="text-muted-foreground hover:text-foreground transition-colors">
          datuma
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
        <span className="text-foreground">{label}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <button
          type="button"
          className="p-2 hover:bg-accent rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
        {isClerkConfigured ? (
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              ...clerkAppearance,
              elements: {
                ...clerkAppearance.elements,
                avatarBox: "h-8 w-8",
              },
            }}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
            VZ
          </div>
        )}
      </div>
    </nav>
  );
}
