export type EmployeeBenefitsSourceEntry = {
  hint: string;
  returnLabel: string;
};

export function resolveEmployeeBenefitsSourceEntry(
  source: string | null,
  isKoLocale: boolean
): EmployeeBenefitsSourceEntry | null {
  if (source !== "employee-dashboard") {
    return null;
  }
  return {
    hint: isKoLocale
      ? "\uC9C1\uC6D0 \uB300\uC2DC\uBCF4\uB4DC\uC5D0\uC11C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4."
      : "Opened from employee dashboard.",
    returnLabel: isKoLocale
      ? "\uB300\uC2DC\uBCF4\uB4DC\uB85C \uB3CC\uC544\uAC00\uAE30"
      : "Back to dashboard"
  };
}
