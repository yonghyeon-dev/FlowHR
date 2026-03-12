"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type PayPeriod = "MONTHLY" | "BIWEEKLY";

type AdminSettingsDto = {
  fiscalYearStartMonth: number;
  standardWorkHoursPerDay: number;
  standardWorkDaysPerWeek: number;
  overtimeThresholdHours: number;
  payPeriod: PayPeriod;
  timezone: string | null;
  currency: string;
};

type SettingsFormState = {
  fiscalYearStartMonth: string;
  standardWorkHoursPerDay: string;
  standardWorkDaysPerWeek: string;
  overtimeThresholdHours: string;
  payPeriod: PayPeriod;
  timezone: string;
  currency: string;
};

type AdminSettingsCopy = {
  eyebrow: string;
  pageTitle: string;
  pageSubtitle: string;
  sourceHint: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  formSectionTitle: string;
  formSectionDescription: string;
  guideSectionTitle: string;
  guideSectionDescription: string;
  governanceSectionTitle: string;
  governanceSectionDescription: string;
  summaryLabels: {
    fiscalYearStartMonth: string;
    workRule: string;
    payPeriod: string;
    timezone: string;
  };
  timezonePlaceholder: string;
  currencyPlaceholder: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  timezoneRequired: string;
  currencyInvalid: string;
  apiLoadLabel: string;
  apiSaveLabel: string;
  navigation: {
    backToHub: string;
    securitySettings: string;
  };
  invalidFieldValue: (fieldName: string) => string;
  fields: {
    fiscalYearStartMonth: string;
    standardWorkHoursPerDay: string;
    standardWorkDaysPerWeek: string;
    overtimeThresholdHours: string;
    payPeriod: string;
    timezone: string;
    currency: string;
  };
  payPeriodOptions: {
    monthly: string;
    biweekly: string;
  };
  tabs: Array<{
    href: string;
    label: string;
  }>;
  guideItems: string[];
  governanceCards: Array<{
    title: string;
    description: string;
    href: string;
    label: string;
  }>;
};

const defaultFormState: SettingsFormState = {
  fiscalYearStartMonth: "1",
  standardWorkHoursPerDay: "8",
  standardWorkDaysPerWeek: "5",
  overtimeThresholdHours: "8",
  payPeriod: "MONTHLY",
  timezone: "Asia/Seoul",
  currency: "KRW"
};

