import Link from "next/link";
import { type KpiCopy } from "@/components/admin-kpi/copy";
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

function resolveRecruitmentPriorityAction(
  snapshot: RecruitmentKpiSnapshot,
  copy: KpiCopy
): RecruitmentPriorityAction {
  if (snapshot.stalledReferral7dCount > 0) {
    return {
      href: "/admin/recruitment?risk=stalled_7d",
      label: copy.recruitmentPanel.actionOpenStalledQueue,
      reason: copy.recruitmentPanel.priorityReasonStalled
    };
  }
  if (snapshot.activeReferralCount > 0) {
    return {
      href: "/admin/recruitment",
      label: copy.recruitmentPanel.actionOpenRecruitmentWorkspace,
      reason: copy.recruitmentPanel.priorityReasonActive
    };
  }
  if (snapshot.openOpeningCount > 0) {
    return {
      href: "/admin/recruitment",
      label: copy.recruitmentPanel.actionOpenRecruitmentWorkspace,
      reason: copy.recruitmentPanel.priorityReasonOpenings
    };
  }
  return {
    href: "/admin/recruitment",
    label: copy.recruitmentPanel.actionOpenRecruitmentWorkspace,
    reason: copy.recruitmentPanel.priorityReasonClear
  };
}

function buildRecruitmentQuickActions(copy: KpiCopy): RecruitmentQuickAction[] {
  return [
    {
      href: "/admin/recruitment",
      label: copy.recruitmentPanel.actionOpenRecruitmentWorkspace
    },
    {
      href: "/admin/recruitment?risk=stalled_7d",
      label: copy.recruitmentPanel.actionOpenStalledQueue
    },
    {
      href: "/admin/recruitment?stage=SUBMITTED",
      label: copy.recruitmentPanel.actionOpenSubmittedQueue
    }
  ];
}

export function AdminRecruitmentKpiPanel({ copy, snapshot }: AdminRecruitmentKpiPanelProps) {
  const priorityAction = resolveRecruitmentPriorityAction(snapshot, copy);
  const quickActions = buildRecruitmentQuickActions(copy);
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
