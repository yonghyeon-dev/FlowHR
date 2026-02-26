import {
  type AdminContractsCopy,
  type ContractDocumentStatus
} from "@/components/contracts/copy";
import {
  contractDocumentStatusFilters,
  type ContractDocumentExpirationWindow,
  type ContractDocumentStatusFilter
} from "@/components/contracts/useAdminContractsDocumentFilters";

type AdminContractsDocumentFilterControlsProps = {
  copy: AdminContractsCopy;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: ContractDocumentStatusFilter;
  onStatusFilterChange: (value: ContractDocumentStatusFilter) => void;
  expirationWindowDays: ContractDocumentExpirationWindow;
  onExpirationWindowDaysChange: (value: ContractDocumentExpirationWindow) => void;
  renewalCandidateOnly: boolean;
  onRenewalCandidateOnlyChange: (value: boolean) => void;
  statusLabels: Record<ContractDocumentStatus, string>;
  visibleCount: number;
  totalCount: number;
  expiringSoonCount: number;
  renewalCandidateCount: number;
};

export function AdminContractsDocumentFilterControls({
  copy,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  expirationWindowDays,
  onExpirationWindowDaysChange,
  renewalCandidateOnly,
  onRenewalCandidateOnlyChange,
  statusLabels,
  visibleCount,
  totalCount,
  expiringSoonCount,
  renewalCandidateCount
}: AdminContractsDocumentFilterControlsProps) {
  return (
    <>
      <div className="contract-form-grid">
        <label>
          {copy.documentSearchLabel}
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={copy.documentSearchPlaceholder}
          />
        </label>
        <label>
          {copy.documentStatusFilterLabel}
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as ContractDocumentStatusFilter)}
          >
            <option value="ALL">{copy.allDocumentStatusOption}</option>
            {contractDocumentStatusFilters.map((status: ContractDocumentStatus) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {copy.expirationWindowFilterLabel}
          <select
            value={expirationWindowDays}
            onChange={(event) => onExpirationWindowDaysChange(event.target.value as ContractDocumentExpirationWindow)}
          >
            <option value="ALL">{copy.expirationWindowAllOption}</option>
            <option value="7">{copy.expirationWindow7Option}</option>
            <option value="14">{copy.expirationWindow14Option}</option>
            <option value="30">{copy.expirationWindow30Option}</option>
          </select>
        </label>
      </div>
      <label>
        <input
          type="checkbox"
          checked={renewalCandidateOnly}
          onChange={(event) => onRenewalCandidateOnlyChange(event.target.checked)}
        />{" "}
        {copy.renewalCandidateOnlyLabel}
      </label>
      <p className="small">
        {copy.documentVisibleCountLabel} {visibleCount} / {totalCount}
      </p>
      <p className="small muted">
        {copy.expiringSoonCountLabel} {expiringSoonCount} | {copy.renewalCandidateCountLabel}{" "}
        {renewalCandidateCount}
      </p>
    </>
  );
}
