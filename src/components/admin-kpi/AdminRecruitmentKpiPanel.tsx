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

export function AdminRecruitmentKpiPanel({ copy, snapshot }: AdminRecruitmentKpiPanelProps) {
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
    </article>
  );
}
