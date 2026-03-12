"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppNavLinkProps = {
  href: string;
  label: string;
  badge?: string | number | null;
  muted?: boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNavLink({ href, label, badge = null, muted = false }: AppNavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);
  const className = `nav-item${active ? " active" : ""}${muted ? " muted-link" : ""}`;

  return (
    <Link aria-current={active ? "page" : undefined} className={className} href={href}>
      <span>{label}</span>
      {badge !== null ? <span className="nav-badge">{badge}</span> : null}
    </Link>
  );
}
