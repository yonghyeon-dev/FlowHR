"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
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

type ReportsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  sourceHint: string;
  backToHubLabel: string;
  exportLabel: string;
  queryLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  dateFromLabel: string;
  dateToLabel: string;
  yearLabel: string;
  monthLabel: string;
  summaryTabLabel: string;
  summaryItemsLabel: string;
  summaryRangeLabel: string;
  tabs: Record<TabKey, string>;
  panelTitles: Record<TabKey, string>;
  panelDescriptions: Record<TabKey, string>;
  tableHeaders: {
    overtime: string[];
    attendance: string[];
  };
};

function getCopy(locale: string): ReportsCopy {
  if (locale === "ko") {
    return {
      pageTitle: "운영 리포트",
      pageSubtitle: "근태, 초과근무, 휴가, 급여 데이터를 조회하고 필요한 보고서를 내보냅니다.",
      sourceHint: "운영 리포트는 관리자 허브의 인사이트 레인과 월간 점검 흐름을 바로 지원합니다.",
      backToHubLabel: "관리자 허브",
      exportLabel: "CSV 내보내기",
      queryLabel: "조회",
      loadingLabel: "불러오는 중...",
      emptyLabel: "표시할 데이터가 없습니다.",
      dateFromLabel: "시작일",
      dateToLabel: "종료일",
      yearLabel: "연도",
      monthLabel: "월",
      summaryTabLabel: "현재 리포트",
      summaryItemsLabel: "불러온 항목",
      summaryRangeLabel: "조회 범위",
      tabs: {
        overtime: "초과근무",
        attendance: "근태 요약",
        leave: "휴가",
        payroll: "급여"
      },
      panelTitles: {
        overtime: "초과근무 리포트",
        attendance: "근태 부서 요약",
        leave: "휴가 리포트",
        payroll: "급여 리포트"
      },
      panelDescriptions: {
        overtime: "월 기준으로 초과근무 현황을 조회하고 CSV로 내보냅니다.",
        attendance: "기간 기준으로 부서별 출근, 결근, 지각 현황을 확인합니다.",
        leave: "기간 기준 휴가 데이터를 CSV로 내보냅니다.",
        payroll: "기간 기준 급여 데이터를 CSV로 내보냅니다."
      },
      tableHeaders: {
        overtime: ["직원명", "부서", "정규 시간", "초과 시간", "합계", "주 평균", "초과 주 수"],
        attendance: ["부서", "총원", "출근", "결근", "지각"]
      }
    };
  }

  return {
    pageTitle: "Operational Reports",
    pageSubtitle: "Review attendance, overtime, leave, and payroll data and export the reports you need.",
    sourceHint: "Operational reports support the admin hub insight lane and recurring review workflows.",
    backToHubLabel: "Admin hub",
    exportLabel: "Export CSV",
    queryLabel: "Load report",
    loadingLabel: "Loading...",
    emptyLabel: "No data to display.",
    dateFromLabel: "Start date",
    dateToLabel: "End date",
    yearLabel: "Year",
    monthLabel: "Month",
    summaryTabLabel: "Current report",
    summaryItemsLabel: "Loaded items",
    summaryRangeLabel: "Query range",
    tabs: {
      overtime: "Overtime",
      attendance: "Attendance summary",
      leave: "Leave",
      payroll: "Payroll"
    },
    panelTitles: {
      overtime: "Overtime report",
      attendance: "Attendance department summary",
      leave: "Leave report",
      payroll: "Payroll report"
    },
    panelDescriptions: {
      overtime: "Review monthly overtime and export the result as CSV.",
      attendance: "Review department attendance outcomes across a selected date range.",
      leave: "Export leave data for the selected date range.",
      payroll: "Export payroll data for the selected date range."
    },
    tableHeaders: {
      overtime: ["Employee", "Department", "Regular hours", "Overtime hours", "Total", "Weekly avg", "Exceeded weeks"],
      attendance: ["Department", "Headcount", "Present", "Absent", "Late"]
    }
  };
}

