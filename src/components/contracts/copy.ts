import { type FlowLocale } from "@/lib/i18n/locales";

export type ContractCategory = "employment" | "amendment" | "nda" | "policy";
export type ContractTemplateStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ContractDocumentStatus =
  | "DRAFT"
  | "APPROVAL_REQUESTED"
  | "SENT"
  | "SIGNED"
  | "REJECTED"
  | "EXPIRED"
  | "RENEWED";
export type ContractApprovalStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

const categoryLabelsEn: Record<ContractCategory, string> = {
  employment: "employment",
  amendment: "amendment",
  nda: "nda",
  policy: "policy"
};

const templateStatusLabelsEn: Record<ContractTemplateStatus, string> = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED"
};

const documentStatusLabelsEn: Record<ContractDocumentStatus, string> = {
  DRAFT: "DRAFT",
  APPROVAL_REQUESTED: "APPROVAL_REQUESTED",
  SENT: "SENT",
  SIGNED: "SIGNED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  RENEWED: "RENEWED"
};

const approvalStatusLabelsEn: Record<ContractApprovalStatus, string> = {
  NONE: "NONE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
};

export const contractCategoryLabelByLocale: Record<FlowLocale, Record<ContractCategory, string>> = {
  ko: {
    employment: "근로계약",
    amendment: "변경계약",
    nda: "비밀유지",
    policy: "정책"
  },
  en: categoryLabelsEn
};

export const contractTemplateStatusLabelByLocale: Record<FlowLocale, Record<ContractTemplateStatus, string>> = {
  ko: {
    DRAFT: "초안",
    ACTIVE: "사용 중",
    ARCHIVED: "보관"
  },
  en: templateStatusLabelsEn
};

export const contractDocumentStatusLabelByLocale: Record<FlowLocale, Record<ContractDocumentStatus, string>> = {
  ko: {
    DRAFT: "초안",
    APPROVAL_REQUESTED: "승인 요청",
    SENT: "발송",
    SIGNED: "서명 완료",
    REJECTED: "거절",
    EXPIRED: "만료",
    RENEWED: "갱신"
  },
  en: documentStatusLabelsEn
};

export const contractApprovalStatusLabelByLocale: Record<FlowLocale, Record<ContractApprovalStatus, string>> = {
  ko: {
    NONE: "없음",
    PENDING: "대기",
    APPROVED: "승인",
    REJECTED: "반려"
  },
  en: approvalStatusLabelsEn
};

