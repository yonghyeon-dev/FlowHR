import type { ApprovalDomain } from "@/app/admin/approval-templates/page-types";

export type AdminApprovalTemplatesLocaleCopy = {
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
    loadTemplates: string;
    sessionError: string;
  };
  create: {
    title: string;
    templateName: string;
    domain: string;
    payrollGrossMin: string;
    payrollGrossMax: string;
    payrollGrossMinPlaceholder: string;
    payrollGrossMaxPlaceholder: string;
    rolesLegend: string;
    activateOnCreate: string;
    active: string;
    inactive: string;
    createTemplate: string;
  };
  preview: {
    title: string;
    description: string;
    domain: string;
    actorRole: string;
    actorIdOptional: string;
    payrollGross: string;
    payrollGrossPlaceholder: string;
    runPreview: string;
    result: string;
    expected: string;
    fallback: string;
    actor: string;
    gross: string;
    matchedTemplates: string;
    delegations: string;
    allowed: string;
    blocked: string;
    noResult: string;
  };
  templateList: {
    title: string;
    empty: string;
    roles: string;
    stages: string;
    gross: string;
    created: string;
    updated: string;
    active: string;
    inactive: string;
    activate: string;
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
    toPolicy: string;
    toAdmin: string;
  };
  apiLabels: {
    fetchTemplates: string;
    createTemplate: string;
    gatePreview: string;
    activateTemplate: string;
    deactivateTemplate: string;
  };
  domainLabels: Record<ApprovalDomain, string>;
};

const COPY_BY_LOCALE: Record<"ko" | "en", AdminApprovalTemplatesLocaleCopy> = {
  ko: {
    hero: {
      eyebrow: "FlowHR 관리자",
      title: "결재 라인 템플릿",
      description:
        "도메인별 결재 역할 구성을 템플릿으로 관리합니다. 활성 템플릿은 게이트 평가 시 기본 정책보다 우선 적용됩니다.",
      devNotice: "개발 도구 모드에서는 헤더 기반 액터 컨텍스트를 사용합니다."
    },
    context: {
      title: "작업 조건",
      organizationId: "작업 공간 상태",
      adminActorId: "관리자 세션 상태",
      accessTokenOptional: "액세스 토큰 (선택)",
      bearerPlaceholder: "Bearer 토큰",
      loadTemplates: "템플릿 조회",
      sessionError: "세션 오류"
    },
    create: {
      title: "템플릿 생성",
      templateName: "템플릿 이름",
      domain: "도메인",
      payrollGrossMin: "급여 총액 하한 (KRW)",
      payrollGrossMax: "급여 총액 상한 (KRW)",
      payrollGrossMinPlaceholder: "비우면 하한 없음",
      payrollGrossMaxPlaceholder: "비우면 상한 없음",
      rolesLegend: "승인 가능 역할 (최소 1개)",
      activateOnCreate: "생성 즉시 활성화",
      active: "활성",
      inactive: "비활성",
      createTemplate: "템플릿 생성"
    },
    preview: {
      title: "게이트 프리뷰",
      description: "정책/템플릿/위임 조합 결과를 승인 전에 미리 확인합니다.",
      domain: "도메인",
      actorRole: "검증 액터 역할",
      actorIdOptional: "검증 직원 번호 (선택)",
      payrollGross: "급여 총액 (KRW)",
      payrollGrossPlaceholder: "비우면 급여 조건 미매칭으로 계산",
      runPreview: "게이트 프리뷰 실행",
      result: "결과",
      expected: "예상 역할",
      fallback: "기본 역할",
      actor: "액터",
      gross: "총급여",
      matchedTemplates: "매칭 템플릿",
      delegations: "활성 위임",
      allowed: "허용",
      blocked: "차단",
      noResult: "아직 프리뷰 결과가 없습니다."
    },
    templateList: {
      title: "템플릿 목록",
      empty: "등록된 템플릿이 없습니다.",
      roles: "역할",
      stages: "단계",
      gross: "총급여",
      created: "생성",
      updated: "수정",
      active: "활성",
      inactive: "비활성",
      activate: "활성화",
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
      toPolicy: "결재/위임 정책으로",
      toAdmin: "관리자 홈으로"
    },
    apiLabels: {
      fetchTemplates: "결재 라인 템플릿 조회",
      createTemplate: "결재 라인 템플릿 생성",
      gatePreview: "결재 게이트 프리뷰 실행",
      activateTemplate: "결재 라인 템플릿 활성화",
      deactivateTemplate: "결재 라인 템플릿 비활성화"
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
      title: "Approval line templates",
      description:
        "Manage domain-based approval-role sets as templates. Active templates take precedence over the policy fallback role at gate evaluation time.",
      devNotice: "In dev mode, header-based actor context is used."
    },
    context: {
      title: "Work conditions",
      organizationId: "Workspace status",
      adminActorId: "Admin session status",
      accessTokenOptional: "Access Token (optional)",
      bearerPlaceholder: "Bearer token",
      loadTemplates: "Load templates",
      sessionError: "Session error"
    },
    create: {
      title: "Create template",
      templateName: "Template name",
      domain: "Domain",
      payrollGrossMin: "Payroll gross min (KRW)",
      payrollGrossMax: "Payroll gross max (KRW)",
      payrollGrossMinPlaceholder: "Leave empty for no lower bound",
      payrollGrossMaxPlaceholder: "Leave empty for no upper bound",
      rolesLegend: "Eligible approver roles (at least 1)",
      activateOnCreate: "Activate on create",
      active: "Active",
      inactive: "Inactive",
      createTemplate: "Create template"
    },
    preview: {
      title: "Gate preview",
      description: "Check the policy/template/delegation resolution result before approval.",
      domain: "Domain",
      actorRole: "Actor role",
      actorIdOptional: "Employee number (optional)",
      payrollGross: "Payroll gross (KRW)",
      payrollGrossPlaceholder: "Leave empty to evaluate unmatched condition",
      runPreview: "Run gate preview",
      result: "Result",
      expected: "expected",
      fallback: "fallback",
      actor: "actor",
      gross: "gross",
      matchedTemplates: "matched templates",
      delegations: "active delegations",
      allowed: "Allowed",
      blocked: "Blocked",
      noResult: "No preview result yet."
    },
    templateList: {
      title: "Template list",
      empty: "No templates registered.",
      roles: "roles",
      stages: "stages",
      gross: "gross",
      created: "created",
      updated: "updated",
      active: "ACTIVE",
      inactive: "INACTIVE",
      activate: "Activate",
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
      toPolicy: "Go to approval/delegation policy",
      toAdmin: "Back to admin home"
    },
    apiLabels: {
      fetchTemplates: "Fetch approval line templates",
      createTemplate: "Create approval line template",
      gatePreview: "Run approval gate preview",
      activateTemplate: "Activate approval line template",
      deactivateTemplate: "Deactivate approval line template"
    },
    domainLabels: {
      ATTENDANCE: "Attendance",
      LEAVE: "Leave",
      PAYROLL: "Payroll"
    }
  }
};

export function resolveAdminApprovalTemplatesLocaleCopy(isKoLocale: boolean) {
  return COPY_BY_LOCALE[isKoLocale ? "ko" : "en"];
}

export function formatApprovalTemplateDateTime(value: string, runtimeLocale: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

export function formatApprovalTemplateKrw(
  value: number | null | undefined,
  runtimeLocale: string
) {
  if (value === null || value === undefined) {
    return "-";
  }
  return value.toLocaleString(runtimeLocale);
}
