"use client";

import Link from "next/link";

type AdminContractsWorkspaceHeaderProps = {
  heroEyebrow: string;
  title: string;
  description: string;
  analyticsSource: string | null;
  analyticsFocusLabel: string;
  analyticsSourceBanner: string;
  analyticsSourceFocusLabel: string;
  dashboardSourceBanner: string;
  dashboardSourceFocusLabel: string;
  dashboardFocusLabel: string;
  analyticsBackHref: string | null;
  analyticsBackLabel: string;
  openTemplateBuilderAction: string;
  summaryKpiAria: string;
  templatesKpiLabel: string;
  templatesCount: number;
  documentsKpiLabel: string;
  documentsCount: number;
  pendingApprovalKpiLabel: string;
  pendingApprovalCount: number;
};

export function AdminContractsWorkspaceHeader({
  heroEyebrow,
  title,
  description,
  analyticsSource,
  analyticsFocusLabel,
  analyticsSourceBanner,
  analyticsSourceFocusLabel,
  dashboardSourceBanner,
  dashboardSourceFocusLabel,
  dashboardFocusLabel,
  analyticsBackHref,
  analyticsBackLabel,
  openTemplateBuilderAction,
  summaryKpiAria,
  templatesKpiLabel,
  templatesCount,
  documentsKpiLabel,
  documentsCount,
  pendingApprovalKpiLabel,
  pendingApprovalCount
}: AdminContractsWorkspaceHeaderProps) {
  return (
    <>
      <header className="page-header workspace-page-header">
        <div>
          <p className="page-eyebrow">{heroEyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
          {analyticsSource === "admin-analytics" ? (
            <p className="small muted workspace-source-banner">
              {analyticsSourceBanner} · {analyticsSourceFocusLabel}: {analyticsFocusLabel}
            </p>
          ) : null}
          {analyticsSource === "admin-hub" ? (
            <p className="small muted workspace-source-banner">
              {dashboardSourceBanner} · {dashboardSourceFocusLabel}: {dashboardFocusLabel}
            </p>
          ) : null}
          <div className="contract-action-row">
            {analyticsBackHref ? (
              <Link href={analyticsBackHref} className="btn btn-secondary btn-small">
                {analyticsBackLabel}
              </Link>
            ) : null}
            <Link href="/admin/contracts/builder" className="btn btn-secondary btn-small">
              {openTemplateBuilderAction}
            </Link>
          </div>
        </div>
      </header>
      <section className="kpi-strip workspace-summary-strip" aria-label={summaryKpiAria}>
        <article className="kpi-card">
          <span>{templatesKpiLabel}</span>
          <strong>{templatesCount}</strong>
        </article>
        <article className="kpi-card">
          <span>{documentsKpiLabel}</span>
          <strong>{documentsCount}</strong>
        </article>
        <article className="kpi-card">
          <span>{pendingApprovalKpiLabel}</span>
          <strong>{pendingApprovalCount}</strong>
        </article>
      </section>
    </>
  );
}
