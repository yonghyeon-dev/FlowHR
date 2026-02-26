import type { FlowLocale } from "@/lib/i18n/locales";
import type { RecruitmentOpeningStatus, RecruitmentReferralStage } from "@/features/recruitment/types";

export type AdminRecruitmentCopy = {
  pageTitle: string;
  pageSubtitle: string;
  sessionTitle: string;
  organizationIdLabel: string;
  actorIdLabel: string;
  accessTokenLabel: string;
  refreshAction: string;
  createOpeningTitle: string;
  openingTitleLabel: string;
  departmentLabel: string;
  employmentTypeLabel: string;
  createOpeningAction: string;
  openingsTitle: string;
  referralsTitle: string;
  referralFilterLabel: string;
  referralRiskFilterLabel: string;
  referralSearchLabel: string;
  referralSearchPlaceholder: string;
  clearSearchAction: string;
  filteredReferralSummaryLabel: string;
  referralRiskSummaryLabel: string;
  stalledBadgeLabel: string;
  referralOpeningTitleLabel: string;
  unknownOpeningLabel: string;
  filteredEmptyReferrals: string;
  stageUpdateLabel: string;
  updateStageAction: string;
  emptyOpenings: string;
  emptyReferrals: string;
  statusLabel: string;
  stageLabel: string;
  messages: {
    needOrganization: string;
    needTitle: string;
    needDepartment: string;
    needEmploymentType: string;
    openingCreated: string;
    referralUpdated: string;
    loadFailed: string;
  };
  openingStatus: Record<RecruitmentOpeningStatus, string>;
  referralStage: Record<RecruitmentReferralStage, string>;
  referralStageFilter: {
    all: string;
    SUBMITTED: string;
    SCREENING: string;
    INTERVIEW: string;
    OFFER: string;
    HIRED: string;
    REJECTED: string;
    WITHDRAWN: string;
  };
  referralRiskFilter: {
    all: string;
    stalled7d: string;
  };
};

export type EmployeeRecruitmentCopy = {
  pageTitle: string;
  pageSubtitle: string;
  sessionTitle: string;
  organizationIdLabel: string;
  employeeIdLabel: string;
  accessTokenLabel: string;
  refreshAction: string;
  openingsTitle: string;
  submitTitle: string;
  referralsTitle: string;
  openingLabel: string;
  candidateNameLabel: string;
  candidateEmailLabel: string;
  noteLabel: string;
  submitAction: string;
  emptyOpenings: string;
  emptyReferrals: string;
  stageLabel: string;
  stageFilterLabel: string;
  referralSearchLabel: string;
  referralSearchPlaceholder: string;
  clearSearchAction: string;
  referralSummaryLabel: string;
  filteredReferralSummaryLabel: string;
  openingTitleLabel: string;
  unknownOpeningLabel: string;
  withdrawAction: string;
  filteredEmptyReferrals: string;
  messages: {
    needOrganization: string;
    needOpening: string;
    needCandidateName: string;
    needCandidateEmail: string;
    needNote: string;
    submitted: string;
    withdrawn: string;
    withdrawFailed: string;
    loadFailed: string;
  };
  referralStage: Record<RecruitmentReferralStage, string>;
  referralStageFilter: {
    all: string;
    SUBMITTED: string;
    SCREENING: string;
    INTERVIEW: string;
    OFFER: string;
    HIRED: string;
    REJECTED: string;
    WITHDRAWN: string;
  };
};

