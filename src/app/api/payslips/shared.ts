import type { Actor } from "@/lib/actor";
import type { DataAccess, PayrollRunEntity } from "@/features/shared/data-access";
import { readNestedNumber, resolveEmployeeName } from "@/app/api/admin/reports/shared";

const DEFAULT_PERIOD_START = new Date("2020-01-01T00:00:00.000Z");
const DEFAULT_PERIOD_END = new Date("2100-12-31T23:59:59.999Z");

type PayslipDeduction = {
  type: string;
  description: string;
  amount: number;
};

type PayslipItem = {
  type: string;
  description: string;
  amount: number;
};

export type PayslipSummaryResponse = {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  basePay: number;
  overtimePay: number;
  totalDeductions: number;
  netPay: number;
  status: "PREVIEWED" | "CONFIRMED";
  confirmedAt: string | null;
};

export type PayslipDetailResponse = PayslipSummaryResponse & {
  items: PayslipItem[];
  deductions: PayslipDeduction[];
};

export type PayslipRole = "admin" | "employee";

export type PayslipActor = Actor & {
  role: PayslipRole;
};

export function isPayslipActor(actor: Actor | null): actor is PayslipActor {
  return actor?.role === "admin" || actor?.role === "employee";
}

export function resolvePayslipScope(actor: PayslipActor) {
  const actorOrganizationId = actor.organizationId?.trim() ?? "";
  return {
    actorOrganizationId: actorOrganizationId.length > 0 ? actorOrganizationId : null
  };
}

export function parsePayslipPeriod(value: string | null) {
  if (!value) {
    return {
      period: null,
      periodStart: DEFAULT_PERIOD_START,
      periodEnd: DEFAULT_PERIOD_END
    };
  }

  const normalized = value.trim();
  const matched = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!matched) {
    return null;
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const monthLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    period: normalized,
    periodStart: new Date(`${matched[1]}-${matched[2]}-01T00:00:00+09:00`),
    periodEnd: new Date(`${matched[1]}-${matched[2]}-${String(monthLastDay).padStart(2, "0")}T23:59:59+09:00`)
  };
}

