type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";

export type AdminApprovalPolicyLocaleCopy = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    devNotice: string;
  };
  context: {
    title: string;
    organizationId: string;
    adminActorId: string;
    accessTokenOptional: string;
    bearerPlaceholder: string;
    loadPolicy: string;
    loadDelegations: string;
    sessionError: string;
    policyState: string;
    configured: string;
    defaultFallback: string;
  };
  policy: {
    title: string;
    attendanceApproverRole: string;
    leaveApproverRole: string;
    payrollApproverRole: string;
    savePolicy: string;
  };
  delegationCreate: {
    title: string;
    domain: string;
    delegatorRole: string;
    delegateActorId: string;
    startsAt: string;
    endsAt: string;
    reasonOptional: string;
    createDelegation: string;
  };
  delegationList: {
    title: string;
    expireDelegations: string;
    dryRun: string;
    execute: string;
    preview: string;
    lastResult: string;
    checked: string;
    expired: string;
    dryRunValue: string;
    noDelegations: string;
    active: string;
    inactive: string;
    deactivate: string;
  };
  logs: {
    title: string;
    total: string;
    success: string;
    fail: string;
    inProgress: string;
    empty: string;
    okBadge: string;
    failBadge: string;
    toAdmin: string;
  };
  apiLabels: {
    loadPolicy: string;
    savePolicy: string;
    loadDelegations: string;
    createDelegation: string;
    deactivateDelegation: string;
    expireDelegations: string;
  };
  domainLabels: Record<ApprovalDomain, string>;
};

const COPY_BY_LOCALE: Record<"ko" | "en", AdminApprovalPolicyLocaleCopy> = {
  ko: {
    hero: {
      eyebrow: "FlowHR 관리자",
      title: "결재/위임 정책",
      description: "도메인별 기본 결재 역할과 임시 위임 규칙을 관리합니다.",
      devNotice: "개발 도구 모드에서는 헤더 기반 액터 컨텍스트를 사용합니다."
    },
    context: {
      title: "작업 조건",
      organizationId: "조직",
      adminActorId: "세션 액터",
      accessTokenOptional: "액세스 토큰 (선택)",
      bearerPlaceholder: "Bearer 토큰",
      loadPolicy: "정책 조회",
      loadDelegations: "위임 조회",
      sessionError: "세션 오류",
      policyState: "현재 정책 상태",
      configured: "설정됨",
      defaultFallback: "기본값 사용"
    },
    policy: {
      title: "도메인별 결재 역할",
      attendanceApproverRole: "근태 승인 역할",
      leaveApproverRole: "휴가 승인 역할",
      payrollApproverRole: "급여 확정 역할",
      savePolicy: "정책 저장"
    },
    delegationCreate: {
      title: "위임 생성",
      domain: "도메인",
      delegatorRole: "위임자 역할",
      delegateActorId: "수임자 직원 번호",
      startsAt: "시작 시각",
      endsAt: "종료 시각",
      reasonOptional: "사유 (선택)",
      createDelegation: "위임 생성"
    },
    delegationList: {
      title: "위임 목록",
      expireDelegations: "만료 위임 정리",
      dryRun: "드라이런",
      execute: "실행",
      preview: "미리보기",
      lastResult: "최근 정리 결과",
      checked: "검사",
      expired: "만료",
      dryRunValue: "드라이런",
      noDelegations: "등록된 위임이 없습니다.",
      active: "활성",
      inactive: "비활성",
      deactivate: "비활성화"
    },
    logs: {
      title: "요청 로그",
      total: "총",
      success: "성공",
      fail: "실패",
      inProgress: "진행 중",
      empty: "아직 API 호출 이력이 없습니다.",
      okBadge: "성공",
      failBadge: "실패",
      toAdmin: "관리자 홈으로"
    },
    apiLabels: {
      loadPolicy: "결재 정책 조회",
      savePolicy: "결재 정책 저장",
      loadDelegations: "위임 목록 조회",
      createDelegation: "위임 생성",
      deactivateDelegation: "위임 비활성화",
      expireDelegations: "만료 위임 정리"
    },
    domainLabels: {
      ATTENDANCE: "근태",
      LEAVE: "휴가",
      PAYROLL: "급여"
    }
  },
  en: {
    hero: {
      eyebrow: "FlowHR Admin",
      title: "Approval and delegation policy",
      description: "Configure domain-default approval roles and temporary delegation policies.",
      devNotice: "In dev-tools mode, header-based actor context is used."
    },
    context: {
      title: "Work conditions",
      organizationId: "Organization",
      adminActorId: "Session actor",
      accessTokenOptional: "Access Token (optional)",
      bearerPlaceholder: "Bearer token",
      loadPolicy: "Load policy",
      loadDelegations: "Load delegations",
      sessionError: "Session error",
      policyState: "Current policy state",
      configured: "Configured",
      defaultFallback: "Default fallback"
    },
    policy: {
      title: "Domain approval roles",
      attendanceApproverRole: "Attendance approver role",
      leaveApproverRole: "Leave approver role",
      payrollApproverRole: "Payroll finalizer role",
      savePolicy: "Save policy"
    },
    delegationCreate: {
      title: "Create delegation",
      domain: "Domain",
      delegatorRole: "Delegator role",
      delegateActorId: "Delegate employee number",
      startsAt: "Start time",
      endsAt: "End time",
      reasonOptional: "Reason (optional)",
      createDelegation: "Create delegation"
    },
    delegationList: {
      title: "Delegation list",
      expireDelegations: "Expire delegations",
      dryRun: "Dry-run",
      execute: "Execute",
      preview: "Preview",
      lastResult: "Last expiry result",
      checked: "checked",
      expired: "expired",
      dryRunValue: "dryRun",
      noDelegations: "No delegations found.",
      active: "ACTIVE",
      inactive: "INACTIVE",
      deactivate: "Deactivate"
    },
    logs: {
      title: "Request logs",
      total: "Total",
      success: "Success",
      fail: "Fail",
      inProgress: "In progress",
      empty: "No API call history yet.",
      okBadge: "OK",
      failBadge: "FAIL",
      toAdmin: "Back to admin home"
    },
    apiLabels: {
      loadPolicy: "Load approval policy",
      savePolicy: "Save approval policy",
      loadDelegations: "Load delegations",
      createDelegation: "Create delegation",
      deactivateDelegation: "Deactivate delegation",
      expireDelegations: "Expire delegations"
    },
    domainLabels: {
      ATTENDANCE: "Attendance",
      LEAVE: "Leave",
      PAYROLL: "Payroll"
    }
  }
};

export function resolveAdminApprovalPolicyLocaleCopy(isKoLocale: boolean) {
  return COPY_BY_LOCALE[isKoLocale ? "ko" : "en"];
}

export function formatApprovalPolicyDateTime(value: string, runtimeLocale: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}
