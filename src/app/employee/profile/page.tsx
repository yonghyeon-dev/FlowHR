"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type EmployeeProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  active: boolean;
  departmentId: string | null;
  positionId: string | null;
  organizationId: string | null;
};

function getLabel(locale: string, ko: string, en: string) {
  return locale === "ko" ? ko : en;
}

export default function EmployeeProfilePage() {
  const { loading: sessionLoading } = useSupabaseSession();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClientFetch({ method: "GET", path: "/api/people/employees" });
      const body = (await parseApiResponseBody(response)) as {
        employees?: EmployeeProfile[];
      };
      if (!response.ok) {
        throw new Error("Failed to load profile");
      }
      const employees = body?.employees ?? [];
      if (employees.length > 0) {
        setProfile(employees[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading) {
      void loadProfile();
    }
  }, [sessionLoading, loadProfile]);

  if (sessionLoading) return null;

  const l = (ko: string, en: string) => getLabel("ko", ko, en);

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{l("내 프로필", "My Profile")}</h1>
          <p className="page-subtitle">{l("내 인사 정보를 확인합니다.", "View your profile information.")}</p>
        </div>
      </header>

      {error ? <p className="small fail">{error}</p> : null}
      {isLoading ? <p className="small muted">{l("불러오는 중...", "Loading...")}</p> : null}

      {profile ? (
        <section className="panel-grid">
          <article className="panel">
            <h2>{l("기본 정보", "Basic Info")}</h2>
            <dl className="info-list">
              <div className="info-row">
                <dt>{l("이름", "Name")}</dt>
                <dd>{profile.name ?? "-"}</dd>
              </div>
              <div className="info-row">
                <dt>{l("이메일", "Email")}</dt>
                <dd>{profile.email ?? "-"}</dd>
              </div>
              <div className="info-row">
                <dt>{l("전화번호", "Phone")}</dt>
                <dd>{profile.phone ?? "-"}</dd>
              </div>
              <div className="info-row">
                <dt>{l("상태", "Status")}</dt>
                <dd>{profile.status}</dd>
              </div>
              <div className="info-row">
                <dt>{l("활성", "Active")}</dt>
                <dd>{profile.active ? l("예", "Yes") : l("아니오", "No")}</dd>
              </div>
            </dl>
          </article>

          <article className="panel">
            <h2>{l("조직 정보", "Organization Info")}</h2>
            <dl className="info-list">
              <div className="info-row">
                <dt>{l("사번", "Employee ID")}</dt>
                <dd>{profile.id}</dd>
              </div>
              <div className="info-row">
                <dt>{l("부서 ID", "Department ID")}</dt>
                <dd>{profile.departmentId ?? "-"}</dd>
              </div>
              <div className="info-row">
                <dt>{l("직급 ID", "Position ID")}</dt>
                <dd>{profile.positionId ?? "-"}</dd>
              </div>
              <div className="info-row">
                <dt>{l("조직 ID", "Organization ID")}</dt>
                <dd>{profile.organizationId ?? "-"}</dd>
              </div>
            </dl>
          </article>
        </section>
      ) : null}
    </main>
  );
}
