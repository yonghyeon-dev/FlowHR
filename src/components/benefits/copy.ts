import type { FlowLocale } from "@/lib/i18n/locales";
import type { BenefitCatalogStatus, BenefitRequestStatus } from "@/features/benefits/types";

export type AdminBenefitsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  sessionTitle: string;
  organizationIdLabel: string;
  actorIdLabel: string;
  accessTokenLabel: string;
  refreshAction: string;
  catalogTitle: string;
  requestTitle: string;
  benefitLabel: string;
  createCatalogTitle: string;
  nameLabel: string;
  descriptionLabel: string;
  annualLimitLabel: string;
  createCatalogAction: string;
  decisionNoteLabel: string;
  approveAction: string;
  rejectAction: string;
  emptyCatalog: string;
  emptyRequests: string;
  statusLabel: string;
  amountLabel: string;
  reasonLabel: string;
  requestedAtLabel: string;
  requestFilterLabel: string;
  requestRiskFilterLabel: string;
  requestSearchLabel: string;
  requestSearchPlaceholder: string;
  clearSearchAction: string;
  filteredRequestSummaryLabel: string;
  overLimitRequestSummaryLabel: string;
  pendingAgingRiskSummaryLabel: string;
  overLimitBadgeLabel: string;
  overLimitAmountLabel: string;
  pendingAgingRiskBadgeLabel: string;
  filteredEmptyRequests: string;
  unknownBenefitLabel: string;
  statsLabel: string;
  requestStatsLabel: string;
  logsTitle: string;
  messages: {
    needOrganization: string;
    needName: string;
    needDescription: string;
    catalogCreated: string;
    requestDecided: string;
    loadFailed: string;
  };
  catalogStatus: Record<BenefitCatalogStatus, string>;
  requestStatus: Record<BenefitRequestStatus, string>;
  requestFilter: {
    all: string;
    SUBMITTED: string;
    APPROVED: string;
    REJECTED: string;
    CANCELED: string;
  };
  requestRiskFilter: {
    all: string;
    overLimit: string;
  };
};

export type EmployeeBenefitsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  sessionTitle: string;
  organizationIdLabel: string;
  employeeIdLabel: string;
  accessTokenLabel: string;
  refreshAction: string;
  catalogTitle: string;
  submitTitle: string;
  requestTitle: string;
  benefitLabel: string;
  amountLabel: string;
  reasonLabel: string;
  submitAction: string;
  emptyCatalog: string;
  emptyRequests: string;
  annualLimitLabel: string;
  statusLabel: string;
  requestedAtLabel: string;
  requestFilterLabel: string;
  requestSearchLabel: string;
  requestSearchPlaceholder: string;
  clearSearchAction: string;
  requestSummaryLabel: string;
  filteredRequestSummaryLabel: string;
  annualUsageSummaryLabel: string;
  estimatedRemainingLabel: string;
  overLimitWarningLabel: string;
  unknownBenefitLabel: string;
  cancelAction: string;
  filteredEmptyRequests: string;
  messages: {
    needOrganization: string;
    needCatalog: string;
    needAmount: string;
    needReason: string;
    submitted: string;
    canceled: string;
    cancelFailed: string;
    loadFailed: string;
  };
  requestStatus: Record<BenefitRequestStatus, string>;
  requestFilter: {
    all: string;
    SUBMITTED: string;
    APPROVED: string;
    REJECTED: string;
    CANCELED: string;
  };
};

