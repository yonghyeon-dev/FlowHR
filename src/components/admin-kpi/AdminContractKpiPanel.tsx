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

export function AdminContractKpiPanel({
  copy,
  snapshot
}: AdminContractKpiPanelProps) {
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
    </article>
  );
}
