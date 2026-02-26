import {
  type AdminContractsCopy,
  type ContractDocumentStatus
} from "@/components/contracts/copy";
import {
  contractDocumentStatusFilters,
  type ContractDocumentSlaRiskFilter,
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
  slaRiskFilter: ContractDocumentSlaRiskFilter;
  onSlaRiskFilterChange: (value: ContractDocumentSlaRiskFilter) => void;
  renewalCandidateOnly: boolean;
  onRenewalCandidateOnlyChange: (value: boolean) => void;
  statusLabels: Record<ContractDocumentStatus, string>;
  visibleCount: number;
  totalCount: number;
  expiringSoonCount: number;
  dueSoonSlaCount: number;
  overdueSlaCount: number;
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
  slaRiskFilter,
  onSlaRiskFilterChange,
  renewalCandidateOnly,
  onRenewalCandidateOnlyChange,
  statusLabels,
  visibleCount,
  totalCount,
  expiringSoonCount,
  dueSoonSlaCount,
  overdueSlaCount,
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
        <label>
          {copy.slaRiskFilterLabel}
          <select
            value={slaRiskFilter}
            onChange={(event) => onSlaRiskFilterChange(event.target.value as ContractDocumentSlaRiskFilter)}
          >
            <option value="ALL">{copy.slaRiskAllOption}</option>
            <option value="DUE_SOON">{copy.slaRiskDueSoonOption}</option>
            <option value="OVERDUE">{copy.slaRiskOverdueOption}</option>
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
        {copy.expiringSoonCountLabel} {expiringSoonCount} | {copy.slaRiskDueSoonOption} {dueSoonSlaCount} |{" "}
        {copy.overdueSlaCountLabel} {overdueSlaCount} | {copy.renewalCandidateCountLabel} {renewalCandidateCount}
      </p>
      <div className="contract-action-row">
        <span className="small muted">{copy.slaRiskFilterLabel}</span>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onSlaRiskFilterChange("ALL")}>{copy.slaRiskAllOption}</button>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onSlaRiskFilterChange("DUE_SOON")}>{copy.slaRiskDueSoonOption}</button>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onSlaRiskFilterChange("OVERDUE")}>{copy.slaRiskOverdueOption}</button>
      </div>
      <div className="contract-action-row">
        <span className="small muted">{copy.expirationWindowFilterLabel}</span>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onExpirationWindowDaysChange("ALL")}>{copy.expirationWindowAllOption}</button>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onExpirationWindowDaysChange("7")}>{copy.expirationWindow7Option}</button>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onExpirationWindowDaysChange("14")}>{copy.expirationWindow14Option}</button>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onExpirationWindowDaysChange("30")}>{copy.expirationWindow30Option}</button>
      </div>
    </>
  );
}
