import { type FlowLocale } from "@/lib/i18n/locales";

export type KpiCopy = {
  title: string;
  description: string;
  analyticsTitle: string;
  analyticsDescription: string;
  productionWarning: string;
  loginCta: string;
  contextTitle: string;
  organizationIdLabel: string;
  adminActorIdLabel: string;
  accessTokenLabel: string;
  periodStartLabel: string;
  periodEndLabel: string;
  thisMonthButton: string;
  recent30DaysButton: string;
  refreshButton: string;
  exportCsvButton: string;
  exportCsvDone: string;
  focusMetricLabel: string;
  focusMetricAllOption: string;
  quickDrilldownLabel: string;
  quickDrilldownAllAction: string;
  focusWorkspaceTitle: string;
  focusWorkspaceDescription: string;
  focusWorkspaceOpenAction: string;
  focusWorkspaceCopyLinkAction: string;
  focusWorkspaceCopyDone: string;
  focusWorkspaceCopyFailed: string;
  focusWorkspaceMetricSummaryTitle: string;
  focusWorkspaceNoMetricSelected: string;
  focusWorkspaceTrendDirectionLabel: string;
  focusWorkspaceTrendUp: string;
  focusWorkspaceTrendDown: string;
  focusWorkspaceTrendFlat: string;
  loadingLabel: string;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  cards: {
    pendingApprovals: string;
    stalledApprovals: string;
    attendanceApprovalRate: string;
    leaveApprovedDays: string;
    payrollConfirmedRate: string;
    contractDecisionQueueCount: string;
    contractSlaOverdueCount: string;
  };
  details: {
    attendanceTotal: string;
    leaveApprovedRequests: string;
    payrollConfirmedRuns: string;
    stalledThreshold: string;
  };
  recruitmentPanel: {
    title: string;
    description: string;
    openOpeningCount: string;
    activeReferralCount: string;
    stalledReferral7dCount: string;
    stalledThreshold: string;
    priorityActionLabel: string;
    quickActionsLabel: string;
    actionOpenRecruitmentWorkspace: string;
    actionOpenStalledQueue: string;
    actionOpenSubmittedQueue: string;
    priorityReasonStalled: string;
    priorityReasonActive: string;
    priorityReasonOpenings: string;
    priorityReasonClear: string;
  };
  noticesPanel: {
    title: string;
    description: string;
    publishedNoticeCount: string;
    noReadNoticeCount: string;
    unreadAging3dCount: string;
    agingThreshold: string;
    priorityActionLabel: string;
    quickActionsLabel: string;
    actionOpenNoticeWorkspace: string;
    actionOpenNoReadQueue: string;
    priorityReasonAging: string;
    priorityReasonNoRead: string;
    priorityReasonClear: string;
  };
  benefitsPanel: {
    title: string;
    description: string;
    submittedCount: string;
    approvedCount: string;
    rejectedCount: string;
    pendingAging3dCount: string;
    agingThreshold: string;
    overLimitSubmittedCount: string;
    overLimitHint: string;
  };
  onboardingPanel: {
    title: string;
    description: string;
    activeEmployeeCount: string;
    inviteCoveragePercent: string;
    pendingInviteCount: string;
    contractResponseCoveragePercent: string;
    pendingContractResponseCount: string;
    readinessPercent: string;
    readinessHint: string;
  };
  payrollRiskPanel: {
    title: string;
    description: string;
    totalRunCount: string;
    previewedRunCount: string;
    confirmedUndistributedCount: string;
    distributedUnacknowledgedCount: string;
    distributionHint: string;
    receiptHint: string;
    yearEndReadinessPercent: string;
    yearEndBlockingRunCount: string;
    priorityActionLabel: string;
    quickActionsLabel: string;
    actionOpenPayrollClose: string;
    actionOpenPayslipDelivery: string;
    actionOpenYearEnd: string;
    priorityReasonPreviewed: string;
    priorityReasonUndistributed: string;
    priorityReasonUnacknowledged: string;
    priorityReasonReady: string;
  };
  trendTitle: string;
  trendCurrent: string;
  trendPrevious: string;
  trendDelta: string;
  metricLabel: string;
  logsTitle: string;
  logSuccessLabel: string;
  logFailLabel: string;
  noLogs: string;
  noData: string;
  metrics: {
    pendingApprovals: string;
    stalledApprovals: string;
    attendanceApprovalRate: string;
    leaveApprovedDays: string;
    payrollConfirmedRate: string;
    contractDecisionQueueCount: string;
    contractSlaOverdueCount: string;
  };
};

