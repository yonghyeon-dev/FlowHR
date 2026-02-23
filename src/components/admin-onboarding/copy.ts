import { type FlowLocale } from "@/lib/i18n/locales";

export type AdminOnboardingCopy = {
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
  checklistTitle: string;
  applyDepartmentsButton: string;
  applyEmployeesButton: string;
  applyLeavePolicyButton: string;
  loadButton: string;
  loadingLabel: string;
  logsTitle: string;
  logsEmpty: string;
  checklist: {
    organization: string;
    departments: string;
    employees: string;
    leavePolicy: string;
  };
};

const defaultCopy: AdminOnboardingCopy = {
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
  leavePolicyTitle: "4) Leave policy defaults",
  checklistTitle: "Setup checklist",
  applyDepartmentsButton: "Apply departments",
  applyEmployeesButton: "Apply employees",
  applyLeavePolicyButton: "Apply policy",
  loadButton: "Refresh setup state",
  loadingLabel: "Loading onboarding data...",
  logsTitle: "Action logs",
  logsEmpty: "No logs yet.",
  checklist: {
    organization: "Organization selected",
    departments: "At least one department",
    employees: "At least one active employee",
    leavePolicy: "Leave policy configured"
  }
};

export const adminOnboardingCopyByLocale: Record<FlowLocale, AdminOnboardingCopy> = {
  ko: {
    ...defaultCopy,
    title: "관리자 온보딩 마법사",
    description: "조직 컨텍스트, 부서/직원 일괄 등록, 휴가 정책 기본값을 한 흐름으로 초기 설정합니다.",
    productionWarning: "프로덕션 환경에서는 API 호출을 위해 Bearer 토큰 세션이 필요합니다.",
    loginCta: "/login 열기",
    contextTitle: "컨텍스트",
    organizationSelectTitle: "1) 조직 컨텍스트",
    organizationRefreshButton: "조직 목록 새로고침",
    departmentSeedTitle: "2) 부서 일괄 등록 (CODE,이름)",
    departmentSeedPlaceholder: "DEV,개발팀",
    employeeSeedTitle: "3) 직원 일괄 등록 (ID,이름,이메일,부서코드)",
    employeeSeedPlaceholder: "EMP-2001,홍길동,hong@example.com,DEV",
    leavePolicyTitle: "4) 휴가 정책 기본값",
    checklistTitle: "설정 체크리스트",
    applyDepartmentsButton: "부서 적용",
    applyEmployeesButton: "직원 적용",
    applyLeavePolicyButton: "정책 적용",
    loadButton: "설정 상태 새로고침",
    loadingLabel: "온보딩 데이터를 불러오는 중입니다...",
    logsTitle: "실행 로그",
    logsEmpty: "아직 로그가 없습니다.",
    checklist: {
      organization: "조직 선택 완료",
      departments: "부서 1개 이상 등록",
      employees: "활성 직원 1명 이상 등록",
      leavePolicy: "휴가 정책 설정 완료"
    }
  },
  en: defaultCopy
};
