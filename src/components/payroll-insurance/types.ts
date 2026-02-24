export type PayrollInsuranceSettlementResponse = {
  summary: {
    sourceRecordCount: number;
    totals: {
      regular: number;
      overtime: number;
      night: number;
      holiday: number;
    };
    grossPayKrw: number;
    taxableBaseKrw: number;
    rounding: {
      mode: "round" | "floor" | "ceil";
      unitsKrw: {
        nationalPensionUnitKrw: number;
        healthInsuranceUnitKrw: number;
        longTermCareUnitKrw: number;
        employmentInsuranceUnitKrw: number;
        industrialAccidentUnitKrw: number;
      };
    };
    rawContributionKrw: {
      employee: {
        nationalPensionKrw: number;
        healthInsuranceKrw: number;
        longTermCareKrw: number;
        employmentInsuranceKrw: number;
      };
      employer: {
        nationalPensionKrw: number;
        healthInsuranceKrw: number;
        longTermCareKrw: number;
        employmentInsuranceKrw: number;
        industrialAccidentKrw: number;
      };
    };
    employeeContributionKrw: {
      nationalPensionKrw: number;
      healthInsuranceKrw: number;
      longTermCareKrw: number;
      employmentInsuranceKrw: number;
      totalKrw: number;
    };
    employerContributionKrw: {
      nationalPensionKrw: number;
      healthInsuranceKrw: number;
      longTermCareKrw: number;
      employmentInsuranceKrw: number;
      industrialAccidentKrw: number;
      totalKrw: number;
    };
    contributionBasesKrw: {
      nationalPensionBaseKrw: number;
      healthInsuranceBaseKrw: number;
      employmentInsuranceBaseKrw: number;
      industrialAccidentBaseKrw: number;
    };
    settlementKrw: {
      priorWithheldKrw: number;
      priorEmployerPaidKrw: number;
      employeeDeltaKrw: number;
      employerDeltaKrw: number;
      totalDeltaKrw: number;
    };
  };
};

export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};

export function formatKrw(value: number, runtimeLocale: string) {
  return `${value.toLocaleString(runtimeLocale)} KRW`;
}

export function defaultMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  return {
    periodStartDate: start.toISOString().slice(0, 10),
    periodEndDate: end.toISOString().slice(0, 10)
  };
}

export function toSeoulStartIso(dateValue: string) {
  return `${dateValue}T00:00:00+09:00`;
}

export function toSeoulEndIso(dateValue: string) {
  return `${dateValue}T23:59:59+09:00`;
}
