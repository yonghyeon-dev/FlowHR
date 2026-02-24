import { Permissions } from "@/lib/rbac";
import {
  asYearEndFinalizationAuditPayload,
  buildYearEndFilingGuard,
  buildYearEndInsuranceReconciliationMonthlyBreakdown,
  listYearEndFilingSubmissionSummaries,
  resolveYearEndSettlementHashFromFinalizationPayload
} from "@/features/payroll/service-year-end-adapter-helpers";
import {
  isPayrollYearEndEnabled,
  isPayrollYearEndFilingSubmissionEnabled,
  toKrwInteger
} from "@/features/payroll/service-runtime-helpers";
import type {
  GetPayrollYearEndInsuranceReconciliationReportInput,
  GetPayrollYearEndPreflightChecklistInput
} from "@/features/payroll/service-input-types";
import type {
  GetPayrollYearEndInsuranceReconciliationReportResult,
  GetPayrollYearEndPreflightChecklistResult
} from "@/features/payroll/service-output-types";
import { loadYearEndRunSnapshot } from "@/features/payroll/service-year-end-run-snapshot-helpers";
import {
  type ServiceContext,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";
import { ServiceError } from "@/features/shared/service-error";

export async function getPayrollYearEndInsuranceReconciliationReportFromHelper(
  context: ServiceContext,
  input: GetPayrollYearEndInsuranceReconciliationReportInput
): Promise<GetPayrollYearEndInsuranceReconciliationReportResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const annualRunSocialInsuranceKrw = snapshot.confirmedRuns.reduce(
    (total, run) => total + (run.socialInsuranceKrw ?? 0),
    0
  );
  const entityId = `${input.year}_${input.employeeId}`;
  const finalizationLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 500
  });
  const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
  const finalizedPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
  const insuranceCapApplied = finalizedPayload?.deductionItemsKrw.capAppliedByItemKrw.insurancePremiumKrw;
  const insurancePremiumAppliedKrw = insuranceCapApplied?.appliedKrw ?? null;
  const status: GetPayrollYearEndInsuranceReconciliationReportResult["report"]["reconciliation"]["status"] =
    insurancePremiumAppliedKrw === null
      ? "pending_finalization"
      : annualRunSocialInsuranceKrw === insurancePremiumAppliedKrw
        ? "matched"
        : "mismatch";
  const comparedKrw = insurancePremiumAppliedKrw ?? 0;

  return {
    report: {
      year: input.year,
      employeeId: input.employeeId,
      periodStart: snapshot.periodStart.toISOString(),
      periodEnd: snapshot.periodEnd.toISOString(),
      runStates: {
        totalRuns: snapshot.runs.length,
        confirmedRuns: snapshot.confirmedRuns.length,
        previewedRuns: snapshot.previewedRuns.length,
        confirmedRunIds: snapshot.confirmedRuns.map((run) => run.id),
        previewedRunIds: snapshot.previewedRuns.map((run) => run.id)
      },
      annualRunSocialInsuranceKrw,
      finalization: {
        finalized: Boolean(finalizedPayload?.finalized && finalizedPayload.finalizedAt),
        finalizationId: finalizedPayload?.finalizationId ?? null,
        settlementHash: finalizedPayload
          ? resolveYearEndSettlementHashFromFinalizationPayload(finalizedPayload)
          : null,
        finalizedAt: finalizedPayload?.finalizedAt ?? null,
        insurancePremiumInputKrw: insuranceCapApplied?.inputKrw ?? null,
        insurancePremiumAppliedKrw,
        insurancePremiumCapKrw: insuranceCapApplied?.capKrw ?? null,
        applicationReasonCode: insuranceCapApplied?.applicationReasonCode ?? null,
        applicationReason: insuranceCapApplied?.applicationReason ?? null
      },
      reconciliation: {
        baselineKrw: annualRunSocialInsuranceKrw,
        comparedKrw,
        deltaKrw: annualRunSocialInsuranceKrw - comparedKrw,
        status
      },
      monthlyBreakdown: buildYearEndInsuranceReconciliationMonthlyBreakdown(snapshot.runs)
    }
  };
}

