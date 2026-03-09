"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { formatUserFacingErrorMessage } from "@/lib/product-language";

type FeatureMode = "default" | "enabled" | "disabled";

type FeatureToggleState = {
  mode: FeatureMode;
  effectiveEnabled: boolean;
  fallbackEnabled: boolean;
};

type FeatureManagementSnapshot = {
  payroll: {
    deductions: FeatureToggleState;
    deductionProfile: FeatureToggleState;
    krBaseline: FeatureToggleState;
    krInsuranceSettlement: FeatureToggleState;
    closePeriod: FeatureToggleState;
    payslipDelivery: FeatureToggleState;
    yearEnd: FeatureToggleState;
    yearEndDeductionInput: FeatureToggleState;
    yearEndFilingExport: FeatureToggleState;
    yearEndFilingSubmission: FeatureToggleState;
  };
};

type FeatureManagementDto = FeatureManagementSnapshot & {
  organizationId: string;
  updatedAt: string;
};

type FeatureKey = keyof FeatureManagementSnapshot["payroll"];

type PageCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  featureTitle: string;
  featureDescription: string;
  effectiveTitle: string;
  effectiveDescription: string;
  opsOnlyTitle: string;
  opsOnlyDescription: string;
  lastSavedLabel: string;
  noSaveHistory: string;
  modeLabel: string;
  effectiveLabel: string;
  fallbackLabel: string;
  enabledLabel: string;
  disabledLabel: string;
  modeOptions: Record<FeatureMode, string>;
  features: Record<FeatureKey, { label: string; description: string }>;
  opsOnlyItems: string[];
};

const DEFAULT_FORM: FeatureManagementSnapshot = {
  payroll: {
    deductions: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    deductionProfile: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    krBaseline: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    krInsuranceSettlement: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    closePeriod: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    payslipDelivery: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    yearEnd: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    yearEndDeductionInput: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    yearEndFilingExport: { mode: "default", effectiveEnabled: false, fallbackEnabled: false },
    yearEndFilingSubmission: {
      mode: "default",
      effectiveEnabled: false,
      fallbackEnabled: false
    }
  }
};

