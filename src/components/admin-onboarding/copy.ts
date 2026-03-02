import { type FlowLocale } from "@/lib/i18n/locales";

export type AdminOnboardingCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  productionWarning: string;
  loginCta: string;
  contextTitle: string;
  organizationIdLabel: string;
  adminActorIdLabel: string;
  accessTokenLabel: string;
  organizationSelectTitle: string;
  organizationRefreshButton: string;
  departmentSeedTitle: string;
  departmentSeedPlaceholder: string;
  employeeSeedTitle: string;
  employeeSeedPlaceholder: string;
  leavePolicyTitle: string;
  inviteCoverageTitle: string;
  inviteCoverageDescription: string;
  inviteCoverageEligibleLabel: string;
  inviteCoverageSentLabel: string;
  inviteCoveragePendingLabel: string;
  inviteCoverageReadyLabel: string;
  inviteCoverageMissingLabel: string;
  inviteCoverageIssueButton: string;
  inviteCoverageIssueHint: string;
  contractTemplateTitle: string;
  contractTemplateDescription: string;
  contractTemplateCountLabel: string;
  contractTemplateBootstrapButton: string;
  contractTemplateBootstrapHint: string;
  contractTemplateReadyLabel: string;
  contractTemplateMissingLabel: string;
  contractDraftCoverageLabel: string;
  contractDraftPendingLabel: string;
  contractDraftReadyLabel: string;
  contractDraftMissingLabel: string;
  contractDraftIssueButton: string;
  contractDraftIssueHint: string;
  contractApprovalCoverageLabel: string;
  contractApprovalPendingLabel: string;
  contractApprovalReadyLabel: string;
  contractApprovalMissingLabel: string;
  contractApprovalIssueButton: string;
  contractApprovalIssueHint: string;
  contractApprovalDecisionCoverageLabel: string;
  contractApprovalDecisionPendingLabel: string;
  contractApprovalDecisionReadyLabel: string;
  contractApprovalDecisionMissingLabel: string;
  contractApprovalDecisionIssueButton: string;
  contractApprovalDecisionIssueHint: string;
  contractSendCoverageLabel: string;
  contractSendPendingLabel: string;
  contractSendReadyLabel: string;
  contractSendMissingLabel: string;
  contractSendIssueButton: string;
  contractSendIssueHint: string;
  checklistTitle: string;
  applyDepartmentsButton: string;
  applyEmployeesButton: string;
  applyLeavePolicyButton: string;
  loadButton: string;
  loadingLabel: string;
  progressLabel: string;
  doneLabel: string;
  todoLabel: string;
  okLabel: string;
  failLabel: string;
  logsTitle: string;
  logsEmpty: string;
  leavePolicyFields: {
    annualGrantDays: string;
    carryOverCapDays: string;
    allowHalfDay: string;
    allowHourly: string;
    hourlyIncrementMinutes: string;
    maxHoursPerRequest: string;
    enabled: string;
    disabled: string;
  };
  requestLabels: {
    organizations: string;
    departments: string;
    employees: string;
    invites: string;
    leavePolicy: string;
    createDepartmentPrefix: string;
    createEmployeePrefix: string;
    createInvitePrefix: string;
    contractDocuments: string;
    createContractTemplate: string;
    createContractDocumentPrefix: string;
    requestContractApprovalPrefix: string;
    approveContractPrefix: string;
    sendContractPrefix: string;
    upsertLeavePolicy: string;
  };
  checklist: {
    organization: string;
    departments: string;
    employees: string;
    invites: string;
    leavePolicy: string;
  };
};

