import type { InviteDeliveryMode, InviteRole } from "@/app/admin/page-types";

const DEMO_ORG_NAME_BY_LOCALE = {
  ko: "FlowHR 데모 조직",
  en: "FlowHR Demo Org"
} as const;

const QUEUE_LABELS_BY_LOCALE = {
  ko: {
    all: "전체",
    attendance: "출퇴근",
    leave: "휴가",
    payroll: "급여"
  },
  en: {
    all: "All",
    attendance: "Attendance",
    leave: "Leave",
    payroll: "Payroll"
  }
} as const;

const WORK_TYPE_LABELS_BY_LOCALE = {
  ko: {
    holiday: "휴일",
    work: "근무"
  },
  en: {
    holiday: "Holiday",
    work: "Work"
  }
} as const;

const LOG_STATUS_LABELS_BY_LOCALE = {
  ko: {
    success: "성공",
    fail: "실패"
  },
  en: {
    success: "OK",
    fail: "FAIL"
  }
} as const;

const INVITE_ROLE_LABELS_BY_LOCALE: Record<"ko" | "en", Record<InviteRole, string>> = {
  ko: {
    employee: "직원",
    manager: "매니저",
    payroll_operator: "급여 담당",
    admin: "관리자"
  },
  en: {
    employee: "Employee",
    manager: "Manager",
    payroll_operator: "Payroll Operator",
    admin: "Admin"
  }
};

const INVITE_DELIVERY_MODE_LABELS_BY_LOCALE: Record<
  "ko" | "en",
  Record<InviteDeliveryMode, string>
> = {
  ko: {
    link: "링크",
    email: "이메일"
  },
  en: {
    link: "Link",
    email: "Email"
  }
};

export function isDefaultDemoOrganizationName(name: string) {
  return name === DEMO_ORG_NAME_BY_LOCALE.en || name === DEMO_ORG_NAME_BY_LOCALE.ko;
}

export function resolveAdminLocaleLabelBundle(isKoLocale: boolean) {
  const localeKey = isKoLocale ? "ko" : "en";
  return {
    demoOrganizationName: DEMO_ORG_NAME_BY_LOCALE[localeKey],
    notConfiguredLabel: isKoLocale ? "미설정" : "not configured",
    queueLabels: QUEUE_LABELS_BY_LOCALE[localeKey],
    workTypeLabels: WORK_TYPE_LABELS_BY_LOCALE[localeKey],
    logStatusLabels: LOG_STATUS_LABELS_BY_LOCALE[localeKey],
    inviteRoleLabels: INVITE_ROLE_LABELS_BY_LOCALE[localeKey],
    inviteDeliveryModeLabels: INVITE_DELIVERY_MODE_LABELS_BY_LOCALE[localeKey],
    updatedAtLabel: isKoLocale ? "업데이트" : "Updated"
  } as const;
}
