"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { formatEmployeeStatusLabel, formatUserFacingErrorMessage } from "@/lib/product-language";

type EmployeeListItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  active: boolean;
  departmentId: string | null;
  positionId: string | null;
};

function getLabel(ko: string, en: string) {
  return ko;
}

export default function EmployeePeoplePage() {
  const { loading: sessionLoading } = useSupabaseSession();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClientFetch({ method: "GET", path: "/api/people/employees?active=true" });
      const body = (await parseApiResponseBody(response)) as {
        employees?: EmployeeListItem[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(formatUserFacingErrorMessage(body?.error ?? "Failed to load employees", "ko-KR"));
      }
      setEmployees(body?.employees ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(formatUserFacingErrorMessage(message, "ko-KR"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading) {
      void loadEmployees();
    }
  }, [sessionLoading, loadEmployees]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.trim().toLowerCase();
    return employees.filter((employee) => (employee.name ?? "").toLowerCase().includes(q) || (employee.email ?? "").toLowerCase().includes(q));
  }, [employees, search]);

  if (sessionLoading) return null;

  const l = getLabel;

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{l("동료 디렉터리", "People Directory")}</h1>
          <p className="page-subtitle">{l("같은 조직의 동료 정보를 조회합니다.", "Browse your organization's people directory.")}</p>
        </div>
      </header>

      {error ? <p className="small fail">{error}</p> : null}

      <section className="panel">
        <div className="input-grid" style={{ marginBottom: "1rem" }}>
          <label>
            {l("검색", "Search")}
            <input
              type="text"
              placeholder={l("이름 또는 이메일", "Name or email")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="small muted">{l("불러오는 중...", "Loading...")}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{l("이름", "Name")}</th>
                <th>{l("이메일", "Email")}</th>
                <th>{l("전화번호", "Phone")}</th>
                <th>{l("상태", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted" style={{ textAlign: "center" }}>
                    {l("직원을 찾을 수 없습니다.", "No employees found.")}
                  </td>
                </tr>
              ) : (
                filtered.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name ?? "-"}</td>
                    <td>{employee.email ?? "-"}</td>
                    <td>{employee.phone ?? "-"}</td>
                    <td>{formatEmployeeStatusLabel(employee.status, "ko-KR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <p className="small muted" style={{ marginTop: "0.5rem" }}>
          {l(`총 ${filtered.length}명`, `Total: ${filtered.length}`)}
        </p>
      </section>
    </main>
  );
}