const defaultCopy: AdminOnboardingCopy = {
  heroEyebrow: "FlowHR Admin",
  title: "Admin Onboarding Wizard",
  description: "Guide first-time setup with organization context, department/employee seed, and leave policy defaults.",
  productionWarning: "Production runtime requires bearer token session to call APIs.",
  loginCta: "Open /login",
  contextTitle: "Context",
  organizationIdLabel: "Organization ID",
  adminActorIdLabel: "Admin Actor ID (Dev fallback)",
  accessTokenLabel: "Access Token (optional)",
  organizationSelectTitle: "1) Organization context",
  organizationRefreshButton: "Reload organizations",
  departmentSeedTitle: "2) Department seed (CODE,Name per line)",
  departmentSeedPlaceholder: "DEV,Development",
  employeeSeedTitle: "3) Employee seed (ID,Name,Email,DepartmentCode)",
  employeeSeedPlaceholder: "EMP-2001,Jane,jane@example.com,DEV",
  inviteCoverageTitle: "4) Employee invite coverage",
  inviteCoverageDescription: "Issue onboarding invites for employees with email addresses.",
  inviteCoverageEligibleLabel: "Employees with email",
  inviteCoverageSentLabel: "Invites issued",
  inviteCoveragePendingLabel: "Pending invites",
  inviteCoverageReadyLabel: "Invite coverage complete",
  inviteCoverageMissingLabel: "Invite action required",
  inviteCoverageIssueButton: "Issue pending invites",
  inviteCoverageIssueHint: "Creates employee-role invites for pending email targets only.",
  leavePolicyTitle: "5) Leave policy defaults",
  contractTemplateTitle: "6) Employment contract template",
  contractTemplateDescription: "Prepare one active employment contract template to start onboarding contracts.",
  contractTemplateCountLabel: "Active employment templates",
  contractTemplateBootstrapButton: "Create default employment template",
  contractTemplateBootstrapHint: "Created as ACTIVE and reusable for onboarding document drafts.",
  contractTemplateReadyLabel: "Template ready",
  contractTemplateMissingLabel: "Template required",
  contractDraftCoverageLabel: "Employees with contract draft",
  contractDraftPendingLabel: "Pending draft creation",
  contractDraftReadyLabel: "Contract draft coverage complete",
  contractDraftMissingLabel: "Contract drafts required",
  contractDraftIssueButton: "Create pending contract drafts",
  contractDraftIssueHint: "Creates one DRAFT employment contract document per pending employee.",
  contractApprovalCoverageLabel: "Employees with approval requested",
  contractApprovalPendingLabel: "Pending approval request",
  contractApprovalReadyLabel: "Approval request coverage complete",
  contractApprovalMissingLabel: "Approval requests required",
  contractApprovalIssueButton: "Request pending approvals",
  contractApprovalIssueHint: "Requests approval for pending DRAFT employment contract documents.",
  contractApprovalDecisionCoverageLabel: "Employees with approval completed",
  contractApprovalDecisionPendingLabel: "Pending approval decision",
  contractApprovalDecisionReadyLabel: "Approval decision coverage complete",
  contractApprovalDecisionMissingLabel: "Approval decisions required",
  contractApprovalDecisionIssueButton: "Approve pending requests",
  contractApprovalDecisionIssueHint: "Approves pending contract approval requests for onboarding documents.",
  contractSendCoverageLabel: "Employees with contract sent",
  contractSendPendingLabel: "Pending send",
  contractSendReadyLabel: "Send coverage complete",
  contractSendMissingLabel: "Send actions required",
  contractSendIssueButton: "Send approved contracts",
  contractSendIssueHint: "Sends approval-completed onboarding contracts to employees.",
  checklistTitle: "Setup checklist",
  applyDepartmentsButton: "Apply departments",
  applyEmployeesButton: "Apply employees",
  applyLeavePolicyButton: "Apply policy",
  loadButton: "Refresh setup state",
  loadingLabel: "Loading onboarding data...",
  progressLabel: "Progress",
  doneLabel: "DONE",
  todoLabel: "TODO",
  okLabel: "OK",
  failLabel: "FAIL",
  logsTitle: "Action logs",
  logsEmpty: "No logs yet.",
  leavePolicyFields: {
    annualGrantDays: "Annual grant days",
    carryOverCapDays: "Carry-over cap days",
    allowHalfDay: "Allow half-day",
    allowHourly: "Allow hourly",
    hourlyIncrementMinutes: "Hourly increment minutes",
    maxHoursPerRequest: "Max hours per request",
    enabled: "Enabled",
    disabled: "Disabled"
  },
  requestLabels: {
    organizations: "organizations",
    departments: "departments",
    employees: "employees",
    invites: "invites",
    leavePolicy: "leave policy",
    createDepartmentPrefix: "create department",
    createEmployeePrefix: "create employee",
    createInvitePrefix: "create invite",
    contractDocuments: "contract documents",
    createContractTemplate: "create contract template",
    createContractDocumentPrefix: "create contract document",
    requestContractApprovalPrefix: "request contract approval",
    approveContractPrefix: "approve contract",
    sendContractPrefix: "send contract",
    upsertLeavePolicy: "upsert leave policy"
  },
  checklist: {
    organization: "Organization selected",
    departments: "At least one department",
    employees: "At least one active employee",
    invites: "Employee invite coverage complete",
    leavePolicy: "Leave policy configured"
  }
};

