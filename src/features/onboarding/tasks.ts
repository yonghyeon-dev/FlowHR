import type {
  DataAccess,
  EmployeeEntity,
  OnboardingTaskEntity,
  OnboardingTaskTemplateEntity
} from "@/features/shared/data-access";

function normalizeTemplateTitle(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

export async function seedMissingDefaultOnboardingTaskTemplates(input: {
  dataAccess: DataAccess;
  organizationId: string;
  defaultTitles: readonly string[];
}) {
  const { dataAccess, organizationId, defaultTitles } = input;
  const existing = await dataAccess.onboardingTaskTemplates.listByOrganization(organizationId);
  const existingTitleSet = new Set(existing.map((template) => normalizeTemplateTitle(template.title)));

  for (const [index, title] of defaultTitles.entries()) {
    const normalizedTitle = normalizeTemplateTitle(title);
    if (existingTitleSet.has(normalizedTitle)) {
      continue;
    }
    await dataAccess.onboardingTaskTemplates.create({
      organizationId,
      title,
      sortOrder: index
    });
    existingTitleSet.add(normalizedTitle);
  }

  return dataAccess.onboardingTaskTemplates.listByOrganization(organizationId);
}

export async function ensureDefaultOnboardingTaskTemplates(input: {
  dataAccess: DataAccess;
  organizationId: string;
  defaultTitles: readonly string[];
}): Promise<OnboardingTaskTemplateEntity[]> {
  const existing = await input.dataAccess.onboardingTaskTemplates.listByOrganization(input.organizationId);
  if (existing.length > 0) {
    return existing;
  }
  return seedMissingDefaultOnboardingTaskTemplates(input);
}

export async function assignOnboardingTasksFromTemplates(input: {
  dataAccess: DataAccess;
  employeeId: string;
  templates: readonly OnboardingTaskTemplateEntity[];
}): Promise<OnboardingTaskEntity[]> {
  const { dataAccess, employeeId, templates } = input;
  return Promise.all(
    templates.map((template) =>
      dataAccess.onboardingTasks.create({
        employeeId,
        title: template.title,
        status: "PENDING"
      })
    )
  );
}

export async function ensureEmployeeOnboardingTasksForActiveStatus(input: {
  dataAccess: DataAccess;
  employee: EmployeeEntity;
  defaultTitles: readonly string[];
}): Promise<OnboardingTaskEntity[]> {
  const { dataAccess, employee, defaultTitles } = input;
  const existingTasks = await dataAccess.onboardingTasks.listByEmployee(employee.id);
  if (employee.status !== "ACTIVE" || existingTasks.length > 0) {
    return existingTasks;
  }
  if (!employee.organizationId) {
    return existingTasks;
  }

  const templates = await ensureDefaultOnboardingTaskTemplates({
    dataAccess,
    organizationId: employee.organizationId,
    defaultTitles
  });
  if (templates.length === 0) {
    return existingTasks;
  }

  return assignOnboardingTasksFromTemplates({
    dataAccess,
    employeeId: employee.id,
    templates
  });
}