const adminContractsCopyEn = {
  heroEyebrow: "FlowHR Admin",
  title: "E-Contract Workspace",
  description: "Template CRUD, approval-gated send, employee signature, and renewal lifecycle.",
  openTemplateBuilderAction: "Open Template Builder",
  templatesKpiLabel: "Templates",
  documentsKpiLabel: "Documents",
  pendingApprovalKpiLabel: "Pending Approval",
  summaryKpiAria: "contract summary kpi",
  templateLibraryTitle: "Contract Template Library",
  nameLabel: "Name",
  categoryLabel: "Category",
  bodyLabel: "Body",
  createTemplateAction: "Create Template",
  templateListAria: "contract template list",
  updatedPrefix: "updated",
  documentLifecycleTitle: "Document Lifecycle",
  employeeIdLabel: "Employee ID",
  employeeIdPlaceholder: "EMP-0001",
  selectedTemplateLabel: "Selected Template",
  createDraftAction: "Create Draft",
  documentSearchLabel: "Document Search",
  documentSearchPlaceholder: "Search by title/document ID/employee ID",
  documentStatusFilterLabel: "Document Status",
  allDocumentStatusOption: "All statuses",
  expirationWindowFilterLabel: "Expiry window",
  expirationWindowAllOption: "All windows",
  expirationWindow7Option: "Within 7 days",
  expirationWindow14Option: "Within 14 days",
  expirationWindow30Option: "Within 30 days",
  slaRiskFilterLabel: "SLA risk",
  slaRiskAllOption: "All risks",
  slaRiskDueSoonOption: "Due soon (D-3)",
  slaRiskOverdueOption: "Overdue",
  renewalCandidateOnlyLabel: "Renewal candidates only",
  decisionQueueOnlyLabel: "Decision queue only",
  documentVisibleCountLabel: "Visible documents",
  expiringSoonCountLabel: "Expiring soon",
  overdueSlaCountLabel: "SLA overdue",
  decisionQueueCountLabel: "Decision queue",
  renewalCandidateCountLabel: "Renewal candidates",
  slaDueSoonBadgeLabel: "SLA due soon",
  slaOverdueBadgeLabel: "SLA overdue",
  documentListAria: "contract document list",
  employeePrefix: "employee",
  approvalPrefix: "approval",
  expiresPrefix: "expires",
  nextStepLabel: "Next step",
  nextStepRequestApproval: "Request approval",
  nextStepApproveOrReject: "Approve or reject",
  nextStepSendDocument: "Send to employee",
  nextStepWaitEmployeeResponse: "Wait for employee response",
  nextStepRenewDocument: "Renew document",
  nextStepNoAction: "No available admin action",
  requestApprovalAction: "Request Approval",
  approveAction: "Approve",
  rejectAction: "Reject",
  sendAction: "Send",
  expireAction: "Expire",
  renewAction: "Renew",
  actionCompletedPrefix: "Action completed",
  actionFailedPrefix: "Action failed",
  templateCreatedMessage: "Template created",
  draftCreatedMessage: "Draft document created",
  loadError: "failed to load contracts",
  templateCreateError: "template create failed",
  draftCreateError: "document create failed",
  requiredTemplateAndEmployeeError: "template and employeeId are required",
  manualExpireReason: "manual admin expire",
  draftTitlePrefix: "Contract"
};

export type AdminContractsCopy = typeof adminContractsCopyEn;

