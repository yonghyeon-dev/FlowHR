import type { DataAccess, OnboardingTaskTemplateEntity } from "@/features/shared/data-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { translate, type MessageKey } from "@/lib/i18n/messages";

const defaultOnboardingTaskTitleKeys = [
  "admin.onboarding.defaultTask.verifyPersonalInfo",
  "admin.onboarding.defaultTask.reviewEmploymentGuidelines",
  "admin.onboarding.defaultTask.registerPayrollAccount",
  "admin.onboarding.defaultTask.registerEmergencyContact",
  "admin.onboarding.defaultTask.completeDepartmentIntroduction"
] as const satisfies readonly MessageKey[];

function defaultOnboardingTaskTitles() {
  return defaultOnboardingTaskTitleKeys.map((key) => translate(DEFAULT_LOCALE, key));
}

function sortTemplates(templates: OnboardingTaskTemplateEntity[]) {
  return [...templates].sort((left, right) => {
    const bySortOrder = left.sortOrder - right.sortOrder;
    if (bySortOrder !== 0) {
      return bySortOrder;
    }
    const byCreatedAt = left.createdAt.getTime() - right.createdAt.getTime();
    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }
    return left.id.localeCompare(right.id);
  });
}

export async function ensureOnboardingTaskTemplates(
  dataAccess: DataAccess,
  organizationId: string
): Promise<OnboardingTaskTemplateEntity[]> {
  const templates = await dataAccess.onboardingTaskTemplates.listByOrganization(organizationId);
  if (templates.length > 0) {
    return sortTemplates(templates);
  }

  const titles = defaultOnboardingTaskTitles();
  const created: OnboardingTaskTemplateEntity[] = [];
  for (const [index, title] of titles.entries()) {
    const template = await dataAccess.onboardingTaskTemplates.create({
      organizationId,
      title,
      sortOrder: index,
      active: true
    });
    created.push(template);
  }

  return sortTemplates(created);
}

export async function ensureEmployeeOnboardingTasks(
  dataAccess: DataAccess,
  input: {
    employeeId: string;
    organizationId: string;
  }
) {
  const existing = await dataAccess.onboardingTasks.listByEmployee(input.employeeId);
  if (existing.length > 0) {
    return existing;
  }

  const templates = await ensureOnboardingTaskTemplates(dataAccess, input.organizationId);
  const activeTemplates = templates.filter((template) => template.active);
  if (activeTemplates.length === 0) {
    return existing;
  }

  for (const template of activeTemplates) {
    await dataAccess.onboardingTasks.create({
      employeeId: input.employeeId,
      templateId: template.id,
      title: template.title,
      status: "PENDING"
    });
  }

  return dataAccess.onboardingTasks.listByEmployee(input.employeeId);
}
