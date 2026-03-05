"use client";

import { useCallback, useEffect, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

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

const defaultFormState: SettingsFormState = {
  fiscalYearStartMonth: "1",
  standardWorkHoursPerDay: "8",
  standardWorkDaysPerWeek: "5",
  overtimeThresholdHours: "8",
  payPeriod: "MONTHLY",
  timezone: "Asia/Seoul",
  currency: "KRW"
};

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

function parseInteger(value: string, fieldName: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} 값을 확인해 주세요.`);
  }
  return parsed;
}

function parseNumber(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} 값을 확인해 주세요.`);
  }
  return parsed;
}

export default function AdminSettingsPage() {
  const { loading: supabaseSessionLoading } = useSupabaseSession();
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
        label: "조직 설정 조회",
        method: "GET",
        path: "/api/admin/settings",
        runtimeLocale: "ko-KR"
      });

      if (!result.response.ok) {
        throw new Error(toErrorMessage(result.body, "조직 설정을 불러오지 못했습니다."));
      }

      const body = result.body as AdminSettingsDto;
      setForm(mapDtoToForm(body));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        throw new Error("타임존을 입력해 주세요.");
      }
      if (!/^[A-Za-z]{3}$/.test(currency)) {
        throw new Error("통화 코드는 3자리 영문 코드여야 합니다. (예: KRW)");
      }

      const payload = {
        fiscalYearStartMonth: parseInteger(form.fiscalYearStartMonth, "회계연도 시작월"),
        standardWorkHoursPerDay: parseNumber(form.standardWorkHoursPerDay, "표준 근무시간(일)"),
        standardWorkDaysPerWeek: parseInteger(form.standardWorkDaysPerWeek, "표준 근무일수(주)"),
        overtimeThresholdHours: parseNumber(form.overtimeThresholdHours, "초과근무 기준(시간)"),
        payPeriod: form.payPeriod,
        timezone,
        currency
      };

      const result = await performAdminApiCall({
        label: "조직 설정 저장",
        method: "PATCH",
        path: "/api/admin/settings",
        payload,
        runtimeLocale: "ko-KR"
      });

      if (!result.response.ok) {
        throw new Error(toErrorMessage(result.body, "조직 설정 저장에 실패했습니다."));
      }

      const body = result.body as AdminSettingsDto;
      setForm(mapDtoToForm(body));
      setNotice("조직 설정이 저장되었습니다.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  }, [form]);

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">조직 설정 관리자</h1>
          <p className="page-subtitle">회계, 근무, 급여 기준값을 조회하고 저장합니다.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void loadSettings()} disabled={isLoading}>
            {isLoading ? "불러오는 중..." : "다시 불러오기"}
          </button>
        </div>
      </header>

      {error ? <p className="small fail">{error}</p> : null}
      {notice ? <p className="small ok">{notice}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>설정 입력</h2>
          <p className="small muted">아래 항목은 `GET/PATCH /api/admin/settings`와 연결됩니다.</p>

          <div className="input-grid">
            <label>
              회계연도 시작월
              <input
                type="number"
                min={1}
                max={12}
                value={form.fiscalYearStartMonth}
                onChange={(event) => setForm((prev) => ({ ...prev, fiscalYearStartMonth: event.target.value }))}
              />
            </label>

            <label>
              표준 근무시간(일)
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={form.standardWorkHoursPerDay}
                onChange={(event) => setForm((prev) => ({ ...prev, standardWorkHoursPerDay: event.target.value }))}
              />
            </label>

            <label>
              표준 근무일수(주)
              <input
                type="number"
                min={1}
                max={7}
                value={form.standardWorkDaysPerWeek}
                onChange={(event) => setForm((prev) => ({ ...prev, standardWorkDaysPerWeek: event.target.value }))}
              />
            </label>

            <label>
              초과근무 기준(시간)
              <input
                type="number"
                min={0}
                max={168}
                step={0.5}
                value={form.overtimeThresholdHours}
                onChange={(event) => setForm((prev) => ({ ...prev, overtimeThresholdHours: event.target.value }))}
              />
            </label>

            <label>
              급여 주기
              <select
                value={form.payPeriod}
                onChange={(event) => setForm((prev) => ({ ...prev, payPeriod: event.target.value as PayPeriod }))}
              >
                <option value="MONTHLY">월간 (MONTHLY)</option>
                <option value="BIWEEKLY">격주 (BIWEEKLY)</option>
              </select>
            </label>

            <label>
              타임존
              <input
                type="text"
                placeholder="예: Asia/Seoul"
                value={form.timezone}
                onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              />
            </label>

            <label>
              통화 코드
              <input
                type="text"
                placeholder="예: KRW"
                maxLength={3}
                value={form.currency}
                onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
              />
            </label>
          </div>

          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>입력 가이드</h2>
          <ul className="simple-list">
            <li>회계연도 시작월: 1~12 정수</li>
            <li>표준 근무시간(일): 1~24</li>
            <li>표준 근무일수(주): 1~7 정수</li>
            <li>초과근무 기준(시간): 0~168</li>
            <li>급여 주기: 월간 또는 격주</li>
            <li>타임존: 예) Asia/Seoul, Asia/Tokyo</li>
            <li>통화: 3자리 코드 (예: KRW, USD)</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
