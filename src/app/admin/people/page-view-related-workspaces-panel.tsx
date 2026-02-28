import Link from "next/link";

type AdminPeopleRelatedWorkspacesPanelProps = {
  isKoLocale: boolean;
};

export function AdminPeopleRelatedWorkspacesPanel({ isKoLocale }: AdminPeopleRelatedWorkspacesPanelProps) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "Related workspaces" : "Related workspaces"}</h2>
      <div className="panel-actions">
        <Link className="btn btn-secondary" href="/admin/approval-executions">
          {isKoLocale ? "Approval executions" : "Approval executions"}
        </Link>
        <Link className="btn btn-secondary" href="/admin/attendance-live">
          {isKoLocale ? "Attendance workspace" : "Attendance workspace"}
        </Link>
        <Link className="btn btn-secondary" href="/admin">
          {isKoLocale ? "Admin dashboard" : "Admin dashboard"}
        </Link>
      </div>
    </article>
  );
}