const adminCopyByLocale: Record<FlowLocale, AdminRecruitmentCopy> = {
  ko: {
    pageTitle: "채용 워크스페이스",
    pageSubtitle: "채용 공고 등록과 추천 후보자 단계 관리를 한 화면에서 처리합니다.",
    sessionTitle: "세션/조회",
    organizationIdLabel: "조직 식별자",
    actorIdLabel: "관리자 액터 식별자",
    accessTokenLabel: "접근 토큰(선택)",
    refreshAction: "데이터 새로고침",
    createOpeningTitle: "채용 공고 추가",
    openingTitleLabel: "공고명",
    departmentLabel: "부서",
    employmentTypeLabel: "고용 형태",
    createOpeningAction: "공고 저장",
    openingsTitle: "채용 공고",
    referralsTitle: "추천 후보자",
    referralFilterLabel: "추천 단계 필터",
    referralRiskFilterLabel: "정체 위험 필터",
    referralSearchLabel: "추천 검색",
    referralSearchPlaceholder: "후보자/공고/추천인/메모 검색",
    clearSearchAction: "검색 초기화",
    filteredReferralSummaryLabel: "표시 추천 수",
    referralRiskSummaryLabel: "7일 이상 정체",
    stalledBadgeLabel: "정체 위험",
    referralOpeningTitleLabel: "공고명",
    unknownOpeningLabel: "알 수 없는 공고",
    filteredEmptyReferrals: "현재 필터 조건에 맞는 추천 후보자가 없습니다.",
    stageUpdateLabel: "단계 변경",
    updateStageAction: "단계 업데이트",
    emptyOpenings: "등록된 채용 공고가 없습니다.",
    emptyReferrals: "추천 후보자 데이터가 없습니다.",
    statusLabel: "상태",
    stageLabel: "단계",
    messages: {
      needOrganization: "조직 식별자를 입력하세요.",
      needTitle: "공고명을 입력하세요.",
      needDepartment: "부서를 입력하세요.",
      needEmploymentType: "고용 형태를 입력하세요.",
      openingCreated: "채용 공고를 등록했습니다.",
      referralUpdated: "후보자 단계를 변경했습니다.",
      loadFailed: "채용 데이터를 불러오지 못했습니다."
    },
    openingStatus: {
      OPEN: "진행 중",
      CLOSED: "마감"
    },
    referralStage: {
      SUBMITTED: "추천 접수",
      SCREENING: "서류 검토",
      INTERVIEW: "면접",
      OFFER: "오퍼",
      HIRED: "채용 완료",
      REJECTED: "불합격",
      WITHDRAWN: "철회"
    },
    referralStageFilter: {
      all: "전체",
      SUBMITTED: "추천 접수",
      SCREENING: "서류 검토",
      INTERVIEW: "면접",
      OFFER: "오퍼",
      HIRED: "채용 완료",
      REJECTED: "불합격",
      WITHDRAWN: "철회"
    },
    referralRiskFilter: {
      all: "전체",
      stalled7d: "7일 이상 정체"
    }
  },
  en: {
    pageTitle: "Recruitment Workspace",
    pageSubtitle: "Manage openings and referral pipeline stages in one screen.",
    sessionTitle: "Session / Filters",
    organizationIdLabel: "Organization ID",
    actorIdLabel: "Admin Actor ID",
    accessTokenLabel: "Access token (optional)",
    refreshAction: "Refresh data",
    createOpeningTitle: "Create opening",
    openingTitleLabel: "Opening title",
    departmentLabel: "Department",
    employmentTypeLabel: "Employment type",
    createOpeningAction: "Save opening",
    openingsTitle: "Openings",
    referralsTitle: "Referrals",
    referralFilterLabel: "Referral stage filter",
    referralRiskFilterLabel: "Stall risk filter",
    referralSearchLabel: "Referral search",
    referralSearchPlaceholder: "Search by candidate/opening/referrer/note",
    clearSearchAction: "Clear search",
    filteredReferralSummaryLabel: "Visible referrals",
    referralRiskSummaryLabel: "Stalled over 7 days",
    stalledBadgeLabel: "Stall risk",
    referralOpeningTitleLabel: "Opening title",
    unknownOpeningLabel: "Unknown opening",
    filteredEmptyReferrals: "No referral matches current filters.",
    stageUpdateLabel: "Update stage",
    updateStageAction: "Apply stage",
    emptyOpenings: "No opening found.",
    emptyReferrals: "No referral found.",
    statusLabel: "Status",
    stageLabel: "Stage",
    messages: {
      needOrganization: "Organization ID is required.",
      needTitle: "Opening title is required.",
      needDepartment: "Department is required.",
      needEmploymentType: "Employment type is required.",
      openingCreated: "Recruitment opening created.",
      referralUpdated: "Referral stage updated.",
      loadFailed: "Failed to load recruitment data."
    },
    openingStatus: {
      OPEN: "Open",
      CLOSED: "Closed"
    },
    referralStage: {
      SUBMITTED: "Submitted",
      SCREENING: "Screening",
      INTERVIEW: "Interview",
      OFFER: "Offer",
      HIRED: "Hired",
      REJECTED: "Rejected",
      WITHDRAWN: "Withdrawn"
    },
    referralStageFilter: {
      all: "All",
      SUBMITTED: "Submitted",
      SCREENING: "Screening",
      INTERVIEW: "Interview",
      OFFER: "Offer",
      HIRED: "Hired",
      REJECTED: "Rejected",
      WITHDRAWN: "Withdrawn"
    },
    referralRiskFilter: {
      all: "All",
      stalled7d: "Stalled >= 7d"
    }
  }
};

