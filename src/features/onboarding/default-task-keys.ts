import type { MessageKey } from "@/lib/i18n/messages";

export const onboardingDefaultTaskTitleKeys = [
  "admin.onboarding.defaultTask.signContract",
  "admin.onboarding.defaultTask.registerPayrollAccount",
  "admin.onboarding.defaultTask.confirmInsuranceEnrollment",
  "admin.onboarding.defaultTask.issueInternalAccount",
  "admin.onboarding.defaultTask.attendDepartmentOt"
] as const satisfies readonly MessageKey[];
