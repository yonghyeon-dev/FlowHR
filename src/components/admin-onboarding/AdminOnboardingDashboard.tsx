"use client";

import Link from "next/link";

import {
  AdminOnboardingChecklistPanel,
  AdminOnboardingContextPanel,
  AdminOnboardingSetupPanels
} from "@/components/admin-onboarding/AdminOnboardingSections";
import { adminOnboardingCopyByLocale } from "@/components/admin-onboarding/copy";
import { useAdminOnboardingData } from "@/components/admin-onboarding/useAdminOnboardingData";
import { useI18n } from "@/lib/i18n/provider";

export function AdminOnboardingDashboard() {
  const { locale } = useI18n();
  const copy = adminOnboardingCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const data = useAdminOnboardingData({
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

      <AdminOnboardingContextPanel
        copy={copy}
        showDevTools={data.showDevTools}
        sessionOrganizationId={data.organizationId}
        sessionActorId={data.adminActorId}
        pendingLabel={data.pendingLabel}
        refreshDisabled={data.refreshDisabled}
        onRefresh={() => {
          void data.loadSetup();
        }}
      />

      <AdminOnboardingSetupPanels
        copy={copy}
        showDevTools={data.showDevTools}
        organizationId={data.organizationId}
        organizations={data.organizations}
        departments={data.departments}
        departmentSeedInput={data.departmentSeedInput}
        employeeSeedInput={data.employeeSeedInput}
        annualGrantDays={data.annualGrantDays}
        carryOverCapDays={data.carryOverCapDays}
        allowHalfDay={data.allowHalfDay}
        allowHourly={data.allowHourly}
        hourlyIncrementMinutes={data.hourlyIncrementMinutes}
        maxHoursPerRequest={data.maxHoursPerRequest}
        activeEmployeeCount={data.activeEmployeeCount}
        inviteEligibleEmployeeCount={data.inviteEligibleEmployeeCount}
        invitedEmployeeCount={data.invitedEmployeeCount}
        pendingInviteCount={data.pendingInviteCount}
        activeContractTemplateCount={data.activeContractTemplateCount}
        preparedContractDraftEmployeeCount={data.preparedContractDraftEmployeeCount}
        pendingContractDraftCount={data.pendingContractDraftCount}
        approvalRequestedContractEmployeeCount={data.approvalRequestedContractEmployeeCount}
        pendingContractApprovalRequestCount={data.pendingContractApprovalRequestCount}
        approvedContractEmployeeCount={data.approvedContractEmployeeCount}
        pendingContractApprovalDecisionCount={data.pendingContractApprovalDecisionCount}
        onSetDepartmentSeedInput={data.setDepartmentSeedInput}
        onSetEmployeeSeedInput={data.setEmployeeSeedInput}
        onSetAnnualGrantDays={data.setAnnualGrantDays}
        onSetCarryOverCapDays={data.setCarryOverCapDays}
        onSetAllowHalfDay={data.setAllowHalfDay}
        onSetAllowHourly={data.setAllowHourly}
        onSetHourlyIncrementMinutes={data.setHourlyIncrementMinutes}
        onSetMaxHoursPerRequest={data.setMaxHoursPerRequest}
        onReloadOrganizations={() => {
          void data.loadSetup();
        }}
        onApplyDepartments={() => {
          void data.applyDepartments();
        }}
        onApplyEmployees={() => {
          void data.applyEmployees();
        }}
        onApplyLeavePolicy={() => {
          void data.applyLeavePolicy();
        }}
        onIssuePendingEmployeeInvites={() => {
          void data.issuePendingEmployeeInvites();
        }}
        onBootstrapEmploymentContractTemplate={() => {
          void data.bootstrapEmploymentContractTemplate();
        }}
        onCreatePendingContractDrafts={() => {
          void data.createPendingContractDrafts();
        }}
        onRequestPendingContractApprovals={() => {
          void data.requestPendingContractApprovals();
        }}
        onApprovePendingContractApprovals={() => {
          void data.approvePendingContractApprovals();
        }}
      />

      <AdminOnboardingChecklistPanel
        copy={copy}
        progressPercent={data.progressPercent}
        checklistItems={data.checklistItems}
        logs={data.logs}
      />
    </main>
  );
}
