"use client";

import { useCallback, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import {
  formatEmployeeDisplayName,
  formatUserFacingErrorMessage
} from "@/lib/product-language";

type TabKey = "overtime" | "attendance" | "leave" | "payroll";

type OvertimeItem = {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  weeklyAverage: number;
  exceededWeeks: number;
};

type AttendanceItem = {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
};

export default function AdminReportsPage() {
  const { loading: sessionLoading } = useSupabaseSession();
  const [tab, setTab] = useState<TabKey>("overtime");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [overtimeItems, setOvertimeItems] = useState<OvertimeItem[]>([]);
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const loadOvertime = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const path = `/api/admin/reports/overtime?period=monthly&year=${year}&month=${month}&limit=100`;
      const result = await performAdminApiCall({
        label: "초과근무 리포트 조회",
        method: "GET",
        path,
        runtimeLocale: "ko-KR"
      });
      if (!result.response.ok) {
        throw new Error("초과근무 리포트를 불러오지 못했습니다.");
      }
      const body = result.body as { items?: OvertimeItem[] };
      setOvertimeItems(body?.items ?? []);
    } catch (err) {
      setError(formatUserFacingErrorMessage(err instanceof Error ? err.message : String(err), "ko-KR"));
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const path = `/api/admin/reports/attendance/department-summary?startDate=${fromDate}&endDate=${toDate}`;
      const result = await performAdminApiCall({
        label: "근태 부서 요약 조회",
        method: "GET",
        path,
        runtimeLocale: "ko-KR"
      });
      if (!result.response.ok) {
        throw new Error("근태 요약을 불러오지 못했습니다.");
      }
      const body = result.body as { items?: AttendanceItem[] };
      setAttendanceItems(body?.items ?? []);
    } catch (err) {
      setError(formatUserFacingErrorMessage(err instanceof Error ? err.message : String(err), "ko-KR"));
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  const handleExport = async (type: "overtime" | "leave" | "payroll") => {
    const fromIso = new Date(`${fromDate}T00:00:00+09:00`).toISOString();
    const toIso = new Date(`${toDate}T23:59:59+09:00`).toISOString();
    const pathMap: Record<typeof type, string> = {
      overtime: `/api/admin/reports/overtime/export?period=monthly&year=${year}&month=${month}`,
      leave: `/api/admin/reports/leave/export?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
      payroll: `/api/admin/reports/payroll/export?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    };

    try {
      const result = await performAdminApiCall({
        label: `${type} CSV 내보내기`,
        method: "GET",
        path: pathMap[type],
        runtimeLocale: "ko-KR"
      });
      if (result.response.ok) {
        const text = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
        const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${type}-report.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // best-effort export
    }
  };

  if (sessionLoading) {
    return null;
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overtime", label: "초과근무" },
    { key: "attendance", label: "근태 요약" },
    { key: "leave", label: "휴가" },
    { key: "payroll", label: "급여" }
  ];

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">리포트</h1>
          <p className="page-subtitle">근태, 초과근무, 휴가, 급여 데이터를 조회하고 내보냅니다.</p>
        </div>
      </header>

      {error ? <p className="small fail">{error}</p> : null}

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            className={tabItem.key === tab ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => setTab(tabItem.key)}
          >
            {tabItem.label}
          </button>
        ))}
      </nav>

      {tab === "overtime" ? (
        <section className="panel">
          <h2>초과근무 리포트</h2>
          <div className="input-grid" style={{ marginBottom: "1rem" }}>
            <label>
              연도
              <input type="number" value={year} onChange={(event) => setYear(event.target.value)} min={2020} max={2030} />
            </label>
            <label>
              월
              <input type="number" value={month} onChange={(event) => setMonth(event.target.value)} min={1} max={12} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
              <button className="btn btn-primary" type="button" onClick={() => void loadOvertime()}>
                조회
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => void handleExport("overtime")}>
                CSV
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="small muted">불러오는 중...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>직원명</th>
                  <th>부서</th>
                  <th>정규 시간</th>
                  <th>초과 시간</th>
                  <th>합계</th>
                  <th>주 평균</th>
                  <th>초과 주 수</th>
                </tr>
              </thead>
              <tbody>
                {overtimeItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted" style={{ textAlign: "center" }}>
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  overtimeItems.map((item) => (
                    <tr key={item.employeeId}>
                      <td>{formatEmployeeDisplayName(item.employeeName, "ko-KR")}</td>
                      <td>{item.departmentName || "-"}</td>
                      <td>{item.regularHours}</td>
                      <td>{item.overtimeHours}</td>
                      <td>{item.totalHours}</td>
                      <td>{item.weeklyAverage}</td>
                      <td>{item.exceededWeeks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {tab === "attendance" ? (
        <section className="panel">
          <h2>근태 부서별 요약</h2>
          <div className="input-grid" style={{ marginBottom: "1rem" }}>
            <label>
              시작일
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              종료일
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn btn-primary" type="button" onClick={() => void loadAttendance()}>
                조회
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="small muted">불러오는 중...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>부서</th>
                  <th>총원</th>
                  <th>출근</th>
                  <th>결근</th>
                  <th>지각</th>
                </tr>
              </thead>
              <tbody>
                {attendanceItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  attendanceItems.map((item) => (
                    <tr key={item.departmentId}>
                      <td>{item.departmentName || "-"}</td>
                      <td>{item.totalEmployees}</td>
                      <td>{item.presentCount}</td>
                      <td>{item.absentCount}</td>
                      <td>{item.lateCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {tab === "leave" ? (
        <section className="panel">
          <h2>휴가 리포트</h2>
          <p className="small muted">날짜 범위를 선택하고 CSV로 내보냅니다.</p>
          <div className="input-grid" style={{ marginBottom: "1rem" }}>
            <label>
              시작일
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              종료일
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn btn-secondary" type="button" onClick={() => void handleExport("leave")}>
                CSV 내보내기
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "payroll" ? (
        <section className="panel">
          <h2>급여 리포트</h2>
          <p className="small muted">날짜 범위를 선택하고 CSV로 내보냅니다.</p>
          <div className="input-grid" style={{ marginBottom: "1rem" }}>
            <label>
              시작일
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              종료일
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn btn-secondary" type="button" onClick={() => void handleExport("payroll")}>
                CSV 내보내기
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
