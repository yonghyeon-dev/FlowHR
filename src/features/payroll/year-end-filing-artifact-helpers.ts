import { createHash } from "node:crypto";

type PayrollYearEndWithholdingReceiptDocumentFormat = "json" | "text";
type PayrollYearEndFilingExportFormat = "json" | "csv" | "jsonl" | "hometax_csv";

type YearEndFilingRunShape = {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  state: string;
  grossPayKrw: number;
  withholdingTaxKrw?: number | null;
  socialInsuranceKrw?: number | null;
  otherDeductionsKrw?: number | null;
  totalDeductionsKrw?: number | null;
  netPayKrw?: number | null;
  payslipDistributedAt?: Date | null;
  payslipReceiptConfirmedAt?: Date | null;
};

type YearEndFilingRecord = {
  runId: string;
  periodStart: string;
  periodEnd: string;
  state: string;
  grossPayKrw: number;
  withholdingTaxKrw: number;
  socialInsuranceKrw: number;
  otherDeductionsKrw: number;
  totalDeductionsKrw: number;
  netPayKrw: number;
  payslipDistributedAt: string | null;
  payslipReceiptConfirmedAt: string | null;
};

type YearEndFinalizationAuditPayloadShape = {
  year: number;
  employeeId: string;
  finalizationId: string;
  finalizedAt: string | null;
  annualTotalsKrw: {
    grossPayKrw: number;
    withholdingTaxKrw: number;
    totalDeductionsKrw: number;
    netPayKrw: number;
  };
  settlementKrw: {
    taxableAnnualIncomeKrw: number;
    annualTaxLiabilityKrw: number;
    withholdingDeltaKrw: number;
  };
  runStates: {
    confirmedRuns: number;
  };
};

type PayrollYearEndWithholdingReceiptSummaryShape = {
  year: number;
  employeeId: string;
  receiptNumber: string;
  issuerName: string;
  issuedAt: string | null;
  runStates: {
    totalRuns: number;
    confirmedRuns: number;
    previewedRuns: number;
    undistributedRuns: number;
    pendingReceiptRuns: number;
  };
  annualTotalsKrw: {
    grossPayKrw: number;
    withholdingTaxKrw: number;
    socialInsuranceKrw: number;
    otherDeductionsKrw: number;
    totalDeductionsKrw: number;
    netPayKrw: number;
  };
  blockingReasons: string[];
};