export const adminContractsCopyByLocale: Record<FlowLocale, AdminContractsCopy> = {
  ko: {
    heroEyebrow: "FlowHR 관리자",
    title: "전자계약 워크스페이스",
    description: "템플릿 생성, 승인 연동 발송, 직원 서명, 갱신 라이프사이클을 한 화면에서 처리합니다.",
    openTemplateBuilderAction: "템플릿 빌더 열기",
    templatesKpiLabel: "템플릿",
    documentsKpiLabel: "문서",
    pendingApprovalKpiLabel: "승인 대기",
    summaryKpiAria: "전자계약 요약 지표",
    templateLibraryTitle: "계약 템플릿 라이브러리",
    nameLabel: "이름",
    categoryLabel: "카테고리",
    bodyLabel: "본문",
    createTemplateAction: "템플릿 생성",
    templateListAria: "계약 템플릿 목록",
    updatedPrefix: "업데이트",
    documentLifecycleTitle: "문서 라이프사이클",
    employeeIdLabel: "직원 번호",
    employeeIdPlaceholder: "직원-0001",
    selectedTemplateLabel: "선택된 템플릿",
    createDraftAction: "초안 생성",
    documentSearchLabel: "문서 검색",
    documentSearchPlaceholder: "제목/문서 번호/직원 번호 검색",
    documentStatusFilterLabel: "문서 상태",
    allDocumentStatusOption: "전체 상태",
    expirationWindowFilterLabel: "만료 임박 기간",
    expirationWindowAllOption: "전체 기간",
    expirationWindow7Option: "7일 이내",
    expirationWindow14Option: "14일 이내",
    expirationWindow30Option: "30일 이내",
    slaRiskFilterLabel: "기한 위험",
    slaRiskAllOption: "전체 위험",
    slaRiskDueSoonOption: "임박(3일 이내)",
    slaRiskOverdueOption: "기한 초과",
    renewalCandidateOnlyLabel: "갱신 후보만 보기",
    decisionQueueOnlyLabel: "즉시 처리 큐만 보기",
    documentVisibleCountLabel: "표시 문서",
    expiringSoonCountLabel: "만료 임박",
    overdueSlaCountLabel: "기한 초과",
    decisionQueueCountLabel: "즉시 처리 큐",
    renewalCandidateCountLabel: "갱신 후보",
    slaDueSoonBadgeLabel: "기한 임박",
    slaOverdueBadgeLabel: "기한 초과",
    documentListAria: "계약 문서 목록",
    employeePrefix: "직원",
    approvalPrefix: "승인",
    expiresPrefix: "만료",
    nextStepLabel: "다음 단계",
    nextStepRequestApproval: "승인 요청",
    nextStepApproveOrReject: "승인 또는 반려",
    nextStepSendDocument: "직원에게 발송",
    nextStepWaitEmployeeResponse: "직원 응답 대기",
    nextStepRenewDocument: "문서 갱신",
    nextStepNoAction: "관리자 실행 가능 작업 없음",
    requestApprovalAction: "승인 요청",
    approveAction: "승인",
    rejectAction: "반려",
    sendAction: "발송",
    expireAction: "만료",
    renewAction: "갱신",
    actionCompletedPrefix: "작업 완료",
    actionFailedPrefix: "작업 실패",
    templateCreatedMessage: "템플릿을 생성했습니다",
    draftCreatedMessage: "문서 초안을 생성했습니다",
    loadError: "계약 데이터를 불러오지 못했습니다.",
    templateCreateError: "템플릿 생성에 실패했습니다",
    draftCreateError: "문서 생성에 실패했습니다",
    requiredTemplateAndEmployeeError: "템플릿과 직원 번호를 입력해 주세요",
    manualExpireReason: "관리자 수동 만료",
    draftTitlePrefix: "계약"
  },
  en: adminContractsCopyEn
};

const contractTemplateBuilderCopyEn = {
  heroEyebrow: "FlowHR Admin",
  title: "Contract Template Builder",
  description: "Compose clause blocks, generate a deterministic template body, and create a draft template.",
  builderTitle: "Builder",
  templateNameLabel: "Template Name",
  categoryLabel: "Category",
  addClauseAction: "Add Clause",
  createTemplateAction: "Create Template",
  validationFailedMessage: "Fix checklist items before creating template",
  clauseBuilderAria: "contract template clause builder",
  clausePrefix: "Clause",
  requiredLabel: "Required",
  requiredChip: "required",
  optionalChip: "optional",
  titleLabel: "Title",
  bodyLabel: "Body",
  removeClauseAction: "Remove Clause",
  generatedBodyTitle: "Generated Body Preview",
  noClauseContent: "No clause content.",
  noTemplateMessage: "Create a template to confirm saved metadata.",
  templateIdLabel: "Template ID",
  versionLabel: "Version",
  statusLabel: "Status",
  categoryValueLabel: "Category",
  backToContractsAction: "Back to Contracts",
  templateCreatedPrefix: "Template created",
  templateCreateError: "template create failed",
  checklistTitle: "Draft validation checklist",
  checklistReadyLabel: "Ready",
  checklistNeedsFixLabel: "Needs fixes",
  checklistNameRule: "Template name must be at least 2 characters",
  checklistClauseRule: "At least one clause must include title and body",
  checklistRequiredRule: "At least one clause must be marked required",
  checklistDuplicateRule: "Clause titles should not be duplicated",
  diffPanelTitle: "Template version diff",
  captureBaselineAction: "Capture baseline",
  resetBaselineAction: "Reset baseline",
  baselineCapturedMessage: "Baseline captured from current body preview",
  noBaselineMessage: "Capture a baseline to compare template body changes.",
  diffAddedCountLabel: "Added lines",
  diffRemovedCountLabel: "Removed lines",
  diffNoChangesLabel: "No line changes from baseline.",
  untitledClause: "Untitled Clause",
  emptyClauseBody: "-",
  defaultTemplateName: "Employment Contract v1",
  defaultClauses: [
    {
      title: "Role and Responsibilities",
      body: "The employee agrees to perform assigned duties and follow internal policy."
    },
    {
      title: "Compensation",
      body: "Monthly compensation and payroll schedule follow company policy."
    },
    {
      title: "Confidentiality",
      body: "The employee must protect confidential company information."
    }
  ]
};

