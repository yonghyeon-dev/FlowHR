import Link from "next/link";

import { type KpiCopy } from "@/components/admin-kpi/copy";

export type ContractKpiSnapshot = {
  decisionQueueCount: number;
  pendingResponseCount: number;
  slaOverdueCount: number;
  renewalCandidateCount: number;
};

type BuildContractKpiSnapshotInput = {
  decisionQueueCount: number;
  pendingResponseCount: number;
  slaOverdueCount: number;
  renewalCandidateCount: number;
};

export function buildContractKpiSnapshot(
  input: BuildContractKpiSnapshotInput
): ContractKpiSnapshot {
  return {
    decisionQueueCount: Math.max(0, input.decisionQueueCount),
    pendingResponseCount: Math.max(0, input.pendingResponseCount),
    slaOverdueCount: Math.max(0, input.slaOverdueCount),
    renewalCandidateCount: Math.max(0, input.renewalCandidateCount)
  };
}

type AdminContractKpiPanelProps = {
  copy: KpiCopy;
  snapshot: ContractKpiSnapshot;
};

type ContractPriorityAction = {
  href: string;
  label: string;
  reason: string;
};

type ContractQuickAction = {
  href: string;
  label: string;
};

function withAnalyticsSourceContext(href: string, focusMetric?: string): string {
  const separator = href.includes("?") ? "&" : "?";
  const focusQuery = focusMetric ? `&focusMetric=${focusMetric}` : "";
  return `${href}${separator}source=admin-analytics${focusQuery}`;
}

function resolveContractPriorityAction(
  snapshot: ContractKpiSnapshot,
  copy: KpiCopy
): ContractPriorityAction {
  if (snapshot.slaOverdueCount > 0) {
    return {
      href: withAnalyticsSourceContext(
        "/admin/contracts?slaRisk=OVERDUE",
        "contractSlaOverdueCount"
      ),
      label: copy.contractPanel.actionOpenSlaOverdueQueue,
      reason: copy.contractPanel.priorityReasonSlaOverdue
    };
  }
  if (snapshot.pendingResponseCount > 0) {
    return {
      href: withAnalyticsSourceContext("/admin/contracts?status=SENT"),
      label: copy.contractPanel.actionOpenPendingResponseQueue,
      reason: copy.contractPanel.priorityReasonPendingResponse
    };
  }
  if (snapshot.decisionQueueCount > 0) {
    return {
      href: withAnalyticsSourceContext(
        "/admin/contracts?decisionQueueOnly=true",
        "contractDecisionQueueCount"
      ),
      label: copy.contractPanel.actionOpenDecisionQueue,
      reason: copy.contractPanel.priorityReasonDecisionQueue
    };
  }
  if (snapshot.renewalCandidateCount > 0) {
    return {
      href: withAnalyticsSourceContext("/admin/contracts?renewalCandidateOnly=true"),
      label: copy.contractPanel.actionOpenContractsWorkspace,
      reason: copy.contractPanel.priorityReasonRenewal
    };
  }
  return {
    href: withAnalyticsSourceContext("/admin/contracts"),
    label: copy.contractPanel.actionOpenContractsWorkspace,
    reason: copy.contractPanel.priorityReasonClear
  };
}

function buildContractQuickActions(copy: KpiCopy): ContractQuickAction[] {
  return [
    {
      href: withAnalyticsSourceContext("/admin/contracts"),
      label: copy.contractPanel.actionOpenContractsWorkspace
    },
    {
      href: withAnalyticsSourceContext(
        "/admin/contracts?decisionQueueOnly=true",
        "contractDecisionQueueCount"
      ),
      label: copy.contractPanel.actionOpenDecisionQueue
    },
    {
      href: withAnalyticsSourceContext("/admin/contracts?status=SENT"),
      label: copy.contractPanel.actionOpenPendingResponseQueue
    },
    {
      href: withAnalyticsSourceContext(
        "/admin/contracts?slaRisk=OVERDUE",
        "contractSlaOverdueCount"
      ),
      label: copy.contractPanel.actionOpenSlaOverdueQueue
    }
  ];
}

export function AdminContractKpiPanel({
  copy,
  snapshot
}: AdminContractKpiPanelProps) {
  const priorityAction = resolveContractPriorityAction(snapshot, copy);
  const quickActions = buildContractQuickActions(copy);

  return (
    <article className="panel">
      <h2>{copy.contractPanel.title}</h2>
      <p className="small muted">{copy.contractPanel.description}</p>
      <div className="kpi-strip">
        <article className="kpi-card">
          <p>{copy.contractPanel.decisionQueueCount}</p>
          <strong>{snapshot.decisionQueueCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.contractPanel.pendingResponseCount}</p>
          <strong>{snapshot.pendingResponseCount}</strong>
          <small>{copy.contractPanel.pendingResponseHint}</small>
        </article>
        <article className="kpi-card">
          <p>{copy.contractPanel.slaOverdueCount}</p>
          <strong>{snapshot.slaOverdueCount}</strong>
          <small>{copy.contractPanel.slaOverdueHint}</small>
        </article>
        <article className="kpi-card">
          <p>{copy.contractPanel.renewalCandidateCount}</p>
          <strong>{snapshot.renewalCandidateCount}</strong>
        </article>
      </div>
      <section style={{ marginTop: 12 }}>
        <p className="small muted">{copy.contractPanel.priorityActionLabel}</p>
        <p className="small" style={{ marginTop: 4 }}>
          {priorityAction.reason}
        </p>
        <div className="actions" style={{ marginTop: 8 }}>
          <Link href={priorityAction.href} className="btn btn-primary btn-small">
            {priorityAction.label}
          </Link>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          {copy.contractPanel.quickActionsLabel}
        </p>
        <div className="actions" style={{ marginTop: 6 }}>
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="btn btn-secondary btn-small">
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
