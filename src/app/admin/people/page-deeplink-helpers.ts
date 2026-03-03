import { type ActiveFilter, type UpdatedWindow } from "@/app/admin/people/page-types";

export type AdminPeopleFocusPanel =
  | "directory-filters"
  | "org-chart"
  | "employee-compare"
  | "employee-history";

export type AdminPeopleSourceContext = "admin-onboarding" | "admin-dashboard";

export function normalizeAdminPeopleFocusPanel(value: string | null): AdminPeopleFocusPanel | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === "directory-filters" || normalized === "filters" || normalized === "invites") {
    return "directory-filters";
  }
  if (normalized === "org-chart" || normalized === "organization" || normalized === "org") {
    return "org-chart";
  }
  if (normalized === "employee-compare" || normalized === "compare") {
    return "employee-compare";
  }
  if (normalized === "employee-history" || normalized === "history") {
    return "employee-history";
  }
  return null;
}

export function normalizeAdminPeopleSourceContext(value: string | null): AdminPeopleSourceContext | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "admin-onboarding" || normalized === "admin-dashboard") {
    return normalized;
  }
  return null;
}

export function normalizeActiveFilter(value: string | null): ActiveFilter | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "all" || normalized === "active" || normalized === "inactive") {
    return normalized;
  }
  return null;
}

export function normalizeUpdatedWindow(value: string | null): UpdatedWindow | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "all" || normalized === "7" || normalized === "30" || normalized === "90") {
    return normalized;
  }
  return null;
}

export function normalizeHistoryLimit(value: string | null): string | null {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 500) {
    return null;
  }
  return String(parsed);
}