function getAdminSettingsCopy(locale: string): AdminSettingsCopy {
  if (locale === "ko") {
    return {
      eyebrow: "settings",
      pageTitle: "운영 설정",
      pageSubtitle:
        "회사 운영 기준, 알림 규칙, 보안 정책으로 이어지는 관리 기준선을 한 화면에서 정리하세요.",
      sourceHint:
        "이 기본값은 급여, 근태, 결재, 자동화 워크스페이스의 기준값으로 즉시 연결됩니다.",
      reloadLabel: "다시 불러오기",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "설정 저장",
      saveLoadingLabel: "저장 중...",
      formSectionTitle: "회사 운영 기본값",
      formSectionDescription:
        "회계연도, 근무 기준, 급여 주기, 시간대와 통화를 관리합니다. 저장 즉시 `/api/admin/settings` 기준값으로 반영됩니다.",
      guideSectionTitle: "입력 가이드",
      guideSectionDescription:
        "실운영 기준과 맞지 않는 값을 저장하면 급여, 연장근로, 정산 계산이 흔들릴 수 있으니 먼저 기준값을 확인하세요.",
      governanceSectionTitle: "연결된 운영 설정",
      governanceSectionDescription:
        "역할/알림/보안/기능 관리는 아래 전용 워크스페이스에서 이어서 조정합니다.",
      summaryLabels: {
        fiscalYearStartMonth: "회계연도 시작",
        workRule: "근무 기준",
        payPeriod: "급여 주기",
        timezone: "시간대"
      },
      timezonePlaceholder: "예: Asia/Seoul",
      currencyPlaceholder: "예: KRW",
      loadFailed: "운영 설정을 불러오지 못했습니다.",
      saveFailed: "운영 설정 저장에 실패했습니다.",
      saveSuccess: "운영 설정이 저장되었습니다.",
      timezoneRequired: "시간대를 입력해 주세요.",
      currencyInvalid: "통화 코드는 KRW처럼 영문 3자리여야 합니다.",
      apiLoadLabel: "운영 설정 조회",
      apiSaveLabel: "운영 설정 저장",
      navigation: {
        backToHub: "관리자 허브",
        securitySettings: "출퇴근 보안 설정"
      },
      invalidFieldValue: (fieldName) => `${fieldName} 값을 확인해 주세요.`,
      fields: {
        fiscalYearStartMonth: "회계연도 시작 월",
        standardWorkHoursPerDay: "일일 기준 근무 시간",
        standardWorkDaysPerWeek: "주간 기준 근무 일수",
        overtimeThresholdHours: "연장근로 기준 시간",
        payPeriod: "급여 주기",
        timezone: "시간대",
        currency: "통화 코드"
      },
      payPeriodOptions: {
        monthly: "월 단위 정산",
        biweekly: "격주 정산"
      },
      tabs: [
        { href: "/admin/settings", label: "회사 운영" },
        { href: "/admin/notification-defaults", label: "알림 규칙" },
        { href: "/admin/attendance-security", label: "출퇴근 보안" },
        { href: "/admin/feature-management", label: "기능 관리" },
        { href: "/admin/audit-logs", label: "감사 로그" }
      ],
      guideItems: [
        "회계연도 시작 월은 1월부터 12월까지의 정수만 입력합니다.",
        "일일 기준 근무 시간은 1시간에서 24시간 사이 값으로 관리합니다.",
        "주간 기준 근무 일수는 1일에서 7일 사이 값으로 관리합니다.",
        "연장근로 기준 시간은 주간 기준으로 0시간에서 168시간 사이만 허용합니다.",
        "시간대는 실제 근무 지역과 일치해야 근태와 급여 시각 계산이 흔들리지 않습니다.",
        "통화 코드는 KRW, USD처럼 영문 3자리 기준으로 통일합니다."
      ],
      governanceCards: [
        {
          title: "알림 기본값",
          description: "결재, 근태, 문서, 급여 알림의 기본 수신 규칙을 정리합니다.",
          href: "/admin/notification-defaults",
          label: "알림 규칙 열기"
        },
        {
          title: "출퇴근 보안",
          description: "근태 캡처, 위치 기준, 운영 보안 정책을 연결된 화면에서 조정합니다.",
          href: "/admin/attendance-security",
          label: "보안 정책 열기"
        },
        {
          title: "기능 관리",
          description: "연말정산, 실험 기능, 운영 플래그를 제품 모드 기준으로 정리합니다.",
          href: "/admin/feature-management",
          label: "기능 관리 열기"
        },
        {
          title: "감사 로그",
          description: "누가 언제 운영 설정을 바꾸었는지 기록과 변경 이력을 확인합니다.",
          href: "/admin/audit-logs",
          label: "감사 로그 열기"
        }
      ]
    };
  }

  return {
    eyebrow: "settings",
    pageTitle: "Operations settings",
    pageSubtitle:
      "Keep company defaults, notification rules, and security policies aligned from one operating surface.",
    sourceHint:
      "These defaults feed payroll, attendance, approvals, and automation workspaces immediately.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save settings",
    saveLoadingLabel: "Saving...",
    formSectionTitle: "Company operating defaults",
    formSectionDescription:
      "Manage fiscal year, work rules, pay cycle, timezone, and currency. Saving updates `/api/admin/settings` immediately.",
    guideSectionTitle: "Input guide",
    guideSectionDescription:
      "Confirm the live operating baseline before changing values that affect payroll, overtime, and downstream calculations.",
    governanceSectionTitle: "Connected operating workspaces",
    governanceSectionDescription:
      "Continue role, notification, security, and feature controls in their dedicated admin workspaces.",
    summaryLabels: {
      fiscalYearStartMonth: "Fiscal year start",
      workRule: "Work rule baseline",
      payPeriod: "Pay cycle",
      timezone: "Timezone"
    },
    timezonePlaceholder: "e.g. Asia/Seoul",
    currencyPlaceholder: "e.g. KRW",
    loadFailed: "Failed to load operations settings.",
    saveFailed: "Failed to save operations settings.",
    saveSuccess: "Operations settings were saved.",
    timezoneRequired: "Please enter a timezone.",
    currencyInvalid: "Currency code must be a 3-letter alphabetic value such as KRW.",
    apiLoadLabel: "Load operations settings",
    apiSaveLabel: "Save operations settings",
    navigation: {
      backToHub: "Admin hub",
      securitySettings: "Attendance security"
    },
    invalidFieldValue: (fieldName) => `Please check the value for ${fieldName}.`,
    fields: {
      fiscalYearStartMonth: "Fiscal year start month",
      standardWorkHoursPerDay: "Standard work hours per day",
      standardWorkDaysPerWeek: "Standard work days per week",
      overtimeThresholdHours: "Overtime threshold hours",
      payPeriod: "Pay period",
      timezone: "Timezone",
      currency: "Currency code"
    },
    payPeriodOptions: {
      monthly: "Monthly",
      biweekly: "Biweekly"
    },
    tabs: [
      { href: "/admin/settings", label: "Company defaults" },
      { href: "/admin/notification-defaults", label: "Notification rules" },
      { href: "/admin/attendance-security", label: "Attendance security" },
      { href: "/admin/feature-management", label: "Feature management" },
      { href: "/admin/audit-logs", label: "Audit log" }
    ],
    guideItems: [
      "Fiscal year start month must stay between 1 and 12.",
      "Standard work hours per day must stay between 1 and 24.",
      "Standard work days per week must stay between 1 and 7.",
      "Overtime threshold hours must stay between 0 and 168.",
      "Timezone should match the live operating region.",
      "Currency codes must use a 3-letter alphabetic value such as KRW or USD."
    ],
    governanceCards: [
      {
        title: "Notification defaults",
        description: "Tune the baseline delivery rules for approvals, attendance, documents, and payroll.",
        href: "/admin/notification-defaults",
        label: "Open notification rules"
      },
      {
        title: "Attendance security",
        description: "Continue with attendance capture, geofence, and runtime security policy controls.",
        href: "/admin/attendance-security",
        label: "Open security policy"
      },
      {
        title: "Feature management",
        description: "Control year-end filing, experimental modules, and product-mode feature flags.",
        href: "/admin/feature-management",
        label: "Open feature management"
      },
      {
        title: "Audit log",
        description: "Review who changed operating settings and when the policy baseline moved.",
        href: "/admin/audit-logs",
        label: "Open audit log"
      }
    ]
  };
}

function toErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const candidate = body as { error?: unknown; message?: unknown };
  if (typeof candidate.error === "string" && candidate.error.trim().length > 0) {
    return candidate.error.trim();
  }
  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message.trim();
  }
  return fallback;
}

function mapDtoToForm(dto: AdminSettingsDto): SettingsFormState {
  return {
    fiscalYearStartMonth: String(dto.fiscalYearStartMonth),
    standardWorkHoursPerDay: String(dto.standardWorkHoursPerDay),
    standardWorkDaysPerWeek: String(dto.standardWorkDaysPerWeek),
    overtimeThresholdHours: String(dto.overtimeThresholdHours),
    payPeriod: dto.payPeriod,
    timezone: dto.timezone?.trim() || "Asia/Seoul",
    currency: dto.currency.trim().toUpperCase()
  };
}

function parseInteger(value: string, invalidValueErrorMessage: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(invalidValueErrorMessage);
  }
  return parsed;
}

function parseNumber(value: string, invalidValueErrorMessage: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(invalidValueErrorMessage);
  }
  return parsed;
}

function formatPayPeriodLabel(period: PayPeriod, copy: AdminSettingsCopy) {
  return period === "BIWEEKLY" ? copy.payPeriodOptions.biweekly : copy.payPeriodOptions.monthly;
}

