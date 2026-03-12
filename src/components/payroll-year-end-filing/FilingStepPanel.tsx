"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { isAdminPayrollSource, withAdminSource } from "@/app/admin/source-context";
import FilingActionLog from "@/components/payroll-year-end-filing/FilingActionLog";
import FilingExportBundle from "@/components/payroll-year-end-filing/FilingExportBundle";
import FilingGateCard from "@/components/payroll-year-end-filing/FilingGateCard";
import {
  buildFilingOpsStepHref,
  getFilingStepDefinition,
  getNextFilingWorkflowStep,
  getPreviousFilingWorkflowStep,
  summarizeFilingWorkflowGates
} from "@/components/payroll-year-end-filing/filing-workflow-helpers";
import { useFilingWorkflow } from "@/contexts/FilingWorkflowContext";
import { useI18n } from "@/lib/i18n/provider";
import styles from "@/components/payroll-year-end-filing/FilingWorkflow.module.css";

export default function FilingStepPanel() {
  const workflow = useFilingWorkflow();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const showPayrollSource = isAdminPayrollSource(source);
  const current = getFilingStepDefinition(workflow.currentStep);
  const previousStep = getPreviousFilingWorkflowStep(workflow.currentStep);
  const nextStep = getNextFilingWorkflowStep(workflow.currentStep);
  const gateSummary = summarizeFilingWorkflowGates(workflow.gates);
  const alertStepHref =
    source === "admin-payroll"
      ? withAdminSource("/admin/payroll-year-end-filing/ops/alert", "admin-payroll")
      : "/admin/payroll-year-end-filing/ops/alert";
  const filingWorkspaceHref = showPayrollSource
    ? withAdminSource("/admin/payroll-year-end-filing", "admin-payroll")
    : "/admin/payroll-year-end-filing";

  return (
    <section className="panel workspace-section-card filing-workflow-step-card" id={`filing-workflow-step-${workflow.currentStep}`}>
      <div className={styles.stepHero}>
        <div className={styles.stepCopy}>
          <p className="eyebrow">{showPayrollSource ? "payroll filing step" : "filing step"}</p>
          <h2>{isKoLocale ? `${current.title} 단계` : `${current.title} Step`}</h2>
          <p className="small muted">{current.description}</p>
        </div>
        <div className={styles.stepMetrics}>
          <div className={styles.stepMetric}>
            <span>{isKoLocale ? "게이트 준비" : "Gate readiness"}</span>
            <strong>
              {gateSummary.ready}/{gateSummary.total}
            </strong>
          </div>
          <div className={styles.stepMetric}>
            <span>{isKoLocale ? "담당 역할" : "Owner role"}</span>
            <strong>{workflow.metadata.ownerRole || (isKoLocale ? "미지정" : "Unassigned")}</strong>
          </div>
        </div>
      </div>
      <p className="small workspace-source-banner">
        {showPayrollSource
          ? isKoLocale
            ? "급여 레인 문맥을 유지한 채 단계 전환과 되돌아가기를 진행합니다."
            : "Step navigation stays attached to the payroll lane context."
          : isKoLocale
            ? "신고 ops 단계 흐름을 이어서 조정합니다."
            : "Continue the filing ops workflow in one route-first sequence."}
      </p>

      <div className="panel-actions">
        {showPayrollSource ? (
          <Link href="/admin/payroll" className="btn btn-secondary btn-small">
            {isKoLocale ? "급여 레인으로" : "Back to payroll lane"}
          </Link>
        ) : null}
        <Link href={filingWorkspaceHref} className="btn btn-secondary btn-small">
          {isKoLocale ? "신고 워크스페이스" : "Open filing workspace"}
        </Link>
        <Link href={alertStepHref} className="btn btn-secondary btn-small">
          {isKoLocale ? "알림 단계로" : "Back to alert step"}
        </Link>
        <Link
          href={buildFilingOpsStepHref({
            step: previousStep,
            metadata: workflow.metadata,
            gates: workflow.gates,
            source
          })}
          className="btn btn-secondary btn-small"
        >
          {isKoLocale ? "이전 단계" : "Previous step"}
        </Link>
        <Link
          href={buildFilingOpsStepHref({
            step: nextStep,
            metadata: workflow.metadata,
            gates: workflow.gates,
            source
          })}
          className="btn btn-secondary btn-small"
        >
          {isKoLocale ? "다음 단계" : "Next step"}
        </Link>
        <button className="btn btn-secondary btn-small" onClick={workflow.advanceStep}>
          {isKoLocale ? "현재 문맥에서 진행" : "Advance in context"}
        </button>
      </div>

      <div className={styles.stepPanelGrid}>
        <FilingExportBundle metadata={workflow.metadata} onMetadataChange={workflow.setMetadata} />

        <FilingGateCard
          gates={workflow.gates}
          onGateChange={(key, value) => workflow.setGate(key, value)}
        />

        <FilingActionLog entries={workflow.actionLog} onRecordAction={workflow.recordAction} />
      </div>
    </section>
  );
}