export type ContractTemplateBuilderCopy = typeof contractTemplateBuilderCopyEn;

export const contractTemplateBuilderCopyByLocale: Record<FlowLocale, ContractTemplateBuilderCopy> = {
  ko: {
    heroEyebrow: "FlowHR 관리자",
    title: "계약 템플릿 빌더",
    description: "조항 블록을 구성하고 일관된 본문을 생성해 계약 템플릿 초안을 만듭니다.",
    builderTitle: "빌더",
    templateNameLabel: "템플릿 이름",
    categoryLabel: "카테고리",
    addClauseAction: "조항 추가",
    createTemplateAction: "템플릿 생성",
    validationFailedMessage: "체크리스트 항목을 먼저 해결해 주세요",
    clauseBuilderAria: "계약 템플릿 조항 빌더",
    clausePrefix: "조항",
    requiredLabel: "필수",
    requiredChip: "필수",
    optionalChip: "선택",
    titleLabel: "제목",
    bodyLabel: "본문",
    removeClauseAction: "조항 제거",
    generatedBodyTitle: "생성 본문 미리보기",
    noClauseContent: "조항 내용이 없습니다.",
    noTemplateMessage: "템플릿을 생성하면 저장된 메타데이터를 확인할 수 있습니다.",
    templateIdLabel: "템플릿 번호",
    versionLabel: "버전",
    statusLabel: "상태",
    categoryValueLabel: "카테고리",
    backToContractsAction: "계약 화면으로 돌아가기",
    templateCreatedPrefix: "템플릿 생성 완료",
    templateCreateError: "템플릿 생성에 실패했습니다",
    checklistTitle: "초안 검증 체크리스트",
    checklistReadyLabel: "준비 완료",
    checklistNeedsFixLabel: "수정 필요",
    checklistNameRule: "템플릿 이름은 2자 이상이어야 합니다",
    checklistClauseRule: "제목과 본문이 있는 조항이 최소 1개 필요합니다",
    checklistRequiredRule: "필수 조항이 최소 1개 필요합니다",
    checklistDuplicateRule: "조항 제목이 중복되지 않아야 합니다",
    diffPanelTitle: "템플릿 버전 비교",
    captureBaselineAction: "기준본 캡처",
    resetBaselineAction: "기준본 초기화",
    baselineCapturedMessage: "현재 생성 본문을 기준본으로 저장했습니다",
    noBaselineMessage: "기준본을 캡처하면 템플릿 본문 변경점을 비교할 수 있습니다.",
    diffAddedCountLabel: "추가 라인",
    diffRemovedCountLabel: "삭제 라인",
    diffNoChangesLabel: "기준본 대비 변경된 라인이 없습니다.",
    untitledClause: "제목 없는 조항",
    emptyClauseBody: "-",
    defaultTemplateName: "근로계약서 버전 1",
    defaultClauses: [
      {
        title: "직무 및 책임",
        body: "직원은 해당 업무를 수행하고 내부 정책을 준수합니다."
      },
      {
        title: "보상",
        body: "월 보상과 급여 일정은 회사 정책을 따릅니다."
      },
      {
        title: "기밀 유지",
        body: "직원은 회사의 기밀 정보를 보호해야 합니다."
      }
    ]
  },
  en: contractTemplateBuilderCopyEn
};

