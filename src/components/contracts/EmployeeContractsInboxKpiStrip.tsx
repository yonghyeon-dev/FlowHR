import type { EmployeeContractsCopy } from "@/components/contracts/copy";

type EmployeeContractsInboxKpiStripProps = Pick<
  EmployeeContractsCopy,
  | "visibleCountLabel"
  | "actionNeededCountLabel"
  | "pendingResponseCountLabel"
  | "dueSoonCountLabel"
  | "overdueCountLabel"
> & {
  visibleCount: number;
  actionNeededCount: number;
  pendingResponseCount: number;
  dueSoonCount: number;
  overdueCount: number;
};

export function EmployeeContractsInboxKpiStrip({
  visibleCountLabel,
  actionNeededCountLabel,
  pendingResponseCountLabel,
  dueSoonCountLabel,
  overdueCountLabel,
  visibleCount,
  actionNeededCount,
  pendingResponseCount,
  dueSoonCount,
  overdueCount
}: EmployeeContractsInboxKpiStripProps) {
  return (
    <div className="kpi-strip workspace-summary-strip employee-workspace-status-strip">
      <article className="kpi-card">
        <span>{visibleCountLabel}</span>
        <strong>{visibleCount}</strong>
      </article>
      <article className="kpi-card">
        <span>{actionNeededCountLabel}</span>
        <strong>{actionNeededCount}</strong>
      </article>
      <article className="kpi-card">
        <span>{pendingResponseCountLabel}</span>
        <strong>{pendingResponseCount}</strong>
      </article>
      <article className="kpi-card">
        <span>{dueSoonCountLabel}</span>
        <strong>{dueSoonCount}</strong>
      </article>
      <article className="kpi-card">
        <span>{overdueCountLabel}</span>
        <strong>{overdueCount}</strong>
      </article>
    </div>
  );
}
