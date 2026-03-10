"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AdminOnboardingChecklistPanel,
  AdminOnboardingContextPanel,
  AdminOnboardingSetupPanels
} from "@/components/admin-onboarding/AdminOnboardingSections";
import { AdminOnboardingReadinessPanel } from "@/components/admin-onboarding/AdminOnboardingReadinessPanel";
import { adminOnboardingCopyByLocale } from "@/components/admin-onboarding/copy";
import type { OnboardingChecklistItem } from "@/features/admin-onboarding/checklist";
import { useAdminOnboardingData } from "@/components/admin-onboarding/useAdminOnboardingData";
import { useI18n } from "@/lib/i18n/provider";

export function AdminOnboardingDashboard() {
  const router = useRouter();
  const { locale } = useI18n();
  const copy = adminOnboardingCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const data = useAdminOnboardingData({
    loadingLabel: copy.loadingLabel,
    runtimeLocale,
    requestLabels: copy.requestLabels
  });
  const runPriorityAction = async (key: OnboardingChecklistItem["key"]) => {
    if (key === "departments") {
      await data.applyDepartments();
      return;
    }
    if (key === "employees") {
      await data.applyEmployees();
      return;
    }
    if (key === "invites") {
      await data.issuePendingEmployeeInvites();
      return;
    }
    if (key === "leave_policy") {
      await data.applyLeavePolicy();
      return;
    }
    if (key === "contracts") {
      if (data.activeContractTemplateCount === 0) {
        await data.bootstrapEmploymentContractTemplate();
        return;
      }
      if (data.pendingContractDraftCount > 0) {
        await data.createPendingContractDrafts();
        return;
      }
      if (data.pendingContractApprovalRequestCount > 0) {
        await data.requestPendingContractApprovals();
        return;
      }
      if (data.pendingContractApprovalDecisionCount > 0) {
        await data.approvePendingContractApprovals();
        return;
      }
      if (data.pendingContractSendCount > 0) {
        await data.sendPendingContracts();
        return;
      }
      if (data.pendingContractResponseCount > 0) {
        router.push("/admin/contracts?status=SENT&focus=pending-response");
      }
    }
  };

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

      <AdminOnboardingReadinessPanel
        copy={copy}
        checklistItems={data.checklistItems}
        priorityActionPending={Boolean(data.pendingLabel)}
        onRunPriorityAction={(key) => {
          void runPriorityAction(key);
        }}
      />

      <AdminOnboardingContextPanel
        copy={copy}
        showDevTools={data.showDevTools}
        runtimeLocale={runtimeLocale}
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
        runtimeLocale={runtimeLocale}
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
        sentContractEmployeeCount={data.sentContractEmployeeCount}
        pendingContractSendCount={data.pendingContractSendCount}
        respondedContractEmployeeCount={data.respondedContractEmployeeCount}
        pendingContractResponseCount={data.pendingContractResponseCount}
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
        onSendPendingContracts={() => {
          void data.sendPendingContracts();
        }}
        onOpenPendingContractResponses={() => {
          router.push("/admin/contracts?status=SENT&focus=pending-response");
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
