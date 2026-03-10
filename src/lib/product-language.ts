type LocaleKey = "ko" | "en";

function toLocaleKey(locale: string): LocaleKey {
  return locale.toLowerCase().startsWith("ko") ? "ko" : "en";
}

function humanizeToken(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const employeeStatusLabels = {
  ko: {
    ACTIVE: "재직 중",
    ON_LEAVE: "휴직 중",
    RESIGNED: "퇴직"
  },
  en: {
    ACTIVE: "Active",
    ON_LEAVE: "On leave",
    RESIGNED: "Resigned"
  }
} as const;

const notificationTypeLabels = {
  ko: {
    LEAVE_REQUESTED: "휴가 요청",
    LEAVE_APPROVED: "휴가 승인",
    LEAVE_REJECTED: "휴가 반려",
    ATTENDANCE_APPROVED: "출퇴근 승인",
    ATTENDANCE_REJECTED: "출퇴근 반려",
    PAYSLIP_READY: "급여명세서 발행"
  },
  en: {
    LEAVE_REQUESTED: "Leave requested",
    LEAVE_APPROVED: "Leave approved",
    LEAVE_REJECTED: "Leave rejected",
    ATTENDANCE_APPROVED: "Attendance approved",
    ATTENDANCE_REJECTED: "Attendance rejected",
    PAYSLIP_READY: "Payslip ready"
  }
} as const;

const approvalDomainLabels = {
  ko: {
    ATTENDANCE: "근태",
    LEAVE: "휴가",
    PAYROLL: "급여"
  },
  en: {
    ATTENDANCE: "Attendance",
    LEAVE: "Leave",
    PAYROLL: "Payroll"
  }
} as const;

const approvalEntityTypeLabels = {
  ko: {
    AttendanceRecord: "출퇴근 정정 요청",
    attendance_record: "출퇴근 정정 요청",
    LeaveRequest: "휴가 요청",
    leave_request: "휴가 요청",
    PayrollRun: "급여 승인 요청",
    payroll_run: "급여 승인 요청",
    BENEFIT_REQUEST: "복리후생 요청",
    benefit_request: "복리후생 요청",
    CONTRACT_DOCUMENT: "계약 문서",
    ContractDocument: "계약 문서",
    ContractTemplate: "계약 템플릿",
    Employee: "직원",
    employee: "직원",
    Department: "부서",
    department: "부서",
    Position: "직급",
    position: "직급",
    Organization: "조직",
    organization: "조직",
    PayrollYearEnd: "연말정산",
    Notice: "공지",
    notice: "공지",
    AuthInvite: "초대",
    AuthUser: "사용자"
  },
  en: {
    AttendanceRecord: "Attendance correction",
    attendance_record: "Attendance correction",
    LeaveRequest: "Leave request",
    leave_request: "Leave request",
    PayrollRun: "Payroll approval",
    payroll_run: "Payroll approval",
    BENEFIT_REQUEST: "Benefit request",
    benefit_request: "Benefit request",
    CONTRACT_DOCUMENT: "Contract document",
    ContractDocument: "Contract document",
    ContractTemplate: "Contract template",
    Employee: "Employee",
    employee: "Employee",
    Department: "Department",
    department: "Department",
    Position: "Position",
    position: "Position",
    Organization: "Organization",
    organization: "Organization",
    PayrollYearEnd: "Year-end payroll",
    Notice: "Notice",
    notice: "Notice",
    AuthInvite: "Invite",
    AuthUser: "User"
  }
} as const;

const actorRoleLabels = {
  ko: {
    admin: "관리자",
    employee: "직원",
    manager: "매니저",
    payroll_operator: "급여 담당",
    system: "시스템"
  },
  en: {
    admin: "Admin",
    employee: "Employee",
    manager: "Manager",
    payroll_operator: "Payroll operator",
    system: "System"
  }
} as const;

const stageResolutionLabels = {
  ko: {
    EXPECTED_ROLE: "권한 일치",
    ACTIVE_DELEGATION: "활성 위임",
    PRIVILEGED_BYPASS: "관리자 우회",
    DENIED: "권한 없음"
  },
  en: {
    EXPECTED_ROLE: "Expected role",
    ACTIVE_DELEGATION: "Active delegation",
    PRIVILEGED_BYPASS: "Privileged bypass",
    DENIED: "Denied"
  }
} as const;

const approvalStateLabels = {
  ko: {
    PENDING: "대기",
    APPROVED: "승인",
    REJECTED: "반려"
  },
  en: {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected"
  }
} as const;

const notificationChannelLabels = {
  ko: {
    "approval-stalled-queue": "결재 지연 알림"
  },
  en: {
    "approval-stalled-queue": "Approval stalled alert"
  }
} as const;

const auditActionLabels = {
  ko: {
    "employee.created": "직원 생성",
    "employee.profile.updated": "직원 프로필 변경"
  },
  en: {
    "employee.created": "Employee created",
    "employee.profile.updated": "Employee profile updated"
  }
} as const;

export function formatEmployeeStatusLabel(status: string, locale: string) {
  const key = toLocaleKey(locale);
  return employeeStatusLabels[key][status as keyof (typeof employeeStatusLabels)[typeof key]] ?? humanizeToken(status);
}

export function formatNotificationTypeLabel(type: string, locale: string) {
  const key = toLocaleKey(locale);
  return notificationTypeLabels[key][type as keyof (typeof notificationTypeLabels)[typeof key]] ?? humanizeToken(type);
}

export function formatApprovalDomainLabel(domain: string, locale: string) {
  const key = toLocaleKey(locale);
  return approvalDomainLabels[key][domain as keyof (typeof approvalDomainLabels)[typeof key]] ?? humanizeToken(domain);
}

export function formatApprovalEntityTypeLabel(entityType: string, locale: string) {
  const key = toLocaleKey(locale);
  return (
    approvalEntityTypeLabels[key][entityType as keyof (typeof approvalEntityTypeLabels)[typeof key]] ??
    humanizeToken(entityType)
  );
}

export function formatActorRoleLabel(role: string, locale: string) {
  const key = toLocaleKey(locale);
  return actorRoleLabels[key][role as keyof (typeof actorRoleLabels)[typeof key]] ?? humanizeToken(role);
}

export function formatApprovalStageResolutionLabel(value: string, locale: string) {
  const key = toLocaleKey(locale);
  return stageResolutionLabels[key][value as keyof (typeof stageResolutionLabels)[typeof key]] ?? humanizeToken(value);
}

export function formatApprovalExecutionStateLabel(value: string, locale: string) {
  const key = toLocaleKey(locale);
  return approvalStateLabels[key][value as keyof (typeof approvalStateLabels)[typeof key]] ?? humanizeToken(value);
}

export function formatNotificationChannelLabel(value: string, locale: string) {
  const key = toLocaleKey(locale);
  return (
    notificationChannelLabels[key][value as keyof (typeof notificationChannelLabels)[typeof key]] ??
    humanizeToken(value)
  );
}

export function formatAuditActionLabel(action: string, locale: string) {
  const key = toLocaleKey(locale);
  return auditActionLabels[key][action as keyof (typeof auditActionLabels)[typeof key]] ?? humanizeToken(action);
}

export function formatEmployeeDisplayName(name: string | null | undefined, locale: string) {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return toLocaleKey(locale) === "ko" ? "이름 미등록 직원" : "Unnamed employee";
}

export function formatOrganizationDisplayName(name: string | null | undefined, locale: string) {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return toLocaleKey(locale) === "ko" ? "이름 미등록 조직" : "Unnamed organization";
}

export function formatDepartmentDisplayName(name: string | null | undefined, locale: string) {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return toLocaleKey(locale) === "ko" ? "이름 미등록 부서" : "Unnamed department";
}

export function formatPositionDisplayName(name: string | null | undefined, locale: string) {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return toLocaleKey(locale) === "ko" ? "이름 미등록 직급" : "Unnamed position";
}

export function formatWorkspaceConnectionState(hasWorkspace: boolean, locale: string) {
  if (hasWorkspace) {
    return toLocaleKey(locale) === "ko" ? "작업 공간 연결됨" : "Workspace connected";
  }
  return toLocaleKey(locale) === "ko" ? "작업 공간 미연결" : "Workspace unavailable";
}

export function formatAdminSessionConnectionState(hasAdminSession: boolean, locale: string) {
  if (hasAdminSession) {
    return toLocaleKey(locale) === "ko" ? "관리자 세션 연결됨" : "Admin session connected";
  }
  return toLocaleKey(locale) === "ko" ? "관리자 세션 미연결" : "Admin session unavailable";
}

export function formatEmployeeSessionConnectionState(hasEmployeeSession: boolean, locale: string) {
  if (hasEmployeeSession) {
    return toLocaleKey(locale) === "ko" ? "직원 세션 연결됨" : "Employee session connected";
  }
  return toLocaleKey(locale) === "ko" ? "직원 세션 미연결" : "Employee session unavailable";
}

export function formatPublicEmployeeNumber(id: string | null | undefined) {
  const normalized = id?.trim() ?? "";
  if (!normalized) {
    return "-";
  }
  if (/^EMP[-_]/i.test(normalized)) {
    return normalized;
  }
  return `EMP-${normalized.slice(-4).toUpperCase()}`;
}

export function formatUserFacingErrorMessage(message: string, locale: string) {
  const key = toLocaleKey(locale);
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("missing or invalid actor context") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden")
  ) {
    return key === "ko"
      ? "인증에 실패했습니다. 다시 로그인해 주세요."
      : "Authentication failed. Please sign in again.";
  }

  if (normalized.includes("organization_id_required") || normalized.includes("organization id")) {
    return key === "ko"
      ? "조직 정보가 확인되지 않습니다. 다시 로그인해 주세요."
      : "Organization context is missing. Please sign in again.";
  }

  if (normalized.includes("not found")) {
    return key === "ko" ? "대상을 찾을 수 없습니다." : "The requested item could not be found.";
  }

  return message;
}

export function formatApprovalQueueRequestLabel(queue: "attendance" | "leave" | "payroll", locale: string) {
  if (queue === "attendance") {
    return toLocaleKey(locale) === "ko" ? "출퇴근 정정 요청" : "Attendance correction";
  }
  if (queue === "leave") {
    return toLocaleKey(locale) === "ko" ? "휴가 요청" : "Leave request";
  }
  return toLocaleKey(locale) === "ko" ? "급여 승인 요청" : "Payroll approval";
}
