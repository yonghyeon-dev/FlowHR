import type { FlowLocale } from "@/lib/i18n/locales";
import type { NoticeAudience, NoticeStatus } from "@/features/notices/types";

export type NoticeWorkspaceCopy = {
  pageTitle: string;
  pageSubtitle: string;
  filtersTitle: string;
  organizationIdLabel: string;
  actorIdLabel: string;
  accessTokenLabel: string;
  statusFilterLabel: string;
  audienceFilterLabel: string;
  refreshAction: string;
  composeTitle: string;
  titleLabel: string;
  bodyLabel: string;
  audienceLabel: string;
  scheduleLabel: string;
  createAction: string;
  publishAction: string;
  listTitle: string;
  listEmpty: string;
  listSearchLabel: string;
  listSearchPlaceholder: string;
  clearListSearchAction: string;
  filteredListSummaryLabel: string;
  filteredListEmpty: string;
  statsLabel: string;
  pendingLabelPrefix: string;
  statusMessagePrefix: string;
  logsTitle: string;
  logsEmpty: string;
  readCountLabel: string;
  badge: {
    DRAFT: string;
    SCHEDULED: string;
    PUBLISHED: string;
  };
  audience: {
    all: string;
    employees: string;
    admins: string;
  };
  statusFilter: {
    all: string;
    DRAFT: string;
    SCHEDULED: string;
    PUBLISHED: string;
  };
  audienceFilter: {
    all: string;
    allAudience: string;
    employees: string;
    admins: string;
  };
  messages: {
    needOrganization: string;
    needTitle: string;
    needBody: string;
    created: string;
    published: string;
    loadFailed: string;
  };
};

export type EmployeeNoticeBoardCopy = {
  pageTitle: string;
  pageSubtitle: string;
  filtersTitle: string;
  organizationIdLabel: string;
  employeeIdLabel: string;
  accessTokenLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  readStatusFilterLabel: string;
  readStatusFilterAllOption: string;
  readStatusFilterUnreadOption: string;
  readStatusFilterReadOption: string;
  unreadOnlyLabel: string;
  clearFiltersAction: string;
  refreshAction: string;
  markAllReadAction: string;
  audienceLabel: string;
  summaryLabel: string;
  filteredSummaryLabel: string;
  unreadLabel: string;
  logsCountLabel: string;
  listTitle: string;
  listEmpty: string;
  filteredListEmpty: string;
  markReadAction: string;
  readAtLabel: string;
  readBadge: string;
  unreadBadge: string;
  audience: {
    all: string;
    employees: string;
  };
  messages: {
    needOrganization: string;
    loadFailed: string;
    markedRead: string;
    markReadFailed: string;
    markedAllRead: string;
    markAllReadFailed: string;
  };
};

function mapStatusLabel(copy: NoticeWorkspaceCopy, status: NoticeStatus) {
  return copy.badge[status];
}

function mapAudienceLabel(
  copy: NoticeWorkspaceCopy | EmployeeNoticeBoardCopy,
  audience: NoticeAudience | "all"
) {
  if (audience === "all") {
    return copy.audience.all;
  }
  if (audience === "admins") {
    return "admins" in copy.audience ? copy.audience.admins : copy.audience.all;
  }
  return copy.audience.employees;
}

