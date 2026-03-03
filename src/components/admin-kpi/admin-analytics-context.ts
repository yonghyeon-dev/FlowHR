import { type AdminKpiFocusMetric } from "@/components/admin-kpi/AdminKpiSections";

const adminAnalyticsFocusMetricSet = new Set<AdminKpiFocusMetric>([
  "all",
  "pendingApprovals",
  "stalledApprovals",
  "attendanceApprovalRate",
  "leaveApprovedDays",
  "payrollConfirmedRate",
  "contractDecisionQueueCount",
  "contractSlaOverdueCount"
]);

export function normalizeAdminAnalyticsFocusMetric(
  value: string | null
): AdminKpiFocusMetric | null {
  if (!value) {
    return null;
  }
  if (adminAnalyticsFocusMetricSet.has(value as AdminKpiFocusMetric)) {
    return value as AdminKpiFocusMetric;
  }
  return null;
}

export function resolveAdminAnalyticsBackHref(
  source: string | null,
  analyticsFocusMetric: AdminKpiFocusMetric | null
) {
  if (source !== "admin-analytics") {
    return "";
  }
  if (!analyticsFocusMetric || analyticsFocusMetric === "all") {
    return "/admin/analytics";
  }
  return `/admin/analytics?focus=${encodeURIComponent(analyticsFocusMetric)}`;
}
