import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import MarketingNav from "../components/Layout/MarketingNav";
import MarketingFooter from "../components/Layout/MarketingFooter";
import { clerkAppearance } from "../lib/clerkAppearance";

export default function SignUpPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return (
    <main className="relative min-h-screen overflow-x-hidden flex flex-col">
      <MarketingNav />

      <section className="relative flex-1 flex flex-col items-center justify-center px-6 pt-36 pb-24">
        <div className="absolute inset-0 grid-lines opacity-30 pointer-events-none" />
        <div className="absolute right-[-15%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] rounded-full bg-gradient-to-br from-foreground/5 via-foreground/0 to-foreground/10 blur-3xl pointer-events-none" />

        <div
          className={`relative z-10 w-full max-w-md transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span className="w-8 h-px bg-foreground/30" />
              Free to start
              <span className="w-8 h-px bg-foreground/30" />
            </span>
          </div>

          <h1
            className={`font-display text-4xl lg:text-5xl tracking-tight text-center mb-2 transition-all duration-1000 delay-150 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            Create your account
          </h1>
          <p
            className={`text-muted-foreground text-center max-w-xs mx-auto mb-10 transition-all duration-1000 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            Three dashboards a month, on us. No card needed.
          </p>

          <div
            className={`transition-all duration-1000 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/app"
              appearance={clerkAppearance}
            />
          </div>

          <p
            className={`mt-8 text-center text-sm text-muted-foreground transition-all duration-1000 delay-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="text-brand hover:text-brand-hover underline underline-offset-4 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
