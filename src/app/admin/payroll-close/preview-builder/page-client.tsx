"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { buildQuery, formatDateTime, isTruthyFlag, toIso } from "@/app/admin/page-helpers";
import { resolveAdminLocaleLabelBundle } from "@/app/admin/page-locale-helpers";
import { buildAdminPayrollPreviewWorkspaceActions } from "@/app/admin/payroll-close/preview-builder/page-actions";
import { useAdminPayrollPreviewBuilderState } from "@/app/admin/payroll-close/preview-builder/page-state";
import { AdminDebugLogsPanel } from "@/components/admin-dashboard/AdminDebugLogsPanel";
import { AdminPayrollPanel } from "@/components/admin-dashboard/AdminPayrollPanel";
import { createEmptyPayrollKrIncomeSplitItemDraft } from "@/components/payroll/PayrollKrIncomeSplitItemsTable";
import { isAdminHubSource } from "@/app/admin/source-context";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminPayrollPreviewBuilderPageClient() {
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, loading: supabaseSessionLoading } = useSupabaseSession();
  const localeLabelBundle = resolveAdminLocaleLabelBundle(isKoLocale);
  const pageState = useAdminPayrollPreviewBuilderState();
  const initialRefreshDoneRef = useRef(false);

  const bearerToken = useMemo(
    () => supabaseSession?.accessToken?.trim() ?? "",
    [supabaseSession?.accessToken]
  );
  const usesBearerToken = bearerToken.length > 0;
  const requiresLoginSession =
    !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;
  const loginRequiredMessage = isKoLocale
    ? "운영 환경에서는 로그인 세션이 필요합니다. /login에서 다시 로그인해 주세요."
    : "Login session is required in production. Please sign in again at /login.";

  const callApi = useCallback(
    async (
      label: string,
      method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
      path: string,
      payload?: Record<string, unknown>,
      options?: { omitOrganizationHeader?: boolean }
    ) => {
      const result = await performAdminApiCall({
        label,
        method,
        path,
        payload,
        runtimeLocale,
        omitOrganizationHeader: options?.omitOrganizationHeader
      });
      pageState.setLogs((prev) => [result.log, ...prev].slice(0, 30));
      return {
        response: result.response,
        body: result.body
      };
    },
    [pageState, runtimeLocale]
  );

  const workspaceActions = buildAdminPayrollPreviewWorkspaceActions({
    callApi,
    buildQuery,
    toIso,
    runtimeLocale,
    periodStart: pageState.periodStart,
    periodEnd: pageState.periodEnd,
    employeeId: pageState.employeeId,
    payrollPreviewMode: pageState.payrollPreviewMode,
    payrollHourlyRateKrw: pageState.payrollHourlyRateKrw,
    payrollNonTaxableIncomeKrw: pageState.payrollNonTaxableIncomeKrw,
    payrollTaxableIncomeKrw: pageState.payrollTaxableIncomeKrw,
    payrollTaxableItems: pageState.payrollTaxableItems,
    payrollNonTaxableItems: pageState.payrollNonTaxableItems,
    payrollIncomeSplitItemPresetId: pageState.payrollIncomeSplitItemPresetId,
    payrollOtherDeductionsKrw: pageState.payrollOtherDeductionsKrw,
    payrollAdditionalTaxCreditKrw: pageState.payrollAdditionalTaxCreditKrw,
    payrollDependentCount: pageState.payrollDependentCount,
    payrollDependentTaxCreditPerPersonKrw: pageState.payrollDependentTaxCreditPerPersonKrw,
    payrollIncomeTaxLookupPresetId: pageState.payrollIncomeTaxLookupPresetId,
    payrollIncomeTaxLookupPresetAuto: pageState.payrollIncomeTaxLookupPresetAuto,
    payrollIncomeTaxLookupAsOf: pageState.payrollIncomeTaxLookupAsOf,
    payrollRequireMonthlyBoundary: pageState.payrollRequireMonthlyBoundary,
    payrollNationalPensionCapKrw: pageState.payrollNationalPensionCapKrw,
    payrollHealthInsuranceCapKrw: pageState.payrollHealthInsuranceCapKrw,
    payrollEmploymentInsuranceCapKrw: pageState.payrollEmploymentInsuranceCapKrw,
    setPreviewedPayroll: pageState.setPreviewedPayroll,
    setLastPayrollRunId: pageState.setLastPayrollRunId,
    setLogs: pageState.setLogs
  });

  useEffect(() => {
    if (initialRefreshDoneRef.current || requiresLoginSession) {
      return;
    }
    initialRefreshDoneRef.current = true;
    void workspaceActions.refreshPreviewedPayroll();
  }, [requiresLoginSession, workspaceActions]);

  if (supabaseSessionLoading) {
    return null;
  }

  const source = searchParams.get("source");
  const openedFromShareLink = source === "payroll-preview-share";

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            {isKoLocale ? "급여 프리뷰 작업면" : "Payroll preview workspace"}
          </h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "급여 프리뷰/확정과 프리셋 공유 재생을 전용 작업면에서 처리하세요."
              : "Handle payroll preview, confirmation, and preset-share replay in a dedicated workspace."}
          </p>
          {isAdminHubSource(source) ? (
            <p className="small muted">
              {isKoLocale
                ? "관리자 허브 급여 lane에서 이동했습니다."
                : "Opened from the admin hub payroll lane."}
            </p>
          ) : null}
          {openedFromShareLink ? (
            <p className="small muted">
              {isKoLocale
                ? "공유된 급여 프리셋 입력값을 작업면에 다시 적용했습니다."
                : "Re-applied shared payroll preset values into this workspace."}
            </p>
          ) : null}
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin/payroll-close">
            {isKoLocale ? "급여 마감으로" : "Back to payroll close"}
          </Link>
          <Link className="btn btn-secondary" href="/admin">
            {isKoLocale ? "관리자 홈" : "Admin home"}
          </Link>
        </div>
      </header>

      {requiresLoginSession ? (
        <p className="small fail">
          {loginRequiredMessage} <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="panel-grid">
        <AdminPayrollPanel
          isKoLocale={isKoLocale}
          payrollPreviewMode={pageState.payrollPreviewMode}
          employeeId={pageState.employeeId}
          payrollHourlyRateKrw={pageState.payrollHourlyRateKrw}
          payrollNonTaxableIncomeKrw={pageState.payrollNonTaxableIncomeKrw}
          payrollTaxableIncomeKrw={pageState.payrollTaxableIncomeKrw}
          payrollTaxableItems={pageState.payrollTaxableItems}
          payrollNonTaxableItems={pageState.payrollNonTaxableItems}
          payrollIncomeSplitItemPresetId={pageState.payrollIncomeSplitItemPresetId}
          payrollOtherDeductionsKrw={pageState.payrollOtherDeductionsKrw}
          payrollAdditionalTaxCreditKrw={pageState.payrollAdditionalTaxCreditKrw}
          payrollDependentCount={pageState.payrollDependentCount}
          payrollDependentTaxCreditPerPersonKrw={pageState.payrollDependentTaxCreditPerPersonKrw}
          payrollIncomeTaxLookupPresetId={pageState.payrollIncomeTaxLookupPresetId}
          payrollIncomeTaxLookupPresetAuto={pageState.payrollIncomeTaxLookupPresetAuto}
          payrollIncomeTaxLookupAsOf={pageState.payrollIncomeTaxLookupAsOf}
          payrollRequireMonthlyBoundary={pageState.payrollRequireMonthlyBoundary}
          payrollNationalPensionCapKrw={pageState.payrollNationalPensionCapKrw}
          payrollHealthInsuranceCapKrw={pageState.payrollHealthInsuranceCapKrw}
          payrollEmploymentInsuranceCapKrw={pageState.payrollEmploymentInsuranceCapKrw}
          payrollPresetShareLinkFeedback={pageState.payrollPresetShareLinkFeedback}
          previewedPayroll={pageState.previewedPayroll}
          lastPayrollRunId={pageState.lastPayrollRunId}
          formatDateTime={(value) => formatDateTime(value, runtimeLocale)}
          onPayrollPreviewModeChange={pageState.setPayrollPreviewMode}
          onEmployeeIdChange={pageState.setEmployeeId}
          onPayrollHourlyRateKrwChange={pageState.setPayrollHourlyRateKrw}
          onPayrollNonTaxableIncomeKrwChange={pageState.setPayrollNonTaxableIncomeKrw}
          onPayrollTaxableIncomeKrwChange={pageState.setPayrollTaxableIncomeKrw}
          onPayrollTaxableItemsChange={pageState.setPayrollTaxableItems}
          onPayrollNonTaxableItemsChange={pageState.setPayrollNonTaxableItems}
          onPayrollIncomeSplitItemPresetIdChange={pageState.setPayrollIncomeSplitItemPresetId}
          onPayrollOtherDeductionsKrwChange={pageState.setPayrollOtherDeductionsKrw}
          onPayrollAdditionalTaxCreditKrwChange={pageState.setPayrollAdditionalTaxCreditKrw}
          onPayrollDependentCountChange={pageState.setPayrollDependentCount}
          onPayrollDependentTaxCreditPerPersonKrwChange={
            pageState.setPayrollDependentTaxCreditPerPersonKrw
          }
          onPayrollIncomeTaxLookupPresetIdChange={pageState.setPayrollIncomeTaxLookupPresetId}
          onPayrollIncomeTaxLookupPresetAutoChange={(enabled) => {
            pageState.setPayrollIncomeTaxLookupPresetAuto(enabled);
            if (enabled) {
              pageState.setPayrollIncomeTaxLookupPresetId("");
            }
          }}
          onPayrollIncomeTaxLookupAsOfChange={pageState.setPayrollIncomeTaxLookupAsOf}
          onPayrollRequireMonthlyBoundaryChange={pageState.setPayrollRequireMonthlyBoundary}
          onPayrollNationalPensionCapKrwChange={pageState.setPayrollNationalPensionCapKrw}
          onPayrollHealthInsuranceCapKrwChange={pageState.setPayrollHealthInsuranceCapKrw}
          onPayrollEmploymentInsuranceCapKrwChange={pageState.setPayrollEmploymentInsuranceCapKrw}
          onLastPayrollRunIdChange={pageState.setLastPayrollRunId}
          onPreviewPayroll={() => void workspaceActions.previewPayroll()}
          onConfirmPayroll={() => void workspaceActions.confirmPayroll(pageState.lastPayrollRunId)}
          onResetPayrollPresetShareContext={pageState.resetPayrollPresetShareContext}
          onReapplyPayrollPresetShareContext={pageState.reapplyPayrollPresetShareContext}
          onClearManualIncomeSplitItems={() => {
            pageState.setPayrollTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
            pageState.setPayrollNonTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
          }}
        />

        <AdminDebugLogsPanel
          showDevTools={showDevTools}
          isKoLocale={isKoLocale}
          logs={pageState.logs}
          logStatusLabels={localeLabelBundle.logStatusLabels}
          onClearLogs={workspaceActions.clearLogs}
        />
      </section>
    </main>
  );
}
