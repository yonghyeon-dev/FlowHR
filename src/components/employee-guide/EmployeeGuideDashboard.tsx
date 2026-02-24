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
  const data = useEmployeeGuideData({
    loadingLabel: copy.loadingLabel,
    runtimeLocale,
    requestLabels: copy.requestLabels
  });

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      {data.isProductionRuntime && !data.usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {copy.productionWarning} <Link href="/login">{copy.loginCta}</Link>
        </p>
      ) : null}

      <EmployeeGuideContextPanel
        copy={copy}
        organizationId={data.organizationId}
        employeeId={data.employeeId}
        accessToken={data.accessToken}
        pendingLabel={data.pendingLabel}
        refreshDisabled={data.refreshDisabled}
        onSetOrganizationId={data.setOrganizationId}
        onSetEmployeeId={data.setEmployeeId}
        onSetAccessToken={data.setAccessToken}
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
      />
    </main>
  );
}
