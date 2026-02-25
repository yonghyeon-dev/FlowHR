"use client";

import { formatDateTime, formatKrw, type PayslipPageCopy } from "@/app/employee/payslips/page-locale-helpers";
import type { PayrollRunDto } from "@/app/employee/payslips/page-helpers";

type EmployeePayslipRunListPanelProps = {
  pageCopy: PayslipPageCopy;
  runs: PayrollRunDto[];
  selectedRun: PayrollRunDto | null;
  setSelectedRunId: (runId: string) => void;
};

export function EmployeePayslipRunListPanel({
  pageCopy,
  runs,
  selectedRun,
  setSelectedRunId
}: EmployeePayslipRunListPanelProps) {
  return (
    <article className="panel">
      <h2>{pageCopy.payslipList.title}</h2>
      {runs.length === 0 ? (
        <p className="small muted">{pageCopy.payslipList.empty}</p>
      ) : (
        <ul className="simple-list" aria-label={pageCopy.payslipList.ariaLabel}>
          {runs.map((run) => (
            <li
              key={run.id}
              style={{
                borderColor: selectedRun?.id === run.id ? "var(--primary)" : "var(--line)",
                background: selectedRun?.id === run.id ? "var(--primary-soft)" : "#fff"
              }}
            >
              <span>
                <strong>
                  {formatDateTime(run.periodStart)} ~ {formatDateTime(run.periodEnd)}
                </strong>{" "}
                <span className="muted">
                  {pageCopy.payslipList.gross} {formatKrw(run.grossPayKrw)} ·{" "}
                  {pageCopy.payslipList.deduction} {formatKrw(run.totalDeductionsKrw)} ·{" "}
                  {pageCopy.payslipList.net} {formatKrw(run.netPayKrw)} · {pageCopy.payslipList.confirmed}{" "}
                  {formatDateTime(run.confirmedAt)}
                </span>
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setSelectedRunId(run.id)}
              >
                {pageCopy.payslipList.select}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
