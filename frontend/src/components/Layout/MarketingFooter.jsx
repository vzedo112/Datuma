import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { name: "How it works", href: "/#how", external: false },
    { name: "Pricing", href: "/pricing", external: false },
  ],
  Company: [
    { name: "About", href: "/about", external: false },
    { name: "Contact", href: "mailto:hello@datuma.app", external: true },
  ],
  Legal: [
    { name: "Privacy", href: "/privacy", external: false },
    { name: "Terms", href: "/terms", external: false },
    { name: "Security & trust", href: "/security", external: false },
  ],
};

function FooterLink({ link }) {
  const cls =
    "text-sm text-muted-foreground hover:text-foreground transition-colors";
  if (link.external) {
    return (
      <a href={link.href} className={cls}>
        {link.name}
      </a>
    );
  }
  return (
    <Link to={link.href} className={cls}>
      {link.name}
    </Link>
  );
}

export default function MarketingFooter() {
  const year = new Date().getFullYear();
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
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-xs">
                Drop a spreadsheet, get a business-ready dashboard in 30
                seconds. No setup. No SQL.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Currently in invite-only beta
              </div>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {year} Datuma. All rights reserved.
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Built in the EU · hosted in the EU
          </p>
        </div>
      </div>
    </footer>
  );
}