function buildYearEndFilingCsv(
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayloadShape
) {
  const header = [
    "year",
    "employeeId",
    "finalizationId",
    "finalizedAt",
    "runId",
    "periodStart",
    "periodEnd",
    "state",
    "grossPayKrw",
    "withholdingTaxKrw",
    "socialInsuranceKrw",
    "otherDeductionsKrw",
    "totalDeductionsKrw",
    "netPayKrw",
    "payslipDistributedAt",
    "payslipReceiptConfirmedAt"
  ].join(",");

  const lines = rows.map((row) =>
    [
      payload.year,
      payload.employeeId,
      payload.finalizationId,
      payload.finalizedAt ?? "",
      row.runId,
      row.periodStart,
      row.periodEnd,
      row.state,
      row.grossPayKrw,
      row.withholdingTaxKrw,
      row.socialInsuranceKrw,
      row.otherDeductionsKrw,
      row.totalDeductionsKrw,
      row.netPayKrw,
      row.payslipDistributedAt ?? "",
      row.payslipReceiptConfirmedAt ?? ""
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function buildYearEndFilingJsonl(rows: YearEndFilingRecord[]) {
  return rows.map((row) => JSON.stringify(row)).join("\n");
}

function buildYearEndFilingHometaxCsv(
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayloadShape
) {
  const header = [
    "year",
    "employeeId",
    "finalizationId",
    "runId",
    "grossPayKrw",
    "taxableAnnualIncomeKrw",
    "annualTaxLiabilityKrw",
    "withholdingDeltaKrw",
    "withholdingTaxKrw",
    "totalDeductionsKrw",
    "netPayKrw",
    "receiptConfirmedAt"
  ].join(",");
  const lines = rows.map((row) =>
    [
      payload.year,
      payload.employeeId,
      payload.finalizationId,
      row.runId,
      row.grossPayKrw,
      payload.settlementKrw.taxableAnnualIncomeKrw,
      payload.settlementKrw.annualTaxLiabilityKrw,
      payload.settlementKrw.withholdingDeltaKrw,
      row.withholdingTaxKrw,
      row.totalDeductionsKrw,
      row.netPayKrw,
      row.payslipReceiptConfirmedAt ?? ""
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

export function buildYearEndWithholdingReceiptDocumentArtifact(
  receipt: PayrollYearEndWithholdingReceiptSummaryShape,
  format: PayrollYearEndWithholdingReceiptDocumentFormat
) {
  if (format === "text") {
    const lines = [
      "FlowHR Withholding Receipt",
      "",
      `Year: ${receipt.year}`,
      `Employee ID: ${receipt.employeeId}`,
      `Receipt Number: ${receipt.receiptNumber}`,
      `Issued At: ${receipt.issuedAt ?? "-"}`,
      `Issuer: ${receipt.issuerName}`,
      "",
      "Annual Totals (KRW)",
      `- Gross Pay: ${receipt.annualTotalsKrw.grossPayKrw.toLocaleString("ko-KR")}`,
      `- Withholding Tax: ${receipt.annualTotalsKrw.withholdingTaxKrw.toLocaleString("ko-KR")}`,
      `- Social Insurance: ${receipt.annualTotalsKrw.socialInsuranceKrw.toLocaleString("ko-KR")}`,
      `- Other Deductions: ${receipt.annualTotalsKrw.otherDeductionsKrw.toLocaleString("ko-KR")}`,
      `- Total Deductions: ${receipt.annualTotalsKrw.totalDeductionsKrw.toLocaleString("ko-KR")}`,
      `- Net Pay: ${receipt.annualTotalsKrw.netPayKrw.toLocaleString("ko-KR")}`,
      "",
      "Run States",
      `- Total: ${receipt.runStates.totalRuns}`,
      `- Confirmed: ${receipt.runStates.confirmedRuns}`,
      `- Previewed: ${receipt.runStates.previewedRuns}`,
      `- Undistributed: ${receipt.runStates.undistributedRuns}`,
      `- Pending Receipt: ${receipt.runStates.pendingReceiptRuns}`,
      "",
      `Blocking Reasons: ${receipt.blockingReasons.join(" | ") || "-"}`,
      ""
    ];
    return {
      content: lines.join("\n"),
      contentType: "text/plain; charset=utf-8",
      fileName: `withholding-receipt-${receipt.year}-${receipt.employeeId}.txt`
    };
  }

  return {
    content: JSON.stringify(
      {
        receipt
      },
      null,
      2
    ),
    contentType: "application/json; charset=utf-8",
    fileName: `withholding-receipt-${receipt.year}-${receipt.employeeId}.json`
  };
}

export function buildYearEndFilingRecords(runs: YearEndFilingRunShape[]): YearEndFilingRecord[] {
  return runs
    .map((run) => {
      const withholdingTaxKrw = run.withholdingTaxKrw ?? 0;
      const socialInsuranceKrw = run.socialInsuranceKrw ?? 0;
      const otherDeductionsKrw = run.otherDeductionsKrw ?? 0;
      const totalDeductionsKrw =
        run.totalDeductionsKrw ?? withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw;
      const netPayKrw = run.netPayKrw ?? run.grossPayKrw - totalDeductionsKrw;
      return {
        runId: run.id,
        periodStart: run.periodStart.toISOString(),
        periodEnd: run.periodEnd.toISOString(),
        state: run.state,
        grossPayKrw: run.grossPayKrw,
        withholdingTaxKrw,
        socialInsuranceKrw,
        otherDeductionsKrw,
        totalDeductionsKrw,
        netPayKrw,
        payslipDistributedAt: run.payslipDistributedAt?.toISOString() ?? null,
        payslipReceiptConfirmedAt: run.payslipReceiptConfirmedAt?.toISOString() ?? null
      };
    })
    .sort((left, right) => left.runId.localeCompare(right.runId));
}

export function buildYearEndFilingArtifact(
  format: PayrollYearEndFilingExportFormat,
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayloadShape
) {
  let content = "";
  let contentType = "application/json";
  let fileName = `payroll-year-end-${payload.year}-${payload.employeeId}.json`;

  if (format === "csv") {
    content = buildYearEndFilingCsv(rows, payload);
    contentType = "text/csv";
    fileName = `payroll-year-end-${payload.year}-${payload.employeeId}.csv`;
  } else if (format === "jsonl") {
    content = buildYearEndFilingJsonl(rows);
    contentType = "application/x-ndjson";
    fileName = `payroll-year-end-${payload.year}-${payload.employeeId}.jsonl`;
  } else if (format === "hometax_csv") {
    content = buildYearEndFilingHometaxCsv(rows, payload);
    contentType = "text/csv";
    fileName = `payroll-year-end-${payload.year}-${payload.employeeId}.hometax.csv`;
  } else {
    content = JSON.stringify(
      {
        year: payload.year,
        employeeId: payload.employeeId,
        finalizationId: payload.finalizationId,
        finalizedAt: payload.finalizedAt,
        records: rows
      },
      null,
      2
    );
  }

  return {
    fileName,
    contentType,
    content,
    byteLength: Buffer.byteLength(content, "utf8"),
    checksumSha256: createHash("sha256").update(content).digest("hex")
  };
}

export function validateYearEndFilingRecords(
  rows: YearEndFilingRecord[],
  payload: YearEndFinalizationAuditPayloadShape
) {
  const aggregated = rows.reduce(
    (totals, row) => ({
      grossPayKrw: totals.grossPayKrw + row.grossPayKrw,
      withholdingTaxKrw: totals.withholdingTaxKrw + row.withholdingTaxKrw,
      totalDeductionsKrw: totals.totalDeductionsKrw + row.totalDeductionsKrw,
      netPayKrw: totals.netPayKrw + row.netPayKrw
    }),
    {
      grossPayKrw: 0,
      withholdingTaxKrw: 0,
      totalDeductionsKrw: 0,
      netPayKrw: 0
    }
  );

  const checks = {
    totalsMatch:
      aggregated.grossPayKrw === payload.annualTotalsKrw.grossPayKrw &&
      aggregated.withholdingTaxKrw === payload.annualTotalsKrw.withholdingTaxKrw &&
      aggregated.totalDeductionsKrw === payload.annualTotalsKrw.totalDeductionsKrw &&
      aggregated.netPayKrw === payload.annualTotalsKrw.netPayKrw,
    confirmedRunCountMatch: rows.length === payload.runStates.confirmedRuns,
    uniqueRunIds: new Set(rows.map((row) => row.runId)).size === rows.length,
    receiptCoverage: rows.every(
      (row) => typeof row.payslipReceiptConfirmedAt === "string" && row.payslipReceiptConfirmedAt.length > 0
    ),
    nonNegativeAmounts: rows.every(
      (row) =>
        row.grossPayKrw >= 0 &&
        row.withholdingTaxKrw >= 0 &&
        row.socialInsuranceKrw >= 0 &&
        row.otherDeductionsKrw >= 0 &&
        row.totalDeductionsKrw >= 0 &&
        row.netPayKrw >= 0
    )
  };

  const issues: string[] = [];
  if (!checks.totalsMatch) {
    issues.push("record totals do not match finalized annual totals");
  }
  if (!checks.confirmedRunCountMatch) {
    issues.push("record count does not match confirmed run count from finalization");
  }
  if (!checks.uniqueRunIds) {
    issues.push("duplicate run IDs detected in filing records");
  }
  if (!checks.receiptCoverage) {
    issues.push("one or more filing records are missing payslip receipt confirmation");
  }
  if (!checks.nonNegativeAmounts) {
    issues.push("one or more filing records include negative KRW amounts");
  }

  return {
    status: issues.length === 0 ? "pass" : "fail",
    issues,
    checks
  } as const;
}
