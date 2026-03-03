import Link from "next/link";

import type { OnboardingChecklistItem } from "@/features/admin-onboarding/checklist";
import type { AdminOnboardingCopy } from "@/components/admin-onboarding/copy";

type AdminOnboardingReadinessPanelProps = {
  copy: AdminOnboardingCopy;
  checklistItems: OnboardingChecklistItem[];
  priorityActionPending: boolean;
  onRunPriorityAction: (key: OnboardingChecklistItem["key"]) => void;
};

const checklistHrefByKey: Record<OnboardingChecklistItem["key"], string> = {
  organization: "/admin/onboarding",
  departments: "/admin/people",
  employees: "/admin/people",
  invites: "/admin/people?panel=invites",
  leave_policy: "/admin/leave-accrual",
  contracts: "/admin/contracts?status=SENT"
};

function withOnboardingSource(href: string) {
  if (!href.startsWith("/admin/people")) {
    return href;
  }
  if (href.includes("source=")) {
    return href;
  }
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}source=admin-onboarding`;
}

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

function canRunChecklistAction(key: OnboardingChecklistItem["key"]) {
  return key !== "organization";
}

export function AdminOnboardingReadinessPanel(props: AdminOnboardingReadinessPanelProps) {
  const { copy, checklistItems, priorityActionPending, onRunPriorityAction } = props;
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
                  {!canRunChecklistAction(priorityItem.key) ? (
                    <Link
                      className="btn btn-primary btn-small"
                      href={withOnboardingSource(checklistHrefByKey[priorityItem.key])}
                    >
                      {copy.readinessOpenWorkspaceLabel}
                    </Link>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => {
                          onRunPriorityAction(priorityItem.key);
                        }}
                        disabled={priorityActionPending}
                      >
                        {copy.readinessPriorityActionLabel}
                      </button>
                      <Link
                        className="btn btn-secondary btn-small"
                        href={withOnboardingSource(checklistHrefByKey[priorityItem.key])}
                      >
                        {copy.readinessOpenWorkspaceLabel}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : null}
            <p className="small muted">{copy.readinessPendingCountLabel}: {pendingItems.length}</p>
            <ul className="simple-list">
              {pendingItems.map((item) => (
                <li key={item.key}>
                  <span>
                    {resolveChecklistLabel(copy, item.key)}
                  </span>
                  <span>
                    <Link href={withOnboardingSource(checklistHrefByKey[item.key])}>
                      {copy.readinessOpenWorkspaceLabel}
                    </Link>
                    {canRunChecklistAction(item.key) ? (
                      <>
                        {" / "}
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => {
                            onRunPriorityAction(item.key);
                          }}
                          disabled={priorityActionPending}
                        >
                          {copy.readinessPriorityActionLabel}
                        </button>
                      </>
                    ) : null}
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
