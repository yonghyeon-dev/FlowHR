import {
  type AdminContractsCopy,
  type ContractDocumentStatus
} from "@/components/contracts/copy";
import {
  contractDocumentStatusFilters,
  type ContractDocumentStatusFilter
} from "@/components/contracts/useAdminContractsDocumentFilters";

type AdminContractsDocumentFilterControlsProps = {
  copy: AdminContractsCopy;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: ContractDocumentStatusFilter;
  onStatusFilterChange: (value: ContractDocumentStatusFilter) => void;
  statusLabels: Record<ContractDocumentStatus, string>;
  visibleCount: number;
  totalCount: number;
};

export function AdminContractsDocumentFilterControls({
  copy,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  statusLabels,
  visibleCount,
  totalCount
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
      </div>
      <p className="small">
        {copy.documentVisibleCountLabel} {visibleCount} / {totalCount}
      </p>
    </>
  );
}
