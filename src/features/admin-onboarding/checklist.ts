export type OnboardingChecklistInput = {
  organizationId: string;
  departmentCount: number;
  employeeCount: number;
  inviteCoverageDone: boolean;
  leavePolicyConfigured: boolean;
  contractJourneyDone: boolean;
};

export type OnboardingChecklistItem = {
  key: "organization" | "departments" | "employees" | "invites" | "leave_policy" | "contracts";
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
      key: "invites",
      done: input.inviteCoverageDone
    },
    {
      key: "leave_policy",
      done: input.leavePolicyConfigured
    },
    {
      key: "contracts",
      done: input.contractJourneyDone
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