const defaultCopy: KpiCopy = {
  title: "Admin KPI Dashboard",
  description:
    "Track core journey metrics for approvals, attendance, leave, and payroll with current-vs-previous period comparison.",
  analyticsTitle: "Admin Analytics & Report",
  analyticsDescription:
    "Generate KPI snapshots and trend rows for reporting, then export the current view as CSV.",
  productionWarning: "Production runtime requires bearer token session to call APIs.",
  loginCta: "Open /login",
  contextTitle: "Context & Period",
  organizationIdLabel: "Organization ID",
  adminActorIdLabel: "Admin Actor ID (Dev fallback)",
  accessTokenLabel: "Access Token (optional)",
  periodStartLabel: "Period Start",
  periodEndLabel: "Period End",
  thisMonthButton: "This month",
  recent30DaysButton: "Last 30 days",
  refreshButton: "Refresh KPIs",
  exportCsvButton: "Export CSV",
  exportCsvDone: "CSV export is ready",
  focusMetricLabel: "Focus metric",
  focusMetricAllOption: "All metrics",
  quickDrilldownLabel: "Quick drilldown",
  quickDrilldownAllAction: "All",
  focusWorkspaceTitle: "Focused workspace",
  focusWorkspaceDescription:
    "Move directly to the workspace that can resolve the currently selected KPI focus.",
  focusWorkspaceOpenAction: "Open workspace",
  focusWorkspaceCopyLinkAction: "Copy focus link",
  focusWorkspaceCopyDone: "Focused analytics link copied",
  focusWorkspaceCopyFailed: "Could not copy focused analytics link",
  focusWorkspaceMetricSummaryTitle: "Focused metric summary",
  focusWorkspaceNoMetricSelected: "Select one focused KPI to see summary details.",
  focusWorkspaceTrendDirectionLabel: "Trend direction",
  focusWorkspaceTrendUp: "Increasing",
  focusWorkspaceTrendDown: "Decreasing",
  focusWorkspaceTrendFlat: "No change",
  loadingLabel: "Loading KPI metrics...",
  currentPeriodLabel: "Current period",
  previousPeriodLabel: "Previous period",
  cards: {
    pendingApprovals: "Pending approvals",
    stalledApprovals: "Stalled approvals (24h+)",
    attendanceApprovalRate: "Attendance approval rate",
    leaveApprovedDays: "Approved leave days",
    payrollConfirmedRate: "Payroll confirmed rate",
    contractDecisionQueueCount: "Contract decision queue",
    contractSlaOverdueCount: "Contract SLA overdue"
  },
  details: {
    attendanceTotal: "total records",
    leaveApprovedRequests: "approved requests",
    payrollConfirmedRuns: "confirmed runs",
    stalledThreshold: "older than 24h"
  },
  recruitmentPanel: {
    title: "Recruitment snapshot",
    description: "Current organization hiring queue status",
    openOpeningCount: "Open openings",
    activeReferralCount: "Active referrals",
    stalledReferral7dCount: "Stalled referrals (7d+)",
    stalledThreshold: "no stage update for 7+ days",
    priorityActionLabel: "Top-priority action",
    quickActionsLabel: "Quick actions",
    actionOpenRecruitmentWorkspace: "Open recruitment workspace",
    actionOpenStalledQueue: "Open stalled referral queue",
    actionOpenSubmittedQueue: "Open submitted referral queue",
    priorityReasonStalled: "Stalled referrals exist. Start with stalled-risk queue follow-up.",
    priorityReasonActive: "Active referrals exist. Continue stage progression in recruitment workspace.",
    priorityReasonOpenings: "Openings are active but active referrals are clear. Monitor opening coverage.",
    priorityReasonClear: "Recruitment queue is stable. Continue routine opening and referral operations."
  },
  noticesPanel: {
    title: "Notice read coverage",
    description: "Published notices that still need acknowledgement follow-up",
    publishedNoticeCount: "Published notices",
    noReadNoticeCount: "No-read notices",
    unreadAging3dCount: "No-read notices (3d+)",
    agingThreshold: "published or updated 3+ days ago",
    priorityActionLabel: "Top-priority action",
    quickActionsLabel: "Quick actions",
    actionOpenNoticeWorkspace: "Open notice workspace",
    actionOpenNoReadQueue: "Open no-read queue",
    priorityReasonAging: "Aged unread notices exist. Start with no-read queue follow-up.",
    priorityReasonNoRead: "No-read notices exist. Follow up acknowledgement first.",
    priorityReasonClear: "No-read risk is clear. Continue scheduled/published notice operations."
  },
  benefitsPanel: {
    title: "Benefits request snapshot",
    description: "Track approval queue and risk signals for employee benefits requests.",
    submittedCount: "Submitted requests",
    approvedCount: "Approved requests",
    rejectedCount: "Rejected requests",
    pendingAging3dCount: "Submitted aging (3d+)",
    agingThreshold: "submitted for 3+ days",
    overLimitSubmittedCount: "Over-limit submitted",
    overLimitHint: "amount exceeds annual limit"
  },
  onboardingPanel: {
    title: "Onboarding readiness snapshot",
    description: "Track invite coverage and contract response completion for active employees.",
    activeEmployeeCount: "Active employees",
    inviteCoveragePercent: "Invite coverage",
    pendingInviteCount: "Pending invites",
    contractResponseCoveragePercent: "Contract response coverage",
    pendingContractResponseCount: "Pending contract responses",
    readinessPercent: "Readiness score",
    readinessHint: "People + invite + contract response checkpoints"
  },
  payrollRiskPanel: {
    title: "Payroll and year-end risk snapshot",
    description:
      "Track payroll run blockers before year-end filing and withholding receipt issuance.",
    totalRunCount: "Runs in period",
    previewedRunCount: "Previewed runs",
    confirmedUndistributedCount: "Confirmed not distributed",
    distributedUnacknowledgedCount: "Distributed not acknowledged",
    distributionHint: "confirm payout distribution for each run",
    receiptHint: "request employee payslip acknowledgement",
    yearEndReadinessPercent: "Year-end readiness",
    yearEndBlockingRunCount: "Blocking runs",
    priorityActionLabel: "Top-priority action",
    quickActionsLabel: "Quick actions",
    actionOpenPayrollClose: "Open payroll close",
    actionOpenPayslipDelivery: "Open payslip delivery",
    actionOpenYearEnd: "Open year-end workspace",
    priorityReasonPreviewed: "Unconfirmed payroll runs exist. Confirm runs first.",
    priorityReasonUndistributed: "Confirmed runs are waiting for payslip distribution.",
    priorityReasonUnacknowledged: "Distributed runs still need employee acknowledgement.",
    priorityReasonReady: "Blocking runs are cleared. Proceed to year-end finalization."
  },
  trendTitle: "Period comparison",
  trendCurrent: "Current",
  trendPrevious: "Previous",
  trendDelta: "Delta",
  metricLabel: "Metric",
  logsTitle: "API call logs",
  logSuccessLabel: "OK",
  logFailLabel: "FAIL",
  noLogs: "No API logs yet.",
  noData: "No KPI snapshot yet. Choose period and load.",
  metrics: {
    pendingApprovals: "Pending approvals",
    stalledApprovals: "Stalled approvals (24h+)",
    attendanceApprovalRate: "Attendance approval rate",
    leaveApprovedDays: "Approved leave days",
    payrollConfirmedRate: "Payroll confirmed rate",
    contractDecisionQueueCount: "Contract decision queue",
    contractSlaOverdueCount: "Contract SLA overdue"
  }
};