export default function AdminReportsPage() {
  const { loading: sessionLoading } = useSupabaseSession();
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);

  const [tab, setTab] = useState<TabKey>("overtime");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [overtimeItems, setOvertimeItems] = useState<OvertimeItem[]>([]);
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const tabs: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: "overtime", label: copy.tabs.overtime },
      { key: "attendance", label: copy.tabs.attendance },
      { key: "leave", label: copy.tabs.leave },
      { key: "payroll", label: copy.tabs.payroll }
    ],
    [copy.tabs]
  );

  const loadOvertime = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const path = `/api/admin/reports/overtime?period=monthly&year=${year}&month=${month}&limit=100`;
      const result = await performAdminApiCall({
        label: "Load overtime report",
        method: "GET",
        path,
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(locale === "ko" ? "초과근무 리포트를 불러오지 못했습니다." : "Failed to load overtime report.");
      }
      const body = result.body as { items?: OvertimeItem[] };
      setOvertimeItems(body?.items ?? []);
    } catch (err) {
      setError(formatUserFacingErrorMessage(err instanceof Error ? err.message : String(err), runtimeLocale));
    } finally {
      setIsLoading(false);
    }
  }, [locale, month, runtimeLocale, year]);

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const path = `/api/admin/reports/attendance/department-summary?startDate=${fromDate}&endDate=${toDate}`;
      const result = await performAdminApiCall({
        label: "Load attendance summary",
        method: "GET",
        path,
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(locale === "ko" ? "근태 요약을 불러오지 못했습니다." : "Failed to load attendance summary.");
      }
      const body = result.body as { items?: AttendanceItem[] };
      setAttendanceItems(body?.items ?? []);
    } catch (err) {
      setError(formatUserFacingErrorMessage(err instanceof Error ? err.message : String(err), runtimeLocale));
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, locale, runtimeLocale, toDate]);

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
        label: `${type} CSV export`,
        method: "GET",
        path: pathMap[type],
        runtimeLocale
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

  const currentItems =
    tab === "overtime" ? overtimeItems.length : tab === "attendance" ? attendanceItems.length : 0;
  const rangeLabel =
    tab === "overtime" ? `${year}-${month.padStart(2, "0")}` : `${fromDate} ~ ${toDate}`;

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          <p className="small muted workspace-source-banner">{copy.sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            {copy.backToHubLabel}
          </Link>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.pageTitle}>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryTabLabel}</p>
          <strong>{copy.tabs[tab]}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryItemsLabel}</p>
          <strong>{currentItems}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryRangeLabel}</p>
          <strong>{rangeLabel}</strong>
        </article>
      </section>

      {error ? <p className="small fail workspace-inline-status">{error}</p> : null}

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <div className="section-heading">
            <div>
              <h2>{copy.panelTitles[tab]}</h2>
              <p className="small muted">{copy.panelDescriptions[tab]}</p>
            </div>
          </div>

          <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
            <div className="form-grid">
              <label className="stack gap-8">
                <span>{copy.yearLabel}</span>
                <input type="number" value={year} onChange={(event) => setYear(event.target.value)} min={2020} max={2030} />
              </label>
              <label className="stack gap-8">
                <span>{copy.monthLabel}</span>
                <input type="number" value={month} onChange={(event) => setMonth(event.target.value)} min={1} max={12} />
              </label>
            </div>
          ) : (
            <div className="form-grid">
              <label className="stack gap-8">
                <span>{copy.dateFromLabel}</span>
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              </label>
              <label className="stack gap-8">
                <span>{copy.dateToLabel}</span>
                <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              </label>
            </div>
          )}

          <div className="panel-actions">
            {tab === "overtime" ? (
              <>
                <button className="btn btn-primary" type="button" onClick={() => void loadOvertime()}>
                  {copy.queryLabel}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => void handleExport("overtime")}>
                  {copy.exportLabel}
                </button>
              </>
            ) : null}
            {tab === "attendance" ? (
              <button className="btn btn-primary" type="button" onClick={() => void loadAttendance()}>
                {copy.queryLabel}
              </button>
            ) : null}
            {tab === "leave" ? (
              <button className="btn btn-secondary" type="button" onClick={() => void handleExport("leave")}>
                {copy.exportLabel}
              </button>
            ) : null}
            {tab === "payroll" ? (
              <button className="btn btn-secondary" type="button" onClick={() => void handleExport("payroll")}>
                {copy.exportLabel}
              </button>
            ) : null}
          </div>
        </article>

        <article className="panel workspace-section-card workspace-note-card">
          <div className="section-heading">
            <div>
              <h2>{copy.summaryTabLabel}</h2>
              <p className="small muted">{copy.panelDescriptions[tab]}</p>
            </div>
          </div>
          <dl className="definition-grid">
            <div>
              <dt>{copy.summaryTabLabel}</dt>
              <dd>{copy.tabs[tab]}</dd>
            </div>
            <div>
              <dt>{copy.summaryItemsLabel}</dt>
              <dd>{currentItems}</dd>
            </div>
            <div>
              <dt>{copy.summaryRangeLabel}</dt>
              <dd>{rangeLabel}</dd>
            </div>
          </dl>
        </article>

        <article className="panel workspace-section-card">
          <div className="section-heading">
            <div>
              <h2>{copy.panelTitles[tab]}</h2>
              <p className="small muted">{isLoading ? copy.loadingLabel : copy.panelDescriptions[tab]}</p>
            </div>
          </div>

          {tab === "overtime" ? (
            isLoading ? (
              <p className="small muted">{copy.loadingLabel}</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    {copy.tableHeaders.overtime.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overtimeItems.length === 0 ? (
                    <tr>
                      <td colSpan={copy.tableHeaders.overtime.length} className="muted" style={{ textAlign: "center" }}>
                        {copy.emptyLabel}
                      </td>
                    </tr>
                  ) : (
                    overtimeItems.map((item) => (
                      <tr key={item.employeeId}>
                        <td>{formatEmployeeDisplayName(item.employeeName, runtimeLocale)}</td>
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
            )
          ) : null}

          {tab === "attendance" ? (
            isLoading ? (
              <p className="small muted">{copy.loadingLabel}</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    {copy.tableHeaders.attendance.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceItems.length === 0 ? (
                    <tr>
                      <td colSpan={copy.tableHeaders.attendance.length} className="muted" style={{ textAlign: "center" }}>
                        {copy.emptyLabel}
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
            )
          ) : null}

          {tab === "leave" || tab === "payroll" ? (
            <p className="small muted">{copy.panelDescriptions[tab]}</p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
