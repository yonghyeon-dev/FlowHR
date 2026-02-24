type AdminApprovalHistoryLocaleCopy = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    devActorNotice: string;
  };
  filters: {
    title: string;
    organizationId: string;
    adminActorId: string;
    accessTokenOptional: string;
    bearerPlaceholder: string;
    domain: string;
    targetEntityType: string;
    targetEntityTypePlaceholder: string;
    targetEntityId: string;
    allowed: string;
    resolution: string;
    limit: string;
    all: string;
    loadHistory: string;
    sessionError: string;
  };
  results: {
    title: string;
    empty: string;
    allowed: string;
    blocked: string;
    required: string;
    fallback: string;
    actor: string;
    stage: string;
    gross: string;
    matchedTemplates: string;
    delegations: string;
    evaluated: string;
  };
  logs: {
    title: string;
    total: string;
    success: string;
    fail: string;
    okBadge: string;
    failBadge: string;
    inProgress: string;
    empty: string;
    fetchHistory: string;
    goToExecutions: string;
    goToTemplates: string;
    goToAdminHome: string;
  };
};

const COPY_BY_LOCALE: Record<"ko" | "en", AdminApprovalHistoryLocaleCopy> = {
  ko: {
    hero: {
      eyebrow: "FlowHR 관리자",
      title: "결재 단계 이력",
      description: "승인 게이트 평가 결과(허용/차단, 템플릿 매칭, 위임 적용)를 조회합니다.",
      devActorNotice: "개발 모드에서는 헤더 기반 액터 컨텍스트를 사용합니다."
    },
    filters: {
      title: "컨텍스트/필터",
      organizationId: "조직 ID",
      adminActorId: "관리자 액터 ID (개발용 대체값)",
      accessTokenOptional: "액세스 토큰 (선택)",
      bearerPlaceholder: "베어러 토큰",
      domain: "도메인",
      targetEntityType: "대상 엔티티 타입",
      targetEntityTypePlaceholder: "AttendanceRecord / LeaveRequest / PayrollRun",
      targetEntityId: "대상 엔티티 ID",
      allowed: "허용 여부",
      resolution: "해결 유형",
      limit: "조회 개수 제한",
      all: "전체",
      loadHistory: "이력 조회",
      sessionError: "세션 오류"
    },
    results: {
      title: "조회 결과",
      empty: "조회된 이력이 없습니다.",
      allowed: "허용",
      blocked: "차단",
      required: "필수 역할",
      fallback: "대체값",
      actor: "액터",
      stage: "단계",
      gross: "총지급액",
      matchedTemplates: "매칭 템플릿",
      delegations: "위임",
      evaluated: "평가 시각"
    },
    logs: {
      title: "요청 로그",
      total: "총",
      success: "성공",
      fail: "실패",
      okBadge: "성공",
      failBadge: "실패",
      inProgress: "진행중",
      empty: "아직 API 호출 이력이 없습니다.",
      fetchHistory: "결재 단계 이력 조회",
      goToExecutions: "결재 실행 현황",
      goToTemplates: "결재 템플릿으로",
      goToAdminHome: "관리자 홈으로"
    }
  },
  en: {
    hero: {
      eyebrow: "FlowHR Admin",
      title: "Approval stage history",
      description: "Review gate-evaluation results (allowed/blocked, template matches, and active delegations).",
      devActorNotice: "In dev mode, header-based actor context is used."
    },
    filters: {
      title: "Context and filters",
      organizationId: "Organization ID",
      adminActorId: "Admin Actor ID (dev fallback)",
      accessTokenOptional: "Access Token (optional)",
      bearerPlaceholder: "Bearer token",
      domain: "Domain",
      targetEntityType: "Target Entity Type",
      targetEntityTypePlaceholder: "AttendanceRecord / LeaveRequest / PayrollRun",
      targetEntityId: "Target Entity ID",
      allowed: "Allowed",
      resolution: "Resolution",
      limit: "Limit",
      all: "ALL",
      loadHistory: "Load history",
      sessionError: "Session error"
    },
    results: {
      title: "History results",
      empty: "No history found.",
      allowed: "Allowed",
      blocked: "Blocked",
      required: "required roles",
      fallback: "fallback",
      actor: "actor",
      stage: "stage",
      gross: "gross",
      matchedTemplates: "matched templates",
      delegations: "delegations",
      evaluated: "evaluated"
    },
    logs: {
      title: "Request logs",
      total: "Total",
      success: "Success",
      fail: "Fail",
      okBadge: "OK",
      failBadge: "FAIL",
      inProgress: "In progress",
      empty: "No API call history yet.",
      fetchHistory: "Fetch approval stage history",
      goToExecutions: "Go to approval executions",
      goToTemplates: "Go to approval templates",
      goToAdminHome: "Back to admin home"
    }
  }
};

export function resolveAdminApprovalHistoryLocaleCopy(isKoLocale: boolean) {
  return COPY_BY_LOCALE[isKoLocale ? "ko" : "en"];
}

export function formatApprovalHistoryDateTime(value: string, runtimeLocale: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}