export const kpiCopyByLocale: Record<FlowLocale, KpiCopy> = {
  ko: {
    ...defaultCopy,
    title: "관리자 KPI 대시보드",
    description: "결재, 근태, 휴가, 급여 핵심 지표를 현재 기간과 이전 동일 기간으로 비교합니다.",
    analyticsTitle: "관리자 분석/리포트",
    analyticsDescription: "현재 KPI 스냅샷과 기간 비교 데이터를 CSV로 내려받아 리포팅에 활용하세요.",
    productionWarning: "프로덕션 환경에서는 API 호출을 위해 베어러 토큰 세션이 필요합니다.",
    loginCta: "로그인 열기",
    contextTitle: "컨텍스트 및 기간",
    organizationIdLabel: "조직 식별자",
    adminActorIdLabel: "관리자 액터 식별자 (개발용 대체값)",
    accessTokenLabel: "액세스 토큰 (선택)",
    periodStartLabel: "기간 시작",
    periodEndLabel: "기간 종료",
    thisMonthButton: "이번 달",
    recent30DaysButton: "최근 30일",
    refreshButton: "KPI 새로고침",
    exportCsvButton: "CSV 내보내기",
    exportCsvDone: "CSV 파일을 내려받았습니다",
    focusMetricLabel: "집중 지표",
    focusMetricAllOption: "전체 지표",
    quickDrilldownLabel: "빠른 드릴다운",
    quickDrilldownAllAction: "전체",
    focusWorkspaceTitle: "집중 지표 워크스페이스",
    focusWorkspaceDescription: "현재 선택한 집중 지표를 해결할 수 있는 워크스페이스로 바로 이동합니다.",
    focusWorkspaceOpenAction: "워크스페이스 열기",
    focusWorkspaceCopyLinkAction: "집중 링크 복사",
    focusWorkspaceCopyDone: "집중 지표 링크를 복사했습니다",
    focusWorkspaceCopyFailed: "집중 지표 링크를 복사할 수 없습니다",
    focusWorkspaceMetricSummaryTitle: "집중 지표 요약",
    focusWorkspaceNoMetricSelected: "요약을 보려면 집중 지표를 선택하세요.",
    focusWorkspaceTrendDirectionLabel: "추세 방향",
    focusWorkspaceTrendUp: "상승",
    focusWorkspaceTrendDown: "하락",
    focusWorkspaceTrendFlat: "변화 없음",
    loadingLabel: "KPI 지표를 불러오는 중입니다...",
    currentPeriodLabel: "현재 기간",
    previousPeriodLabel: "이전 동일 기간",
    cards: {
      pendingApprovals: "결재 대기 건수",
      stalledApprovals: "정체 결재 (24시간+)",
      attendanceApprovalRate: "근태 승인률",
      leaveApprovedDays: "휴가 승인 일수",
      payrollConfirmedRate: "급여 확정률",
      contractDecisionQueueCount: "계약 의사결정 큐",
      contractSlaOverdueCount: "계약 SLA 기한 초과"
    },
    details: {
      attendanceTotal: "총 근태 건",
      leaveApprovedRequests: "승인된 휴가 요청",
      payrollConfirmedRuns: "확정된 급여 실행 건",
      stalledThreshold: "24시간 이상 정체"
    },
    recruitmentPanel: {
      title: "채용 스냅샷",
      description: "현재 조직 기준 채용 파이프라인 현황",
      openOpeningCount: "진행 중 공고 수",
      activeReferralCount: "진행 중 추천 수",
      stalledReferral7dCount: "7일 이상 정체 추천",
      stalledThreshold: "7일 이상 단계 변경 없음",
      priorityActionLabel: "최우선 조치",
      quickActionsLabel: "빠른 이동",
      actionOpenRecruitmentWorkspace: "채용 워크스페이스 열기",
      actionOpenStalledQueue: "정체 추천 큐 열기",
      actionOpenSubmittedQueue: "신규 추천 큐 열기",
      priorityReasonStalled: "정체 추천이 있습니다. 정체 위험 큐부터 후속 조치하세요.",
      priorityReasonActive: "진행 중 추천이 있습니다. 채용 워크스페이스에서 단계 진행을 이어가세요.",
      priorityReasonOpenings: "공고는 열려 있으나 진행 추천이 없습니다. 공고 유입 상태를 확인하세요.",
      priorityReasonClear: "채용 큐 리스크가 정리되었습니다. 일반 채용 운영을 진행하세요."
    },
    noticesPanel: {
      title: "공지 읽음 커버리지",
      description: "게시 공지 중 아직 읽지 않은 공지를 추적합니다.",
      publishedNoticeCount: "게시 공지 수",
      noReadNoticeCount: "미열람 공지 수",
      unreadAging3dCount: "3일+ 미열람 공지",
      agingThreshold: "게시/수정 후 3일 이상 경과",
      priorityActionLabel: "최우선 조치",
      quickActionsLabel: "빠른 이동",
      actionOpenNoticeWorkspace: "공지 워크스페이스 열기",
      actionOpenNoReadQueue: "미열람 큐 열기",
      priorityReasonAging: "3일 이상 미열람 공지가 있습니다. 미열람 큐부터 확인하세요.",
      priorityReasonNoRead: "미열람 공지가 남아 있습니다. 읽음 확인 후속 조치가 필요합니다.",
      priorityReasonClear: "미열람 리스크가 정리되었습니다. 일반 공지 운영을 진행하세요."
    },
    benefitsPanel: {
      title: "복리후생 요청 스냅샷",
      description: "복리후생 요청 승인 큐와 위험 신호를 추적합니다.",
      submittedCount: "제출 요청 수",
      approvedCount: "승인 요청 수",
      rejectedCount: "반려 요청 수",
      pendingAging3dCount: "3일+ 제출 대기",
      agingThreshold: "제출 후 3일 이상 경과",
      overLimitSubmittedCount: "한도 초과 제출",
      overLimitHint: "연간 한도 초과 요청"
    },
    onboardingPanel: {
      title: "온보딩 준비 스냅샷",
      description: "활성 직원 기준 초대 커버리지와 계약 응답 완료율을 확인합니다.",
      activeEmployeeCount: "활성 직원 수",
      inviteCoveragePercent: "초대 커버리지",
      pendingInviteCount: "미발급 초대",
      contractResponseCoveragePercent: "계약 응답 커버리지",
      pendingContractResponseCount: "미응답 계약",
      readinessPercent: "준비 점수",
      readinessHint: "직원/초대/계약응답 체크포인트"
    },
    payrollRiskPanel: {
      title: "급여/연말정산 리스크 스냅샷",
      description: "연말정산 제출 및 원천징수영수증 발급 전 선행 리스크를 추적합니다.",
      totalRunCount: "기간 내 급여 실행",
      previewedRunCount: "미확정 실행",
      confirmedUndistributedCount: "확정 후 미배포",
      distributedUnacknowledgedCount: "배포 후 미수신확인",
      distributionHint: "각 실행의 명세서 배포가 필요합니다.",
      receiptHint: "직원 명세서 수신 확인이 필요합니다.",
      yearEndReadinessPercent: "연말 준비율",
      yearEndBlockingRunCount: "차단 실행 건",
      priorityActionLabel: "최우선 조치",
      quickActionsLabel: "빠른 이동",
      actionOpenPayrollClose: "급여 마감 열기",
      actionOpenPayslipDelivery: "명세서 배포 열기",
      actionOpenYearEnd: "연말정산 워크스페이스 열기",
      priorityReasonPreviewed: "미확정 급여 실행이 있습니다. 먼저 실행 확정이 필요합니다.",
      priorityReasonUndistributed: "확정된 실행이 명세서 미배포 상태입니다.",
      priorityReasonUnacknowledged: "배포된 실행에 직원 수신 확인이 남아 있습니다.",
      priorityReasonReady: "차단 실행이 정리되었습니다. 연말 정산을 진행하세요."
    },
    trendTitle: "기간 비교",
    trendCurrent: "현재",
    trendPrevious: "이전",
    trendDelta: "증감",
    metricLabel: "지표",
    logsTitle: "API 호출 로그",
    logSuccessLabel: "정상",
    logFailLabel: "실패",
    noLogs: "아직 API 호출 로그가 없습니다.",
    noData: "아직 KPI 스냅샷이 없습니다. 기간을 선택해 조회하세요.",
    metrics: {
      pendingApprovals: "결재 대기 건수",
      stalledApprovals: "정체 결재 (24시간+)",
      attendanceApprovalRate: "근태 승인률",
      leaveApprovedDays: "휴가 승인 일수",
      payrollConfirmedRate: "급여 확정률",
      contractDecisionQueueCount: "계약 의사결정 큐",
      contractSlaOverdueCount: "계약 SLA 기한 초과"
    }
  },
  en: defaultCopy
};