const employeeContractsCopyEn = {
  title: "My Contracts",
  description: "Review pending contracts and respond with signature hash verification.",
  inboxTitle: "Inbox",
  inboxAria: "employee contract inbox",
  inboxSearchLabel: "Inbox search",
  inboxSearchPlaceholder: "Search by title/document ID/status",
  inboxStatusFilterLabel: "Status filter",
  inboxStatusFilterAllOption: "All statuses",
  inboxStatusFilterPendingOption: "Pending response",
  inboxStatusFilterRespondedOption: "Responded",
  inboxStatusFilterExpiredOption: "Expired",
  inboxDeadlineFilterLabel: "Deadline risk",
  inboxDeadlineFilterAllOption: "All deadlines",
  inboxDeadlineFilterDueSoonOption: "Due soon (D-3)",
  inboxDeadlineFilterOverdueOption: "Overdue",
  clearSearchAction: "Clear search",
  visibleCountLabel: "Visible documents",
  pendingResponseCountLabel: "Pending response",
  dueSoonCountLabel: "Due soon",
  overdueCountLabel: "Overdue",
  dueSoonBadgeLabel: "Due soon",
  overdueBadgeLabel: "Overdue",
  riskQuickFilterLabel: "Quick deadline filter",
  riskQuickAllAction: "All",
  riskQuickDueSoonAction: "Due soon",
  riskQuickOverdueAction: "Overdue",
  inboxFilteredEmpty: "No documents match the current search.",
  approvalPrefix: "approval",
  expiresPrefix: "expires",
  selectAction: "Select",
  responseTitle: "Response",
  nextActionTitle: "Next Action",
  nextActionNoDocument: "Select a document to view the next recommended step.",
  nextActionWaitAdminApproval: "Wait for admin approval/send before you can respond.",
  nextActionRespondPending: "Review the document and submit sign/reject response.",
  nextActionRespondDueSoon: "Deadline is near. Submit your response as soon as possible.",
  nextActionRespondOverdue: "Response deadline is overdue. Ask admin for resend or extension.",
  nextActionReviewSigned: "Signature completed. Download evidence and archive the record.",
  nextActionReviewRejected: "Rejection recorded. Request revised document if needed.",
  nextActionRequestRenewal: "Document is expired/renewed. Request or open the latest version.",
  responseHistoryTitle: "Recent Response History",
  responseHistoryFilterLabel: "History filter",
  responseHistoryFilterAllAction: "All",
  responseHistoryFilterSignedAction: "Signed",
  responseHistoryFilterRejectedAction: "Rejected",
  responseHistoryFilterEvidenceAction: "Evidence",
  responseHistoryVisibleCountLabel: "Visible history",
  responseHistoryEmpty: "No recent response history is available.",
  responseHistoryFilteredEmpty: "No history matches the selected filter.",
  responseHistorySignedLabel: "Signed response",
  responseHistoryRejectedLabel: "Rejected response",
  responseHistoryEvidenceLoadedLabel: "Evidence loaded",
  noDocumentMessage: "No document available.",
  detailAria: "selected employee contract detail",
  idLabel: "ID",
  statusLabel: "Status",
  hashLabel: "Hash",
  updatedLabel: "Updated",
  respondedLabel: "Responded",
  signatureHashLabel: "Signature Hash",
  evidenceHashLabel: "Evidence Hash",
  signatureInputLabel: "Signature Input (required for sign)",
  signatureInputPlaceholder: "Type your signature confirmation",
  signatureInputRequiredHint: "Enter signature input before signing.",
  signatureInputRequiredError: "Signature input is required to sign.",
  commentLabel: "Comment",
  quickCommentTemplatesLabel: "Quick comment templates",
  quickCommentTemplateConfirmTerms: "I reviewed the terms and agree.",
  quickCommentTemplateNeedClarification: "Please clarify this clause before I can sign.",
  quickCommentTemplateRequestRevision: "Please revise this document and resend.",
  signAction: "Sign",
  rejectAction: "Reject",
  loadEvidenceJsonAction: "Load Evidence JSON",
  loadEvidenceTextAction: "Load Evidence Text",
  evidenceFileLabel: "Evidence File",
  generatedAtLabel: "Generated At",
  contentShaLabel: "Content SHA256",
  downloadEvidenceAction: "Download Evidence",
  copyEvidenceMetadataAction: "Copy Evidence Metadata",
  copySignatureHashAction: "Copy Signature Hash",
  copyEvidenceHashAction: "Copy Evidence Hash",
  copiedEvidenceMetadataStatus: "Evidence metadata copied",
  copiedSignatureHashStatus: "Signature hash copied",
  copiedEvidenceHashStatus: "Evidence hash copied",
  copyEvidenceMetadataError: "Failed to copy evidence metadata",
  copyHashClipboardError: "Failed to copy hash",
  responseDisabledHint: "You can respond only after admin sends this document.",
  signedMessage: "Contract signed",
  rejectedMessage: "Contract rejected",
  evidenceLoadedPrefix: "Signature evidence loaded",
  loadError: "failed to load inbox",
  respondError: "response failed",
  evidenceLoadError: "signature evidence load failed"
};