function formatWorkRuleSummary(form: SettingsFormState, locale: string) {
  if (locale === "ko") {
    return `${form.standardWorkHoursPerDay}시간 · 주 ${form.standardWorkDaysPerWeek}일`;
  }
  return `${form.standardWorkHoursPerDay}h · ${form.standardWorkDaysPerWeek} days/week`;
}

export default function AdminSettingsPage() {
  const { locale } = useI18n();
  const { loading: supabaseSessionLoading } = useSupabaseSession();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getAdminSettingsCopy(locale), [locale]);
  const [form, setForm] = useState<SettingsFormState>(defaultFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await performAdminApiCall({
        label: copy.apiLoadLabel,
        method: "GET",
        path: "/api/admin/settings",
        runtimeLocale
      });

      if (!result.response.ok) {
        throw new Error(toErrorMessage(result.body, copy.loadFailed));
      }

      setForm(mapDtoToForm(result.body as AdminSettingsDto));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [copy.apiLoadLabel, copy.loadFailed, runtimeLocale]);

  useEffect(() => {
    if (supabaseSessionLoading) {
      return;
    }
    void loadSettings();
  }, [loadSettings, supabaseSessionLoading]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const timezone = form.timezone.trim();
      const currency = form.currency.trim().toUpperCase();

      if (!timezone) {
        throw new Error(copy.timezoneRequired);
      }
      if (!/^[A-Za-z]{3}$/.test(currency)) {
        throw new Error(copy.currencyInvalid);
      }

      const payload = {
        fiscalYearStartMonth: parseInteger(
          form.fiscalYearStartMonth,
          copy.invalidFieldValue(copy.fields.fiscalYearStartMonth)
        ),
        standardWorkHoursPerDay: parseNumber(
          form.standardWorkHoursPerDay,
          copy.invalidFieldValue(copy.fields.standardWorkHoursPerDay)
        ),
        standardWorkDaysPerWeek: parseInteger(
          form.standardWorkDaysPerWeek,
          copy.invalidFieldValue(copy.fields.standardWorkDaysPerWeek)
        ),
        overtimeThresholdHours: parseNumber(
          form.overtimeThresholdHours,
          copy.invalidFieldValue(copy.fields.overtimeThresholdHours)
        ),
        payPeriod: form.payPeriod,
        timezone,
        currency
      };

      const result = await performAdminApiCall({
        label: copy.apiSaveLabel,
        method: "PATCH",
        path: "/api/admin/settings",
        payload,
        runtimeLocale
      });

      if (!result.response.ok) {
        throw new Error(toErrorMessage(result.body, copy.saveFailed));
      }

      setForm(mapDtoToForm(result.body as AdminSettingsDto));
      setNotice(copy.saveSuccess);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  }, [copy, form, runtimeLocale]);

  if (supabaseSessionLoading) {
    return null;
  }

  return (
    <main className="saas-content workspace-shell admin-workspace-shell v2-route-shell v2-admin-settings-shell">
      <header className="page-header workspace-page-header v2-page-header">
        <div className="v2-page-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <div className="v2-breadcrumb">
            <span>{copy.navigation.backToHub}</span>
            <span>{copy.pageTitle}</span>
          </div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          <p className="small muted workspace-source-banner">{copy.sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            {copy.navigation.backToHub}
          </Link>
          <Link className="btn btn-secondary" href="/admin/attendance-security">
            {copy.navigation.securitySettings}
          </Link>
          <button className="btn btn-secondary" type="button" onClick={() => void loadSettings()} disabled={isLoading}>
            {isLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
        </div>
      </header>

      <nav className="v2-tab-row" aria-label={copy.pageTitle}>
        {copy.tabs.map((tab) => (
          <Link
            key={tab.href}
            className={tab.href === "/admin/settings" ? "v2-tab-link active" : "v2-tab-link"}
            href={tab.href}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.pageTitle}>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryLabels.fiscalYearStartMonth}</p>
          <strong>{form.fiscalYearStartMonth}월</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryLabels.workRule}</p>
          <strong>{formatWorkRuleSummary(form, locale)}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryLabels.payPeriod}</p>
          <strong>{formatPayPeriodLabel(form.payPeriod, copy)}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryLabels.timezone}</p>
          <strong>{form.timezone}</strong>
        </article>
      </section>

      {error ? <p className="small fail workspace-inline-status">{error}</p> : null}
      {notice ? <p className="small ok workspace-inline-status">{notice}</p> : null}

      <section className="panel-grid workspace-panel-grid v2-form-layout">
        <article className="panel workspace-section-card workspace-toolbar-card v2-surface-card">
          <h2>{copy.formSectionTitle}</h2>
          <p className="small muted">{copy.formSectionDescription}</p>

          <div className="input-grid">
            <label>
              {copy.fields.fiscalYearStartMonth}
              <input
                type="number"
                min={1}
                max={12}
                value={form.fiscalYearStartMonth}
                onChange={(event) => setForm((previous) => ({ ...previous, fiscalYearStartMonth: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.payPeriod}
              <select
                value={form.payPeriod}
                onChange={(event) => setForm((previous) => ({ ...previous, payPeriod: event.target.value as PayPeriod }))}
              >
                <option value="MONTHLY">{copy.payPeriodOptions.monthly}</option>
                <option value="BIWEEKLY">{copy.payPeriodOptions.biweekly}</option>
              </select>
            </label>

            <label>
              {copy.fields.standardWorkHoursPerDay}
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={form.standardWorkHoursPerDay}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, standardWorkHoursPerDay: event.target.value }))
                }
              />
            </label>

            <label>
              {copy.fields.standardWorkDaysPerWeek}
              <input
                type="number"
                min={1}
                max={7}
                value={form.standardWorkDaysPerWeek}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, standardWorkDaysPerWeek: event.target.value }))
                }
              />
            </label>

            <label>
              {copy.fields.overtimeThresholdHours}
              <input
                type="number"
                min={0}
                max={168}
                step={0.5}
                value={form.overtimeThresholdHours}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, overtimeThresholdHours: event.target.value }))
                }
              />
            </label>

            <label>
              {copy.fields.timezone}
              <input
                type="text"
                placeholder={copy.timezonePlaceholder}
                value={form.timezone}
                onChange={(event) => setForm((previous) => ({ ...previous, timezone: event.target.value }))}
              />
            </label>

            <label className="full">
              {copy.fields.currency}
              <input
                type="text"
                placeholder={copy.currencyPlaceholder}
                maxLength={3}
                value={form.currency}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, currency: event.target.value.toUpperCase() }))
                }
              />
            </label>
          </div>

          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? copy.saveLoadingLabel : copy.saveLabel}
            </button>
          </div>
        </article>

        <div className="v2-side-stack">
          <article className="panel workspace-section-card workspace-note-card v2-surface-card">
            <h2>{copy.guideSectionTitle}</h2>
            <p className="small muted">{copy.guideSectionDescription}</p>
            <ul className="simple-list">
              {copy.guideItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="panel workspace-section-card v2-surface-card">
            <h2>{copy.governanceSectionTitle}</h2>
            <p className="small muted">{copy.governanceSectionDescription}</p>
            <div className="v2-stat-list">
              {copy.governanceCards.map((card) => (
                <div className="v2-stat-row" key={card.href}>
                  <div className="v2-stat-copy">
                    <strong>{card.title}</strong>
                    <p>{card.description}</p>
                  </div>
                  <Link className="btn btn-secondary btn-small" href={card.href}>
                    {card.label}
                  </Link>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
