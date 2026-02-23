import Link from "next/link";
import styles from "./SaasMobileMenu.module.css";

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
    <header className={styles.header}>
      <div className={styles.top}>
        <Link href="/">FlowHR</Link>
        <span className="saas-badge">{badge}</span>
      </div>
      <details className={styles.menu}>
        <summary>{menuLabel}</summary>
        <nav className={styles.nav} aria-label={navAriaLabel}>
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className={item.muted ? styles.muted : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        {footerLinks.length > 0 ? (
          <div className={styles.footer}>
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className={item.muted ? styles.muted : undefined}>
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </details>
    </header>
  );
}