function getCopy(locale: string): PageCopy {
  if (locale === "ko") {
    return {
      pageTitle: "기능 관리",
      pageSubtitle:
        "급여 및 연말정산 기능의 롤아웃 상태를 조직 단위로 관리하고, 진짜 ops 전용 제어는 별도로 구분합니다.",
      reloadLabel: "새로고침",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "설정 저장",
      saveLoadingLabel: "저장 중...",
      loadFailed: "기능 관리 설정을 불러오지 못했습니다.",
      saveFailed: "기능 관리 설정을 저장하지 못했습니다.",
      saveSuccess: "기능 관리 설정을 저장했습니다.",
      featureTitle: "급여 기능 토글",
      featureDescription:
        "기본값 사용은 현재 서버 기본 롤아웃 상태를 따릅니다. 조직 단위로 강제 켜기/끄기를 적용할 수 있습니다.",
      effectiveTitle: "현재 적용 상태",
      effectiveDescription: "각 기능의 실제 적용 상태와 서버 기본값을 함께 확인합니다.",
      opsOnlyTitle: "Ops 전용 제어",
      opsOnlyDescription:
        "아래 제어는 고객 관리자 설정이 아니라 배포/운영 인프라 수준에서만 관리합니다.",
      lastSavedLabel: "마지막 저장",
      noSaveHistory: "저장 이력 없음",
      modeLabel: "조직 설정",
      effectiveLabel: "실제 적용",
      fallbackLabel: "서버 기본값",
      enabledLabel: "켜짐",
      disabledLabel: "꺼짐",
      modeOptions: {
        default: "기본값 사용",
        enabled: "항상 켜기",
        disabled: "항상 끄기"
      },
      features: {
        deductions: {
          label: "공제 포함 급여 프리뷰",
          description: "공제/세액 포함 급여 미리보기 경로를 제어합니다."
        },
        deductionProfile: {
          label: "공제 프로필",
          description: "프로필 기반 공제 계산 모드를 제어합니다."
        },
        krBaseline: {
          label: "KR 기준 공제 계산",
          description: "법정 기준 공제 계산 모드를 제어합니다."
        },
        krInsuranceSettlement: {
          label: "4대보험 정산",
          description: "보험 정산 프리뷰 및 보고 흐름을 제어합니다."
        },
        closePeriod: {
          label: "급여 마감",
          description: "급여 기간 마감 프리뷰/적용 흐름을 제어합니다."
        },
        payslipDelivery: {
          label: "명세서 배포",
          description: "명세서 배포 및 수신 확인 흐름을 제어합니다."
        },
        yearEnd: {
          label: "연말정산",
          description: "연말정산 조회, 확정, 영수증 흐름의 기본 게이트입니다."
        },
        yearEndDeductionInput: {
          label: "연말정산 공제 입력",
          description: "연말정산 공제 입력 및 재계산 흐름을 제어합니다."
        },
        yearEndFilingExport: {
          label: "연말정산 신고 export",
          description: "연말정산 신고 export 및 finalize 후속 흐름을 제어합니다."
        },
        yearEndFilingSubmission: {
          label: "연말정산 신고 제출",
          description: "신고 제출, ACK, 재제출, 증빙 메모 흐름을 제어합니다."
        }
      },
      opsOnlyItems: [
        "NEXT_PUBLIC_FLOWHR_DEV_TOOLS: 개발/운영 도구 노출",
        "FLOWHR_DATA_ACCESS: 저장소 모드 전환",
        "FLOWHR_EVENT_PUBLISHER / FLOWHR_EVENT_HTTP_*: 이벤트 전송 인프라",
        "FLOWHR_TENANCY_V1 / FLOWHR_RBAC_V1: 전역 보안 롤아웃"
      ]
    };
  }

  return {
    pageTitle: "Feature Management",
    pageSubtitle:
      "Manage payroll and year-end rollout states per organization while keeping true ops-only controls explicitly separated.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save settings",
    saveLoadingLabel: "Saving...",
    loadFailed: "Failed to load feature management settings.",
    saveFailed: "Failed to save feature management settings.",
    saveSuccess: "Feature management settings were saved.",
    featureTitle: "Payroll feature toggles",
    featureDescription:
      "Default mode follows the current server rollout state. You can force each feature on or off for this organization.",
    effectiveTitle: "Effective state",
    effectiveDescription: "Review the effective runtime state together with the server fallback for each feature.",
    opsOnlyTitle: "Ops-only controls",
    opsOnlyDescription:
      "The controls below remain deployment and infrastructure owned, not customer-admin managed.",
    lastSavedLabel: "Last saved",
    noSaveHistory: "No save history",
    modeLabel: "Organization setting",
    effectiveLabel: "Effective runtime",
    fallbackLabel: "Server default",
    enabledLabel: "Enabled",
    disabledLabel: "Disabled",
    modeOptions: {
      default: "Use default",
      enabled: "Force enabled",
      disabled: "Force disabled"
    },
    features: {
      deductions: {
        label: "Payroll preview with deductions",
        description: "Controls deduction and tax preview flows."
      },
      deductionProfile: {
        label: "Deduction profile mode",
        description: "Controls profile-based deduction calculation."
      },
      krBaseline: {
        label: "KR statutory baseline",
        description: "Controls statutory payroll deduction calculation."
      },
      krInsuranceSettlement: {
        label: "Insurance settlement",
        description: "Controls insurance settlement preview and reporting."
      },
      closePeriod: {
        label: "Payroll close period",
        description: "Controls payroll period close preview/apply flows."
      },
      payslipDelivery: {
        label: "Payslip delivery",
        description: "Controls payslip distribution and receipt acknowledgement."
      },
      yearEnd: {
        label: "Year-end baseline",
        description: "Controls year-end read/finalization/receipt baseline flows."
      },
      yearEndDeductionInput: {
        label: "Year-end deduction input",
        description: "Controls year-end deduction input and recalculation flows."
      },
      yearEndFilingExport: {
        label: "Year-end filing export",
        description: "Controls filing export and finalize follow-up flows."
      },
      yearEndFilingSubmission: {
        label: "Year-end filing submission",
        description: "Controls filing submit, ack, resubmit, and evidence-note flows."
      }
    },
    opsOnlyItems: [
      "NEXT_PUBLIC_FLOWHR_DEV_TOOLS: dev and ops tooling visibility",
      "FLOWHR_DATA_ACCESS: storage mode switching",
      "FLOWHR_EVENT_PUBLISHER / FLOWHR_EVENT_HTTP_*: event transport infrastructure",
      "FLOWHR_TENANCY_V1 / FLOWHR_RBAC_V1: global security rollout controls"
    ]
  };
}