const employeeCopyByLocale: Record<FlowLocale, EmployeeRecruitmentCopy> = {
  ko: {
    pageTitle: "채용",
    pageSubtitle: "진행 중인 채용 공고를 확인하고 후보자를 추천합니다.",
    sessionTitle: "조회 설정",
    organizationIdLabel: "조직 식별자",
    employeeIdLabel: "직원 식별자",
    accessTokenLabel: "접근 토큰(선택)",
    refreshAction: "데이터 새로고침",
    openingsTitle: "진행 중 공고",
    submitTitle: "후보자 추천",
    referralsTitle: "내 추천 이력",
    openingLabel: "채용 공고",
    candidateNameLabel: "후보자 이름",
    candidateEmailLabel: "후보자 이메일",
    noteLabel: "추천 메모",
    submitAction: "추천 제출",
    emptyOpenings: "추천 가능한 채용 공고가 없습니다.",
    emptyReferrals: "추천 이력이 없습니다.",
    stageLabel: "단계",
    stageFilterLabel: "추천 단계 필터",
    referralSearchLabel: "추천 검색",
    referralSearchPlaceholder: "후보자/공고/메모 검색",
    clearSearchAction: "검색 초기화",
    referralSummaryLabel: "단계별 건수",
    filteredReferralSummaryLabel: "표시 건수",
    openingTitleLabel: "공고명",
    unknownOpeningLabel: "알 수 없는 공고",
    withdrawAction: "추천 철회",
    filteredEmptyReferrals: "현재 검색 조건에 맞는 추천 이력이 없습니다.",
    messages: {
      needOrganization: "조직 식별자를 입력하세요.",
      needOpening: "채용 공고를 선택하세요.",
      needCandidateName: "후보자 이름을 입력하세요.",
      needCandidateEmail: "후보자 이메일을 입력하세요.",
      needNote: "추천 메모를 입력하세요.",
      submitted: "후보자 추천을 제출했습니다.",
      withdrawn: "추천을 철회했습니다.",
      withdrawFailed: "추천 철회에 실패했습니다.",
      loadFailed: "채용 데이터를 불러오지 못했습니다."
    },
    referralStage: {
      SUBMITTED: "추천 접수",
      SCREENING: "서류 검토",
      INTERVIEW: "면접",
      OFFER: "오퍼",
      HIRED: "채용 완료",
      REJECTED: "불합격",
      WITHDRAWN: "철회"
    },
    referralStageFilter: {
      all: "전체",
      SUBMITTED: "추천 접수",
      SCREENING: "서류 검토",
      INTERVIEW: "면접",
      OFFER: "오퍼",
      HIRED: "채용 완료",
      REJECTED: "불합격",
      WITHDRAWN: "철회"
    }
  },
  en: {
    pageTitle: "Recruitment",
    pageSubtitle: "Check active openings and submit candidate referrals.",
    sessionTitle: "Filters",
    organizationIdLabel: "Organization ID",
    employeeIdLabel: "Employee ID",
    accessTokenLabel: "Access token (optional)",
    refreshAction: "Refresh data",
    openingsTitle: "Active openings",
    submitTitle: "Submit referral",
    referralsTitle: "My referrals",
    openingLabel: "Opening",
    candidateNameLabel: "Candidate name",
    candidateEmailLabel: "Candidate email",
    noteLabel: "Referral note",
    submitAction: "Submit referral",
    emptyOpenings: "No active opening available.",
    emptyReferrals: "No referral history.",
    stageLabel: "Stage",
    stageFilterLabel: "Referral stage filter",
    referralSearchLabel: "Referral search",
    referralSearchPlaceholder: "Search by candidate/opening/note",
    clearSearchAction: "Clear search",
    referralSummaryLabel: "Stage summary",
    filteredReferralSummaryLabel: "Visible items",
    openingTitleLabel: "Opening title",
    unknownOpeningLabel: "Unknown opening",
    withdrawAction: "Withdraw referral",
    filteredEmptyReferrals: "No referral matches current search.",
    messages: {
      needOrganization: "Organization ID is required.",
      needOpening: "Select an opening.",
      needCandidateName: "Candidate name is required.",
      needCandidateEmail: "Candidate email is required.",
      needNote: "Referral note is required.",
      submitted: "Referral submitted.",
      withdrawn: "Referral withdrawn.",
      withdrawFailed: "Failed to withdraw referral.",
      loadFailed: "Failed to load recruitment data."
    },
    referralStage: {
      SUBMITTED: "Submitted",
      SCREENING: "Screening",
      INTERVIEW: "Interview",
      OFFER: "Offer",
      HIRED: "Hired",
      REJECTED: "Rejected",
      WITHDRAWN: "Withdrawn"
    },
    referralStageFilter: {
      all: "All",
      SUBMITTED: "Submitted",
      SCREENING: "Screening",
      INTERVIEW: "Interview",
      OFFER: "Offer",
      HIRED: "Hired",
      REJECTED: "Rejected",
      WITHDRAWN: "Withdrawn"
    }
  }
};

export function resolveAdminRecruitmentCopy(locale: FlowLocale) {
  return adminCopyByLocale[locale];
}

export function resolveEmployeeRecruitmentCopy(locale: FlowLocale) {
  return employeeCopyByLocale[locale];
}
