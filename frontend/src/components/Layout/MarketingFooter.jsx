import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { name: "How it works", href: "/#how" },
    { name: "Pricing", href: "/pricing" },
    { name: "Changelog", href: "#" },
    { name: "Security", href: "#" },
  ],
  Company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#", badge: "Hiring" },
    { name: "Contact", href: "#" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "DPA", href: "#" },
  ],
};

const social = ["Twitter", "GitHub", "LinkedIn"];

export default function MarketingFooter() {
  return (
    <footer className="relative border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-8">
            <div className="col-span-2">
              <Link to="/" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-display">Datuma</span>
                <span className="text-xs text-brand font-mono">™</span>
              </Link>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-xs">
                Drop a spreadsheet, get a business-ready dashboard in 30 seconds. No setup. No SQL.
              </p>
              <div className="flex gap-6">
                {social.map((name) => (
                  <button
                    type="button"
                    key={name}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group bg-transparent border-0 p-0 cursor-pointer"
                  >
                    {name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                      >
                        {link.name}
                        {link.badge && (
                          <span className="text-xs px-2 py-0.5 bg-foreground text-background rounded-full font-mono">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2026 Datuma. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
