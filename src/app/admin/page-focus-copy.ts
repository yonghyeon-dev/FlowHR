import type { AdminDashboardFocusCard } from "@/app/admin/page-focus-cards";

type DashboardLocale = "ko" | "en";

function resolveLocale(locale: string): DashboardLocale {
  return locale === "ko" ? "ko" : "en";
}

export function resolveAdminDashboardPriorityTitle(locale: string) {
  const normalized = resolveLocale(locale);
  return normalized === "ko" ? "우선순위 대기열" : "Priority queues";
}

export function resolveAdminDashboardPriorityDescription(locale: string) {
  const normalized = resolveLocale(locale);
  return normalized === "ko"
    ? "가장 위험한 대기 업무부터 확인하고 전용 워크스페이스로 바로 이동하세요."
    : "Focus on the highest-risk backlog first and jump directly to the matching workspace.";
}

export function resolveAdminDashboardPrioritySummary(input: {
  locale: string;
  critical: number;
  watch: number;
  stable: number;
}) {
  const normalized = resolveLocale(input.locale);
  if (normalized === "ko") {
    return `긴급 ${input.critical}건 | 주의 ${input.watch}건 | 안정 ${input.stable}건`;
  }
  return `${input.critical} critical | ${input.watch} watch | ${input.stable} stable`;
}

export function resolveAdminDashboardFocusCardLabel(card: AdminDashboardFocusCard, locale: string) {
  const normalized = resolveLocale(locale);
  if (card.key === "attendance") {
    return normalized === "ko" ? "출퇴근 승인 대기" : "Pending attendance approvals";
  }
  if (card.key === "leave") {
    return normalized === "ko" ? "휴가 승인 대기" : "Pending leave approvals";
  }
  return normalized === "ko" ? "급여 프리뷰 대기" : "Pending payroll previews";
}

export function resolveAdminDashboardFocusSeverityLabel(card: AdminDashboardFocusCard, locale: string) {
  const normalized = resolveLocale(locale);
  if (card.severity === "critical") {
    return normalized === "ko" ? "긴급" : "Critical";
  }
  if (card.severity === "watch") {
    return normalized === "ko" ? "주의" : "Watch";
  }
  return normalized === "ko" ? "안정" : "Stable";
}
