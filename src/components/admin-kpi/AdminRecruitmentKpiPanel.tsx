import Link from "next/link";
import { type KpiCopy } from "@/components/admin-kpi/copy";
import { type AdminKpiFocusMetric } from "@/components/admin-kpi/AdminKpiSections";
import { isRecruitmentReferralTerminalStage, type RecruitmentReferralStage } from "@/features/recruitment/types";

type RecruitmentOpeningLite = {
  status: "OPEN" | "CLOSED";
};

type RecruitmentReferralLite = {
  stage: RecruitmentReferralStage;
  updatedAt: string;
};

export type RecruitmentKpiSnapshot = {
  openOpeningCount: number;
  activeReferralCount: number;
  stalledReferral7dCount: number;
};

export function buildRecruitmentKpiSnapshot(
  input: {
    openings: RecruitmentOpeningLite[];
    referrals: RecruitmentReferralLite[];
  },
  now = new Date()
): RecruitmentKpiSnapshot {
  const nowMs = now.getTime();
  const stalledThresholdMs = 7 * 24 * 60 * 60 * 1000;
  const openOpeningCount = input.openings.filter((opening) => opening.status === "OPEN").length;
  const activeReferralCount = input.referrals.filter(
    (referral) => !isRecruitmentReferralTerminalStage(referral.stage)
  ).length;
  const stalledReferral7dCount = input.referrals.filter((referral) => {
    if (isRecruitmentReferralTerminalStage(referral.stage)) {
      return false;
    }
    const updatedAtMs = new Date(referral.updatedAt).getTime();
    return Number.isFinite(updatedAtMs) && nowMs - updatedAtMs >= stalledThresholdMs;
  }).length;

  return {
    openOpeningCount,
    activeReferralCount,
    stalledReferral7dCount
  };
}

type AdminRecruitmentKpiPanelProps = {
  copy: KpiCopy;
  snapshot: RecruitmentKpiSnapshot;
  analyticsFocusMetric?: AdminKpiFocusMetric;
};

type RecruitmentPriorityAction = {
  href: string;
  label: string;
  reason: string;
};

type RecruitmentQuickAction = {
  href: string;
  label: string;
};

function withAnalyticsSourceContext(
  href: string,
  options?: { focusMetric?: string; analyticsFocusMetric?: AdminKpiFocusMetric }
): string {
  const contextParams = new URLSearchParams({ source: "admin-analytics" });
  if (options?.focusMetric) {
    contextParams.set("focusMetric", options.focusMetric);
  }
  if (options?.analyticsFocusMetric && options.analyticsFocusMetric !== "all") {
    contextParams.set("analyticsFocus", options.analyticsFocusMetric);
  }
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${contextParams.toString()}`;
}

function resolveRecruitmentPriorityAction(
  snapshot: RecruitmentKpiSnapshot,
  copy: KpiCopy,
  analyticsFocusMetric?: AdminKpiFocusMetric
): RecruitmentPriorityAction {
  if (snapshot.stalledReferral7dCount > 0) {
    return {
      href: withAnalyticsSourceContext(
        "/admin/recruitment?risk=stalled_7d",
        { focusMetric: "recruitmentStalledReferral7dCount", analyticsFocusMetric }
      ),
      label: copy.recruitmentPanel.actionOpenStalledQueue,
      reason: copy.recruitmentPanel.priorityReasonStalled
    };
  }
  if (snapshot.activeReferralCount > 0) {
    return {
      href: withAnalyticsSourceContext("/admin/recruitment", {
        focusMetric: "recruitmentActiveReferralCount",
        analyticsFocusMetric
      }),
      label: copy.recruitmentPanel.actionOpenRecruitmentWorkspace,
      reason: copy.recruitmentPanel.priorityReasonActive
    };
  }
  if (snapshot.openOpeningCount > 0) {
    return {
      href: withAnalyticsSourceContext("/admin/recruitment", {
        focusMetric: "recruitmentOpenOpeningCount",
        analyticsFocusMetric
      }),
      label: copy.recruitmentPanel.actionOpenRecruitmentWorkspace,
      reason: copy.recruitmentPanel.priorityReasonOpenings
    };
  }
  return {
    href: withAnalyticsSourceContext("/admin/recruitment", {
      focusMetric: "recruitmentActiveReferralCount",
      analyticsFocusMetric
    }),
    label: copy.recruitmentPanel.actionOpenRecruitmentWorkspace,
    reason: copy.recruitmentPanel.priorityReasonClear
  };
}

function buildRecruitmentQuickActions(
  copy: KpiCopy,
  analyticsFocusMetric?: AdminKpiFocusMetric
): RecruitmentQuickAction[] {
  return [
    {
      href: withAnalyticsSourceContext("/admin/recruitment", {
        focusMetric: "recruitmentActiveReferralCount",
        analyticsFocusMetric
      }),
      label: copy.recruitmentPanel.actionOpenRecruitmentWorkspace
    },
    {
      href: withAnalyticsSourceContext(
        "/admin/recruitment?risk=stalled_7d",
        { focusMetric: "recruitmentStalledReferral7dCount", analyticsFocusMetric }
      ),
      label: copy.recruitmentPanel.actionOpenStalledQueue
    },
    {
      href: withAnalyticsSourceContext(
        "/admin/recruitment?stage=SUBMITTED",
        { focusMetric: "recruitmentSubmittedReferralCount", analyticsFocusMetric }
      ),
      label: copy.recruitmentPanel.actionOpenSubmittedQueue
    }
  ];
}

export function AdminRecruitmentKpiPanel({ copy, snapshot, analyticsFocusMetric }: AdminRecruitmentKpiPanelProps) {
  const priorityAction = resolveRecruitmentPriorityAction(snapshot, copy, analyticsFocusMetric);
  const quickActions = buildRecruitmentQuickActions(copy, analyticsFocusMetric);
  return (
    <article className="panel">
      <h2>{copy.recruitmentPanel.title}</h2>
      <p className="small muted">{copy.recruitmentPanel.description}</p>
      <div className="kpi-strip">
        <article className="kpi-card">
          <p>{copy.recruitmentPanel.openOpeningCount}</p>
          <strong>{snapshot.openOpeningCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.recruitmentPanel.activeReferralCount}</p>
          <strong>{snapshot.activeReferralCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.recruitmentPanel.stalledReferral7dCount}</p>
          <strong>{snapshot.stalledReferral7dCount}</strong>
          <small>{copy.recruitmentPanel.stalledThreshold}</small>
        </article>
      </div>
      <section style={{ marginTop: 12 }}>
        <p className="small muted">{copy.recruitmentPanel.priorityActionLabel}</p>
        <p className="small" style={{ marginTop: 4 }}>
          {priorityAction.reason}
        </p>
        <div className="actions" style={{ marginTop: 8 }}>
          <Link href={priorityAction.href} className="btn btn-primary btn-small">
            {priorityAction.label}
          </Link>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          {copy.recruitmentPanel.quickActionsLabel}
        </p>
        <div className="actions" style={{ marginTop: 6 }}>
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="btn btn-secondary btn-small">
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