export const adminOnboardingCopyByLocale: Record<FlowLocale, AdminOnboardingCopy> = {
  ko: {
    ...defaultCopy,
    heroEyebrow: "FlowHR 관리자",
    title: "관리자 온보딩 마법사",
    description: "조직 컨텍스트, 부서/직원 일괄 등록, 휴가 정책 기본값을 한 흐름으로 초기 설정합니다.",
    productionWarning: "프로덕션 환경에서는 API 호출을 위해 베어러 토큰 세션이 필요합니다.",
    loginCta: "로그인 열기",
    contextTitle: "컨텍스트",
    organizationIdLabel: "조직 식별자",
    adminActorIdLabel: "관리자 액터 식별자 (개발용 대체값)",
    accessTokenLabel: "액세스 토큰 (선택)",
    organizationSelectTitle: "1) 조직 컨텍스트",
    organizationRefreshButton: "조직 목록 새로고침",
    departmentSeedTitle: "2) 부서 일괄 등록 (코드, 이름)",
    departmentSeedPlaceholder: "DEV,개발팀",
    employeeSeedTitle: "3) 직원 일괄 등록 (ID, 이름, 이메일, 부서코드)",
    employeeSeedPlaceholder: "EMP-2001,홍길동,hong@example.com,DEV",
    inviteCoverageTitle: "4) 직원 초대 커버리지",
    inviteCoverageDescription: "이메일이 있는 직원에게 온보딩 초대장을 발급합니다.",
    inviteCoverageEligibleLabel: "이메일 보유 직원 수",
    inviteCoverageSentLabel: "발급 완료 초대장",
    inviteCoveragePendingLabel: "미발급 초대장",
    inviteCoverageReadyLabel: "초대 커버리지 완료",
    inviteCoverageMissingLabel: "초대 발급 필요",
    inviteCoverageIssueButton: "미발급 직원 초대장 발급",
    inviteCoverageIssueHint: "대상 직원 이메일 기준으로 아직 발급되지 않은 초대장만 생성합니다.",
    leavePolicyTitle: "5) 휴가 정책 기본값",
    contractTemplateTitle: "6) 근로계약 템플릿",
    contractTemplateDescription: "온보딩 계약 생성을 시작할 수 있도록 활성 근로계약 템플릿 1개를 준비합니다.",
    contractTemplateCountLabel: "활성 근로계약 템플릿 수",
    contractTemplateBootstrapButton: "기본 근로계약 템플릿 생성",
    contractTemplateBootstrapHint: "ACTIVE 상태로 생성되어 온보딩 계약 초안에 바로 사용할 수 있습니다.",
    contractTemplateReadyLabel: "템플릿 준비됨",
    contractTemplateMissingLabel: "템플릿 필요",
    contractDraftCoverageLabel: "계약 초안 준비 직원 수",
    contractDraftPendingLabel: "초안 생성 필요 직원 수",
    contractDraftReadyLabel: "계약 초안 커버리지 완료",
    contractDraftMissingLabel: "계약 초안 생성 필요",
    contractDraftIssueButton: "미생성 계약 초안 일괄 생성",
    contractDraftIssueHint: "대상 직원별로 근로계약 DRAFT 문서를 1건씩 생성합니다.",
    contractApprovalCoverageLabel: "승인요청 완료 직원 수",
    contractApprovalPendingLabel: "승인요청 필요 직원 수",
    contractApprovalReadyLabel: "승인요청 커버리지 완료",
    contractApprovalMissingLabel: "승인요청 필요",
    contractApprovalIssueButton: "미요청 승인 일괄 요청",
    contractApprovalIssueHint: "DRAFT 상태 근로계약 문서에 대해 승인요청을 실행합니다.",
    contractApprovalDecisionCoverageLabel: "승인완료 직원 수",
    contractApprovalDecisionPendingLabel: "승인결정 필요 직원 수",
    contractApprovalDecisionReadyLabel: "승인결정 커버리지 완료",
    contractApprovalDecisionMissingLabel: "승인결정 필요",
    contractApprovalDecisionIssueButton: "미결 승인 일괄 승인",
    contractApprovalDecisionIssueHint: "승인요청 상태 계약 문서를 APPROVE로 처리합니다.",
    contractSendCoverageLabel: "전송완료 직원 수",
    contractSendPendingLabel: "전송 필요 직원 수",
    contractSendReadyLabel: "전송 커버리지 완료",
    contractSendMissingLabel: "전송 실행 필요",
    contractSendIssueButton: "승인완료 계약 일괄 전송",
    contractSendIssueHint: "승인결정이 완료된 DRAFT 계약 문서를 직원에게 전송합니다.",
    checklistTitle: "설정 체크리스트",
    applyDepartmentsButton: "부서 적용",
    applyEmployeesButton: "직원 적용",
    applyLeavePolicyButton: "정책 적용",
    loadButton: "설정 상태 새로고침",
    loadingLabel: "온보딩 데이터를 불러오는 중입니다...",
    progressLabel: "진척도",
    doneLabel: "완료",
    todoLabel: "진행 필요",
    okLabel: "성공",
    failLabel: "실패",
    logsTitle: "실행 로그",
    logsEmpty: "아직 로그가 없습니다.",
    leavePolicyFields: {
      annualGrantDays: "연간 부여 일수",
      carryOverCapDays: "이월 상한 일수",
      allowHalfDay: "반차 허용",
      allowHourly: "시간차 허용",
      hourlyIncrementMinutes: "시간차 최소 단위(분)",
      maxHoursPerRequest: "요청당 최대 시간",
      enabled: "허용",
      disabled: "미허용"
    },
    requestLabels: {
      organizations: "조직 목록 조회",
      departments: "부서 목록 조회",
      employees: "직원 목록 조회",
      invites: "초대장 목록 조회",
      leavePolicy: "휴가 정책 조회",
      createDepartmentPrefix: "부서 생성",
      createEmployeePrefix: "직원 생성",
      createInvitePrefix: "초대장 생성",
      contractDocuments: "계약 문서 목록 조회",
      createContractTemplate: "계약 템플릿 생성",
      createContractDocumentPrefix: "계약 문서 생성",
      requestContractApprovalPrefix: "계약 승인요청",
      approveContractPrefix: "계약 승인처리",
      sendContractPrefix: "계약 전송",
      upsertLeavePolicy: "휴가 정책 저장"
    },
    checklist: {
      organization: "조직 선택 완료",
      departments: "부서 1개 이상 등록",
      employees: "활성 직원 1명 이상 등록",
      invites: "직원 초대 커버리지 완료",
      leavePolicy: "휴가 정책 설정 완료"
    }
  },
  en: defaultCopy
};
