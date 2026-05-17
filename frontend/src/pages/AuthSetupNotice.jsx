import { Link } from "react-router-dom";
import { Settings, ArrowLeft } from "lucide-react";

export default function AuthSetupNotice() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full rounded-xl border border-border bg-card p-8 lg:p-10">
        <div className="p-3 inline-flex border border-border rounded-lg mb-5">
          <Settings className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-3xl tracking-tight mb-3">
          Auth isn't configured yet
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-3">
          To enable sign-in, set{" "}
          <code className="px-1.5 py-0.5 bg-accent rounded text-xs font-mono">
            REACT_APP_CLERK_PUBLISHABLE_KEY
          </code>{" "}
          in{" "}
          <code className="px-1.5 py-0.5 bg-accent rounded text-xs font-mono">
            frontend/.env
          </code>{" "}
          and{" "}
          <code className="px-1.5 py-0.5 bg-accent rounded text-xs font-mono">
            CLERK_SECRET_KEY
          </code>{" "}
          in{" "}
          <code className="px-1.5 py-0.5 bg-accent rounded text-xs font-mono">
            backend/.env
          </code>
          , then restart both dev servers.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Get keys at{" "}
          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:text-brand-hover underline underline-offset-4"
          >
            dashboard.clerk.com
          </a>
          .
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back home
        </Link>
      </div>
    </main>
  );
}
