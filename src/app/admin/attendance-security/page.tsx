"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { formatUserFacingErrorMessage } from "@/lib/product-language";

type AttendanceSecurityDto = {
  gpsRequired: boolean;
  geofenceEnabled: boolean;
  geofenceLatitude: number | null;
  geofenceLongitude: number | null;
  geofenceRadiusMeters: number | null;
  updatedAt: string;
};

type AttendanceSecurityFormState = {
  gpsRequired: boolean;
  geofenceEnabled: boolean;
  geofenceLatitude: string;
  geofenceLongitude: string;
  geofenceRadiusMeters: string;
};

type AttendanceSecurityCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  formTitle: string;
  formDescription: string;
  sessionErrorLabel: string;
  currentStatusTitle: string;
  currentStatusDescription: string;
  gpsRequiredStateLabel: string;
  geofenceStateLabel: string;
  geofenceSummaryLabel: string;
  lastSavedLabel: string;
  neverSavedLabel: string;
  enabledLabel: string;
  disabledLabel: string;
  geofenceDisabledHint: string;
  geofenceRequiresGpsHint: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  fields: {
    gpsRequired: string;
    geofenceEnabled: string;
    geofenceLatitude: string;
    geofenceLongitude: string;
    geofenceRadiusMeters: string;
  };
  invalidNumber: (field: string) => string;
  geofenceFieldRequired: string;
  geofenceSummary: (latitude: number, longitude: number, radius: number) => string;
};

const defaultFormState: AttendanceSecurityFormState = {
  gpsRequired: false,
  geofenceEnabled: false,
  geofenceLatitude: "",
  geofenceLongitude: "",
  geofenceRadiusMeters: ""
};

function getCopy(locale: string): AttendanceSecurityCopy {
  if (locale === "ko") {
    return {
      pageTitle: "출퇴근 보안 설정",
      pageSubtitle: "GPS 필수 정책과 지오펜스 반경을 운영 화면에서 바로 관리합니다.",
      reloadLabel: "새로고침",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "설정 저장",
      saveLoadingLabel: "저장 중...",
      formTitle: "기본 보안 정책",
      formDescription:
        "직원 출퇴근 기록에 적용할 GPS 필수 여부와 지오펜스 좌표/반경을 설정합니다.",
      sessionErrorLabel: "세션 오류",
      currentStatusTitle: "현재 적용 상태",
      currentStatusDescription: "현재 조직에 저장된 출퇴근 보안 정책을 요약해서 보여줍니다.",
      gpsRequiredStateLabel: "GPS 필수",
      geofenceStateLabel: "지오펜스 적용",
      geofenceSummaryLabel: "지오펜스 범위",
      lastSavedLabel: "마지막 저장",
      neverSavedLabel: "저장 이력 없음",
      enabledLabel: "사용",
      disabledLabel: "미사용",
      geofenceDisabledHint: "지오펜스를 끄면 좌표와 반경 검증은 적용되지 않습니다.",
      geofenceRequiresGpsHint: "지오펜스를 켜면 GPS 필수 정책도 함께 적용됩니다.",
      loadFailed: "출퇴근 보안 설정을 불러오지 못했습니다.",
      saveFailed: "출퇴근 보안 설정 저장에 실패했습니다.",
      saveSuccess: "출퇴근 보안 설정이 저장되었습니다.",
      fields: {
        gpsRequired: "직원 출퇴근 시 GPS 캡처 필수",
        geofenceEnabled: "허용 위치 반경(지오펜스) 적용",
        geofenceLatitude: "위도",
        geofenceLongitude: "경도",
        geofenceRadiusMeters: "허용 반경(m)"
      },
      invalidNumber: (field) => `${field} 값을 확인해주세요.`,
      geofenceFieldRequired: "지오펜스를 켜면 위도, 경도, 반경을 모두 입력해야 합니다.",
      geofenceSummary: (latitude, longitude, radius) =>
        `위도 ${latitude.toFixed(6)} / 경도 ${longitude.toFixed(6)} / 반경 ${radius.toLocaleString("ko-KR")}m`
    };
  }

  return {
    pageTitle: "Attendance Security",
    pageSubtitle: "Manage GPS capture and geofence enforcement from the admin product surface.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save settings",
    saveLoadingLabel: "Saving...",
    formTitle: "Default security policy",
    formDescription: "Configure GPS-required attendance capture and allowed geofence range.",
    sessionErrorLabel: "Session error",
    currentStatusTitle: "Current status",
    currentStatusDescription: "Review the attendance security policy saved for the current organization.",
    gpsRequiredStateLabel: "GPS required",
    geofenceStateLabel: "Geofence enabled",
    geofenceSummaryLabel: "Geofence range",
    lastSavedLabel: "Last saved",
    neverSavedLabel: "No save history",
    enabledLabel: "Enabled",
    disabledLabel: "Disabled",
    geofenceDisabledHint: "When geofence is disabled, coordinate and radius checks are skipped.",
    geofenceRequiresGpsHint: "When geofence is enabled, GPS-required policy is automatically enforced.",
    loadFailed: "Failed to load attendance security settings.",
    saveFailed: "Failed to save attendance security settings.",
    saveSuccess: "Attendance security settings were saved.",
    fields: {
      gpsRequired: "Require GPS capture for employee attendance",
      geofenceEnabled: "Apply allowed location radius (geofence)",
      geofenceLatitude: "Latitude",
      geofenceLongitude: "Longitude",
      geofenceRadiusMeters: "Allowed radius (m)"
    },
    invalidNumber: (field) => `Please check the value for ${field}.`,
    geofenceFieldRequired: "Latitude, longitude, and radius are required when geofence is enabled.",
    geofenceSummary: (latitude, longitude, radius) =>
      `Lat ${latitude.toFixed(6)} / Lng ${longitude.toFixed(6)} / Radius ${radius.toLocaleString("en-US")}m`
  };
}

