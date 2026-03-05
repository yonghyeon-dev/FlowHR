import type { OrganizationEntity } from "@/features/shared/data-access";

export const DEFAULT_INSURANCE_RATES = Object.freeze({
  nps: 0.045,
  nhi: 0.03545,
  ei: 0.009,
  wci: null as number | null,
  effectiveYear: 2026
});

export type InsuranceRates = {
  nps: number;
  nhi: number;
  ei: number;
  wci: number | null;
  effectiveYear: number;
};

type OrganizationInsuranceRateOverrides = Pick<
  OrganizationEntity,
  "insuranceRateNps" | "insuranceRateNhi" | "insuranceRateEi" | "insuranceRateWci"
>;

export function resolveInsuranceRates(
  organization: OrganizationInsuranceRateOverrides | null | undefined
): InsuranceRates {
  return {
    nps: organization?.insuranceRateNps ?? DEFAULT_INSURANCE_RATES.nps,
    nhi: organization?.insuranceRateNhi ?? DEFAULT_INSURANCE_RATES.nhi,
    ei: organization?.insuranceRateEi ?? DEFAULT_INSURANCE_RATES.ei,
    wci: organization?.insuranceRateWci ?? DEFAULT_INSURANCE_RATES.wci,
    effectiveYear: DEFAULT_INSURANCE_RATES.effectiveYear
  };
}
