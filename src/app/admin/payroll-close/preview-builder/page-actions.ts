import {
  buildAdminValidationFailureLog,
  confirmPayrollFromHelper,
  type AdminCallApi
} from "@/app/admin/page-action-helpers";
import { buildAdminPayrollPreviewRequest } from "@/app/admin/page-payroll-helpers";
import type { ApiLog, PayrollRunDto } from "@/app/admin/page-types";
import type { PayrollKrIncomeSplitItemDraft } from "@/components/payroll/PayrollKrIncomeSplitItemsTable";

type StringSetter = (value: string) => void;
type LogsSetter = (updater: (prev: ApiLog[]) => ApiLog[]) => void;
type PreviewedPayrollSetter = (value: PayrollRunDto[]) => void;
type QueryBuilder = (params: Record<string, string | undefined>) => string;
type IsoConverter = (value: string) => string;

type BuildAdminPayrollPreviewWorkspaceActionsInput = {
  callApi: AdminCallApi;
  buildQuery: QueryBuilder;
  toIso: IsoConverter;
  runtimeLocale: string;
  periodStart: string;
  periodEnd: string;
  employeeId: string;
  payrollPreviewMode: "gross" | "statutory_kr_baseline";
  payrollHourlyRateKrw: string;
  payrollNonTaxableIncomeKrw: string;
  payrollTaxableIncomeKrw: string;
  payrollTaxableItems: PayrollKrIncomeSplitItemDraft[];
  payrollNonTaxableItems: PayrollKrIncomeSplitItemDraft[];
  payrollIncomeSplitItemPresetId: string;
  payrollOtherDeductionsKrw: string;
  payrollAdditionalTaxCreditKrw: string;
  payrollDependentCount: string;
  payrollDependentTaxCreditPerPersonKrw: string;
  payrollIncomeTaxLookupPresetId: string;
  payrollIncomeTaxLookupPresetAuto: boolean;
  payrollIncomeTaxLookupAsOf: string;
  payrollRequireMonthlyBoundary: boolean;
  payrollNationalPensionCapKrw: string;
  payrollHealthInsuranceCapKrw: string;
  payrollEmploymentInsuranceCapKrw: string;
  setPreviewedPayroll: PreviewedPayrollSetter;
  setLastPayrollRunId: StringSetter;
  setLogs: LogsSetter;
};

async function listPreviewedPayrollRuns(input: {
  callApi: AdminCallApi;
  periodStart: string;
  periodEnd: string;
  buildQuery: QueryBuilder;
  toIso: IsoConverter;
}): Promise<PayrollRunDto[]> {
  const from = input.toIso(input.periodStart);
  const to = input.toIso(input.periodEnd);
  const { response, body } = await input.callApi(
    "급여 프리뷰 조회",
    "GET",
    `/api/payroll/runs${input.buildQuery({ from, to, state: "PREVIEWED" })}`
  );
  if (!response.ok) {
    return [];
  }
  const parsed = body as { runs?: PayrollRunDto[] };
  return Array.isArray(parsed.runs) ? parsed.runs : [];
}

export function buildAdminPayrollPreviewWorkspaceActions(
  input: BuildAdminPayrollPreviewWorkspaceActionsInput
) {
  async function refreshPreviewedPayroll() {
    const previewedPayroll = await listPreviewedPayrollRuns({
      callApi: input.callApi,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      buildQuery: input.buildQuery,
      toIso: input.toIso
    });
    input.setPreviewedPayroll(previewedPayroll);
  }

  async function confirmPayroll(runId: string) {
    const confirmed = await confirmPayrollFromHelper({
      callApi: input.callApi,
      runId
    });
    if (confirmed.ok && confirmed.confirmedRunId) {
      input.setLastPayrollRunId(confirmed.confirmedRunId);
    }
    await refreshPreviewedPayroll();
  }

  async function previewPayroll() {
    const previewRequest = buildAdminPayrollPreviewRequest({
      payrollPreviewMode: input.payrollPreviewMode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      employeeId: input.employeeId,
      payrollHourlyRateKrw: input.payrollHourlyRateKrw,
      payrollNonTaxableIncomeKrw: input.payrollNonTaxableIncomeKrw,
      payrollTaxableIncomeKrw: input.payrollTaxableIncomeKrw,
      payrollTaxableItems: input.payrollTaxableItems,
      payrollNonTaxableItems: input.payrollNonTaxableItems,
      payrollIncomeSplitItemPresetId: input.payrollIncomeSplitItemPresetId,
      payrollOtherDeductionsKrw: input.payrollOtherDeductionsKrw,
      payrollAdditionalTaxCreditKrw: input.payrollAdditionalTaxCreditKrw,
      payrollDependentCount: input.payrollDependentCount,
      payrollDependentTaxCreditPerPersonKrw: input.payrollDependentTaxCreditPerPersonKrw,
      payrollIncomeTaxLookupPresetId: input.payrollIncomeTaxLookupPresetId,
      payrollIncomeTaxLookupPresetAuto: input.payrollIncomeTaxLookupPresetAuto,
      payrollIncomeTaxLookupAsOf: input.payrollIncomeTaxLookupAsOf,
      payrollRequireMonthlyBoundary: input.payrollRequireMonthlyBoundary,
      payrollNationalPensionCapKrw: input.payrollNationalPensionCapKrw,
      payrollHealthInsuranceCapKrw: input.payrollHealthInsuranceCapKrw,
      payrollEmploymentInsuranceCapKrw: input.payrollEmploymentInsuranceCapKrw,
      toIso: input.toIso
    });

    if (previewRequest.hasBlockingConsistencyIssues) {
      input.setLogs((prev) => [
        buildAdminValidationFailureLog({
          label: "급여 프리뷰 검증",
          error: "분할 입력 항목을 먼저 정리한 뒤 다시 시도해 주세요.",
          runtimeLocale: input.runtimeLocale
        }),
        ...prev
      ]);
      return;
    }

    const { response, body } = await input.callApi(
      previewRequest.label,
      "POST",
      previewRequest.path,
      previewRequest.payload
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { run?: { id?: string } };
    if (parsed.run?.id) {
      input.setLastPayrollRunId(parsed.run.id);
    }
    await refreshPreviewedPayroll();
  }

  function clearLogs() {
    input.setLogs(() => []);
  }

  return {
    refreshPreviewedPayroll,
    confirmPayroll,
    previewPayroll,
    clearLogs
  };
}
