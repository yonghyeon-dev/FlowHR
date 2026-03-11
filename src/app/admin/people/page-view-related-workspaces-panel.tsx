import Link from "next/link";

type AdminPeopleRelatedWorkspacesPanelProps = {
  isKoLocale: boolean;
};

export function AdminPeopleRelatedWorkspacesPanel({ isKoLocale }: AdminPeopleRelatedWorkspacesPanelProps) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "관련 화면 이동" : "Related workspaces"}</h2>
      <div className="panel-actions">
        <Link className="btn btn-secondary" href="/admin/approval-executions">
          {isKoLocale ? "결재 실행 현황" : "Approval executions"}
        </Link>
        <Link className="btn btn-secondary" href="/admin/attendance-live">
          {isKoLocale ? "근태 워크스페이스" : "Attendance workspace"}
        </Link>
        <Link className="btn btn-secondary" href="/admin">
          {isKoLocale ? "관리자 허브" : "Admin hub"}
        </Link>
      </div>
    </article>
  );
}
