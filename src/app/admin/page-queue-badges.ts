import type { AdminSummary } from "@/app/admin/page-dashboard-types";

export type AdminQueueBadge = {
  key: string;
  label: string;
  total: number;
  critical: number;
  watch: number;
  breakdown: string;
  href: string;
  actions: Array<{ label: string; href: string }>;
};

export function buildAdminQueueBadges(summary: AdminSummary, isKoLocale: boolean): AdminQueueBadge[] {
  return [
    {
      key: "approvals",
      label: isKoLocale ? "결재 대기함" : "Approval queue",
      total: summary.pendingApprovalExecutionCount,
      critical: summary.stalledApprovalExecutionCount,
      watch: Math.max(summary.pendingApprovalExecutionCount - summary.stalledApprovalExecutionCount, 0),
      breakdown: isKoLocale
        ? `대기 ${summary.pendingApprovalExecutionCount} · 정체 ${summary.stalledApprovalExecutionCount}`
        : `Pending ${summary.pendingApprovalExecutionCount} · Stalled ${summary.stalledApprovalExecutionCount}`,
      href: "/admin/approval-executions?source=admin-dashboard",
      actions: [
        {
          label: isKoLocale
            ? `대기 ${summary.pendingApprovalExecutionCount}`
            : `Pending ${summary.pendingApprovalExecutionCount}`,
          href: "/admin/approval-executions?state=PENDING&source=admin-dashboard"
        },
        {
          label: isKoLocale
            ? `정체 ${summary.stalledApprovalExecutionCount}`
            : `Stalled ${summary.stalledApprovalExecutionCount}`,
          href: "/admin/approval-executions?state=PENDING&stalledHoursMin=24&source=admin-dashboard"
        }
      ]
    },
    {
      key: "payroll",
      label: isKoLocale ? "급여 대기함" : "Payroll queue",
      total: summary.previewedPayrollCount + summary.undistributedPayrollCount,
      critical: summary.undistributedPayrollCount,
      watch: summary.previewedPayrollCount,
      breakdown: isKoLocale
        ? `미확정 ${summary.previewedPayrollCount} · 미배포 ${summary.undistributedPayrollCount}`
        : `Previewed ${summary.previewedPayrollCount} · Undistributed ${summary.undistributedPayrollCount}`,
      href: "/admin/payroll-close?source=admin-dashboard",
      actions: [
        {
          label: isKoLocale
            ? `미확정 ${summary.previewedPayrollCount}`
            : `Previewed ${summary.previewedPayrollCount}`,
          href: "/admin/payroll-close?focus=previewed&source=admin-dashboard"
        },
        {
          label: isKoLocale
            ? `미배포 ${summary.undistributedPayrollCount}`
            : `Undistributed ${summary.undistributedPayrollCount}`,
          href: "/admin/payroll-close?focus=undistributed&source=admin-dashboard"
        },
        {
          label: isKoLocale
            ? `배포 처리 ${summary.undistributedPayrollCount}`
            : `Deliver ${summary.undistributedPayrollCount}`,
          href: "/admin/payroll-payslip-delivery?focus=undistributed&source=admin-dashboard"
        }
      ]
    },
    {
      key: "contracts",
      label: isKoLocale ? "계약 대기함" : "Contract queue",
      total: summary.contractDecisionQueueCount + summary.contractPendingResponseCount,
      critical: summary.contractSlaOverdueCount,
      watch: Math.max(
        summary.contractDecisionQueueCount +
          summary.contractPendingResponseCount -
          summary.contractSlaOverdueCount,
        0
      ),
      breakdown: isKoLocale
        ? `의사결정 ${summary.contractDecisionQueueCount} · 응답 대기 ${summary.contractPendingResponseCount} · SLA 초과 ${summary.contractSlaOverdueCount}`
        : `Decision ${summary.contractDecisionQueueCount} · Pending response ${summary.contractPendingResponseCount} · SLA overdue ${summary.contractSlaOverdueCount}`,
      href: "/admin/contracts?source=admin-dashboard",
      actions: [
        {
          label: isKoLocale
            ? `의사결정 ${summary.contractDecisionQueueCount}`
            : `Decision ${summary.contractDecisionQueueCount}`,
          href: "/admin/contracts?decisionQueueOnly=true&source=admin-dashboard"
        },
        {
          label: isKoLocale
            ? `응답 대기 ${summary.contractPendingResponseCount}`
            : `Pending response ${summary.contractPendingResponseCount}`,
          href: "/admin/contracts?status=SENT&source=admin-dashboard"
        },
        {
          label: isKoLocale
            ? `SLA 초과 ${summary.contractSlaOverdueCount}`
            : `SLA overdue ${summary.contractSlaOverdueCount}`,
          href: "/admin/contracts?slaRisk=OVERDUE&source=admin-dashboard"
        }
      ]
    }
  ];
}
