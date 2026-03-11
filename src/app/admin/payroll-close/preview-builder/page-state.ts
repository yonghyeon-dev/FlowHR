"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { firstDayOfMonthLocal, lastDayOfMonthLocal } from "@/app/admin/page-helpers";
import type { ApiLog, PayrollRunDto } from "@/app/admin/page-types";
import { type PayrollKrPresetShareLinkFeedback } from "@/components/payroll/PayrollKrPresetShareLinkFeedbackPanel";
import {
  createEmptyPayrollKrIncomeSplitItemDraft,
  type PayrollKrIncomeSplitItemDraft
} from "@/components/payroll/PayrollKrIncomeSplitItemsTable";
import {
  hasPayrollKrPresetShareContext,
  parsePayrollKrPresetShareContext,
  resolvePayrollKrPresetShareContext
} from "@/features/payroll/kr-preset-share-context";
import { defaultEmployeeIdForApi } from "@/lib/i18n/employee-id-locale";

type PayrollPreviewMode = "gross" | "statutory_kr_baseline";

export function useAdminPayrollPreviewBuilderState() {
  const [periodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd] = useState(lastDayOfMonthLocal());
  const [employeeId, setEmployeeId] = useState(defaultEmployeeIdForApi);
  const [payrollHourlyRateKrw, setPayrollHourlyRateKrw] = useState("12000");
  const [payrollPreviewMode, setPayrollPreviewMode] = useState<PayrollPreviewMode>("gross");
  const [payrollNonTaxableIncomeKrw, setPayrollNonTaxableIncomeKrw] = useState("0");
  const [payrollTaxableIncomeKrw, setPayrollTaxableIncomeKrw] = useState("");
  const [payrollTaxableItems, setPayrollTaxableItems] = useState<PayrollKrIncomeSplitItemDraft[]>([
    createEmptyPayrollKrIncomeSplitItemDraft()
  ]);
  const [payrollNonTaxableItems, setPayrollNonTaxableItems] = useState<PayrollKrIncomeSplitItemDraft[]>([
    createEmptyPayrollKrIncomeSplitItemDraft()
  ]);
  const [payrollIncomeSplitItemPresetId, setPayrollIncomeSplitItemPresetId] = useState("");
  const [payrollOtherDeductionsKrw, setPayrollOtherDeductionsKrw] = useState("0");
  const [payrollAdditionalTaxCreditKrw, setPayrollAdditionalTaxCreditKrw] = useState("0");
  const [payrollDependentCount, setPayrollDependentCount] = useState("0");
  const [payrollDependentTaxCreditPerPersonKrw, setPayrollDependentTaxCreditPerPersonKrw] =
    useState("0");
  const [payrollIncomeTaxLookupPresetId, setPayrollIncomeTaxLookupPresetId] = useState("");
  const [payrollIncomeTaxLookupPresetAuto, setPayrollIncomeTaxLookupPresetAuto] = useState(true);
  const [payrollIncomeTaxLookupAsOf, setPayrollIncomeTaxLookupAsOf] = useState("");
  const [payrollRequireMonthlyBoundary, setPayrollRequireMonthlyBoundary] = useState(false);
  const [payrollNationalPensionCapKrw, setPayrollNationalPensionCapKrw] = useState("");
  const [payrollHealthInsuranceCapKrw, setPayrollHealthInsuranceCapKrw] = useState("");
  const [payrollEmploymentInsuranceCapKrw, setPayrollEmploymentInsuranceCapKrw] = useState("");
  const [previewedPayroll, setPreviewedPayroll] = useState<PayrollRunDto[]>([]);
  const [lastPayrollRunId, setLastPayrollRunId] = useState("");
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [payrollPresetShareLinkFeedback, setPayrollPresetShareLinkFeedback] =
    useState<PayrollKrPresetShareLinkFeedback | null>(null);
  const payrollPresetShareContextAppliedRef = useRef(false);

  useEffect(() => {
    if (previewedPayroll.length === 0) {
      if (lastPayrollRunId !== "") {
        setLastPayrollRunId("");
      }
      return;
    }
    if (previewedPayroll.some((run) => run.id === lastPayrollRunId)) {
      return;
    }
    setLastPayrollRunId(previewedPayroll[0]?.id ?? "");
  }, [lastPayrollRunId, previewedPayroll]);

  const applyPayrollPresetShareContext = useCallback((search: string) => {
    const resolution = resolvePayrollKrPresetShareContext(search);
    const context = parsePayrollKrPresetShareContext(search);
    setPayrollPresetShareLinkFeedback({
      hasAnyQuery: resolution.hasAnyQuery,
      applied: {
        presetId: context.presetId,
        taxableIncomeKrw: context.taxableIncomeKrw,
        nonTaxableIncomeKrw: context.nonTaxableIncomeKrw
      },
      invalid: resolution.invalid
    });
    if (!hasPayrollKrPresetShareContext(context)) {
      return false;
    }
    setPayrollPreviewMode("statutory_kr_baseline");
    if (context.presetId) {
      setPayrollIncomeSplitItemPresetId(context.presetId);
    }
    if (context.taxableIncomeKrw !== null) {
      setPayrollTaxableIncomeKrw(context.taxableIncomeKrw);
    }
    if (context.nonTaxableIncomeKrw !== null) {
      setPayrollNonTaxableIncomeKrw(context.nonTaxableIncomeKrw);
    }
    return true;
  }, []);

  const resetPayrollPresetShareContext = useCallback(() => {
    setPayrollIncomeSplitItemPresetId("");
    setPayrollTaxableIncomeKrw("");
    setPayrollNonTaxableIncomeKrw("0");
  }, []);

  const reapplyPayrollPresetShareContext = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    applyPayrollPresetShareContext(window.location.search);
  }, [applyPayrollPresetShareContext]);

  useEffect(() => {
    if (payrollPresetShareContextAppliedRef.current || typeof window === "undefined") {
      return;
    }
    payrollPresetShareContextAppliedRef.current = true;
    applyPayrollPresetShareContext(window.location.search);
  }, [applyPayrollPresetShareContext]);

  return {
    periodStart,
    periodEnd,
    employeeId,
    setEmployeeId,
    payrollHourlyRateKrw,
    setPayrollHourlyRateKrw,
    payrollPreviewMode,
    setPayrollPreviewMode,
    payrollNonTaxableIncomeKrw,
    setPayrollNonTaxableIncomeKrw,
    payrollTaxableIncomeKrw,
    setPayrollTaxableIncomeKrw,
    payrollTaxableItems,
    setPayrollTaxableItems,
    payrollNonTaxableItems,
    setPayrollNonTaxableItems,
    payrollIncomeSplitItemPresetId,
    setPayrollIncomeSplitItemPresetId,
    payrollOtherDeductionsKrw,
    setPayrollOtherDeductionsKrw,
    payrollAdditionalTaxCreditKrw,
    setPayrollAdditionalTaxCreditKrw,
    payrollDependentCount,
    setPayrollDependentCount,
    payrollDependentTaxCreditPerPersonKrw,
    setPayrollDependentTaxCreditPerPersonKrw,
    payrollIncomeTaxLookupPresetId,
    setPayrollIncomeTaxLookupPresetId,
    payrollIncomeTaxLookupPresetAuto,
    setPayrollIncomeTaxLookupPresetAuto,
    payrollIncomeTaxLookupAsOf,
    setPayrollIncomeTaxLookupAsOf,
    payrollRequireMonthlyBoundary,
    setPayrollRequireMonthlyBoundary,
    payrollNationalPensionCapKrw,
    setPayrollNationalPensionCapKrw,
    payrollHealthInsuranceCapKrw,
    setPayrollHealthInsuranceCapKrw,
    payrollEmploymentInsuranceCapKrw,
    setPayrollEmploymentInsuranceCapKrw,
    previewedPayroll,
    setPreviewedPayroll,
    lastPayrollRunId,
    setLastPayrollRunId,
    logs,
    setLogs,
    payrollPresetShareLinkFeedback,
    resetPayrollPresetShareContext,
    reapplyPayrollPresetShareContext
  } as const;
}