const workspaceCopyByLocale: Record<FlowLocale, NoticeWorkspaceCopy> = {
  ko: {
    pageTitle: "공지사항 워크스페이스",
    pageSubtitle: "공지 작성, 예약 게시, 게시 처리까지 한 화면에서 관리합니다.",
    filtersTitle: "조회/세션 설정",
    organizationIdLabel: "조직 식별자",
    actorIdLabel: "관리자 액터 식별자",
    accessTokenLabel: "접근 토큰(선택)",
    statusFilterLabel: "상태 필터",
    audienceFilterLabel: "대상 필터",
    refreshAction: "목록 새로고침",
    composeTitle: "공지 작성",
    titleLabel: "제목",
    bodyLabel: "본문",
    audienceLabel: "대상",
    scheduleLabel: "예약 게시 시각(선택)",
    createAction: "공지 저장",
    publishAction: "즉시 게시",
    listTitle: "공지 목록",
    listEmpty: "조건에 맞는 공지가 없습니다.",
    listSearchLabel: "공지 검색",
    listSearchPlaceholder: "제목/본문 검색",
    clearListSearchAction: "검색 초기화",
    filteredListSummaryLabel: "표시 공지 수",
    filteredListEmpty: "현재 검색 조건에 맞는 공지가 없습니다.",
    statsLabel: "요약",
    pendingLabelPrefix: "실행 중",
    statusMessagePrefix: "상태",
    logsTitle: "요청 로그",
    logsEmpty: "아직 요청 로그가 없습니다.",
    readCountLabel: "읽음 수",
    badge: {
      DRAFT: "임시저장",
      SCHEDULED: "예약",
      PUBLISHED: "게시됨"
    },
    audience: {
      all: "전체",
      employees: "직원",
      admins: "관리자"
    },
    statusFilter: {
      all: "전체",
      DRAFT: "임시저장",
      SCHEDULED: "예약",
      PUBLISHED: "게시됨"
    },
    audienceFilter: {
      all: "전체",
      allAudience: "전체",
      employees: "직원",
      admins: "관리자"
    },
    messages: {
      needOrganization: "조직 식별자를 입력하세요.",
      needTitle: "제목을 입력하세요.",
      needBody: "본문을 입력하세요.",
      created: "공지를 저장했습니다.",
      published: "공지를 게시했습니다.",
      loadFailed: "공지 목록 조회에 실패했습니다."
    }
  },
  en: {
    pageTitle: "Notice Workspace",
    pageSubtitle: "Manage notice compose, schedule, and publish actions in one screen.",
    filtersTitle: "Filters / Session",
    organizationIdLabel: "Organization ID",
    actorIdLabel: "Admin Actor ID",
    accessTokenLabel: "Access token (optional)",
    statusFilterLabel: "Status filter",
    audienceFilterLabel: "Audience filter",
    refreshAction: "Refresh list",
    composeTitle: "Compose notice",
    titleLabel: "Title",
    bodyLabel: "Body",
    audienceLabel: "Audience",
    scheduleLabel: "Schedule publish at (optional)",
    createAction: "Save notice",
    publishAction: "Publish now",
    listTitle: "Notice list",
    listEmpty: "No notice found for current filters.",
    listSearchLabel: "Notice search",
    listSearchPlaceholder: "Search in title/body",
    clearListSearchAction: "Clear search",
    filteredListSummaryLabel: "Visible notices",
    filteredListEmpty: "No notice matches current search.",
    statsLabel: "Summary",
    pendingLabelPrefix: "Running",
    statusMessagePrefix: "Status",
    logsTitle: "Request logs",
    logsEmpty: "No request logs yet.",
    readCountLabel: "Read count",
    badge: {
      DRAFT: "Draft",
      SCHEDULED: "Scheduled",
      PUBLISHED: "Published"
    },
    audience: {
      all: "All",
      employees: "Employees",
      admins: "Admins"
    },
    statusFilter: {
      all: "All",
      DRAFT: "Draft",
      SCHEDULED: "Scheduled",
      PUBLISHED: "Published"
    },
    audienceFilter: {
      all: "All",
      allAudience: "All",
      employees: "Employees",
      admins: "Admins"
    },
    messages: {
      needOrganization: "Organization ID is required.",
      needTitle: "Title is required.",
      needBody: "Body is required.",
      created: "Notice saved.",
      published: "Notice published.",
      loadFailed: "Failed to load notices."
    }
  }
};

