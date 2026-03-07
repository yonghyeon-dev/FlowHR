"use client";

import { useCallback, useEffect, useState } from "react";

import { extractEmployeeErrorMessage } from "@/app/employee/page-locale-helpers";
import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

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

type ListEmployeesResponse = {
  employees?: EmployeeProfile[];
};

type UpdateEmployeeResponse = {
  employee?: EmployeeProfile;
};

function getLabel(locale: string, ko: string, en: string) {
  return locale === "ko" ? ko : en;
}

export default function EmployeeProfilePage() {
  const { locale } = useI18n();
  const { loading: sessionLoading } = useSupabaseSession();
  const isKoLocale = locale === "ko";
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const l = useCallback((ko: string, en: string) => getLabel(locale, ko, en), [locale]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClientFetch({ method: "GET", path: "/api/people/employees" });
      const body = (await parseApiResponseBody(response)) as ListEmployeesResponse;
      if (!response.ok) {
        throw new Error(extractEmployeeErrorMessage(body, isKoLocale));
      }
      const employees = body?.employees ?? [];
      if (employees.length > 0) {
        setProfile(employees[0]);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [isKoLocale]);

  const handleStartEdit = useCallback(() => {
    if (!profile) {
      return;
    }
    setEditName(profile.name ?? "");
    setEditPhone(profile.phone ?? "");
    setFormError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  }, [profile]);

  const handleCancelEdit = useCallback(() => {
    setEditName(profile?.name ?? "");
    setEditPhone(profile?.phone ?? "");
    setFormError(null);
    setIsEditing(false);
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!profile) {
      return;
    }

    const normalizedName = editName.trim();
    const normalizedPhone = editPhone.trim();
    if (normalizedName.length === 0) {
      setFormError(l("이름을 입력해 주세요.", "Name is required."));
      setSuccessMessage(null);
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const payload: { name: string; phone?: string } = {
        name: normalizedName
      };
      if (normalizedPhone.length > 0) {
        payload.phone = normalizedPhone;
      }

      const response = await apiClientFetch({
        method: "PATCH",
        path: `/api/people/employees/${encodeURIComponent(profile.id)}`,
        payload
      });
      const body = (await parseApiResponseBody(response)) as UpdateEmployeeResponse;
      if (!response.ok) {
        setFormError(extractEmployeeErrorMessage(body, isKoLocale));
        return;
      }

      const updatedProfile = body?.employee;
      if (updatedProfile) {
        setProfile(updatedProfile);
        setEditName(updatedProfile.name ?? "");
        setEditPhone(updatedProfile.phone ?? "");
      } else {
        await loadProfile();
      }
      setIsEditing(false);
      setSuccessMessage(l("프로필을 저장했습니다.", "Profile saved."));
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : l("프로필 저장에 실패했습니다.", "Failed to save profile.")
      );
    } finally {
      setIsSaving(false);
    }
  }, [editName, editPhone, isKoLocale, l, loadProfile, profile]);

  useEffect(() => {
    if (!sessionLoading) {
      void loadProfile();
    }
  }, [sessionLoading, loadProfile]);

  if (sessionLoading) return null;

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{l("내 프로필", "My Profile")}</h1>
          <p className="page-subtitle">{l("내 인사 정보를 확인합니다.", "View your profile information.")}</p>
        </div>
      </header>

      {error ? <p className="small fail">{error}</p> : null}
      {formError ? <p className="small fail">{formError}</p> : null}
      {successMessage ? <p className="small ok">{successMessage}</p> : null}
      {isLoading ? <p className="small muted">{l("불러오는 중...", "Loading...")}</p> : null}

      {profile ? (
        <section className="panel-grid">
          <article className="panel">
            <div className="panel-actions" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ marginBottom: 6 }}>{l("기본 정보", "Basic Info")}</h2>
                <p className="small muted" style={{ marginBottom: 0 }}>
                  {isEditing
                    ? l("이름과 전화번호를 수정한 뒤 저장해 주세요.", "Update your name and phone, then save.")
                    : l("이름과 전화번호를 직접 수정할 수 있습니다.", "You can edit your name and phone directly.")}
                </p>
              </div>
              <div className="actions">
                {isEditing ? (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={isSaving}>
                      {l("취소", "Cancel")}
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={isSaving}>
                      {isSaving ? l("저장 중...", "Saving...") : l("저장", "Save")}
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={handleStartEdit} disabled={isLoading}>
                    {l("수정", "Edit")}
                  </button>
                )}
              </div>
            </div>
            <dl className="info-list">
              <div className="info-row">
                <dt>{l("이름", "Name")}</dt>
                <dd>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      placeholder={l("이름을 입력해 주세요.", "Enter your name")}
                      maxLength={100}
                    />
                  ) : (
                    profile.name ?? "-"
                  )}
                </dd>
              </div>
              <div className="info-row">
                <dt>{l("이메일", "Email")}</dt>
                <dd>{profile.email ?? "-"}</dd>
              </div>
              <div className="info-row">
                <dt>{l("전화번호", "Phone")}</dt>
                <dd>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(event) => setEditPhone(event.target.value)}
                      placeholder={l("전화번호를 입력해 주세요.", "Enter your phone number")}
                      maxLength={50}
                    />
                  ) : (
                    profile.phone ?? "-"
                  )}
                </dd>
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

      {!isLoading && !profile && !error ? (
        <section className="panel">
          <p className="small muted" style={{ marginBottom: 0 }}>
            {l("표시할 프로필 정보가 없습니다.", "No profile information is available.")}
          </p>
        </section>
      ) : null}
    </main>
  );
}
