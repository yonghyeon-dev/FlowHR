import Link from "next/link";

import type { OnboardingChecklistItem } from "@/features/admin-onboarding/checklist";
import type { AdminOnboardingCopy } from "@/components/admin-onboarding/copy";

type AdminOnboardingReadinessPanelProps = {
  copy: AdminOnboardingCopy;
  checklistItems: OnboardingChecklistItem[];
};

const checklistHrefByKey: Record<OnboardingChecklistItem["key"], string> = {
  organization: "/admin/onboarding",
  departments: "/admin/onboarding",
  employees: "/admin/onboarding",
  invites: "/admin/onboarding",
  leave_policy: "/admin/onboarding",
  contracts: "/admin/contracts"
};

function resolveChecklistLabel(copy: AdminOnboardingCopy, key: OnboardingChecklistItem["key"]) {
  if (key === "organization") {
    return copy.checklist.organization;
  }
  if (key === "departments") {
    return copy.checklist.departments;
  }
  if (key === "employees") {
    return copy.checklist.employees;
  }
  if (key === "invites") {
    return copy.checklist.invites;
  }
  if (key === "leave_policy") {
    return copy.checklist.leavePolicy;
  }
  return copy.checklist.contracts;
}

export function AdminOnboardingReadinessPanel(props: AdminOnboardingReadinessPanelProps) {
  const { copy, checklistItems } = props;
  const pendingItems = checklistItems.filter((item) => !item.done);
  const priorityItem = pendingItems[0] ?? null;
  const ready = pendingItems.length === 0;

  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.readinessTitle}</h2>
        <p className="small">
          <span className={ready ? "ok" : "fail"}>
            {ready ? copy.readinessReadyLabel : copy.readinessPendingLabel}
          </span>
        </p>
        {ready ? (
          <p className="small muted">{copy.readinessReadyHint}</p>
        ) : (
          <>
            {priorityItem ? (
              <div>
                <p className="small">
                  <strong>{copy.readinessPriorityTitle}</strong>
                </p>
                <p className="small muted">{resolveChecklistLabel(copy, priorityItem.key)}</p>
                <p className="small muted">{copy.readinessPriorityHint}</p>
                <div className="actions">
                  <Link className="btn btn-primary btn-small" href={checklistHrefByKey[priorityItem.key]}>
                    {copy.readinessPriorityActionLabel}
                  </Link>
                </div>
              </div>
            ) : null}
            <p className="small muted">{copy.readinessPendingCountLabel}: {pendingItems.length}</p>
            <ul className="simple-list">
              {pendingItems.map((item) => (
                <li key={item.key}>
                  <span>
                    {resolveChecklistLabel(copy, item.key)} /{" "}
                    <Link href={checklistHrefByKey[item.key]}>{copy.readinessOpenWorkspaceLabel}</Link>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>
    </section>
  );
}
