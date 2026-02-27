import Link from "next/link";

import { type PayrollInsuranceCopy } from "@/components/payroll-insurance/copy";
import { formatKrw, type ApiLog, type PayrollInsuranceSettlementResponse } from "@/components/payroll-insurance/types";

type SummaryPanelProps = {
  copy: PayrollInsuranceCopy;
  result: PayrollInsuranceSettlementResponse | null;
  runtimeLocale: string;
};

type ComponentsPanelProps = {
  copy: PayrollInsuranceCopy;
  result: PayrollInsuranceSettlementResponse | null;
  runtimeLocale: string;
};

type LogsPanelProps = {
  copy: PayrollInsuranceCopy;
  stats: { total: number; success: number; fail: number };
  pendingLabel: string | null;
  logs: ApiLog[];
};

function formatKrwRaw(value: number, runtimeLocale: string) {
  return `${value.toLocaleString(runtimeLocale, { maximumFractionDigits: 2 })} KRW`;
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(3)}%`;
}

export function PayrollInsuranceSummaryPanel({ copy, result, runtimeLocale }: SummaryPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.summaryTitle}</h2>
      {!result ? (
        <p className="small">{copy.noResultYet}</p>
      ) : (
        <ul className="simple-list">
          <li>
            <span>{copy.grossTaxableLabel}</span>
            <strong>
              {formatKrw(result.summary.grossPayKrw, runtimeLocale)} / {formatKrw(result.summary.taxableBaseKrw, runtimeLocale)}
            </strong>
          </li>
          <li>
            <span>{copy.employeeTotalLabel}</span>
            <strong>{formatKrw(result.summary.employeeContributionKrw.totalKrw, runtimeLocale)}</strong>
          </li>
          <li>
            <span>{copy.employerTotalLabel}</span>
            <strong>{formatKrw(result.summary.employerContributionKrw.totalKrw, runtimeLocale)}</strong>
          </li>
          <li>
            <span>{copy.totalDeltaLabel}</span>
            <strong>{formatKrw(result.summary.settlementKrw.totalDeltaKrw, runtimeLocale)}</strong>
          </li>
          <li>
            <span>{copy.policyPresetSummaryLabel}</span>
            <strong>
              {result.summary.policyPreset
                ? `${result.summary.policyPreset.id} (${result.summary.policyPreset.effectiveFrom})`
                : copy.policyManualFallbackLabel}
              {result.summary.policyPresetAuto.enabled
                ? ` / ${copy.policyAutoTagLabel} ${result.summary.policyPresetAuto.resolvedBy}`
                : ""}
            </strong>
          </li>
          <li>
            <span>{copy.policyRatesSummaryLabel}</span>
            <strong>
              NP {formatRate(result.summary.policyRates.nationalPensionEmployeeRate)} / HI{" "}
              {formatRate(result.summary.policyRates.healthInsuranceEmployeeRate)} / LTC{" "}
              {formatRate(result.summary.policyRates.longTermCareRateOnHealth)} / EI{" "}
              {formatRate(result.summary.policyRates.employmentInsuranceEmployeeRate)} / IA{" "}
              {formatRate(result.summary.policyRates.industrialAccidentEmployerRate)}
            </strong>
          </li>
          <li>
            <span>{copy.policyCapsSummaryLabel}</span>
            <strong>
              {result.summary.policyCapsKrw.nationalPensionCapKrw === null
                ? `NP ${copy.policyNoCapLabel}`
                : `NP ${formatKrw(result.summary.policyCapsKrw.nationalPensionCapKrw, runtimeLocale)}`}{" "}
              /{" "}
              {result.summary.policyCapsKrw.healthInsuranceCapKrw === null
                ? `HI ${copy.policyNoCapLabel}`
                : `HI ${formatKrw(result.summary.policyCapsKrw.healthInsuranceCapKrw, runtimeLocale)}`}{" "}
              /{" "}
              {result.summary.policyCapsKrw.employmentInsuranceCapKrw === null
                ? `EI ${copy.policyNoCapLabel}`
                : `EI ${formatKrw(result.summary.policyCapsKrw.employmentInsuranceCapKrw, runtimeLocale)}`}
            </strong>
          </li>
          <li>
            <span>{copy.roundingLabel}</span>
            <strong>
              {result.summary.rounding.mode} / NP {result.summary.rounding.unitsKrw.nationalPensionUnitKrw} / HI{" "}
              {result.summary.rounding.unitsKrw.healthInsuranceUnitKrw} / LTC{" "}
              {result.summary.rounding.unitsKrw.longTermCareUnitKrw} / EI{" "}
              {result.summary.rounding.unitsKrw.employmentInsuranceUnitKrw} / IA{" "}
              {result.summary.rounding.unitsKrw.industrialAccidentUnitKrw}
            </strong>
          </li>
        </ul>
      )}
    </article>
  );
}

export function PayrollInsuranceComponentsPanel({
  copy,
  result,
  runtimeLocale
}: ComponentsPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.componentsTitle}</h2>
      {!result ? (
        <p className="small">{copy.noContributionBreakdownYet}</p>
      ) : (
        <ul className="simple-list">
          <li>
            <span>{copy.employeeContributionLabel}</span>
            <strong>
              {formatKrw(result.summary.employeeContributionKrw.nationalPensionKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.employeeContributionKrw.healthInsuranceKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.employeeContributionKrw.longTermCareKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.employeeContributionKrw.employmentInsuranceKrw, runtimeLocale)}
            </strong>
          </li>
          <li>
            <span>{copy.employerContributionLabel}</span>
            <strong>
              {formatKrw(result.summary.employerContributionKrw.nationalPensionKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.employerContributionKrw.healthInsuranceKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.employerContributionKrw.longTermCareKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.employerContributionKrw.employmentInsuranceKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.employerContributionKrw.industrialAccidentKrw, runtimeLocale)}
            </strong>
          </li>
          <li>
            <span>{copy.employeeRawContributionLabel}</span>
            <strong>
              {formatKrwRaw(result.summary.rawContributionKrw.employee.nationalPensionKrw, runtimeLocale)} /{" "}
              {formatKrwRaw(result.summary.rawContributionKrw.employee.healthInsuranceKrw, runtimeLocale)} /{" "}
              {formatKrwRaw(result.summary.rawContributionKrw.employee.longTermCareKrw, runtimeLocale)} /{" "}
              {formatKrwRaw(result.summary.rawContributionKrw.employee.employmentInsuranceKrw, runtimeLocale)}
            </strong>
          </li>
          <li>
            <span>{copy.employerRawContributionLabel}</span>
            <strong>
              {formatKrwRaw(result.summary.rawContributionKrw.employer.nationalPensionKrw, runtimeLocale)} /{" "}
              {formatKrwRaw(result.summary.rawContributionKrw.employer.healthInsuranceKrw, runtimeLocale)} /{" "}
              {formatKrwRaw(result.summary.rawContributionKrw.employer.longTermCareKrw, runtimeLocale)} /{" "}
              {formatKrwRaw(result.summary.rawContributionKrw.employer.employmentInsuranceKrw, runtimeLocale)} /{" "}
              {formatKrwRaw(result.summary.rawContributionKrw.employer.industrialAccidentKrw, runtimeLocale)}
            </strong>
          </li>
          <li>
            <span>{copy.contributionBasesLabel}</span>
            <strong>
              {formatKrw(result.summary.contributionBasesKrw.nationalPensionBaseKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.contributionBasesKrw.healthInsuranceBaseKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.contributionBasesKrw.employmentInsuranceBaseKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.contributionBasesKrw.industrialAccidentBaseKrw, runtimeLocale)}
            </strong>
          </li>
          <li>
            <span>{copy.priorWithheldPaidLabel}</span>
            <strong>
              {formatKrw(result.summary.settlementKrw.priorWithheldKrw, runtimeLocale)} /{" "}
              {formatKrw(result.summary.settlementKrw.priorEmployerPaidKrw, runtimeLocale)}
            </strong>
          </li>
        </ul>
      )}
    </article>
  );
}

export function PayrollInsuranceLogsPanel({ copy, stats, pendingLabel, logs }: LogsPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.apiLogsTitle}</h2>
      <p className="small">
        {copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} / {copy.apiLogsFailLabel}{" "}
        {stats.fail}
        {pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}
      </p>
      {logs.length === 0 ? (
        <p className="small">{copy.noApiCallYet}</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span> {log.label} /{" "}
              {log.status}
              <time>{log.at}</time>
            </li>
          ))}
        </ul>
      )}
      <div className="panel-actions">
        <Link href="/admin" className="btn btn-secondary">
          {copy.backToAdmin}
        </Link>
      </div>
    </article>
  );
}
