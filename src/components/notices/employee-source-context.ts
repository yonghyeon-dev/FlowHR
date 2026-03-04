export type EmployeeNoticeSourceEntry = {
  hint: string;
  returnLabel: string;
};

export function resolveEmployeeNoticeSourceEntry(
  source: string | null,
  isKoLocale: boolean
): EmployeeNoticeSourceEntry | null {
  if (source !== "employee-dashboard") {
    return null;
  }
  return {
    hint: isKoLocale
      ? "직원 대시보드에서 이동했습니다."
      : "Opened from employee dashboard.",
    returnLabel: isKoLocale ? "대시보드로 돌아가기" : "Back to dashboard"
  };
}
