import Link from "next/link";

import { type KpiCopy } from "@/components/admin-kpi/copy";

type BenefitCatalogLite = {
  id: string;
  annualLimitKrw: number;
  status: "ACTIVE" | "INACTIVE";
};

type BenefitRequestLite = {
  benefitId: string;
  amountKrw: number;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELED";
  requestedAt: string;
};

export type BenefitsKpiSnapshot = {
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingAging3dCount: number;
  overLimitSubmittedCount: number;
};

const PENDING_AGING_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

export function buildBenefitsKpiSnapshot(
  input: {
    catalog: BenefitCatalogLite[];
    requests: BenefitRequestLite[];
  },
  now = new Date()
): BenefitsKpiSnapshot {
  const nowMs = now.getTime();
  const annualLimitByBenefitId = new Map<string, number>();
  input.catalog.forEach((item) =>
    annualLimitByBenefitId.set(item.id, item.annualLimitKrw)
  );

  let submittedCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let pendingAging3dCount = 0;
  let overLimitSubmittedCount = 0;

  for (const request of input.requests) {
    if (request.status === "SUBMITTED") {
      submittedCount += 1;
      const requestedAtMs = new Date(request.requestedAt).getTime();
      if (
        Number.isFinite(requestedAtMs) &&
        nowMs - requestedAtMs >= PENDING_AGING_THRESHOLD_MS
      ) {
        pendingAging3dCount += 1;
      }
      const annualLimit = annualLimitByBenefitId.get(request.benefitId);
      if (typeof annualLimit === "number" && request.amountKrw > annualLimit) {
        overLimitSubmittedCount += 1;
      }
      continue;
    }
    if (request.status === "APPROVED") {
      approvedCount += 1;
      continue;
    }
    if (request.status === "REJECTED") {
      rejectedCount += 1;
    }
  }

  return {
    submittedCount,
    approvedCount,
    rejectedCount,
    pendingAging3dCount,
    overLimitSubmittedCount
  };
}

type AdminBenefitsKpiPanelProps = {
  copy: KpiCopy;
  snapshot: BenefitsKpiSnapshot;
};

type BenefitsPriorityAction = {
  href: string;
  label: string;
  reason: string;
};

type BenefitsQuickAction = {
  href: string;
  label: string;
};

function withAnalyticsSourceContext(href: string): string {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}source=admin-analytics`;
}

function resolveBenefitsPriorityAction(
  snapshot: BenefitsKpiSnapshot,
  copy: KpiCopy
): BenefitsPriorityAction {
  if (snapshot.pendingAging3dCount > 0) {
    return {
      href: withAnalyticsSourceContext("/admin/benefits?status=SUBMITTED&risk=pending_3d"),
      label: copy.benefitsPanel.actionOpenPendingQueue,
      reason: copy.benefitsPanel.priorityReasonAging
    };
  }
  if (snapshot.overLimitSubmittedCount > 0) {
    return {
      href: withAnalyticsSourceContext("/admin/benefits?status=SUBMITTED&risk=over_limit"),
      label: copy.benefitsPanel.actionOpenOverLimitQueue,
      reason: copy.benefitsPanel.priorityReasonOverLimit
    };
  }
  if (snapshot.submittedCount > 0) {
    return {
      href: withAnalyticsSourceContext("/admin/benefits?status=SUBMITTED"),
      label: copy.benefitsPanel.actionOpenBenefitsWorkspace,
      reason: copy.benefitsPanel.priorityReasonSubmitted
    };
  }
  return {
    href: withAnalyticsSourceContext("/admin/benefits"),
    label: copy.benefitsPanel.actionOpenBenefitsWorkspace,
    reason: copy.benefitsPanel.priorityReasonClear
  };
}

function buildBenefitsQuickActions(copy: KpiCopy): BenefitsQuickAction[] {
  return [
    {
      href: withAnalyticsSourceContext("/admin/benefits"),
      label: copy.benefitsPanel.actionOpenBenefitsWorkspace
    },
    {
      href: withAnalyticsSourceContext("/admin/benefits?status=SUBMITTED&risk=pending_3d"),
      label: copy.benefitsPanel.actionOpenPendingQueue
    },
    {
      href: withAnalyticsSourceContext("/admin/benefits?status=SUBMITTED&risk=over_limit"),
      label: copy.benefitsPanel.actionOpenOverLimitQueue
    }
  ];
}

export function AdminBenefitsKpiPanel({
  copy,
  snapshot
}: AdminBenefitsKpiPanelProps) {
  const priorityAction = resolveBenefitsPriorityAction(snapshot, copy);
  const quickActions = buildBenefitsQuickActions(copy);
  return (
    <article className="panel">
      <h2>{copy.benefitsPanel.title}</h2>
      <p className="small muted">{copy.benefitsPanel.description}</p>
      <div className="kpi-strip">
        <article className="kpi-card">
          <p>{copy.benefitsPanel.submittedCount}</p>
          <strong>{snapshot.submittedCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.benefitsPanel.approvedCount}</p>
          <strong>{snapshot.approvedCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.benefitsPanel.rejectedCount}</p>
          <strong>{snapshot.rejectedCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.benefitsPanel.pendingAging3dCount}</p>
          <strong>{snapshot.pendingAging3dCount}</strong>
          <small>{copy.benefitsPanel.agingThreshold}</small>
        </article>
        <article className="kpi-card">
          <p>{copy.benefitsPanel.overLimitSubmittedCount}</p>
          <strong>{snapshot.overLimitSubmittedCount}</strong>
          <small>{copy.benefitsPanel.overLimitHint}</small>
        </article>
      </div>
      <section style={{ marginTop: 12 }}>
        <p className="small muted">{copy.benefitsPanel.priorityActionLabel}</p>
        <p className="small" style={{ marginTop: 4 }}>
          {priorityAction.reason}
        </p>
        <div className="actions" style={{ marginTop: 8 }}>
          <Link href={priorityAction.href} className="btn btn-primary btn-small">
            {priorityAction.label}
          </Link>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          {copy.benefitsPanel.quickActionsLabel}
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
