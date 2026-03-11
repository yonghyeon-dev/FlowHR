export type EmployeeWorkspaceSourceEntry = {
  hint: string;
  returnHref: string;
  returnLabel: string;
};

export function resolveEmployeeWorkspaceSourceEntry(
  source: string | null,
  isKoLocale: boolean
): EmployeeWorkspaceSourceEntry | null {
  switch (source) {
    case "employee-dashboard":
      return {
        hint: isKoLocale ? "Today 홈에서 이동했습니다." : "Opened from Today home.",
        returnHref: "/employee",
        returnLabel: isKoLocale ? "Today로 돌아가기" : "Back to Today"
      };
    case "employee-requests":
      return {
        hint: isKoLocale
          ? "요청 워크스페이스에서 이동했습니다."
          : "Opened from requests workspace.",
        returnHref: "/employee/requests",
        returnLabel: isKoLocale
          ? "요청 워크스페이스로 돌아가기"
          : "Back to requests workspace"
      };
    case "employee-guide":
      return {
        hint: isKoLocale ? "가이드에서 이동했습니다." : "Opened from guide.",
        returnHref: "/employee/guide",
        returnLabel: isKoLocale ? "가이드로 돌아가기" : "Back to guide"
      };
    case "employee-schedule":
      return {
        hint: isKoLocale
          ? "일정 워크스페이스에서 이동했습니다."
          : "Opened from schedule workspace.",
        returnHref: "/employee/schedule",
        returnLabel: isKoLocale
          ? "일정 워크스페이스로 돌아가기"
          : "Back to schedule workspace"
      };
    default:
      return null;
  }
}

export function resolveEmployeeScheduleSourceEntry(
  source: string | null,
  isKoLocale: boolean
): EmployeeWorkspaceSourceEntry | null {
  return resolveEmployeeWorkspaceSourceEntry(source, isKoLocale);
}
