import type { Actor } from "@/lib/actor";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { getYearPeriodInSeoul } from "@/features/payroll/service-runtime-helpers";
import type { DataAccess, PayrollRunEntity } from "@/features/shared/data-access";
import type { PayrollTotalsKrw } from "@/features/payroll/service-output-types";

export type YearEndRunSnapshotContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

export type YearEndRunSnapshot = {
  organizationId: string | null;
  periodStart: Date;
  periodEnd: Date;
  runs: PayrollRunEntity[];
  confirmedRuns: PayrollRunEntity[];
  previewedRuns: PayrollRunEntity[];
  totalsKrw: PayrollTotalsKrw;
};

export function aggregatePayrollTotalsKrw(runs: PayrollRunEntity[]): PayrollTotalsKrw {
  return runs.reduce(
    (acc, run) => {
      const withholdingTaxKrw = run.withholdingTaxKrw ?? 0;
      const socialInsuranceKrw = run.socialInsuranceKrw ?? 0;
      const otherDeductionsKrw = run.otherDeductionsKrw ?? 0;
      const totalDeductionsKrw =
        run.totalDeductionsKrw ?? withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw;
      const netPayKrw = run.netPayKrw ?? run.grossPayKrw - totalDeductionsKrw;
      return {
        grossPayKrw: acc.grossPayKrw + run.grossPayKrw,
        withholdingTaxKrw: acc.withholdingTaxKrw + withholdingTaxKrw,
        socialInsuranceKrw: acc.socialInsuranceKrw + socialInsuranceKrw,
        otherDeductionsKrw: acc.otherDeductionsKrw + otherDeductionsKrw,
        totalDeductionsKrw: acc.totalDeductionsKrw + totalDeductionsKrw,
        netPayKrw: acc.netPayKrw + netPayKrw
      };
    },
    {
      grossPayKrw: 0,
      withholdingTaxKrw: 0,
      socialInsuranceKrw: 0,
      otherDeductionsKrw: 0,
      totalDeductionsKrw: 0,
      netPayKrw: 0
    }
  );
}

export async function loadYearEndRunSnapshot(
  context: YearEndRunSnapshotContext,
  year: number,
  employeeId: string
): Promise<YearEndRunSnapshot> {
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, employeeId);
  const { periodStart, periodEnd } = getYearPeriodInSeoul(year);
  const tenantScope = resolveTenantScope(context.actor);
  const runs = await context.dataAccess.payroll.listInPeriod({
    periodStart,
    periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId
  });
  const confirmedRuns = runs.filter((run) => run.state === "CONFIRMED");
  const previewedRuns = runs.filter((run) => run.state !== "CONFIRMED");
  return {
    organizationId: employee.organizationId,
    periodStart,
    periodEnd,
    runs,
    confirmedRuns,
    previewedRuns,
    totalsKrw: aggregatePayrollTotalsKrw(confirmedRuns)
  };
}