const adminCopyByLocale: Record<FlowLocale, AdminBenefitsCopy> = {
  ko: {
    pageTitle: "복리후생 워크스페이스",
    pageSubtitle: "복리후생 항목 관리와 신청 승인 큐를 한 화면에서 처리합니다.",
    sessionTitle: "세션/필터",
    organizationIdLabel: "조직 식별자",
    actorIdLabel: "관리자 액터 식별자",
    accessTokenLabel: "접근 토큰(선택)",
    refreshAction: "목록 새로고침",
    catalogTitle: "복리후생 카탈로그",
    requestTitle: "신청 승인 큐",
    benefitLabel: "복리후생 항목",
    createCatalogTitle: "복리후생 항목 추가",
    nameLabel: "항목명",
    descriptionLabel: "설명",
    annualLimitLabel: "연간 한도(원)",
    createCatalogAction: "항목 저장",
    decisionNoteLabel: "검토 메모(선택)",
    approveAction: "승인",
    rejectAction: "반려",
    emptyCatalog: "등록된 복리후생 항목이 없습니다.",
    emptyRequests: "검토할 신청 건이 없습니다.",
    statusLabel: "상태",
    amountLabel: "신청 금액",
    reasonLabel: "신청 사유",
    requestedAtLabel: "신청 시각",
    requestFilterLabel: "요청 상태 필터",
    requestRiskFilterLabel: "한도 위험 필터",
    requestSearchLabel: "요청 검색",
    requestSearchPlaceholder: "직원/항목/사유 검색",
    clearSearchAction: "검색 초기화",
    filteredRequestSummaryLabel: "표시 요청 수",
    overLimitRequestSummaryLabel: "한도 초과 요청",
    pendingAgingRiskSummaryLabel: "3일 이상 승인대기",
    overLimitBadgeLabel: "한도 초과",
    overLimitAmountLabel: "초과 금액",
    pendingAgingRiskBadgeLabel: "장기 대기",
    filteredEmptyRequests: "현재 필터 조건에 맞는 요청이 없습니다.",
    unknownBenefitLabel: "알 수 없는 항목",
    statsLabel: "카탈로그 수",
    requestStatsLabel: "요청 수",
    logsTitle: "요청 로그",
    messages: {
      needOrganization: "조직 식별자를 입력하세요.",
      needName: "항목명을 입력하세요.",
      needDescription: "설명을 입력하세요.",
      catalogCreated: "복리후생 항목을 추가했습니다.",
      requestDecided: "신청 상태를 변경했습니다.",
      loadFailed: "복리후생 데이터를 불러오지 못했습니다."
    },
    catalogStatus: {
      ACTIVE: "활성",
      INACTIVE: "비활성"
    },
    requestStatus: {
      SUBMITTED: "신청",
      APPROVED: "승인",
      REJECTED: "반려",
      CANCELED: "취소"
    },
    requestFilter: {
      all: "전체",
      SUBMITTED: "신청",
      APPROVED: "승인",
      REJECTED: "반려",
      CANCELED: "취소"
    },
    requestRiskFilter: {
      all: "전체",
      overLimit: "한도 초과만"
    }
  },
  en: {
    pageTitle: "Benefits Workspace",
    pageSubtitle: "Manage benefit catalog and review request queue in one screen.",
    sessionTitle: "Session / Filters",
    organizationIdLabel: "Organization ID",
    actorIdLabel: "Admin Actor ID",
    accessTokenLabel: "Access token (optional)",
    refreshAction: "Refresh",
    catalogTitle: "Benefit catalog",
    requestTitle: "Request review queue",
    benefitLabel: "Benefit",
    createCatalogTitle: "Create catalog item",
    nameLabel: "Name",
    descriptionLabel: "Description",
    annualLimitLabel: "Annual limit (KRW)",
    createCatalogAction: "Save item",
    decisionNoteLabel: "Review note (optional)",
    approveAction: "Approve",
    rejectAction: "Reject",
    emptyCatalog: "No benefit catalog item found.",
    emptyRequests: "No request in queue.",
    statusLabel: "Status",
    amountLabel: "Amount",
    reasonLabel: "Reason",
    requestedAtLabel: "Requested at",
    requestFilterLabel: "Request status filter",
    requestRiskFilterLabel: "Limit risk filter",
    requestSearchLabel: "Request search",
    requestSearchPlaceholder: "Search by employee/benefit/reason",
    clearSearchAction: "Clear search",
    filteredRequestSummaryLabel: "Visible requests",
    overLimitRequestSummaryLabel: "Over-limit requests",
    pendingAgingRiskSummaryLabel: "Pending review over 3 days",
    overLimitBadgeLabel: "Over limit",
    overLimitAmountLabel: "Exceed amount",
    pendingAgingRiskBadgeLabel: "Aging pending",
    filteredEmptyRequests: "No request matches current filters.",
    unknownBenefitLabel: "Unknown benefit",
    statsLabel: "Catalog count",
    requestStatsLabel: "Request count",
    logsTitle: "Request logs",
    messages: {
      needOrganization: "Organization ID is required.",
      needName: "Name is required.",
      needDescription: "Description is required.",
      catalogCreated: "Benefit catalog item created.",
      requestDecided: "Benefit request decision applied.",
      loadFailed: "Failed to load benefit data."
    },
    catalogStatus: {
      ACTIVE: "Active",
      INACTIVE: "Inactive"
    },
    requestStatus: {
      SUBMITTED: "Submitted",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      CANCELED: "Canceled"
    },
    requestFilter: {
      all: "All",
      SUBMITTED: "Submitted",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      CANCELED: "Canceled"
    },
    requestRiskFilter: {
      all: "All",
      overLimit: "Over limit only"
    }
  }
};

