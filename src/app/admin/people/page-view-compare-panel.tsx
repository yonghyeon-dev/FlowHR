import { type CompareRow, type Employee } from "@/app/admin/people/page-types";

type AdminPeopleComparePanelProps = {
  isKoLocale: boolean;
  compareA: string;
  setCompareA: (value: string) => void;
  compareB: string;
  setCompareB: (value: string) => void;
  filteredEmployees: Employee[];
  compareRows: CompareRow[];
  compareEmployeeA: Employee | null;
  compareEmployeeB: Employee | null;
};

export function AdminPeopleComparePanel({
  isKoLocale,
  compareA,
  setCompareA,
  compareB,
  setCompareB,
  filteredEmployees,
  compareRows,
  compareEmployeeA,
  compareEmployeeB
}: AdminPeopleComparePanelProps) {
  return (
    <article className="panel panel-employee-compare">
      <h2>{isKoLocale ? "직원 비교" : "Employee comparison"}</h2>
      <div className="input-grid">
        <label>
          {isKoLocale ? "비교 A" : "Compare A"}
          <select value={compareA} onChange={(event) => setCompareA(event.target.value)}>
            <option value="">{isKoLocale ? "선택" : "Select"}</option>
            {filteredEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.id}
                {employee.name ? ` (${employee.name})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          {isKoLocale ? "비교 B" : "Compare B"}
          <select value={compareB} onChange={(event) => setCompareB(event.target.value)}>
            <option value="">{isKoLocale ? "선택" : "Select"}</option>
            {filteredEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.id}
                {employee.name ? ` (${employee.name})` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      {compareRows.length === 0 ? (
        <p className="small muted">{isKoLocale ? "비교할 두 직원을 선택하세요." : "Select two employees to compare."}</p>
      ) : (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>{isKoLocale ? "항목" : "Field"}</th>
                <th>{compareEmployeeA?.id}</th>
                <th>{compareEmployeeB?.id}</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.label} className={row.diff ? "compare-diff-row" : ""}>
                  <th>
                    {row.label}
                    {row.diff ? <span className="compare-change-chip">{isKoLocale ? "변경됨" : "CHANGED"}</span> : null}
                  </th>
                  <td>{row.a}</td>
                  <td>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
