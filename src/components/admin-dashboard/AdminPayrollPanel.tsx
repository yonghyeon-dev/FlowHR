import { PayrollKrIncomeSplitGuideField } from "@/components/payroll/PayrollKrIncomeSplitGuideField";
import { PayrollKrIncomeSplitConsistencyGuidePanel } from "@/components/payroll/PayrollKrIncomeSplitConsistencyGuidePanel";
import { PayrollKrIncomeSplitPresetPayloadPreviewPanel } from "@/components/payroll/PayrollKrIncomeSplitPresetPayloadPreviewPanel";
import {
  PayrollKrPresetShareLinkFeedbackPanel,
  type PayrollKrPresetShareLinkFeedback
} from "@/components/payroll/PayrollKrPresetShareLinkFeedbackPanel";
import {
  PayrollKrIncomeSplitItemsTable,
  type PayrollKrIncomeSplitItemDraft
} from "@/components/payroll/PayrollKrIncomeSplitItemsTable";
import { PayrollKrIncomeSplitItemPresetField } from "@/components/payroll/PayrollKrIncomeSplitItemPresetField";
import { PayrollKrPresetGuidePanel } from "@/components/payroll/PayrollKrPresetGuidePanel";

type PayrollPreviewMode = "gross" | "statutory_kr_baseline";

type AdminPayrollPanelProps = {
  isKoLocale: boolean;
  payrollPreviewMode: PayrollPreviewMode;
  employeeId: string;
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
  payrollPresetShareLinkFeedback: PayrollKrPresetShareLinkFeedback | null;
  lastPayrollRunId: string;
  onPayrollPreviewModeChange: (mode: PayrollPreviewMode) => void;
  onEmployeeIdChange: (employeeId: string) => void;
  onPayrollHourlyRateKrwChange: (value: string) => void;
  onPayrollNonTaxableIncomeKrwChange: (value: string) => void;
  onPayrollTaxableIncomeKrwChange: (value: string) => void;
  onPayrollTaxableItemsChange: (items: PayrollKrIncomeSplitItemDraft[]) => void;
  onPayrollNonTaxableItemsChange: (items: PayrollKrIncomeSplitItemDraft[]) => void;
  onPayrollIncomeSplitItemPresetIdChange: (presetId: string) => void;
  onPayrollOtherDeductionsKrwChange: (value: string) => void;
  onPayrollAdditionalTaxCreditKrwChange: (value: string) => void;
  onPayrollDependentCountChange: (value: string) => void;
  onPayrollDependentTaxCreditPerPersonKrwChange: (value: string) => void;
  onPayrollIncomeTaxLookupPresetIdChange: (presetId: string) => void;
  onPayrollIncomeTaxLookupPresetAutoChange: (enabled: boolean) => void;
  onPayrollIncomeTaxLookupAsOfChange: (value: string) => void;
  onPayrollRequireMonthlyBoundaryChange: (enabled: boolean) => void;
  onPayrollNationalPensionCapKrwChange: (value: string) => void;
  onPayrollHealthInsuranceCapKrwChange: (value: string) => void;
  onPayrollEmploymentInsuranceCapKrwChange: (value: string) => void;
  onLastPayrollRunIdChange: (value: string) => void;
  onPreviewPayroll: () => void;
  onConfirmPayroll: () => void;
  onResetPayrollPresetShareContext: () => void;
  onReapplyPayrollPresetShareContext: () => void;
  onClearManualIncomeSplitItems: () => void;
};

