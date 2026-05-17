import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/cn";

const links = [
  { name: "Product", href: "/#product" },
  { name: "How it works", href: "/#how" },
  { name: "Pricing", href: "/pricing" },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed z-50 transition-all duration-500",
        scrolled ? "top-3 left-3 right-3" : "top-0 left-0 right-0"
      )}
    >
      <nav
        className={cn(
          "mx-auto transition-all duration-500",
          scrolled || open
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-sm max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-500 px-5 lg:px-8",
            scrolled ? "h-14" : "h-20"
          )}
        >
          <Link to="/" className="flex items-center gap-2 group">
            <span className={cn("font-display tracking-tight transition-all", scrolled ? "text-xl" : "text-2xl")}>
              Datuma
            </span>
            <span className={cn("text-brand font-mono transition-all", scrolled ? "text-[10px] mt-0.5" : "text-xs mt-1")}>
              ™
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {links.map((l) => (
              <a
                key={l.name}
                href={l.href}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
              >
                {l.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <NavLink
              to="/app"
              className={cn(
                "text-foreground/70 hover:text-foreground transition-colors",
                scrolled ? "text-xs" : "text-sm"
              )}
            >
              Sign in
            </NavLink>
            <Link
              to="/app"
              className={cn(
                "inline-flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all",
                scrolled ? "px-4 h-8 text-xs" : "px-5 h-10 text-sm"
              )}
            >
              Try Datuma free
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "md:hidden fixed inset-0 bg-background z-40 transition-all duration-500",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8">
          <div className="flex-1 flex flex-col justify-center gap-8">
            {links.map((l, i) => (
              <a
                key={l.name}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-5xl font-display text-foreground hover:text-muted-foreground transition-all"
                style={{ transitionDelay: open ? `${i * 75}ms` : "0ms" }}
              >
                {l.name}
              </a>
            ))}
          </div>
          <div className="flex gap-4 pt-8 border-t border-foreground/10">
            <Link to="/app" onClick={() => setOpen(false)} className="flex-1 text-center rounded-full h-14 leading-[3.5rem] border border-foreground/20">
              Sign in
            </Link>
            <Link to="/app" onClick={() => setOpen(false)} className="flex-1 text-center rounded-full h-14 leading-[3.5rem] bg-foreground text-background">
              Try free
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
