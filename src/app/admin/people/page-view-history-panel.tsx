import {
  actionLabel,
  changeHighlightClass,
  formatDateTime
} from "@/app/admin/people/page-helpers";
import {
  type Department,
  type Employee,
  type EmployeeHistory,
  type HistoryChangeSummaryItem,
  type HistoryEntryChange,
  type Position,
  type ProfileField
} from "@/app/admin/people/page-types";

type AdminPeopleHistoryPanelProps = {
  isKoLocale: boolean;
  runtimeLocale: string;
  selectedEmployee: Employee | null;
  editDepartmentId: string;
  setEditDepartmentId: (value: string) => void;
  editPositionId: string;
  setEditPositionId: (value: string) => void;
  editActive: string;
  setEditActive: (value: string) => void;
  selectedDepartments: Department[];
  selectedPositions: Position[];
  applySelectedProfileUpdate: () => Promise<void>;
  loadSelectedEmployeeHistory: (employeeId: string) => Promise<void>;
  history: EmployeeHistory[];
  historyChangeSummary: HistoryChangeSummaryItem[];
  historyChanges: (entry: EmployeeHistory) => HistoryEntryChange[];
  profileFieldLabel: Record<ProfileField, string>;
};

export function AdminPeopleHistoryPanel({
  isKoLocale,
  runtimeLocale,
  selectedEmployee,
  editDepartmentId,
  setEditDepartmentId,
  editPositionId,
  setEditPositionId,
  editActive,
  setEditActive,
  selectedDepartments,
  selectedPositions,
  applySelectedProfileUpdate,
  loadSelectedEmployeeHistory,
  history,
  historyChangeSummary,
  historyChanges,
  profileFieldLabel
}: AdminPeopleHistoryPanelProps) {
  return (
    <article className="panel panel-employee-history">
      <h2>{isKoLocale ? "인사 이력" : "HR history"}</h2>
      {selectedEmployee ? (
        <>
          <p className="small">
            {isKoLocale ? "선택 직원" : "Selected employee"}: <strong>{selectedEmployee.id}</strong> · {isKoLocale ? "최근 업데이트" : "Last updated"}{" "}
            {formatDateTime(selectedEmployee.updatedAt, runtimeLocale)}
          </p>
          <div className="input-grid">
            <label>
              {isKoLocale ? "부서 재배정" : "Reassign department"}
              <select value={editDepartmentId} onChange={(event) => setEditDepartmentId(event.target.value)}>
                <option value="">{isKoLocale ? "미지정" : "Unassigned"}</option>
                {selectedDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} ({department.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              {isKoLocale ? "직급 재배정" : "Reassign position"}
              <select value={editPositionId} onChange={(event) => setEditPositionId(event.target.value)}>
                <option value="">{isKoLocale ? "미지정" : "Unassigned"}</option>
                {selectedPositions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name} ({position.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              {isKoLocale ? "활성 상태" : "Active status"}
              <select value={editActive} onChange={(event) => setEditActive(event.target.value)}>
                <option value="true">{isKoLocale ? "활성" : "Active"}</option>
                <option value="false">{isKoLocale ? "비활성" : "Inactive"}</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void applySelectedProfileUpdate()}>
              {isKoLocale ? "프로필 업데이트" : "Update profile"}
            </button>
            <button className="btn btn-secondary" onClick={() => void loadSelectedEmployeeHistory(selectedEmployee.id)}>
              {isKoLocale ? "이력 조회" : "Load history"}
            </button>
          </div>
        </>
      ) : (
        <p className="small muted">{isKoLocale ? "조직도 트리에서 직원을 선택하세요." : "Select an employee from the org chart."}</p>
      )}

      {history.length === 0 ? (
        <p className="small muted">표시할 이력이 없습니다.</p>
      ) : (
        <>
          {historyChangeSummary.length > 0 ? (
            <ul className="history-change-summary-list" aria-label={isKoLocale ? "이력 변경 요약" : "History change summary"}>
              {historyChangeSummary.map((item) => (
                <li key={item.field} className={`history-change-summary-chip ${changeHighlightClass(item.field)}`}>
                  <strong>{item.label}</strong>
                  <span>
                    {item.count}
                    {isKoLocale ? "건 변경" : " changes"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <ul className="history-card-list" aria-label={isKoLocale ? "직원 인사 이력" : "Employee HR history"}>
            {history.map((entry, index) => {
              const changes = historyChanges(entry);
              return (
                <li key={`${entry.action}-${entry.createdAt}-${index}`} className="history-card">
                  <div className="history-card-head">
                    <strong>{actionLabel(entry.action, isKoLocale)}</strong>
                    <span className="muted">{formatDateTime(entry.createdAt, runtimeLocale)}</span>
                  </div>
                  <p className="small">
                    {isKoLocale ? "액터" : "actor"} {entry.actorRole}
                    {entry.actorId ? ` (${entry.actorId})` : ""}
                  </p>
                  {changes.length === 0 ? (
                    <p className="small muted">변경 필드 정보가 없습니다.</p>
                  ) : (
                    <ul className="history-change-list">
                      {changes.map((change) => (
                        <li
                          key={`${entry.createdAt}-${change.field}`}
                          className={`history-change-item ${changeHighlightClass(change.field)}`}
                        >
                          <span className="history-change-field">{profileFieldLabel[change.field]}</span>
                          <span className="history-before">{change.before}</span>
                          <span className="history-arrow">→</span>
                          <span className="history-after">{change.after}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