const employeeCopyByLocale: Record<FlowLocale, EmployeeNoticeBoardCopy> = {
  ko: {
    pageTitle: "내 공지사항",
    pageSubtitle: "게시된 공지를 확인하고 최신 전달 사항을 빠르게 확인합니다.",
    filtersTitle: "조회 설정",
    organizationIdLabel: "조직 식별자",
    employeeIdLabel: "직원 식별자",
    accessTokenLabel: "접근 토큰(선택)",
    searchLabel: "검색어",
    searchPlaceholder: "제목/본문에서 검색",
    readStatusFilterLabel: "읽음 상태",
    readStatusFilterAllOption: "전체",
    readStatusFilterUnreadOption: "미확인",
    readStatusFilterReadOption: "확인함",
    unreadOnlyLabel: "미확인 공지만 보기",
    clearFiltersAction: "필터 초기화",
    refreshAction: "공지 새로고침",
    markAllReadAction: "전체 확인 처리",
    audienceLabel: "대상",
    summaryLabel: "게시 공지",
    filteredSummaryLabel: "표시 공지",
    unreadLabel: "미확인 공지",
    logsCountLabel: "요청 로그 수",
    listTitle: "게시 공지 목록",
    listEmpty: "확인 가능한 게시 공지가 없습니다.",
    filteredListEmpty: "현재 필터 조건에 맞는 공지가 없습니다.",
    markReadAction: "확인 완료",
    readAtLabel: "확인 시각",
    readBadge: "확인함",
    unreadBadge: "미확인",
    audience: {
      all: "전체",
      employees: "직원"
    },
    messages: {
      needOrganization: "조직 식별자를 입력하세요.",
      loadFailed: "공지 목록을 불러오지 못했습니다.",
      markedRead: "공지 확인 처리를 완료했습니다.",
      markReadFailed: "공지 확인 처리에 실패했습니다.",
      markedAllRead: "전체 공지 확인 처리를 완료했습니다.",
      markAllReadFailed: "전체 공지 확인 처리에 실패했습니다."
    }
  },
  en: {
    pageTitle: "My Notices",
    pageSubtitle: "Review published notices and catch up on the latest updates.",
    filtersTitle: "Filters",
    organizationIdLabel: "Organization ID",
    employeeIdLabel: "Employee ID",
    accessTokenLabel: "Access token (optional)",
    searchLabel: "Search",
    searchPlaceholder: "Search in title/body",
    readStatusFilterLabel: "Read status",
    readStatusFilterAllOption: "All",
    readStatusFilterUnreadOption: "Unread",
    readStatusFilterReadOption: "Read",
    unreadOnlyLabel: "Unread only",
    clearFiltersAction: "Clear filters",
    refreshAction: "Refresh notices",
    markAllReadAction: "Mark all as read",
    audienceLabel: "Audience",
    summaryLabel: "Published notices",
    filteredSummaryLabel: "Visible notices",
    unreadLabel: "Unread notices",
    logsCountLabel: "Request log count",
    listTitle: "Published notice list",
    listEmpty: "No published notice is available.",
    filteredListEmpty: "No notice matches current filters.",
    markReadAction: "Mark as read",
    readAtLabel: "Read at",
    readBadge: "Read",
    unreadBadge: "Unread",
    audience: {
      all: "All",
      employees: "Employees"
    },
    messages: {
      needOrganization: "Organization ID is required.",
      loadFailed: "Failed to load notices.",
      markedRead: "Notice marked as read.",
      markReadFailed: "Failed to mark notice as read.",
      markedAllRead: "All notices marked as read.",
      markAllReadFailed: "Failed to mark all notices as read."
    }
  }
};

export function resolveNoticeWorkspaceCopy(locale: FlowLocale) {
  return workspaceCopyByLocale[locale];
}

export function resolveEmployeeNoticeBoardCopy(locale: FlowLocale) {
  return employeeCopyByLocale[locale];
}

export function resolveNoticeStatusLabel(copy: NoticeWorkspaceCopy, status: NoticeStatus) {
  return mapStatusLabel(copy, status);
}

export function resolveNoticeAudienceLabel(
  copy: NoticeWorkspaceCopy | EmployeeNoticeBoardCopy,
  audience: NoticeAudience | "all"
) {
  return mapAudienceLabel(copy, audience);
}
