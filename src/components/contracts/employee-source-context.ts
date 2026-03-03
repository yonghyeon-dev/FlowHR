export type EmployeeContractsSourceEntry = {
  hint: string;
  returnLabel: string;
};

export function resolveEmployeeContractsSourceEntry(
  source: string | null,
  isKoLocale: boolean
): EmployeeContractsSourceEntry | null {
  if (source !== "employee-dashboard") {
    return null;
  }
  return {
    hint: isKoLocale
      ? "직원 대시보드 바로가기에서 이동했습니다."
      : "Opened from employee dashboard shortcut.",
    returnLabel: isKoLocale ? "대시보드로 돌아가기" : "Back to dashboard"
  };
}
