import Link from "next/link";
import type { ReactNode } from "react";

type WorkspaceTone = "admin" | "employee";

type WorkspaceAction =
  | {
      href: string;
      label: string;
      tone?: "primary" | "secondary";
    }
  | {
      label: string;
      onClick: () => void;
      tone?: "primary" | "secondary";
      type?: "button" | "submit" | "reset";
      disabled?: boolean;
    };

type RouteWorkspaceShellProps = {
  children: ReactNode;
  tone: WorkspaceTone;
  className?: string;
};

type RouteWorkspaceHeaderProps = {
  eyebrow?: string | null;
  breadcrumbs?: string[];
  title: string;
  description?: string | null;
  sourceHint?: string | null;
  actions?: WorkspaceAction[];
  className?: string;
};

type RouteWorkspaceTabsProps = {
  ariaLabel: string;
  tabs: Array<
    | {
        href: string;
        label: string;
        active?: boolean;
      }
    | {
        label: string;
        active?: boolean;
        onClick: () => void;
      }
  >;
};

type RouteWorkspaceSummaryProps = {
  ariaLabel: string;
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
  className?: string;
};

type RouteWorkspaceStatusProps = {
  message: string | null;
  tone?: "success" | "error" | "info";
};

type RouteWorkspaceSplitProps = {
  main: ReactNode;
  side?: ReactNode;
  className?: string;
};

type RouteWorkspaceSectionCardProps = {
  id?: string;
  title?: string;
  description?: string | null;
  children: ReactNode;
  className?: string;
};

type RouteWorkspaceEmptyStateProps = {
  title: string;
  description: string;
  action?: WorkspaceAction;
  className?: string;
};

function joinClasses(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function actionToneClassName(tone?: "primary" | "secondary") {
  return tone === "primary" ? "btn btn-primary" : "btn btn-secondary";
}

function renderAction(action: WorkspaceAction, key: string) {
  if ("href" in action) {
    return (
      <Link key={key} className={actionToneClassName(action.tone)} href={action.href}>
        {action.label}
      </Link>
    );
  }

  return (
    <button
      key={key}
      className={actionToneClassName(action.tone)}
      disabled={action.disabled}
      onClick={action.onClick}
      type={action.type ?? "button"}
    >
      {action.label}
    </button>
  );
}

export function RouteWorkspaceShell({ children, tone, className }: RouteWorkspaceShellProps) {
  return (
    <main
      className={joinClasses(
        "saas-content workspace-shell v2-route-shell",
        tone === "admin" ? "admin-workspace-shell" : "employee-workspace-shell",
        className
      )}
    >
      {children}
    </main>
  );
}

export function RouteWorkspaceHeader({
  eyebrow,
  breadcrumbs = [],
  title,
  description,
  sourceHint,
  actions = [],
  className
}: RouteWorkspaceHeaderProps) {
  return (
    <header className={joinClasses("page-header workspace-page-header v2-page-header", className)}>
      <div className="v2-page-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {breadcrumbs.length > 0 ? (
          <div className="v2-breadcrumb">
            {breadcrumbs.map((crumb) => (
              <span key={crumb}>{crumb}</span>
            ))}
          </div>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-subtitle">{description}</p> : null}
        {sourceHint ? <p className="small muted workspace-source-banner">{sourceHint}</p> : null}
      </div>
      {actions.length > 0 ? (
        <div className="page-actions">{actions.map((action, index) => renderAction(action, `${title}-${index}`))}</div>
      ) : null}
    </header>
  );
}

export function RouteWorkspaceTabs({ ariaLabel, tabs }: RouteWorkspaceTabsProps) {
  return (
    <nav aria-label={ariaLabel} className="v2-tab-row">
      {tabs.map((tab, index) =>
        "href" in tab ? (
          <Link key={tab.href} className={tab.active ? "v2-tab-link active" : "v2-tab-link"} href={tab.href}>
            {tab.label}
          </Link>
        ) : (
          <button
            className={tab.active ? "v2-tab-link active" : "v2-tab-link"}
            key={`${tab.label}-${index}`}
            onClick={tab.onClick}
            type="button"
          >
            {tab.label}
          </button>
        )
      )}
    </nav>
  );
}

export function RouteWorkspaceSummary({ ariaLabel, items, className }: RouteWorkspaceSummaryProps) {
  return (
    <section aria-label={ariaLabel} className={joinClasses("kpi-strip workspace-summary-strip v2-workspace-summary", className)}>
      {items.map((item) => (
        <article className="kpi-card workspace-summary-card v2-workspace-summary-card" key={item.label}>
          <p>{item.label}</p>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

export function RouteWorkspaceStatus({ message, tone = "info" }: RouteWorkspaceStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={joinClasses(
        "small workspace-inline-status v2-workspace-feedback",
        tone === "success" ? "ok" : tone === "error" ? "fail" : undefined
      )}
    >
      {message}
    </p>
  );
}

export function RouteWorkspaceSplit({ main, side, className }: RouteWorkspaceSplitProps) {
  return (
    <section className={joinClasses("panel-grid workspace-panel-grid v2-workspace-split", className)}>
      <div className="v2-workspace-main">{main}</div>
      {side ? <aside className="v2-workspace-side">{side}</aside> : null}
    </section>
  );
}

export function RouteWorkspaceSectionCard({
  id,
  title,
  description,
  children,
  className
}: RouteWorkspaceSectionCardProps) {
  return (
    <article className={joinClasses("panel workspace-section-card v2-surface-card", className)} id={id}>
      {title ? <h2>{title}</h2> : null}
      {description ? <p className="small muted">{description}</p> : null}
      {children}
    </article>
  );
}

export function RouteWorkspaceEmptyState({
  title,
  description,
  action,
  className
}: RouteWorkspaceEmptyStateProps) {
  return (
    <div className={joinClasses("empty-state v2-workspace-empty", className)}>
      <div className="empty-icon" aria-hidden="true">
        ·
      </div>
      <p className="empty-title">{title}</p>
      <p className="empty-desc">{description}</p>
      {action ? <div className="page-actions">{renderAction(action, title)}</div> : null}
    </div>
  );
}
