import Link from "next/link";
import styles from "./SaasMobileMenu.module.css";

export type SaasMobileMenuLink = {
  href: string;
  label: string;
  muted?: boolean;
};

export type SaasMobileMenuSection = {
  title: string;
  links: SaasMobileMenuLink[];
};

type SaasMobileMenuProps = {
  badge: string;
  menuLabel: string;
  navAriaLabel: string;
  navLinks: SaasMobileMenuLink[];
  navSections?: SaasMobileMenuSection[];
  footerLinks: SaasMobileMenuLink[];
};

export default function SaasMobileMenu(props: SaasMobileMenuProps) {
  const { badge, menuLabel, navAriaLabel, navLinks, navSections, footerLinks } = props;
  const sections = navSections ?? [{ title: "", links: navLinks }];

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <Link href="/">FlowHR</Link>
        <span className="saas-badge">{badge}</span>
      </div>
      <details className={styles.menu}>
        <summary>{menuLabel}</summary>
        <nav className={styles.nav} aria-label={navAriaLabel}>
          {sections.map((section) => (
            <div key={section.title || "default"} className={styles.section}>
              {section.title ? <p className={styles.sectionTitle}>{section.title}</p> : null}
              <div className={styles.sectionLinks}>
                {section.links.map((item) => (
                  <Link key={item.href} href={item.href} className={item.muted ? styles.muted : undefined}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
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