export function AdminPayrollPanel({
  isKoLocale,
  payrollPreviewMode,
  employeeId,
  payrollHourlyRateKrw,
  payrollNonTaxableIncomeKrw,
  payrollTaxableIncomeKrw,
  payrollTaxableItems,
  payrollNonTaxableItems,
  payrollIncomeSplitItemPresetId,
  payrollOtherDeductionsKrw,
  payrollAdditionalTaxCreditKrw,
  payrollDependentCount,
  payrollDependentTaxCreditPerPersonKrw,
  payrollIncomeTaxLookupPresetId,
  payrollIncomeTaxLookupPresetAuto,
  payrollIncomeTaxLookupAsOf,
  payrollRequireMonthlyBoundary,
  payrollNationalPensionCapKrw,
  payrollHealthInsuranceCapKrw,
  payrollEmploymentInsuranceCapKrw,
  payrollPresetShareLinkFeedback,
  lastPayrollRunId,
  onPayrollPreviewModeChange,
  onEmployeeIdChange,
  onPayrollHourlyRateKrwChange,
  onPayrollNonTaxableIncomeKrwChange,
  onPayrollTaxableIncomeKrwChange,
  onPayrollTaxableItemsChange,
  onPayrollNonTaxableItemsChange,
  onPayrollIncomeSplitItemPresetIdChange,
  onPayrollOtherDeductionsKrwChange,
  onPayrollAdditionalTaxCreditKrwChange,
  onPayrollDependentCountChange,
  onPayrollDependentTaxCreditPerPersonKrwChange,
  onPayrollIncomeTaxLookupPresetIdChange,
  onPayrollIncomeTaxLookupPresetAutoChange,
  onPayrollIncomeTaxLookupAsOfChange,
  onPayrollRequireMonthlyBoundaryChange,
  onPayrollNationalPensionCapKrwChange,
  onPayrollHealthInsuranceCapKrwChange,
  onPayrollEmploymentInsuranceCapKrwChange,
  onLastPayrollRunIdChange,
  onPreviewPayroll,
  onConfirmPayroll,
  onResetPayrollPresetShareContext,
  onReapplyPayrollPresetShareContext,
  onClearManualIncomeSplitItems
}: AdminPayrollPanelProps) {
  return (
    <article className="panel" id="payroll">
      <h2>급여 프리뷰/확정</h2>
      <p className="small">승인된 출퇴근 기반으로 총지급을 산정하거나, 법정공제 기준 프리뷰를 생성할 수 있습니다.</p>
      <div className="input-grid">
        <label>
          프리뷰 모드
          <select value={payrollPreviewMode} onChange={(event) => onPayrollPreviewModeChange(event.target.value as PayrollPreviewMode)}>
            <option value="gross">총지급만</option>
            <option value="statutory_kr_baseline">
              {isKoLocale ? "법정공제(한국 baseline)" : "Statutory deductions (KR baseline)"}
            </option>
          </select>
        </label>
        <label>
          대상 직원 ID
          <input value={employeeId} onChange={(event) => onEmployeeIdChange(event.target.value)} />
        </label>
        <label>
          시급 (KRW)
          <input type="number" min={1} value={payrollHourlyRateKrw} onChange={(event) => onPayrollHourlyRateKrwChange(event.target.value)} />
        </label>
        {payrollPreviewMode === "statutory_kr_baseline" ? (
          <>
            <label>
              비과세 소득(KRW)
              <input
                type="number"
                min={0}
                value={payrollNonTaxableIncomeKrw}
                onChange={(event) => onPayrollNonTaxableIncomeKrwChange(event.target.value)}
              />
            </label>
            <div className="full">
              <PayrollKrIncomeSplitGuideField taxableIncomeKrw={payrollTaxableIncomeKrw} onTaxableIncomeKrwChange={onPayrollTaxableIncomeKrwChange} />
            </div>
            <div className="full">
              <PayrollKrIncomeSplitItemPresetField selectedPresetId={payrollIncomeSplitItemPresetId} onPresetChange={onPayrollIncomeSplitItemPresetIdChange} />
            </div>
            <div className="full">
              <PayrollKrIncomeSplitPresetPayloadPreviewPanel
                selectedPresetId={payrollIncomeSplitItemPresetId}
                taxableIncomeKrw={payrollTaxableIncomeKrw}
                nonTaxableIncomeKrw={payrollNonTaxableIncomeKrw}
              />
            </div>
            <div className="full">
              <PayrollKrPresetShareLinkFeedbackPanel
                feedback={payrollPresetShareLinkFeedback}
                onResetAppliedValues={onResetPayrollPresetShareContext}
                onReapplyQueryValues={onReapplyPayrollPresetShareContext}
              />
            </div>
            <div className="full">
              <PayrollKrIncomeSplitItemsTable
                taxableItems={payrollTaxableItems}
                onTaxableItemsChange={onPayrollTaxableItemsChange}
                nonTaxableItems={payrollNonTaxableItems}
                onNonTaxableItemsChange={onPayrollNonTaxableItemsChange}
                disabled={payrollIncomeSplitItemPresetId.trim().length > 0}
              />
            </div>
            <div className="full">
              <PayrollKrIncomeSplitConsistencyGuidePanel
                taxableItems={payrollTaxableItems}
                nonTaxableItems={payrollNonTaxableItems}
                selectedPresetId={payrollIncomeSplitItemPresetId}
                onClearManualItems={onClearManualIncomeSplitItems}
              />
            </div>
            <label>
              기타 공제(KRW)
              <input type="number" min={0} value={payrollOtherDeductionsKrw} onChange={(event) => onPayrollOtherDeductionsKrwChange(event.target.value)} />
            </label>
            <label>
              세액공제 추가(KRW)
              <input
                type="number"
                min={0}
                value={payrollAdditionalTaxCreditKrw}
                onChange={(event) => onPayrollAdditionalTaxCreditKrwChange(event.target.value)}
              />
            </label>
            <label>
              부양가족 수
              <input type="number" min={0} value={payrollDependentCount} onChange={(event) => onPayrollDependentCountChange(event.target.value)} />
            </label>
            <label>
              1인당 부양가족 공제(KRW)
              <input
                type="number"
                min={0}
                value={payrollDependentTaxCreditPerPersonKrw}
                onChange={(event) => onPayrollDependentTaxCreditPerPersonKrwChange(event.target.value)}
              />
            </label>
            <div className="full">
              <PayrollKrPresetGuidePanel
                selectedPresetId={payrollIncomeTaxLookupPresetId}
                onPresetChange={onPayrollIncomeTaxLookupPresetIdChange}
                presetAutoEnabled={payrollIncomeTaxLookupPresetAuto}
                onPresetAutoEnabledChange={onPayrollIncomeTaxLookupPresetAutoChange}
                presetAsOfInput={payrollIncomeTaxLookupAsOf}
                onPresetAsOfInputChange={onPayrollIncomeTaxLookupAsOfChange}
              />
            </div>
            <label>
              월경계 강제검증(서울)
              <select value={payrollRequireMonthlyBoundary ? "true" : "false"} onChange={(event) => onPayrollRequireMonthlyBoundaryChange(event.target.value === "true")}>
                <option value="false">비활성</option>
                <option value="true">활성</option>
              </select>
            </label>
            <label>
              국민연금 상한(KRW, 선택)
              <input type="number" min={0} value={payrollNationalPensionCapKrw} onChange={(event) => onPayrollNationalPensionCapKrwChange(event.target.value)} />
            </label>
            <label>
              건강보험 상한(KRW, 선택)
              <input type="number" min={0} value={payrollHealthInsuranceCapKrw} onChange={(event) => onPayrollHealthInsuranceCapKrwChange(event.target.value)} />
            </label>
            <label>
              고용보험 상한(KRW, 선택)
              <input type="number" min={0} value={payrollEmploymentInsuranceCapKrw} onChange={(event) => onPayrollEmploymentInsuranceCapKrwChange(event.target.value)} />
            </label>
          </>
        ) : null}
        <label className="full">
          최근 Run ID
          <input value={lastPayrollRunId} onChange={(event) => onLastPayrollRunIdChange(event.target.value)} placeholder="확정 버튼용" />
        </label>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={onPreviewPayroll}>
          프리뷰 생성
        </button>
        <button className="btn btn-danger" onClick={onConfirmPayroll} disabled={!lastPayrollRunId.trim()}>
          Run 확정
        </button>
      </div>
    </article>
  );
}
