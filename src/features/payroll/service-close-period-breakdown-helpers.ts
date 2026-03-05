import type { PayrollRunEntity } from "@/features/shared/data-access";

type WithholdingBreakdownKrw = {
  incomeTaxKrw: number;
  residentTaxKrw: number;
};

type SocialInsuranceBreakdownKrw = {
  nationalPensionKrw: number;
  healthInsuranceKrw: number;
  employmentInsuranceKrw: number;
  industrialAccidentKrw: number;
};

type ClosePeriodBreakdownKrw = {
  withholdingBreakdownKrw: WithholdingBreakdownKrw;
  socialInsuranceBreakdownKrw: SocialInsuranceBreakdownKrw;
};

function toNonNegativeIntegerOrNull(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function resolveRunWithholdingBreakdownKrw(run: PayrollRunEntity): WithholdingBreakdownKrw {
  const withholdingTaxKrw = run.withholdingTaxKrw ?? 0;
  const breakdown = asRecord(run.deductionBreakdown);
  const additional = asRecord(breakdown?.additional);
  const components = asRecord(additional?.components);

  const incomeTaxKrw = toNonNegativeIntegerOrNull(components?.incomeTaxKrw);
  const residentTaxKrw = toNonNegativeIntegerOrNull(components?.localIncomeTaxKrw);
  if (incomeTaxKrw !== null && residentTaxKrw !== null) {
    return { incomeTaxKrw, residentTaxKrw };
  }
  if (incomeTaxKrw !== null) {
    return {
      incomeTaxKrw,
      residentTaxKrw: Math.max(withholdingTaxKrw - incomeTaxKrw, 0)
    };
  }
  if (residentTaxKrw !== null) {
    return {
      incomeTaxKrw: Math.max(withholdingTaxKrw - residentTaxKrw, 0),
      residentTaxKrw
    };
  }

  const derivedIncomeTaxKrw = Math.round(withholdingTaxKrw / 1.1);
  return {
    incomeTaxKrw: derivedIncomeTaxKrw,
    residentTaxKrw: withholdingTaxKrw - derivedIncomeTaxKrw
  };
}

function resolveRunSocialInsuranceBreakdownKrw(run: PayrollRunEntity): SocialInsuranceBreakdownKrw {
  const breakdown = asRecord(run.deductionBreakdown);
  const additional = asRecord(breakdown?.additional);
  const components = asRecord(additional?.components);
  const insuranceBreakdown = asRecord(additional?.insuranceBreakdown);

  const longTermCareKrw = toNonNegativeIntegerOrNull(components?.longTermCareKrw) ?? 0;

  const nationalPensionKrw =
    toNonNegativeIntegerOrNull(insuranceBreakdown?.nps) ??
    toNonNegativeIntegerOrNull(components?.nationalPensionKrw) ??
    0;

  const healthInsuranceBaseKrw =
    toNonNegativeIntegerOrNull(insuranceBreakdown?.nhi) ??
    toNonNegativeIntegerOrNull(components?.healthInsuranceKrw) ??
    0;

  const employmentInsuranceKrw =
    toNonNegativeIntegerOrNull(insuranceBreakdown?.ei) ??
    toNonNegativeIntegerOrNull(components?.employmentInsuranceKrw) ??
    0;

  const industrialAccidentKrw =
    toNonNegativeIntegerOrNull(insuranceBreakdown?.wci) ??
    toNonNegativeIntegerOrNull(components?.workersCompensationKrw) ??
    0;

  return {
    nationalPensionKrw,
    healthInsuranceKrw: healthInsuranceBaseKrw + longTermCareKrw,
    employmentInsuranceKrw,
    industrialAccidentKrw
  };
}

export function aggregateClosePeriodBreakdownKrw(runs: PayrollRunEntity[]): ClosePeriodBreakdownKrw {
  return runs.reduce<ClosePeriodBreakdownKrw>(
    (acc, run) => {
      const withholding = resolveRunWithholdingBreakdownKrw(run);
      const socialInsurance = resolveRunSocialInsuranceBreakdownKrw(run);
      return {
        withholdingBreakdownKrw: {
          incomeTaxKrw: acc.withholdingBreakdownKrw.incomeTaxKrw + withholding.incomeTaxKrw,
          residentTaxKrw: acc.withholdingBreakdownKrw.residentTaxKrw + withholding.residentTaxKrw
        },
        socialInsuranceBreakdownKrw: {
          nationalPensionKrw:
            acc.socialInsuranceBreakdownKrw.nationalPensionKrw + socialInsurance.nationalPensionKrw,
          healthInsuranceKrw:
            acc.socialInsuranceBreakdownKrw.healthInsuranceKrw + socialInsurance.healthInsuranceKrw,
          employmentInsuranceKrw:
            acc.socialInsuranceBreakdownKrw.employmentInsuranceKrw + socialInsurance.employmentInsuranceKrw,
          industrialAccidentKrw:
            acc.socialInsuranceBreakdownKrw.industrialAccidentKrw + socialInsurance.industrialAccidentKrw
        }
      };
    },
    {
      withholdingBreakdownKrw: {
        incomeTaxKrw: 0,
        residentTaxKrw: 0
      },
      socialInsuranceBreakdownKrw: {
        nationalPensionKrw: 0,
        healthInsuranceKrw: 0,
        employmentInsuranceKrw: 0,
        industrialAccidentKrw: 0
      }
    }
  );
}
