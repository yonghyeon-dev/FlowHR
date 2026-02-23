export type OnboardingChecklistInput = {
  organizationId: string;
  departmentCount: number;
  employeeCount: number;
  leavePolicyConfigured: boolean;
};

export type OnboardingChecklistItem = {
  key: "organization" | "departments" | "employees" | "leave_policy";
  done: boolean;
};

export function buildOnboardingChecklist(input: OnboardingChecklistInput): OnboardingChecklistItem[] {
  return [
    {
      key: "organization",
      done: input.organizationId.trim().length > 0
    },
    {
      key: "departments",
      done: input.departmentCount > 0
    },
    {
      key: "employees",
      done: input.employeeCount > 0
    },
    {
      key: "leave_policy",
      done: input.leavePolicyConfigured
    }
  ];
}

export function onboardingProgressPercent(items: OnboardingChecklistItem[]) {
  if (items.length === 0) {
    return 0;
  }
  const completed = items.filter((item) => item.done).length;
  return Math.round((completed / items.length) * 100);
}