function toNonNegativeAmount(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

function toPayslipPeriodString(periodStart: Date) {
  const seoulValue = new Date(periodStart.getTime() + 9 * 60 * 60 * 1000);
  const year = seoulValue.getUTCFullYear();
  const month = String(seoulValue.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function firstNumber(value: unknown, paths: string[][]) {
  for (const path of paths) {
    const found = readNestedNumber(value, path);
    if (found !== null) {
      return toNonNegativeAmount(found);
    }
  }
  return 0;
}

function extractOvertimePay(run: PayrollRunEntity) {
  return firstNumber(run.deductionBreakdown, [
    ["additional", "overtimeKrw"],
    ["additional", "overtimePayKrw"],
    ["additional", "compensation", "overtimeKrw"],
    ["additional", "compensation", "overtimePayKrw"]
  ]);
}

function extractDeductions(run: PayrollRunEntity) {
  const incomeTax = firstNumber(run.deductionBreakdown, [
    ["additional", "components", "incomeTaxKrw"],
    ["additional", "incomeTaxKrw"]
  ]);
  const localIncomeTax = firstNumber(run.deductionBreakdown, [
    ["additional", "components", "localIncomeTaxKrw"],
    ["additional", "components", "localTaxKrw"],
    ["additional", "localIncomeTaxKrw"],
    ["additional", "localTaxKrw"]
  ]);
  const nps = firstNumber(run.deductionBreakdown, [
    ["additional", "components", "nationalPensionKrw"],
    ["additional", "components", "npsKrw"],
    ["additional", "nationalPensionKrw"],
    ["additional", "npsKrw"]
  ]);
  const nhi = firstNumber(run.deductionBreakdown, [
    ["additional", "components", "healthInsuranceKrw"],
    ["additional", "components", "nhiKrw"],
    ["additional", "healthInsuranceKrw"],
    ["additional", "nhiKrw"]
  ]);
  const ei = firstNumber(run.deductionBreakdown, [
    ["additional", "components", "employmentInsuranceKrw"],
    ["additional", "components", "eiKrw"],
    ["additional", "employmentInsuranceKrw"],
    ["additional", "eiKrw"]
  ]);
  const wci = firstNumber(run.deductionBreakdown, [
    ["additional", "components", "industrialAccidentKrw"],
    ["additional", "components", "wciKrw"],
    ["additional", "industrialAccidentKrw"],
    ["additional", "wciKrw"]
  ]);

  const taxFromBreakdown = incomeTax + localIncomeTax;
  const taxTotal = taxFromBreakdown > 0 ? taxFromBreakdown : toNonNegativeAmount(run.withholdingTaxKrw);

  const insuranceFromBreakdown = nps + nhi + ei + wci;
  const insuranceTotal =
    insuranceFromBreakdown > 0 ? insuranceFromBreakdown : toNonNegativeAmount(run.socialInsuranceKrw);

  const otherTotal = toNonNegativeAmount(run.otherDeductionsKrw);

  const deductions: PayslipDeduction[] = [];
  if (incomeTax > 0) {
    deductions.push({ type: "income_tax", description: "Income Tax", amount: incomeTax });
  }
  if (localIncomeTax > 0) {
    deductions.push({ type: "local_income_tax", description: "Local Income Tax", amount: localIncomeTax });
  }
  if (nps > 0) {
    deductions.push({ type: "national_pension", description: "National Pension", amount: nps });
  }
  if (nhi > 0) {
    deductions.push({ type: "health_insurance", description: "Health Insurance", amount: nhi });
  }
  if (ei > 0) {
    deductions.push({ type: "employment_insurance", description: "Employment Insurance", amount: ei });
  }
  if (wci > 0) {
    deductions.push({ type: "industrial_accident_insurance", description: "Industrial Accident Insurance", amount: wci });
  }

  if (taxFromBreakdown === 0 && taxTotal > 0) {
    deductions.push({ type: "tax", description: "Tax", amount: taxTotal });
  }
  if (insuranceFromBreakdown === 0 && insuranceTotal > 0) {
    deductions.push({ type: "insurance", description: "Insurance", amount: insuranceTotal });
  }
  if (otherTotal > 0) {
    deductions.push({ type: "other_deductions", description: "Other Deductions", amount: otherTotal });
  }

  return {
    deductions,
    taxTotal,
    insuranceTotal,
    otherTotal
  };
}

export function toPayslipSummary(
  run: PayrollRunEntity,
  employeeNameById: ReadonlyMap<string, string>
): PayslipSummaryResponse | null {
  if (!run.employeeId) {
    return null;
  }

  const overtimePay = extractOvertimePay(run);
  const deductionSummary = extractDeductions(run);
  const totalDeductions =
    run.totalDeductionsKrw ??
    deductionSummary.taxTotal + deductionSummary.insuranceTotal + deductionSummary.otherTotal;
  const netPay = run.netPayKrw ?? run.grossPayKrw - toNonNegativeAmount(totalDeductions);
  const employeeName = employeeNameById.get(run.employeeId) ?? resolveEmployeeName({ id: run.employeeId, name: null });

  return {
    id: run.id,
    employeeId: run.employeeId,
    employeeName,
    period: toPayslipPeriodString(run.periodStart),
    basePay: toNonNegativeAmount(run.grossPayKrw),
    overtimePay,
    totalDeductions: toNonNegativeAmount(totalDeductions),
    netPay: toNonNegativeAmount(netPay),
    status: run.state,
    confirmedAt: run.confirmedAt?.toISOString() ?? null
  };
}

export function toPayslipDetail(run: PayrollRunEntity, employeeName: string): PayslipDetailResponse | null {
  if (!run.employeeId) {
    return null;
  }

  const summary = toPayslipSummary(run, new Map([[run.employeeId, employeeName]]));
  if (!summary) {
    return null;
  }

  const deductions = extractDeductions(run).deductions;
  const items: PayslipItem[] = [
    {
      type: "base_pay",
      description: "Base Pay",
      amount: summary.basePay
    }
  ];
  if (summary.overtimePay > 0) {
    items.push({
      type: "overtime_pay",
      description: "Overtime Pay",
      amount: summary.overtimePay
    });
  }

  return {
    ...summary,
    items,
    deductions
  };
}

export async function resolveEmployeeNameMap(
  dataAccess: DataAccess,
  employeeIds: string[]
): Promise<Map<string, string>> {
  const uniqueEmployeeIds = Array.from(new Set(employeeIds.map((value) => value.trim()).filter((value) => value.length > 0)));
  if (uniqueEmployeeIds.length === 0) {
    return new Map();
  }

  const resolved = await Promise.all(
    uniqueEmployeeIds.map(async (employeeId) => {
      const employee = await dataAccess.employees.findById(employeeId);
      if (!employee) {
        return [employeeId, employeeId] as const;
      }
      return [employeeId, resolveEmployeeName(employee)] as const;
    })
  );
  return new Map(resolved);
}