const employeeCopyByLocale: Record<FlowLocale, EmployeeBenefitsCopy> = {
  ko: {
    pageTitle: "복리후생",
    pageSubtitle: "복리후생 항목을 조회하고 신청 상태를 확인합니다.",
    sessionTitle: "조회 설정",
    organizationIdLabel: "조직 식별자",
    employeeIdLabel: "직원 식별자",
    accessTokenLabel: "접근 토큰(선택)",
    refreshAction: "데이터 새로고침",
    catalogTitle: "신청 가능 항목",
    submitTitle: "복리후생 신청",
    requestTitle: "내 신청 이력",
    benefitLabel: "항목",
    amountLabel: "신청 금액(원)",
    reasonLabel: "신청 사유",
    submitAction: "신청 제출",
    emptyCatalog: "신청 가능한 항목이 없습니다.",
    emptyRequests: "신청 이력이 없습니다.",
    annualLimitLabel: "연간 한도",
    statusLabel: "상태",
    requestedAtLabel: "신청 시각",
    requestFilterLabel: "요청 상태 필터",
    requestSearchLabel: "요청 검색",
    requestSearchPlaceholder: "항목명/사유로 검색",
    clearSearchAction: "검색 초기화",
    requestSummaryLabel: "상태별 건수",
    filteredRequestSummaryLabel: "표시 건수",
    annualUsageSummaryLabel: "현재 사용/대기 합계",
    estimatedRemainingLabel: "신청 후 예상 잔여 한도",
    overLimitWarningLabel: "한도를 초과한 신청입니다. 관리자 승인 전에 금액을 다시 확인하세요.",
    unknownBenefitLabel: "알 수 없는 항목",
    cancelAction: "신청 취소",
    filteredEmptyRequests: "현재 검색 조건에 맞는 신청 이력이 없습니다.",
    messages: {
      needOrganization: "조직 식별자를 입력하세요.",
      needCatalog: "복리후생 항목을 선택하세요.",
      needAmount: "신청 금액을 입력하세요.",
      needReason: "신청 사유를 입력하세요.",
      submitted: "복리후생 신청을 제출했습니다.",
      canceled: "복리후생 신청을 취소했습니다.",
      cancelFailed: "복리후생 신청 취소에 실패했습니다.",
      loadFailed: "복리후생 데이터를 불러오지 못했습니다."
    },
    requestStatus: {
      SUBMITTED: "신청",
      APPROVED: "승인",
      REJECTED: "반려",
      CANCELED: "취소"
    },
    requestFilter: {
      all: "전체",
      SUBMITTED: "신청",
      APPROVED: "승인",
      REJECTED: "반려",
      CANCELED: "취소"
    }
  },
  en: {
    pageTitle: "Benefits",
    pageSubtitle: "Browse benefit catalog and track your request status.",
    sessionTitle: "Filters",
    organizationIdLabel: "Organization ID",
    employeeIdLabel: "Employee ID",
    accessTokenLabel: "Access token (optional)",
    refreshAction: "Refresh data",
    catalogTitle: "Available benefits",
    submitTitle: "Submit request",
    requestTitle: "My request history",
    benefitLabel: "Benefit",
    amountLabel: "Amount (KRW)",
    reasonLabel: "Reason",
    submitAction: "Submit request",
    emptyCatalog: "No available benefit item.",
    emptyRequests: "No request history.",
    annualLimitLabel: "Annual limit",
    statusLabel: "Status",
    requestedAtLabel: "Requested at",
    requestFilterLabel: "Request status filter",
    requestSearchLabel: "Request search",
    requestSearchPlaceholder: "Search by benefit/reason",
    clearSearchAction: "Clear search",
    requestSummaryLabel: "Status summary",
    filteredRequestSummaryLabel: "Visible items",
    annualUsageSummaryLabel: "Current used/pending amount",
    estimatedRemainingLabel: "Estimated remaining limit after submit",
    overLimitWarningLabel: "This request exceeds the annual limit. Review amount before admin approval.",
    unknownBenefitLabel: "Unknown benefit",
    cancelAction: "Cancel request",
    filteredEmptyRequests: "No request matches current search.",
    messages: {
      needOrganization: "Organization ID is required.",
      needCatalog: "Select a benefit item.",
      needAmount: "Amount is required.",
      needReason: "Reason is required.",
      submitted: "Benefit request submitted.",
      canceled: "Benefit request canceled.",
      cancelFailed: "Failed to cancel benefit request.",
      loadFailed: "Failed to load benefit data."
    },
    requestStatus: {
      SUBMITTED: "Submitted",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      CANCELED: "Canceled"
    },
    requestFilter: {
      all: "All",
      SUBMITTED: "Submitted",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      CANCELED: "Canceled"
    }
  }
};

export function resolveAdminBenefitsCopy(locale: FlowLocale) {
  return adminCopyByLocale[locale];
}

export function resolveEmployeeBenefitsCopy(locale: FlowLocale) {
  return employeeCopyByLocale[locale];
}
