import type { EmployeeInboxDeadlineFilter } from "@/components/contracts/employee-inbox-filter-helpers";
import type { EmployeeContractsCopy } from "@/components/contracts/copy";

type EmployeeContractsInboxQuickFiltersProps = Pick<
  EmployeeContractsCopy,
  | "dueSoonBadgeLabel"
  | "overdueBadgeLabel"
  | "riskQuickFilterLabel"
  | "riskQuickAllAction"
  | "riskQuickActionNeededAction"
  | "riskQuickDueSoonAction"
  | "riskQuickOverdueAction"
  | "clearSearchAction"
  | "visibleCountLabel"
  | "actionNeededCountLabel"
  | "pendingResponseCountLabel"
  | "dueSoonCountLabel"
  | "overdueCountLabel"
> & {
  filteredCount: number;
  totalCount: number;
  actionNeededCount: number;
  pendingResponseCount: number;
  dueSoonCount: number;
  overdueCount: number;
  onChangeDeadlineFilter: (filter: EmployeeInboxDeadlineFilter) => void;
  onClearSearch: () => void;
};

export function EmployeeContractsInboxQuickFilters({
  dueSoonBadgeLabel,
  overdueBadgeLabel,
  riskQuickFilterLabel,
  riskQuickAllAction,
  riskQuickActionNeededAction,
  riskQuickDueSoonAction,
  riskQuickOverdueAction,
  clearSearchAction,
  visibleCountLabel,
  actionNeededCountLabel,
  pendingResponseCountLabel,
  dueSoonCountLabel,
  overdueCountLabel,
  filteredCount,
  totalCount,
  actionNeededCount,
  pendingResponseCount,
  dueSoonCount,
  overdueCount,
  onChangeDeadlineFilter,
  onClearSearch
}: EmployeeContractsInboxQuickFiltersProps) {
  return (
    <div className="contract-action-row">
      <span className="small muted" title={`${dueSoonBadgeLabel} / ${overdueBadgeLabel}`}>
        {riskQuickFilterLabel}
      </span>
      <button type="button" className="btn btn-secondary btn-small" onClick={() => onChangeDeadlineFilter("all")}>
        {riskQuickAllAction}
      </button>
      <button type="button" className="btn btn-secondary btn-small" onClick={() => onChangeDeadlineFilter("action_needed")}>
        {riskQuickActionNeededAction}
      </button>
      <button type="button" className="btn btn-secondary btn-small" onClick={() => onChangeDeadlineFilter("due_soon")}>
        {riskQuickDueSoonAction}
      </button>
      <button type="button" className="btn btn-secondary btn-small" onClick={() => onChangeDeadlineFilter("overdue")}>
        {riskQuickOverdueAction}
      </button>
      <button type="button" className="btn btn-secondary btn-small" onClick={onClearSearch}>
        {clearSearchAction}
      </button>
      <p className="small muted">{visibleCountLabel}: {filteredCount} / {totalCount}</p>
      <p className="small muted">{actionNeededCountLabel}: {actionNeededCount}</p>
      <p className="small muted">{pendingResponseCountLabel}: {pendingResponseCount}</p>
      <p className="small muted">{dueSoonCountLabel}: {dueSoonCount}</p>
      <p className="small muted">{overdueCountLabel}: {overdueCount}</p>
    </div>
  );
}
