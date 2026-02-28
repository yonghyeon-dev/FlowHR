"use client";

import Link from "next/link";

import {
  formatDateTime,
  getCompletedStages,
  getProgressPercent,
  getStalledHours,
  resolveQuickJumpLabel,
  resolveQuickJumpPath,
  toTargetKey
} from "@/app/admin/approval-executions/page-helpers";
import type {
  ApiLog,
  ApiLogStats,
  ApprovalDomain,
  ApprovalExecutionDto,
  ApprovalExecutionSort,
  ApprovalExecutionState,
  ApprovalExecutionSummary,
  ApprovalStageHistoryDto,
  EscalationResultDto
} from "@/app/admin/approval-executions/page-types";
import { domainOptions, stateOptions } from "@/app/admin/approval-executions/page-types";

type SummaryPanelProps = {
  isKoLocale: boolean;
  summary: ApprovalExecutionSummary;
  asOfIso: string;
  runtimeLocale: string;
  stalledHoursMin: string;
};

export function ApprovalExecutionSummaryPanel({
  isKoLocale,
  summary,
  asOfIso,
  runtimeLocale,
  stalledHoursMin
}: SummaryPanelProps) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "실행 요약" : "Execution summary"}</h2>
      <div className="summary-grid">
        <div className="summary-card">
          <p>{isKoLocale ? "전체" : "Total"}</p>
          <strong>{summary.total}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "진행중" : "In progress"}</p>
          <strong>{summary.pendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "정체 항목" : "Stalled items"}</p>
          <strong>{summary.stalledCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "급여 진행중" : "Payroll pending"}</p>
          <strong>{summary.payrollPendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "휴가 진행중" : "Leave pending"}</p>
          <strong>{summary.leavePendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "근태 진행중" : "Attendance pending"}</p>
          <strong>{summary.attendancePendingCount}</strong>
        </div>
      </div>
      <p className="small">
        {isKoLocale ? "기준 시각" : "As of"} {formatDateTime(asOfIso, runtimeLocale)} /{" "}
        {isKoLocale ? "정체 기준" : "Stall threshold"} {stalledHoursMin || "0"}
        {isKoLocale ? "시간" : "h"}
      </p>
    </article>
  );
}

type EscalationResultPanelProps = {
  isKoLocale: boolean;
  runtimeLocale: string;
  escalationResult: EscalationResultDto | null;
};

export function ApprovalExecutionEscalationResultPanel({
  isKoLocale,
  runtimeLocale,
  escalationResult
}: EscalationResultPanelProps) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "에스컬레이션 결과" : "Escalation result"}</h2>
      {!escalationResult ? (
        <p className="small">{isKoLocale ? "아직 에스컬레이션 실행 이력이 없습니다." : "No escalation run yet."}</p>
      ) : (
        <>
          <ul className="simple-list">
            <li>
              <span>{isKoLocale ? "요청 시각" : "requestedAt"}</span>
              <strong>{formatDateTime(escalationResult.requestedAt, runtimeLocale)}</strong>
            </li>
            <li>
              <span>{isKoLocale ? "드라이런" : "dryRun"}</span>
              <strong>{escalationResult.dryRun ? (isKoLocale ? "예" : "yes") : isKoLocale ? "아니오" : "no"}</strong>
            </li>
            <li>
              <span>{isKoLocale ? "후보 / 요청됨" : "candidates / requested"}</span>
              <strong>
                {escalationResult.counts.candidates} / {escalationResult.counts.requested}
              </strong>
            </li>
            <li>
              <span>{isKoLocale ? "웹훅 설정" : "webhook configured"}</span>
              <strong>
                {escalationResult.policy.webhookConfigured ? (isKoLocale ? "예" : "yes") : isKoLocale ? "아니오" : "no"}
              </strong>
            </li>
            <li>
              <span>{isKoLocale ? "제공자" : "provider"}</span>
              <strong>{escalationResult.policy.provider ?? "-"}</strong>
            </li>
            <li>
              <span>{isKoLocale ? "웹훅 소스" : "webhook source"}</span>
              <strong>{escalationResult.policy.webhookSource ?? "-"}</strong>
            </li>
          </ul>
          <p className="small">
            {isKoLocale ? "채널" : "channel"} {escalationResult.policy.notificationChannel} /{" "}
            {isKoLocale ? "임계값" : "threshold"} {escalationResult.policy.stalledHoursMin}h /{" "}
            {isKoLocale ? "제한" : "limit"} {escalationResult.policy.limit}
          </p>
          {escalationResult.items.length > 0 ? (
            <ul className="simple-list">
              {escalationResult.items.map((item) => (
                <li key={item.executionId}>
                  <span>
                    <strong>{item.domain}</strong> / {item.targetEntityType}:{item.targetEntityId}
                    <br />
                    <span className="small">
                      {isKoLocale ? "정체" : "stalled"} {item.stalledHours.toFixed(1)}h /{" "}
                      {isKoLocale ? "단계" : "stage"} {item.currentStageIndex}/{item.totalStages}
                    </span>
                  </span>
                  <span className={item.decision === "REQUESTED" ? "ok" : "muted"}>
                    {item.decision === "REQUESTED"
                      ? isKoLocale
                        ? "요청됨"
                        : "REQUESTED"
                      : isKoLocale
                        ? "드라이런"
                        : "DRY_RUN"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </article>
  );
}