function toFormState(payload: AttendanceSecurityDto): AttendanceSecurityFormState {
  return {
    gpsRequired: payload.gpsRequired,
    geofenceEnabled: payload.geofenceEnabled,
    geofenceLatitude:
      payload.geofenceLatitude === null ? "" : String(payload.geofenceLatitude),
    geofenceLongitude:
      payload.geofenceLongitude === null ? "" : String(payload.geofenceLongitude),
    geofenceRadiusMeters:
      payload.geofenceRadiusMeters === null ? "" : String(payload.geofenceRadiusMeters)
  };
}

function readErrorMessage(body: unknown, fallback: string, locale: string) {
  if (!body || typeof body !== "object") {
    return formatUserFacingErrorMessage(fallback, locale);
  }

  const candidate = body as { error?: unknown; message?: unknown };
  const message =
    (typeof candidate.error === "string" && candidate.error.trim().length > 0
      ? candidate.error.trim()
      : null) ??
    (typeof candidate.message === "string" && candidate.message.trim().length > 0
      ? candidate.message.trim()
      : fallback);

  return formatUserFacingErrorMessage(message, locale);
}

function parseOptionalNumber(value: string, fieldLabel: string, copy: AttendanceSecurityCopy) {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(copy.invalidNumber(fieldLabel));
  }
  return parsed;
}

