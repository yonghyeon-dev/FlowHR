import type { PayrollRunEntity } from "@/features/shared/data-access";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail } from "@/lib/http";

import {
  parseReportRangeQuery,
  readNestedNumber,
  requireAdmin,
  resolveEmployeeName,
  toCsv,
  toExportFileName
} from "../../shared";

const CSV_COLUMNS = [
  "employeeName",
  "basePay",
  "overtime",
  "totalDeductions",
  "nps",
  "nhi",
  "ei",
  "wci",
  "incomeTax",
  "localTax",
  "netPay"
] as const;

function firstNumber(value: unknown, paths: string[][]) {
  for (const path of paths) {
    const found = readNestedNumber(value, path);
    if (found !== null) {
      return found;
    }
  }
  return 0;
}

function extractPayrollAmounts(run: PayrollRunEntity) {
  const components = run.deductionBreakdown;

  const incomeTax = firstNumber(components, [
    ["additional", "components", "incomeTaxKrw"],
    ["additional", "incomeTaxKrw"]
  ]);
  const localTax = firstNumber(components, [
    ["additional", "components", "localIncomeTaxKrw"],
    ["additional", "components", "localTaxKrw"],
    ["additional", "localIncomeTaxKrw"],
    ["additional", "localTaxKrw"]
  ]);

  return {
    basePay: run.grossPayKrw,
    overtime: firstNumber(components, [
      ["additional", "overtimeKrw"],
      ["additional", "overtimePayKrw"],
      ["additional", "compensation", "overtimeKrw"],
      ["additional", "compensation", "overtimePayKrw"]
    ]),
    totalDeductions: run.totalDeductionsKrw ?? 0,
    nps: firstNumber(components, [
      ["additional", "components", "nationalPensionKrw"],
      ["additional", "components", "npsKrw"],
      ["additional", "nationalPensionKrw"],
      ["additional", "npsKrw"]
    ]),
    nhi: firstNumber(components, [
      ["additional", "components", "healthInsuranceKrw"],
      ["additional", "components", "nhiKrw"],
      ["additional", "healthInsuranceKrw"],
      ["additional", "nhiKrw"]
    ]),
    ei: firstNumber(components, [
      ["additional", "components", "employmentInsuranceKrw"],
      ["additional", "components", "eiKrw"],
      ["additional", "employmentInsuranceKrw"],
      ["additional", "eiKrw"]
    ]),
    wci: firstNumber(components, [
      ["additional", "components", "industrialAccidentKrw"],
      ["additional", "components", "wciKrw"],
      ["additional", "industrialAccidentKrw"],
      ["additional", "wciKrw"]
    ]),
    incomeTax,
    localTax,
    netPay: run.netPayKrw ?? run.grossPayKrw - (run.totalDeductionsKrw ?? 0)
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.reports.payroll.export");
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = parseReportRangeQuery(new URL(request.url));
  if (!parsed.ok) {
    return fail(400, "invalid query", parsed.error);
  }

  const dataAccess = getRuntimeDataAccess();
  const [employees, payrollRuns] = await Promise.all([
    dataAccess.employees.list({ organizationId: auth.organizationId }),
    dataAccess.payroll.listInPeriod({
      periodStart: parsed.query.from,
      periodEnd: parsed.query.to,
      organizationId: auth.organizationId
    })
  ]);
  const employeeById = new Map(employees.map((employee) => [employee.id, employee] as const));

  const rows = payrollRuns
    .filter((run) => run.employeeId && employeeById.has(run.employeeId))
    .map((run) => {
      const employee = employeeById.get(run.employeeId!)!;
      const amounts = extractPayrollAmounts(run);
      return [
        resolveEmployeeName(employee),
        amounts.basePay,
        amounts.overtime,
        amounts.totalDeductions,
        amounts.nps,
        amounts.nhi,
        amounts.ei,
        amounts.wci,
        amounts.incomeTax,
        amounts.localTax,
        amounts.netPay
      ];
    });

  const csv = toCsv([...CSV_COLUMNS], rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${toExportFileName("payroll-report")}"`
    }
  });
}

