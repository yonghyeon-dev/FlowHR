import Link from "next/link";

export type SaasMobileMenuLink = {
  href: string;
  label: string;
  muted?: boolean;
};

type SaasMobileMenuProps = {
  badge: string;
  menuLabel: string;
  navAriaLabel: string;
  navLinks: SaasMobileMenuLink[];
  footerLinks: SaasMobileMenuLink[];
};

export default function SaasMobileMenu(props: SaasMobileMenuProps) {
  const { badge, menuLabel, navAriaLabel, navLinks, footerLinks } = props;

  return (
    <header className="saas-mobile-header">
      <div className="saas-mobile-top">
        <Link href="/">FlowHR</Link>
        <span className="saas-badge">{badge}</span>
      </div>
      <details className="saas-mobile-menu">
        <summary>{menuLabel}</summary>
        <nav className="saas-mobile-nav" aria-label={navAriaLabel}>
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className={item.muted ? "muted-link" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        {footerLinks.length > 0 ? (
          <div className="saas-mobile-footer">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className={item.muted ? "muted-link" : undefined}>
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </details>
    </header>
  );
}