function formatLocalizedDateTime(value: string | null, runtimeLocale: string, emptyLabel: string) {
  if (!value) {
    return emptyLabel;
  }
  return new Intl.DateTimeFormat(runtimeLocale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function asEnabledLabel(enabled: boolean, copy: PageCopy) {
  return enabled ? copy.enabledLabel : copy.disabledLabel;
}

export default function AdminFeatureManagementPage() {
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);
  const { loading: sessionLoading, error: sessionError } = useSupabaseSession();

  const [form, setForm] = useState<FeatureManagementSnapshot>(DEFAULT_FORM);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const featureKeys = useMemo(
    () => Object.keys(copy.features) as FeatureKey[],
    [copy.features]
  );

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performAdminApiCall({
        label: "Load feature management settings",
        method: "GET",
        path: "/api/admin/feature-management",
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.loadFailed);
      }

      const payload = result.body as FeatureManagementDto;
      setForm({ payroll: payload.payroll });
      setLastSavedAt(payload.updatedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadFailed;
      setErrorMessage(formatUserFacingErrorMessage(message, runtimeLocale));
    } finally {
      setWorkspaceLoading(false);
    }
  }, [copy.loadFailed, runtimeLocale]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    void loadWorkspace();
  }, [loadWorkspace, sessionLoading]);

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        payroll: Object.fromEntries(
          featureKeys.map((key) => [key, { mode: form.payroll[key].mode }])
        ) as FeatureManagementSnapshot["payroll"]
      };

      const result = await performAdminApiCall({
        label: "Save feature management settings",
        method: "PUT",
        path: "/api/admin/feature-management",
        payload,
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.saveFailed);
      }

      const responsePayload = result.body as FeatureManagementDto;
      setForm({ payroll: responsePayload.payroll });
      setLastSavedAt(responsePayload.updatedAt);
      setSuccessMessage(copy.saveSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.saveFailed;
      setErrorMessage(formatUserFacingErrorMessage(message, runtimeLocale));
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading) {
    return null;
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => void loadWorkspace()}
            disabled={workspaceLoading}
          >
            {workspaceLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
        </div>
      </header>

      {sessionError ? (
        <p className="small fail">{formatUserFacingErrorMessage(sessionError, runtimeLocale)}</p>
      ) : null}
      {errorMessage ? <p className="small fail">{errorMessage}</p> : null}
      {successMessage ? <p className="small ok">{successMessage}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.featureTitle}</h2>
          <p className="small muted">{copy.featureDescription}</p>

          <div className="input-grid">
            {featureKeys.map((key) => (
              <label key={key}>
                {copy.features[key].label}
                <select
                  value={form.payroll[key].mode}
                  onChange={(event) =>
                    setForm((current) => ({
                      payroll: {
                        ...current.payroll,
                        [key]: {
                          ...current.payroll[key],
                          mode: event.target.value as FeatureMode
                        }
                      }
                    }))
                  }
                >
                  <option value="default">{copy.modeOptions.default}</option>
                  <option value="enabled">{copy.modeOptions.enabled}</option>
                  <option value="disabled">{copy.modeOptions.disabled}</option>
                </select>
                <span className="small muted">{copy.features[key].description}</span>
              </label>
            ))}
          </div>

          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? copy.saveLoadingLabel : copy.saveLabel}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.effectiveTitle}</h2>
          <p className="small muted">{copy.effectiveDescription}</p>
          <ul className="simple-list">
            {featureKeys.map((key) => (
              <li key={key}>
                <span>
                  {copy.features[key].label}
                  <span className="small muted"> · {copy.modeLabel}: {copy.modeOptions[form.payroll[key].mode]}</span>
                </span>
                <strong>
                  {copy.effectiveLabel}: {asEnabledLabel(form.payroll[key].effectiveEnabled, copy)} / {copy.fallbackLabel}:{" "}
                  {asEnabledLabel(form.payroll[key].fallbackEnabled, copy)}
                </strong>
              </li>
            ))}
            <li>
              <span>{copy.lastSavedLabel}</span>
              <strong>{formatLocalizedDateTime(lastSavedAt, runtimeLocale, copy.noSaveHistory)}</strong>
            </li>
          </ul>
        </article>

        <article className="panel">
          <h2>{copy.opsOnlyTitle}</h2>
          <p className="small muted">{copy.opsOnlyDescription}</p>
          <ul className="simple-list">
            {copy.opsOnlyItems.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
