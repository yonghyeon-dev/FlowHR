"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type Step = 1 | 2 | 3;

type OrganizationPayload = {
  organization?: {
    id: string;
    name: string;
    businessRegistrationNumber: string | null;
    industry: string | null;
    representativeName: string | null;
    workStartTime: string | null;
    workEndTime: string | null;
    workDays: number[];
    timezone: string | null;
    isOnboardingComplete: boolean;
  };
  error?: string;
};

const defaultWorkDays = [1, 2, 3, 4, 5];

function normalizeWorkDays(value: number[] | null | undefined): number[] {
  if (!Array.isArray(value)) {
    return [...defaultWorkDays];
  }
  const deduped = Array.from(new Set(value.filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)));
  if (deduped.length === 0) {
    return [...defaultWorkDays];
  }
  return deduped.sort((a, b) => a - b);
}

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const { snapshot, error: sessionError, loading: supabaseSessionLoading } = useSupabaseSession();
  const isKoLocale = locale === "ko";

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitPending, setSubmitPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [industry, setIndustry] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [workEndTime, setWorkEndTime] = useState("18:00");
  const [workDays, setWorkDays] = useState<number[]>([...defaultWorkDays]);
  const [timezone, setTimezone] = useState("Asia/Seoul");

  const accessToken = snapshot?.accessToken?.trim() ?? "";
  const organizationId = snapshot?.organizationId?.trim() ?? "";
  const role = snapshot?.role?.trim() ?? "";
  const copy = useMemo(() => {
    if (isKoLocale) {
      return {
        stepTitleStepOne: "1단계 · 조직 정보",
        stepTitleStepTwo: "2단계 · 근무 정책",
        stepTitleStepThree: "3단계 · 완료",
        missingOrganizationIdNotice: "세션에서 조직 정보를 확인할 수 없습니다. /login에서 다시 로그인해 주세요.",
        missingLoginSessionNotice: "로그인 세션을 확인할 수 없습니다. /login에서 다시 로그인해 주세요.",
        loadOrganizationFailed: "조직 정보를 불러오지 못했습니다.",
        stepOneRequiredError: "1단계 필수 항목을 입력해 주세요.",
        stepTwoRequiredError: "2단계 필수 항목을 입력해 주세요.",
        onboardingSaveFailed: "온보딩 저장에 실패했습니다.",
        loadingTitle: "조직 온보딩 준비 중",
        loadingSubtitle: "조직 정보를 확인하고 있습니다.",
        pageTitle: "조직 온보딩 위자드",
        pageSubtitle: "첫 로그인 관리자용 기본 설정입니다. 3단계를 완료하면 관리자 허브로 이동합니다.",
        progressLabelPrefix: "진행 단계",
        companyNameLabel: "회사명",
        companyNamePlaceholder: "예: 플로우HR",
        businessRegistrationNumberLabel: "사업자등록번호",
        businessRegistrationNumberPlaceholder: "예: 123-45-67890",
        industryLabel: "업종",
        industryPlaceholder: "예: SaaS",
        representativeNameLabel: "대표자명",
        representativeNamePlaceholder: "예: 홍길동",
        nextStepButtonLabel: "다음 단계",
        workStartTimeLabel: "기본 근무 시작",
        workEndTimeLabel: "기본 근무 종료",
        timezoneLabel: "시간대",
        workDaysLabel: "근무일",
        previousStepButtonLabel: "이전 단계",
        submitPendingLabel: "저장 중...",
        completeOnboardingButtonLabel: "온보딩 완료",
        onboardingCompleteNotice: "조직 기본 설정이 완료되었습니다.",
        moveToDashboardButtonLabel: "허브로 이동"
      };
    }

    return {
      stepTitleStepOne: "Step 1 · Organization Info",
      stepTitleStepTwo: "Step 2 · Work Policy",
      stepTitleStepThree: "Step 3 · Complete",
      missingOrganizationIdNotice: "Organization context is missing in the session. Please sign in again at /login.",
      missingLoginSessionNotice: "Login session is unavailable. Please sign in again at /login.",
      loadOrganizationFailed: "Failed to load organization details.",
      stepOneRequiredError: "Please complete all required fields in step 1.",
      stepTwoRequiredError: "Please complete all required fields in step 2.",
      onboardingSaveFailed: "Failed to save onboarding setup.",
      loadingTitle: "Preparing organization onboarding",
      loadingSubtitle: "Checking organization details.",
      pageTitle: "Organization Onboarding Wizard",
      pageSubtitle: "Initial setup for first-time admins. Complete all 3 steps to continue to the admin hub.",
      progressLabelPrefix: "Progress",
      companyNameLabel: "Company name",
      companyNamePlaceholder: "e.g. FlowHR",
      businessRegistrationNumberLabel: "Business registration number",
      businessRegistrationNumberPlaceholder: "e.g. 123-45-67890",
      industryLabel: "Industry",
      industryPlaceholder: "e.g. SaaS",
      representativeNameLabel: "Representative name",
      representativeNamePlaceholder: "e.g. Jane Doe",
      nextStepButtonLabel: "Next step",
      workStartTimeLabel: "Default start time",
      workEndTimeLabel: "Default end time",
      timezoneLabel: "Timezone",
      workDaysLabel: "Work days",
      previousStepButtonLabel: "Previous step",
      submitPendingLabel: "Saving...",
      completeOnboardingButtonLabel: "Complete onboarding",
      onboardingCompleteNotice: "Organization setup is complete.",
      moveToDashboardButtonLabel: "Go to admin hub"
    };
  }, [isKoLocale]);
  const weekdays = useMemo<Array<{ value: number; label: string }>>(() => {
    if (isKoLocale) {
      return [
        { value: 1, label: "월" },
        { value: 2, label: "화" },
        { value: 3, label: "수" },
        { value: 4, label: "목" },
        { value: 5, label: "금" },
        { value: 6, label: "토" },
        { value: 7, label: "일" }
      ];
    }
    return [
      { value: 1, label: "Mon" },
      { value: 2, label: "Tue" },
      { value: 3, label: "Wed" },
      { value: 4, label: "Thu" },
      { value: 5, label: "Fri" },
      { value: 6, label: "Sat" },
      { value: 7, label: "Sun" }
    ];
  }, [isKoLocale]);

  const stepTitle = useMemo(() => {
    if (step === 1) {
      return copy.stepTitleStepOne;
    }
    if (step === 2) {
      return copy.stepTitleStepTwo;
    }
    return copy.stepTitleStepThree;
  }, [copy, step]);

  useEffect(() => {
    if (supabaseSessionLoading) {
      return;
    }

    let active = true;

    async function loadOrganization() {
      if (!snapshot) {
        return;
      }

      if (role !== "admin") {
        router.replace("/employee");
        return;
      }

      if (!organizationId) {
        if (active) {
          setLoading(false);
          setLoadError(copy.missingOrganizationIdNotice);
        }
        return;
      }

      if (!accessToken) {
        if (active) {
          setLoading(false);
          setLoadError(copy.missingLoginSessionNotice);
        }
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch(`/api/people/organizations/${encodeURIComponent(organizationId)}`, {
          method: "GET",
          headers: {
            authorization: `Bearer ${accessToken}`
          },
          cache: "no-store"
        });

        const payload = (await response.json()) as OrganizationPayload;
        if (!response.ok || !payload.organization) {
          throw new Error(payload.error ?? copy.loadOrganizationFailed);
        }

        if (payload.organization.isOnboardingComplete) {
          router.replace("/admin");
          return;
        }

        if (!active) {
          return;
        }

        setCompanyName(payload.organization.name ?? "");
        setBusinessRegistrationNumber(payload.organization.businessRegistrationNumber ?? "");
        setIndustry(payload.organization.industry ?? "");
        setRepresentativeName(payload.organization.representativeName ?? "");
        setWorkStartTime(payload.organization.workStartTime ?? "09:00");
        setWorkEndTime(payload.organization.workEndTime ?? "18:00");
        setWorkDays(normalizeWorkDays(payload.organization.workDays));
        setTimezone(payload.organization.timezone ?? "Asia/Seoul");
      } catch (error) {
        if (!active) {
          return;
        }
        setLoadError(error instanceof Error ? error.message : copy.loadOrganizationFailed);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrganization();

    return () => {
      active = false;
    };
  }, [accessToken, organizationId, role, router, snapshot, supabaseSessionLoading]);

  function toggleWorkDay(day: number) {
    setWorkDays((prev) => {
      const hasDay = prev.includes(day);
      if (hasDay) {
        const next = prev.filter((value) => value !== day);
        return next.length > 0 ? next : prev;
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  }

  function handleStepOneNext() {
    if (!companyName.trim() || !businessRegistrationNumber.trim() || !industry.trim() || !representativeName.trim()) {
      setSubmitError(copy.stepOneRequiredError);
      return;
    }
    setSubmitError(null);
    setStep(2);
  }

  async function handleSubmitSetup() {
    if (!organizationId) {
      setSubmitError(copy.missingOrganizationIdNotice);
      return;
    }

    if (!accessToken) {
      setSubmitError(copy.missingLoginSessionNotice);
      return;
    }
    if (!workStartTime.trim() || !workEndTime.trim() || !timezone.trim() || workDays.length === 0) {
      setSubmitError(copy.stepTwoRequiredError);
      return;
    }

    setSubmitPending(true);
    setSubmitError(null);
    try {
      const response = await fetch(`/api/organizations/${encodeURIComponent(organizationId)}/setup`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: companyName.trim(),
          businessRegistrationNumber: businessRegistrationNumber.trim(),
          industry: industry.trim(),
          representativeName: representativeName.trim(),
          workStartTime: workStartTime.trim(),
          workEndTime: workEndTime.trim(),
          workDays,
          timezone: timezone.trim()
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? copy.onboardingSaveFailed);
      }

      setStep(3);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : copy.onboardingSaveFailed);
    } finally {
      setSubmitPending(false);
    }
  }

  if (supabaseSessionLoading) {
    return null;
  }

  if (loading) {
    return (
      <main className="saas-content">
        <section className="panel">
          <h1 className="page-title">{copy.loadingTitle}</h1>
          <p className="small muted">{copy.loadingSubtitle}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
      </header>

      <section className="panel">
        <h2>{stepTitle}</h2>
        <p className="small muted">
          {copy.progressLabelPrefix}: {step} / 3
        </p>
        {sessionError ? <p className="small fail">{sessionError}</p> : null}
        {loadError ? <p className="small fail">{loadError}</p> : null}
        {submitError ? <p className="small fail">{submitError}</p> : null}

        {step === 1 ? (
          <>
            <div className="input-grid">
              <label className="full">
                {copy.companyNameLabel}
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder={copy.companyNamePlaceholder}
                />
              </label>
              <label>
                {copy.businessRegistrationNumberLabel}
                <input
                  value={businessRegistrationNumber}
                  onChange={(event) => setBusinessRegistrationNumber(event.target.value)}
                  placeholder={copy.businessRegistrationNumberPlaceholder}
                />
              </label>
              <label>
                {copy.industryLabel}
                <input
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder={copy.industryPlaceholder}
                />
              </label>
              <label className="full">
                {copy.representativeNameLabel}
                <input
                  value={representativeName}
                  onChange={(event) => setRepresentativeName(event.target.value)}
                  placeholder={copy.representativeNamePlaceholder}
                />
              </label>
            </div>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={handleStepOneNext}>
                {copy.nextStepButtonLabel}
              </button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="input-grid">
              <label>
                {copy.workStartTimeLabel}
                <input
                  value={workStartTime}
                  onChange={(event) => setWorkStartTime(event.target.value)}
                  placeholder="09:00"
                />
              </label>
              <label>
                {copy.workEndTimeLabel}
                <input
                  value={workEndTime}
                  onChange={(event) => setWorkEndTime(event.target.value)}
                  placeholder="18:00"
                />
              </label>
              <label className="full">
                {copy.timezoneLabel}
                <input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Seoul" />
              </label>
            </div>

            <div className="panel-actions">
              <span className="small muted">{copy.workDaysLabel}</span>
              <div className="actions">
                {weekdays.map((day) => (
                  <label key={day.value} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={workDays.includes(day.value)}
                      onChange={() => toggleWorkDay(day.value)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} disabled={submitPending}>
                {copy.previousStepButtonLabel}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void handleSubmitSetup()} disabled={submitPending}>
                {submitPending ? copy.submitPendingLabel : copy.completeOnboardingButtonLabel}
              </button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="small ok">{copy.onboardingCompleteNotice}</p>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => router.push("/admin")}>
                {copy.moveToDashboardButtonLabel}
              </button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
