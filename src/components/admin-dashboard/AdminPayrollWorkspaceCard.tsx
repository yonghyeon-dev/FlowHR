"use client";

import Link from "next/link";

import type { PayrollRunDto } from "@/app/admin/page-types";
import { formatPublicEmployeeNumber } from "@/lib/product-language";

type AdminPayrollWorkspaceCardProps = {
  isKoLocale: boolean;
  previewedPayroll: PayrollRunDto[];
  lastPayrollRunId: string;
  formatDateTime: (value: string | null) => string;
};

export function AdminPayrollWorkspaceCard({
  isKoLocale,
  previewedPayroll,
  lastPayrollRunId,
  formatDateTime,
}: AdminPayrollWorkspaceCardProps) {
  const previewCount = previewedPayroll.filter((run) => run.state !== "CONFIRMED").length;
  const confirmedCount = previewedPayroll.filter((run) => run.state === "CONFIRMED").length;
  const selectedRun = previewedPayroll.find((run) => run.id === lastPayrollRunId) ?? null;

  const cardCopy = isKoLocale
    ? {
        title: "급여 작업 워크스페이스",
        description:
          "대시보드에서는 급여 상태만 확인하고, 프리뷰 생성·확정·공유 재생은 전용 작업면에서 처리합니다.",
        previewQueue: "미확정 프리뷰",
        confirmedQueue: "확정 완료",
        selectedRun: "최근 선택된 확정 대상",
        noSelectedRun: "아직 선택된 확정 대상이 없습니다.",
        selectedRunHint: "대상 프리뷰를 다시 확인하거나 바로 확정 워크스페이스로 이동하세요.",
        openPayrollClose: "급여 마감 열기",
        openPreviewBuilder: "프리뷰 작업면 열기",
        openPreviewedQueue: "프리뷰 대기함 열기",
      }
    : {
        title: "Payroll workspace",
        description:
          "Keep payroll status visible on the dashboard, then continue preview, confirmation, and share replay inside dedicated routes.",
        previewQueue: "Previews pending confirmation",
        confirmedQueue: "Confirmed runs",
        selectedRun: "Last selected confirmation target",
        noSelectedRun: "No confirmation target is selected yet.",
        selectedRunHint: "Review the target preview again or continue in the dedicated confirmation workspace.",
        openPayrollClose: "Open payroll close",
        openPreviewBuilder: "Open preview workspace",
        openPreviewedQueue: "Open preview queue",
      };

  const selectedRunLabel = selectedRun
    ? [
        `${formatDateTime(selectedRun.periodStart)} ~ ${formatDateTime(selectedRun.periodEnd)}`,
        formatPublicEmployeeNumber(selectedRun.employeeId),
      ]
        .filter(Boolean)
        .join(" · ")
    : cardCopy.noSelectedRun;

  return (
    <article className="panel" id="payroll-workspace-card">
      <h2>{cardCopy.title}</h2>
      <p className="small muted">{cardCopy.description}</p>
      <section className="kpi-strip" aria-label={cardCopy.title}>
        <article className="kpi-card">
          <span>{cardCopy.previewQueue}</span>
          <strong>{previewCount}</strong>
        </article>
        <article className="kpi-card">
          <span>{cardCopy.confirmedQueue}</span>
          <strong>{confirmedCount}</strong>
        </article>
      </section>
      <div className="panel" style={{ marginTop: 16 }}>
        <p className="small muted">{cardCopy.selectedRun}</p>
        <strong>{selectedRunLabel}</strong>
        <p className="small muted">{cardCopy.selectedRunHint}</p>
      </div>
      <div className="actions">
        <Link className="btn btn-secondary" href="/admin/payroll-close?source=admin-dashboard">
          {cardCopy.openPayrollClose}
        </Link>
        <Link
          className="btn btn-primary"
          href="/admin/payroll-close/preview-builder?source=admin-dashboard"
        >
          {cardCopy.openPreviewBuilder}
        </Link>
        <Link
          className="btn btn-secondary"
          href="/admin/payroll-close/previewed?source=admin-dashboard"
        >
          {cardCopy.openPreviewedQueue}
        </Link>
      </div>
    </article>
  );
}
