export const ADMIN_HUB_SOURCE = "admin-hub";
export const ADMIN_OPERATIONS_SOURCE = "admin-operations";
export const ADMIN_PAYROLL_SOURCE = "admin-payroll";
export const ADMIN_DASHBOARD_LEGACY_SOURCE = "admin-dashboard";

export function isAdminHubSource(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === ADMIN_HUB_SOURCE || normalized === ADMIN_DASHBOARD_LEGACY_SOURCE;
}

export function withAdminHubSource(href: string) {
  return withAdminSource(href, ADMIN_HUB_SOURCE);
}

export function withAdminSource(href: string, source: string) {
  if (href.includes("source=")) {
    return href;
  }
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}source=${source}`;
}