export type EmployeeContractsCopy = typeof employeeContractsCopyEn;

export const employeeContractsCopyByLocale: Record<FlowLocale, EmployeeContractsCopy> = {
  ko: {
    title: "내 계약함",
    description: "대기 중인 계약을 검토하고 서명 해시 검증 기반으로 응답하세요.",
    inboxTitle: "받은함",
    inboxAria: "직원 계약 받은함 목록",
    inboxSearchLabel: "받은함 검색",
    inboxSearchPlaceholder: "제목/문서 번호/상태 검색",
    inboxStatusFilterLabel: "상태 필터",
    inboxStatusFilterAllOption: "전체 상태",
    inboxStatusFilterPendingOption: "응답 대기",
    inboxStatusFilterRespondedOption: "응답 완료",
    inboxStatusFilterExpiredOption: "만료",
    inboxDeadlineFilterLabel: "기한 위험",
    inboxDeadlineFilterAllOption: "전체 기한",
    inboxDeadlineFilterDueSoonOption: "임박(3일 이내)",
    inboxDeadlineFilterOverdueOption: "기한 초과",
    clearSearchAction: "검색 초기화",
    visibleCountLabel: "표시 문서",
    pendingResponseCountLabel: "응답 대기 건",
    dueSoonCountLabel: "응답 임박",
    overdueCountLabel: "기한 초과",
    dueSoonBadgeLabel: "응답 임박",
    overdueBadgeLabel: "기한 초과",
    riskQuickFilterLabel: "기한 필터 빠른 전환",
    riskQuickAllAction: "전체",
    riskQuickDueSoonAction: "임박",
    riskQuickOverdueAction: "초과",
    inboxFilteredEmpty: "현재 검색 조건에 맞는 문서가 없습니다.",
    approvalPrefix: "승인",
    expiresPrefix: "만료",
    selectAction: "선택",
    responseTitle: "응답",
    nextActionTitle: "다음 권장 작업",
    nextActionNoDocument: "문서를 선택하면 다음 권장 단계를 확인할 수 있습니다.",
    nextActionWaitAdminApproval: "관리자 승인/발송이 완료되어야 응답할 수 있습니다.",
    nextActionRespondPending: "문서를 검토한 뒤 서명 또는 거절로 응답해 주세요.",
    nextActionRespondDueSoon: "응답 기한이 임박했습니다. 가능한 빨리 응답해 주세요.",
    nextActionRespondOverdue: "응답 기한이 지났습니다. 재발송 또는 기한 연장을 요청해 주세요.",
    nextActionReviewSigned: "서명이 완료되었습니다. 증빙 파일을 내려받아 보관해 주세요.",
    nextActionReviewRejected: "거절 처리되었습니다. 필요 시 수정 계약서를 요청해 주세요.",
    nextActionRequestRenewal: "만료/갱신 상태입니다. 최신 문서를 요청하거나 선택해 주세요.",
    responseHistoryTitle: "최근 응답 이력",
    responseHistoryFilterLabel: "이력 필터",
    responseHistoryFilterAllAction: "전체",
    responseHistoryFilterSignedAction: "서명",
    responseHistoryFilterRejectedAction: "거절",
    responseHistoryFilterEvidenceAction: "증빙",
    responseHistoryVisibleCountLabel: "표시 이력",
    responseHistoryEmpty: "최근 응답 이력이 없습니다.",
    responseHistoryFilteredEmpty: "선택한 필터에 맞는 이력이 없습니다.",
    responseHistorySignedLabel: "서명 응답",
    responseHistoryRejectedLabel: "거절 응답",
    responseHistoryEvidenceLoadedLabel: "증빙 로드",
    noDocumentMessage: "표시할 문서가 없습니다.",
    detailAria: "선택된 직원 계약 상세",
    idLabel: "문서 번호",
    statusLabel: "상태",
    hashLabel: "해시",
    updatedLabel: "업데이트",
    respondedLabel: "응답",
    signatureHashLabel: "서명 해시",
    evidenceHashLabel: "증빙 해시",
    signatureInputLabel: "서명 입력(서명 시 필수)",
    signatureInputPlaceholder: "서명 확인 문구를 입력해 주세요",
    signatureInputRequiredHint: "서명 전 서명 입력값을 먼저 입력해 주세요.",
    signatureInputRequiredError: "서명하려면 서명 입력값이 필요합니다.",
    commentLabel: "의견",
    quickCommentTemplatesLabel: "빠른 의견 템플릿",
    quickCommentTemplateConfirmTerms: "계약 내용을 확인했고 동의합니다.",
    quickCommentTemplateNeedClarification: "서명 전 해당 조항에 대한 설명이 필요합니다.",
    quickCommentTemplateRequestRevision: "문서를 수정한 뒤 다시 전달해 주세요.",
    signAction: "서명",
    rejectAction: "거절",
    loadEvidenceJsonAction: "증빙 구조 데이터 불러오기",
    loadEvidenceTextAction: "증빙 텍스트 불러오기",
    evidenceFileLabel: "증빙 파일",
    generatedAtLabel: "생성 시각",
    contentShaLabel: "콘텐츠 해시값",
    downloadEvidenceAction: "증빙 다운로드",
    copyEvidenceMetadataAction: "증빙 메타데이터 복사",
    copySignatureHashAction: "서명 해시 복사",
    copyEvidenceHashAction: "증빙 해시 복사",
    copiedEvidenceMetadataStatus: "증빙 메타데이터를 복사했습니다",
    copiedSignatureHashStatus: "서명 해시를 복사했습니다",
    copiedEvidenceHashStatus: "증빙 해시를 복사했습니다",
    copyEvidenceMetadataError: "증빙 메타데이터 복사에 실패했습니다",
    copyHashClipboardError: "해시 복사에 실패했습니다",
    responseDisabledHint: "관리자가 문서를 발송한 뒤에만 응답할 수 있습니다.",
    signedMessage: "계약을 서명했습니다",
    rejectedMessage: "계약을 거절했습니다",
    evidenceLoadedPrefix: "증빙 파일을 불러왔습니다",
    loadError: "계약함을 불러오지 못했습니다.",
    respondError: "응답 처리에 실패했습니다",
    evidenceLoadError: "증빙 파일 로드에 실패했습니다"
  },
  en: employeeContractsCopyEn
};

export function toDateText(value: string | null, runtimeLocale: string) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString(runtimeLocale);
}