export default function AdminAttendanceSecurityPage() {
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = getCopy(locale);
  const { loading, error: sessionError } = useSupabaseSession();

  const [form, setForm] = useState<AttendanceSecurityFormState>(defaultFormState);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoadingWorkspace(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performAdminApiCall({
        label: "Load attendance security settings",
        method: "GET",
        path: "/api/admin/attendance-security",
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(readErrorMessage(result.body, copy.loadFailed, runtimeLocale));
      }

      const payload = result.body as AttendanceSecurityDto;
      setForm(toFormState(payload));
      setLastSavedAt(payload.updatedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadFailed;
      setErrorMessage(formatUserFacingErrorMessage(message, runtimeLocale));
    } finally {
      setLoadingWorkspace(false);
    }
  }, [copy.loadFailed, runtimeLocale]);

  useEffect(() => {
    if (loading) {
      return;
    }
    void loadWorkspace();
  }, [loadWorkspace, loading]);

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const geofenceLatitude = parseOptionalNumber(
        form.geofenceLatitude,
        copy.fields.geofenceLatitude,
        copy
      );
      const geofenceLongitude = parseOptionalNumber(
        form.geofenceLongitude,
        copy.fields.geofenceLongitude,
        copy
      );
      const geofenceRadiusMeters = parseOptionalNumber(
        form.geofenceRadiusMeters,
        copy.fields.geofenceRadiusMeters,
        copy
      );

      if (
        form.geofenceEnabled &&
        (geofenceLatitude === null || geofenceLongitude === null || geofenceRadiusMeters === null)
      ) {
        throw new Error(copy.geofenceFieldRequired);
      }

      const result = await performAdminApiCall({
        label: "Save attendance security settings",
        method: "PUT",
        path: "/api/admin/attendance-security",
        payload: {
          gpsRequired: form.geofenceEnabled ? true : form.gpsRequired,
          geofenceEnabled: form.geofenceEnabled,
          geofenceLatitude,
          geofenceLongitude,
          geofenceRadiusMeters
        },
        runtimeLocale
      });

      if (!result.response.ok) {
        throw new Error(readErrorMessage(result.body, copy.saveFailed, runtimeLocale));
      }

      const payload = result.body as AttendanceSecurityDto;
      setForm(toFormState(payload));
      setLastSavedAt(payload.updatedAt);
      setSuccessMessage(copy.saveSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.saveFailed;
      setErrorMessage(formatUserFacingErrorMessage(message, runtimeLocale));
    } finally {
      setSaving(false);
    }
  }

  const effectiveGpsRequired = form.gpsRequired || form.geofenceEnabled;
  const parsedLatitude = Number(form.geofenceLatitude);
  const parsedLongitude = Number(form.geofenceLongitude);
  const parsedRadius = Number(form.geofenceRadiusMeters);
  const sourceHint =
    locale === "ko"
      ? "GPS와 지오펜스 정책은 직원 출퇴근 기록과 관리자 검토 흐름에 바로 반영됩니다."
      : "GPS and geofence policies immediately affect attendance capture and admin review flows.";
  const backToHubLabel = locale === "ko" ? "관리자 허브" : "Admin hub";
  const settingsLabel = locale === "ko" ? "조직 설정" : "Organization settings";
  const canShowGeofenceSummary =
    form.geofenceEnabled &&
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude) &&
    Number.isFinite(parsedRadius);

  if (loading) {
    return null;
  }

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          <p className="small muted workspace-source-banner">{sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            {backToHubLabel}
          </Link>
          <Link className="btn btn-secondary" href="/admin/settings">
            {settingsLabel}
          </Link>
          <button className="btn btn-secondary" type="button" onClick={() => void loadWorkspace()} disabled={loadingWorkspace || saving}>
            {loadingWorkspace ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
          <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={loadingWorkspace || saving}>
            {saving ? copy.saveLoadingLabel : copy.saveLabel}
          </button>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.pageTitle}>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.gpsRequiredStateLabel}</p>
          <strong>{effectiveGpsRequired ? copy.enabledLabel : copy.disabledLabel}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.geofenceStateLabel}</p>
          <strong>{form.geofenceEnabled ? copy.enabledLabel : copy.disabledLabel}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.lastSavedLabel}</p>
          <strong>{lastSavedAt ? new Date(lastSavedAt).toLocaleString(runtimeLocale) : copy.neverSavedLabel}</strong>
        </article>
      </section>

      {sessionError ? (
        <p className="small fail workspace-inline-status">
          {copy.sessionErrorLabel}: {formatUserFacingErrorMessage(sessionError, runtimeLocale)}
        </p>
      ) : null}
      {errorMessage ? <p className="small fail workspace-inline-status">{errorMessage}</p> : null}
      {successMessage ? <p className="small ok workspace-inline-status">{successMessage}</p> : null}

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <div className="section-heading">
            <div>
              <h2>{copy.currentStatusTitle}</h2>
              <p className="small muted">{copy.currentStatusDescription}</p>
            </div>
          </div>
          <dl className="definition-grid">
            <div>
              <dt>{copy.gpsRequiredStateLabel}</dt>
              <dd>{effectiveGpsRequired ? copy.enabledLabel : copy.disabledLabel}</dd>
            </div>
            <div>
              <dt>{copy.geofenceStateLabel}</dt>
              <dd>{form.geofenceEnabled ? copy.enabledLabel : copy.disabledLabel}</dd>
            </div>
            <div>
              <dt>{copy.geofenceSummaryLabel}</dt>
              <dd>
                {canShowGeofenceSummary
                  ? copy.geofenceSummary(parsedLatitude, parsedLongitude, parsedRadius)
                  : copy.geofenceDisabledHint}
              </dd>
            </div>
            <div>
              <dt>{copy.lastSavedLabel}</dt>
              <dd>{lastSavedAt ? new Date(lastSavedAt).toLocaleString(runtimeLocale) : copy.neverSavedLabel}</dd>
            </div>
          </dl>
        </article>

        <article className="panel workspace-section-card workspace-note-card">
          <div className="section-heading">
            <div>
              <h2>{copy.formTitle}</h2>
              <p className="small muted">{copy.formDescription}</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="stack gap-8">
              <span>{copy.fields.gpsRequired}</span>
              <input
                type="checkbox"
                checked={effectiveGpsRequired}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gpsRequired: event.target.checked
                  }))
                }
                disabled={form.geofenceEnabled}
              />
            </label>

            <label className="stack gap-8">
              <span>{copy.fields.geofenceEnabled}</span>
              <input
                type="checkbox"
                checked={form.geofenceEnabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    geofenceEnabled: event.target.checked,
                    gpsRequired: event.target.checked ? true : current.gpsRequired
                  }))
                }
              />
            </label>

            <label className="stack gap-8">
              <span>{copy.fields.geofenceLatitude}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.000001"
                value={form.geofenceLatitude}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    geofenceLatitude: event.target.value
                  }))
                }
              />
            </label>

            <label className="stack gap-8">
              <span>{copy.fields.geofenceLongitude}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.000001"
                value={form.geofenceLongitude}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    geofenceLongitude: event.target.value
                  }))
                }
              />
            </label>

            <label className="stack gap-8">
              <span>{copy.fields.geofenceRadiusMeters}</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.geofenceRadiusMeters}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    geofenceRadiusMeters: event.target.value
                  }))
                }
              />
            </label>
          </div>

          <div className="stack gap-8">
            <p className="small muted">{copy.geofenceDisabledHint}</p>
            <p className="small muted">{copy.geofenceRequiresGpsHint}</p>
          </div>
        </article>
      </section>
    </main>
  );
}
