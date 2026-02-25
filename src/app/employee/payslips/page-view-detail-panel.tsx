import {
  formatDateOnly,
  formatKrw,
  formatMonthLabel,
  type PayslipPageCopy
} from "@/app/employee/payslips/page-locale-helpers";
import {
  minutesToHours,
  type AttendanceAggregateDto,
  type DeductionExplainSection,
  type PayrollRunDto
} from "@/app/employee/payslips/page-helpers";

type PayslipDetailPanelProps = {
  pageCopy: PayslipPageCopy;
  selectedRun: PayrollRunDto | null;
  employeeId: string;
  selectedRunStateLabel: string;
  selectedRunNetPayText: string;
  aggregate: AttendanceAggregateDto | null;
  deductionExplainSections: DeductionExplainSection[];
  payslipFileName: string;
  copyPayslipFileName: () => Promise<void>;
  copySelectedRunId: () => Promise<void>;
};

export function PayslipDetailPanel({
  pageCopy,
  selectedRun,
  employeeId,
  selectedRunStateLabel,
  selectedRunNetPayText,
  aggregate,
  deductionExplainSections,
  payslipFileName,
  copyPayslipFileName,
  copySelectedRunId
}: PayslipDetailPanelProps) {
  return (
    <article className="panel panel-payslip-print">
      <h2>{pageCopy.detail.title}</h2>
      {!selectedRun ? (
        <p className="small muted">{pageCopy.detail.empty}</p>
      ) : (
        <>
          <div className="payslip-print-actions actions no-print">
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              {pageCopy.detail.actions.printSavePdf}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void copyPayslipFileName()}>
              {pageCopy.detail.actions.copyPdfFileName}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void copySelectedRunId()}>
              {pageCopy.detail.actions.copyPayslipId}
            </button>
          </div>
          {payslipFileName ? (
            <p className="small muted no-print" style={{ marginTop: 8 }}>
              {pageCopy.detail.recommendedFileName}: <code>{payslipFileName}</code>
            </p>
          ) : null}

          <article className="payslip-sheet" aria-label={pageCopy.detail.sheetAriaLabel}>
            <header className="payslip-sheet-header">
              <div>
                <p className="eyebrow">{pageCopy.detail.sheetEyebrow}</p>
                <h3>
                  {formatMonthLabel(selectedRun.periodStart)} {pageCopy.detail.sheetTitleSuffix}
                </h3>
                <p className="small muted">
                  {pageCopy.detail.payPeriod} {formatDateOnly(selectedRun.periodStart)} ~{" "}
                  {formatDateOnly(selectedRun.periodEnd)}
                </p>
              </div>
              <ul className="payslip-meta-list">
                <li>
                  <span>{pageCopy.detail.employeeId}</span>
                  <strong>{selectedRun.employeeId ?? employeeId}</strong>
                </li>
                <li>
                  <span>{pageCopy.detail.payslipId}</span>
                  <strong>{selectedRun.id}</strong>
                </li>
                <li>
                  <span>{pageCopy.detail.confirmedDate}</span>
                  <strong>{formatDateOnly(selectedRun.confirmedAt)}</strong>
                </li>
                <li>
                  <span>{pageCopy.detail.settlementState}</span>
                  <strong>{selectedRunStateLabel}</strong>
                </li>
              </ul>
            </header>

            <section>
              <h4>{pageCopy.detail.summaryTitle}</h4>
              <div className="payslip-grid">
                <article className="summary-card">
                  <p>{pageCopy.compare.metrics.gross}</p>
                  <strong>{formatKrw(selectedRun.grossPayKrw)}</strong>
                </article>
                <article className="summary-card">
                  <p>{pageCopy.compare.metrics.deduction}</p>
                  <strong>{formatKrw(selectedRun.totalDeductionsKrw)}</strong>
                </article>
                <article className="summary-card">
                  <p>{pageCopy.compare.metrics.net}</p>
                  <strong>{selectedRunNetPayText}</strong>
                </article>
              </div>
            </section>

            <section>
              <h4>{pageCopy.detail.paymentDeductionTitle}</h4>
              <ul className="simple-list">
                <li>
                  <span>{pageCopy.detail.withholdingTax}</span>
                  <strong>{formatKrw(selectedRun.withholdingTaxKrw)}</strong>
                </li>
                <li>
                  <span>{pageCopy.detail.socialInsurance}</span>
                  <strong>{formatKrw(selectedRun.socialInsuranceKrw)}</strong>
                </li>
                <li>
                  <span>{pageCopy.detail.otherDeductions}</span>
                  <strong>{formatKrw(selectedRun.otherDeductionsKrw)}</strong>
                </li>
              </ul>
            </section>

            <section className="payslip-explain">
              {deductionExplainSections.map((section) => (
                <div key={section.id} className="payslip-explain-section">
                  <h4>{section.title}</h4>
                  {section.items.length === 0 ? (
                    <p className="small muted">{pageCopy.detail.noItems}</p>
                  ) : (
                    <ul className="payslip-explain-list">
                      {section.items.map((item) => (
                        <li key={item.key}>
                          <div>
                            <strong>{item.label}</strong>
                            <p>{item.description}</p>
                          </div>
                          <strong className="payslip-explain-amount">{formatKrw(item.amountKrw)}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>

            {aggregate ? (
              <section>
                <h4>{pageCopy.detail.attendanceReference}</h4>
                <p className="small">
                  {pageCopy.attendance.regular} {minutesToHours(aggregate.totals.regular)} /{" "}
                  {pageCopy.attendance.overtime} {minutesToHours(aggregate.totals.overtime)} /{" "}
                  {pageCopy.attendance.night} {minutesToHours(aggregate.totals.night)} /{" "}
                  {pageCopy.attendance.holiday} {minutesToHours(aggregate.totals.holiday)} (
                  {pageCopy.attendance.payable} {aggregate.counts.payable}
                  {pageCopy.attendance.payableUnit})
                </p>
              </section>
            ) : null}

            {selectedRun.deductionBreakdown ? (
              <details className="details no-print" style={{ marginTop: 12 }}>
                <summary>{pageCopy.detail.deductionBreakdownRaw}</summary>
                <pre className="small" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(selectedRun.deductionBreakdown, null, 2)}
                </pre>
              </details>
            ) : null}
          </article>
        </>
      )}
    </article>
  );
}
