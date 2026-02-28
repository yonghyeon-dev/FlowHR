export type AdminSummary = {
  pendingAttendanceCount: number;
  pendingLeaveCount: number;
  previewedPayrollCount: number;
  employeeCount: number;
  refreshedAt: string | null;
};

export type AdminDashboardFocusCard = {
  key: "attendance" | "leave" | "payroll";
  count: number;
  href: string;
  severity: "critical" | "watch" | "stable";
};

type FocusPrioritySummary = {
  critical: number;
  watch: number;
  stable: number;
};

function toFocusSeverity(count: number): AdminDashboardFocusCard["severity"] {
  if (count >= 10) {
    return "critical";
  }
  if (count >= 3) {
    return "watch";
  }
  return "stable";
}

const FOCUS_SEVERITY_WEIGHT: Record<AdminDashboardFocusCard["severity"], number> = {
  critical: 3,
  watch: 2,
  stable: 1
};

export function buildAdminDashboardFocusCards(summary: AdminSummary): AdminDashboardFocusCard[] {
  const cards: AdminDashboardFocusCard[] = [
    {
      key: "attendance",
      count: summary.pendingAttendanceCount,
      href: "/admin/attendance-live",
      severity: toFocusSeverity(summary.pendingAttendanceCount)
    },
    {
      key: "leave",
      count: summary.pendingLeaveCount,
      href: "/admin/approval-executions",
      severity: toFocusSeverity(summary.pendingLeaveCount)
    },
    {
      key: "payroll",
      count: summary.previewedPayrollCount,
      href: "/admin/payroll-year-end",
      severity: toFocusSeverity(summary.previewedPayrollCount)
    }
  ];

  return cards.sort((left, right) => {
    const bySeverity = FOCUS_SEVERITY_WEIGHT[right.severity] - FOCUS_SEVERITY_WEIGHT[left.severity];
    if (bySeverity !== 0) {
      return bySeverity;
    }
    if (left.count !== right.count) {
      return right.count - left.count;
    }
    return left.key.localeCompare(right.key);
  });
}

export function summarizeAdminDashboardFocusCards(cards: AdminDashboardFocusCard[]): FocusPrioritySummary {
  return cards.reduce(
    (summary, card) => {
      summary[card.severity] += 1;
      return summary;
    },
    {
      critical: 0,
      watch: 0,
      stable: 0
    } satisfies FocusPrioritySummary
  );
}
