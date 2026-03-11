"use client";

import Link from "next/link";

import {
  EmployeeGuideChecklistPanel,
  EmployeeGuideContextPanel,
  EmployeeGuideQuickActionsPanel
} from "@/components/employee-guide/EmployeeGuideSections";
import { employeeGuideCopyByLocale } from "@/components/employee-guide/copy";
import { EmployeeWorkspaceHero } from "@/components/employee-dashboard/EmployeeWorkspaceHero";
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
  const nextAction =
    data.nextActionKey === null
      ? null
      : copy.quickActions.find((action) => action.key === data.nextActionKey) ?? null;

  return (
    <main className="saas-content workspace-shell employee-workspace-shell">
      <EmployeeWorkspaceHero
        eyebrow={copy.heroEyebrow}
        title={copy.title}
        description={copy.description}
        sourceHint={copy.sourceHint}
        metaLabel={copy.heroMetaLabel}
        returnHref="/employee/requests?source=employee-guide"
        returnLabel={copy.requestsHubLabel}
        actions={[{ href: "/employee", label: copy.backToHomeLabel, tone: "secondary" }]}
      />

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
        progressPercent={data.progressPercent}
        nextAction={nextAction}
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
