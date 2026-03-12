"use client";

import { useCallback, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import {
  RouteWorkspaceEmptyState,
  RouteWorkspaceHeader,
  RouteWorkspaceSectionCard,
  RouteWorkspaceShell,
  RouteWorkspaceSplit,
  RouteWorkspaceStatus,
  RouteWorkspaceSummary,
  RouteWorkspaceTabs
} from "@/components/workspace/RouteWorkspacePrimitives";
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
  emptyDescription: string;
  dateFromLabel: string;
  dateToLabel: string;
  yearLabel: string;
  monthLabel: string;
  summaryTabLabel: string;
  summaryItemsLabel: string;
  summaryRangeLabel: string;
  summaryActionsLabel: string;
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
      sourceHint: "운영 리포트는 관리자 허브의 인사이트 레인과 반복 검토 흐름을 바로 지원합니다.",
      backToHubLabel: "관리자 허브",
      exportLabel: "CSV 내보내기",
      queryLabel: "리포트 불러오기",
      loadingLabel: "불러오는 중...",
      emptyLabel: "표시할 데이터가 없습니다.",
      emptyDescription: "조회 조건을 확인한 뒤 다시 불러오거나 다른 리포트 탭으로 이동해 주세요.",
      dateFromLabel: "시작일",
      dateToLabel: "종료일",
      yearLabel: "연도",
      monthLabel: "월",
      summaryTabLabel: "현재 리포트",
      summaryItemsLabel: "불러온 항목",
      summaryRangeLabel: "조회 범위",
      summaryActionsLabel: "다음 작업",
      tabs: {
        overtime: "초과근무",
        attendance: "근태 요약",
        leave: "휴가",
        payroll: "급여"
      },
      panelTitles: {
        overtime: "초과근무 리포트",
        attendance: "근태 부서별 요약",
        leave: "휴가 리포트",
        payroll: "급여 리포트"
      },
      panelDescriptions: {
        overtime: "월 기준 초과근무 현황을 조회하고 CSV로 내보냅니다.",
        attendance: "기간 기준으로 부서별 출근, 결근, 지각 현황을 확인합니다.",
        leave: "선택한 기간의 휴가 데이터를 CSV로 내보냅니다.",
        payroll: "선택한 기간의 급여 데이터를 CSV로 내보냅니다."
      },
      tableHeaders: {
        overtime: ["직원", "부서", "정규 시간", "초과 시간", "합계", "주 평균", "초과 주차"],
        attendance: ["부서", "인원", "출근", "결근", "지각"]
      }
    };
  }

  return {
    pageTitle: "Operational reports",
    pageSubtitle: "Review attendance, overtime, leave, and payroll data and export the reports you need.",
    sourceHint: "Operational reports support the admin hub insight lane and recurring review workflows.",
    backToHubLabel: "Admin hub",
    exportLabel: "Export CSV",
    queryLabel: "Load report",
    loadingLabel: "Loading...",
    emptyLabel: "No data to display.",
    emptyDescription: "Review the current query conditions or switch to another report tab.",
    dateFromLabel: "Start date",
    dateToLabel: "End date",
    yearLabel: "Year",
    monthLabel: "Month",
    summaryTabLabel: "Current report",
    summaryItemsLabel: "Loaded items",
    summaryRangeLabel: "Query range",
    summaryActionsLabel: "Next action",
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
  const isKoLocale = locale === "ko";
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

  const tabs = useMemo(
    () => [
      { label: copy.tabs.overtime, active: tab === "overtime", key: "overtime" as const },
      { label: copy.tabs.attendance, active: tab === "attendance", key: "attendance" as const },
      { label: copy.tabs.leave, active: tab === "leave", key: "leave" as const },
      { label: copy.tabs.payroll, active: tab === "payroll", key: "payroll" as const }
    ],
    [copy.tabs, tab]
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
        throw new Error(isKoLocale ? "초과근무 리포트를 불러오지 못했습니다." : "Failed to load overtime report.");
      }
      const body = result.body as { items?: OvertimeItem[] };
      setOvertimeItems(body.items ?? []);
    } catch (loadError) {
      setError(formatUserFacingErrorMessage(loadError instanceof Error ? loadError.message : String(loadError), runtimeLocale));
    } finally {
      setIsLoading(false);
    }
  }, [isKoLocale, month, runtimeLocale, year]);

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
        throw new Error(isKoLocale ? "근태 요약을 불러오지 못했습니다." : "Failed to load attendance summary.");
      }
      const body = result.body as { items?: AttendanceItem[] };
      setAttendanceItems(body.items ?? []);
    } catch (loadError) {
      setError(formatUserFacingErrorMessage(loadError instanceof Error ? loadError.message : String(loadError), runtimeLocale));
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, isKoLocale, runtimeLocale, toDate]);

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
      if (!result.response.ok) {
        return;
      }
      const text = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${type}-report.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      // best effort export
    }
  };

  if (sessionLoading) {
    return null;
  }

  const currentItems =
    tab === "overtime" ? overtimeItems.length : tab === "attendance" ? attendanceItems.length : 0;
  const rangeLabel = tab === "overtime" ? `${year}-${month.padStart(2, "0")}` : `${fromDate} ~ ${toDate}`;

  return (
    <RouteWorkspaceShell tone="admin">
      <RouteWorkspaceHeader
        actions={[{ href: "/admin", label: copy.backToHubLabel, tone: "secondary" }]}
        breadcrumbs={[copy.backToHubLabel, copy.pageTitle]}
        description={copy.pageSubtitle}
        eyebrow="reports"
        sourceHint={copy.sourceHint}
        title={copy.pageTitle}
      />

      <RouteWorkspaceTabs
        ariaLabel={copy.pageTitle}
        tabs={tabs.map((tabItem) => ({
          active: tabItem.active,
          label: tabItem.label,
          onClick: () => setTab(tabItem.key)
        }))}
      />

      <RouteWorkspaceSummary
        ariaLabel={copy.pageTitle}
        items={[
          { label: copy.summaryTabLabel, value: copy.tabs[tab] },
          { label: copy.summaryItemsLabel, value: currentItems },
          { label: copy.summaryRangeLabel, value: rangeLabel }
        ]}
      />

      <RouteWorkspaceStatus message={error} tone="error" />

      <RouteWorkspaceSplit
        main={
          <>
            <RouteWorkspaceSectionCard
              className="workspace-toolbar-card"
              description={copy.panelDescriptions[tab]}
              title={copy.panelTitles[tab]}
            >
              {tab === "overtime" ? (
                <div className="form-grid">
                  <label className="stack gap-8">
                    <span>{copy.yearLabel}</span>
                    <input max={2030} min={2020} onChange={(event) => setYear(event.target.value)} type="number" value={year} />
                  </label>
                  <label className="stack gap-8">
                    <span>{copy.monthLabel}</span>
                    <input max={12} min={1} onChange={(event) => setMonth(event.target.value)} type="number" value={month} />
                  </label>
                </div>
              ) : (
                <div className="form-grid">
                  <label className="stack gap-8">
                    <span>{copy.dateFromLabel}</span>
                    <input onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} />
                  </label>
                  <label className="stack gap-8">
                    <span>{copy.dateToLabel}</span>
                    <input onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} />
                  </label>
                </div>
              )}

              <div className="panel-actions">
                {tab === "overtime" ? (
                  <>
                    <button className="btn btn-primary" onClick={() => void loadOvertime()} type="button">
                      {copy.queryLabel}
                    </button>
                    <button className="btn btn-secondary" onClick={() => void handleExport("overtime")} type="button">
                      {copy.exportLabel}
                    </button>
                  </>
                ) : null}

                {tab === "attendance" ? (
                  <button className="btn btn-primary" onClick={() => void loadAttendance()} type="button">
                    {copy.queryLabel}
                  </button>
                ) : null}

                {tab === "leave" ? (
                  <button className="btn btn-secondary" onClick={() => void handleExport("leave")} type="button">
                    {copy.exportLabel}
                  </button>
                ) : null}

                {tab === "payroll" ? (
                  <button className="btn btn-secondary" onClick={() => void handleExport("payroll")} type="button">
                    {copy.exportLabel}
                  </button>
                ) : null}
              </div>
            </RouteWorkspaceSectionCard>

            <RouteWorkspaceSectionCard title={copy.panelTitles[tab]}>
              {isLoading ? <p className="small muted">{copy.loadingLabel}</p> : null}

              {tab === "overtime" && !isLoading ? (
                overtimeItems.length === 0 ? (
                  <RouteWorkspaceEmptyState
                    action={{ label: copy.queryLabel, onClick: () => void loadOvertime(), tone: "secondary" }}
                    description={copy.emptyDescription}
                    title={copy.emptyLabel}
                  />
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
                      {overtimeItems.map((item) => (
                        <tr key={item.employeeId}>
                          <td>{formatEmployeeDisplayName(item.employeeName, runtimeLocale)}</td>
                          <td>{item.departmentName || "-"}</td>
                          <td>{item.regularHours}</td>
                          <td>{item.overtimeHours}</td>
                          <td>{item.totalHours}</td>
                          <td>{item.weeklyAverage}</td>
                          <td>{item.exceededWeeks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : null}

              {tab === "attendance" && !isLoading ? (
                attendanceItems.length === 0 ? (
                  <RouteWorkspaceEmptyState
                    action={{ label: copy.queryLabel, onClick: () => void loadAttendance(), tone: "secondary" }}
                    description={copy.emptyDescription}
                    title={copy.emptyLabel}
                  />
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
                      {attendanceItems.map((item) => (
                        <tr key={item.departmentId}>
                          <td>{item.departmentName || "-"}</td>
                          <td>{item.totalEmployees}</td>
                          <td>{item.presentCount}</td>
                          <td>{item.absentCount}</td>
                          <td>{item.lateCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : null}

              {(tab === "leave" || tab === "payroll") && !isLoading ? (
                <RouteWorkspaceEmptyState
                  action={{
                    label: copy.exportLabel,
                    onClick: () => void handleExport(tab),
                    tone: "secondary"
                  }}
                  description={copy.panelDescriptions[tab]}
                  title={copy.summaryActionsLabel}
                />
              ) : null}
            </RouteWorkspaceSectionCard>
          </>
        }
        side={
          <>
            <RouteWorkspaceSectionCard title={isKoLocale ? "요약" : "Summary"}>
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
            </RouteWorkspaceSectionCard>

            <RouteWorkspaceSectionCard
              className="workspace-note-card"
              description={copy.panelDescriptions[tab]}
              title={copy.summaryActionsLabel}
            >
              <div className="panel-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (tab === "overtime") {
                      void loadOvertime();
                      return;
                    }
                    if (tab === "attendance") {
                      void loadAttendance();
                      return;
                    }
                    if (tab === "leave" || tab === "payroll") {
                      void handleExport(tab);
                    }
                  }}
                  type="button"
                >
                  {tab === "leave" || tab === "payroll" ? copy.exportLabel : copy.queryLabel}
                </button>
              </div>
            </RouteWorkspaceSectionCard>
          </>
        }
      />
    </RouteWorkspaceShell>
  );
}
