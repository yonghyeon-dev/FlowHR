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

export function AdminBenefitsKpiPanel({
  copy,
  snapshot
}: AdminBenefitsKpiPanelProps) {
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
    </article>
  );
}
