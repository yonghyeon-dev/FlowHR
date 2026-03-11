"use client";

import Link from "next/link";
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
      const body = (await parseApiResponseBody(response)) as { employees?: EmployeeListItem[]; error?: string };

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
    if (!sessionLoading) void loadEmployees();
  }, [sessionLoading, loadEmployees]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.trim().toLowerCase();
    return employees.filter((employee) => {
      return (employee.name ?? "").toLowerCase().includes(q) || (employee.email ?? "").toLowerCase().includes(q);
    });
  }, [employees, search]);

  if (sessionLoading) return null;

  return (
    <main className="saas-content workspace-shell employee-workspace-shell">
      <header className="page-header workspace-page-header employee-workspace-status-header">
        <div>
          <h1 className="page-title">직원 디렉터리</h1>
          <p className="page-subtitle">같은 조직의 직원 연락처와 재직 상태를 한눈에 확인합니다.</p>
          <p className="small muted workspace-source-banner">요청 처리 전에 담당자와 소속 정보를 빠르게 확인하는 참고 화면입니다.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            직원 홈
          </Link>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip employee-workspace-status-strip">
        <article className="kpi-card">
          <span>전체 직원</span>
          <strong>{employees.length}</strong>
        </article>
        <article className="kpi-card">
          <span>검색 결과</span>
          <strong>{filtered.length}</strong>
        </article>
        <article className="kpi-card">
          <span>재직 중</span>
          <strong>{employees.filter((employee) => employee.active).length}</strong>
        </article>
      </section>

      {error ? <p className="small fail workspace-inline-status">{error}</p> : null}

      <section className="panel workspace-section-card workspace-toolbar-card">
        <div className="input-grid" style={{ marginBottom: "1rem" }}>
          <label>
            직원 검색
            <input
              type="text"
              placeholder="이름 또는 이메일"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="small muted workspace-inline-status">직원 목록을 불러오는 중입니다.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted" style={{ textAlign: "center" }}>
                    검색 조건에 맞는 직원이 없습니다.
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
          총 {filtered.length}명
        </p>
      </section>
    </main>
  );
}
