"use client";

import Link from "next/link";

import {
  EmployeeGuideChecklistPanel,
  EmployeeGuideContextPanel,
  EmployeeGuideQuickActionsPanel
} from "@/components/employee-guide/EmployeeGuideSections";
import { employeeGuideCopyByLocale } from "@/components/employee-guide/copy";
import { useEmployeeGuideData } from "@/components/employee-guide/useEmployeeGuideData";
import { useI18n } from "@/lib/i18n/provider";

export function EmployeeGuideDashboard() {
  const { locale } = useI18n();
  const copy = employeeGuideCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const isKoLocale = locale === "ko";
  const data = useEmployeeGuideData({
    loadingLabel: copy.loadingLabel,
    runtimeLocale,
    requestLabels: copy.requestLabels
  });

  return (
    <main className="saas-content workspace-shell employee-workspace-shell">
      <header className="page-header workspace-page-header employee-workspace-status-header">
        <div>
          <p className="eyebrow">{copy.heroEyebrow}</p>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-subtitle">{copy.description}</p>
          <p className="small muted workspace-source-banner">{copy.sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            {copy.backToHomeLabel}
          </Link>
          <Link className="btn btn-secondary" href="/employee/requests?source=employee-guide">
            {copy.requestsHubLabel}
          </Link>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip employee-workspace-status-strip">
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{copy.progressLabel}</p>
          <strong>{data.progressPercent}%</strong>
        </article>
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{copy.summary.attendance}</p>
          <strong>{data.attendanceRecordCount}</strong>
        </article>
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{copy.summary.leave}</p>
          <strong>{data.leaveRequestCount}</strong>
        </article>
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{copy.summary.payslip}</p>
          <strong>{data.confirmedPayslipCount}</strong>
        </article>
      </section>

      {data.requiresLoginSession ? (
        <p className="small fail workspace-inline-status">
          {data.productionSessionRequiredNotice} <Link href="/login">{copy.loginCta}</Link>
        </p>
      ) : null}

      <EmployeeGuideContextPanel
        copy={copy}
        employeeId={data.employeeId}
        showDevTools={data.showDevTools}
        pendingLabel={data.pendingLabel}
        refreshDisabled={data.refreshDisabled}
        isKoLocale={isKoLocale}
        onRefresh={() => {
          void data.loadGuide();
        }}
      />

      <EmployeeGuideQuickActionsPanel copy={copy} />

      <EmployeeGuideChecklistPanel
        copy={copy}
        progressPercent={data.progressPercent}
        checklistItems={data.checklistItems}
        attendanceRecordCount={data.attendanceRecordCount}
        leaveRequestCount={data.leaveRequestCount}
        confirmedPayslipCount={data.confirmedPayslipCount}
        logs={data.logs}
        showDevTools={data.showDevTools}
      />
    </main>
  );
}