export async function getPayrollYearEndPreflightChecklistFromHelper(
  context: ServiceContext,
  input: GetPayrollYearEndPreflightChecklistInput
): Promise<GetPayrollYearEndPreflightChecklistResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const filingGuard = buildYearEndFilingGuard(snapshot);
  const annualGrossPayKrw = snapshot.totalsKrw.grossPayKrw;
  const nonTaxableAnnualIncomeKrw = toKrwInteger(
    input.nonTaxableAnnualIncomeKrw ?? 0,
    "nonTaxableAnnualIncomeKrw"
  );
  const nonTaxableWithinAnnualGross = nonTaxableAnnualIncomeKrw <= annualGrossPayKrw;

  const submissions = isPayrollYearEndFilingSubmissionEnabled()
    ? await listYearEndFilingSubmissionSummaries(context, {
      year: input.year,
      employeeId: input.employeeId
    })
    : [];
  const pendingSubmissionCount = submissions.filter((submission) => submission.status === "submitted").length;
  const rejectedSubmissionCount = submissions.filter(
    (submission) => submission.status === "acknowledged" && submission.ack?.ackStatus === "rejected"
  ).length;

  const entityId = `${input.year}_${input.employeeId}`;
  const finalizationLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 200
  });
  const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
  const finalizationPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
  const settlementHash = finalizationPayload
    ? resolveYearEndSettlementHashFromFinalizationPayload(finalizationPayload)
    : null;

  const checks: GetPayrollYearEndPreflightChecklistResult["checklist"]["checks"] = [
    {
      key: "confirmed_runs_present",
      label: "Confirmed Runs Present",
      status: snapshot.confirmedRuns.length > 0 ? "pass" : "fail",
      detail:
        snapshot.confirmedRuns.length > 0
          ? `${snapshot.confirmedRuns.length} confirmed runs found`
          : "no confirmed payroll runs found for selected year"
    },
    {
      key: "no_previewed_runs",
      label: "No Previewed Runs",
      status: snapshot.previewedRuns.length === 0 ? "pass" : "fail",
      detail:
        snapshot.previewedRuns.length === 0
          ? "all runs are confirmed"
          : `${snapshot.previewedRuns.length} previewed runs remain`
    },
    {
      key: "no_undistributed_runs",
      label: "No Undistributed Runs",
      status: filingGuard.undistributedRuns.length === 0 ? "pass" : "fail",
      detail:
        filingGuard.undistributedRuns.length === 0
          ? "all confirmed runs are distributed"
          : `${filingGuard.undistributedRuns.length} confirmed runs are not distributed`
    },
    {
      key: "no_pending_receipts",
      label: "No Pending Payslip Receipts",
      status: filingGuard.pendingReceiptRuns.length === 0 ? "pass" : "fail",
      detail:
        filingGuard.pendingReceiptRuns.length === 0
          ? "all distributed runs are receipt-confirmed"
          : `${filingGuard.pendingReceiptRuns.length} distributed runs are pending receipt confirmation`
    },
    {
      key: "non_taxable_within_annual_gross",
      label: "Non-Taxable Income Guard",
      status: nonTaxableWithinAnnualGross ? "pass" : "fail",
      detail: nonTaxableWithinAnnualGross
        ? `non-taxable annual income ${nonTaxableAnnualIncomeKrw.toLocaleString("ko-KR")} KRW is within annual gross ${annualGrossPayKrw.toLocaleString("ko-KR")} KRW`
        : `non-taxable annual income ${nonTaxableAnnualIncomeKrw.toLocaleString("ko-KR")} KRW exceeds annual gross ${annualGrossPayKrw.toLocaleString("ko-KR")} KRW`
    },
    {
      key: "no_pending_filing_submissions",
      label: "No Pending Filing Submissions",
      status: pendingSubmissionCount === 0 ? "pass" : "fail",
      detail:
        pendingSubmissionCount === 0
          ? "no pending filing submissions"
          : `${pendingSubmissionCount} pending filing submissions require acknowledge/cancel before finalize handoff`
    },
    {
      key: "settlement_hash_available",
      label: "Settlement Hash Trace",
      status: settlementHash ? "pass" : "warn",
      detail: settlementHash
        ? `latest settlement hash available (${settlementHash.slice(0, 12)}...)`
        : "no finalized settlement hash found yet"
    }
  ];

  const passCount = checks.filter((check) => check.status === "pass").length;
  const failCount = checks.filter((check) => check.status === "fail").length;
  const warnCount = checks.filter((check) => check.status === "warn").length;

  return {
    checklist: {
      year: input.year,
      employeeId: input.employeeId,
      periodStart: snapshot.periodStart.toISOString(),
      periodEnd: snapshot.periodEnd.toISOString(),
      summary: {
        readyToFinalize: failCount === 0,
        passCount,
        failCount,
        warnCount
      },
      metrics: {
        annualGrossPayKrw,
        nonTaxableAnnualIncomeKrw,
        totalRuns: snapshot.runs.length,
        confirmedRuns: snapshot.confirmedRuns.length,
        previewedRuns: snapshot.previewedRuns.length,
        undistributedRuns: filingGuard.undistributedRuns.length,
        pendingReceiptRuns: filingGuard.pendingReceiptRuns.length,
        pendingSubmissionCount,
        rejectedSubmissionCount,
        settlementHash
      },
      checks
    }
  };
}
