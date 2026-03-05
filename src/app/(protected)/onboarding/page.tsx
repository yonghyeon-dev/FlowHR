"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

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

const weekdays: Array<{ value: number; label: string }> = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
  { value: 7, label: "일" }
];

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
  const { snapshot, error: sessionError, loading: supabaseSessionLoading } = useSupabaseSession();

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

  const stepTitle = useMemo(() => {
    if (step === 1) {
      return "1단계 · 조직 정보";
    }
    if (step === 2) {
      return "2단계 · 근무 정책";
    }
    return "3단계 · 완료";
  }, [step]);

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

      if (!organizationId || !accessToken) {
        if (active) {
          setLoading(false);
          setLoadError("조직 식별자 또는 로그인 세션을 확인할 수 없습니다.");
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
          throw new Error(payload.error ?? "조직 정보를 불러오지 못했습니다.");
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
        setLoadError(error instanceof Error ? error.message : "조직 정보를 불러오지 못했습니다.");
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
      setSubmitError("1단계 필수 항목을 입력해 주세요.");
      return;
    }
    setSubmitError(null);
    setStep(2);
  }

  async function handleSubmitSetup() {
    if (!organizationId || !accessToken) {
      setSubmitError("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
      return;
    }
    if (!workStartTime.trim() || !workEndTime.trim() || !timezone.trim() || workDays.length === 0) {
      setSubmitError("2단계 필수 항목을 입력해 주세요.");
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
        throw new Error(payload.error ?? "온보딩 저장에 실패했습니다.");
      }

      setStep(3);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "온보딩 저장에 실패했습니다.");
    } finally {
      setSubmitPending(false);
    }
  }

  if (loading) {
    return (
      <main className="saas-content">
        <section className="panel">
          <h1 className="page-title">조직 온보딩 준비 중</h1>
          <p className="small muted">조직 정보를 확인하고 있습니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">조직 온보딩 위자드</h1>
          <p className="page-subtitle">첫 로그인 관리자용 기본 설정입니다. 3단계를 완료하면 관리자 대시보드로 이동합니다.</p>
        </div>
      </header>

      <section className="panel">
        <h2>{stepTitle}</h2>
        <p className="small muted">진행 단계: {step} / 3</p>
        {sessionError ? <p className="small fail">{sessionError}</p> : null}
        {loadError ? <p className="small fail">{loadError}</p> : null}
        {submitError ? <p className="small fail">{submitError}</p> : null}

        {step === 1 ? (
          <>
            <div className="input-grid">
              <label className="full">
                회사명
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="예: 플로우HR"
                />
              </label>
              <label>
                사업자등록번호
                <input
                  value={businessRegistrationNumber}
                  onChange={(event) => setBusinessRegistrationNumber(event.target.value)}
                  placeholder="예: 123-45-67890"
                />
              </label>
              <label>
                업종
                <input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="예: SaaS" />
              </label>
              <label className="full">
                대표자명
                <input
                  value={representativeName}
                  onChange={(event) => setRepresentativeName(event.target.value)}
                  placeholder="예: 홍길동"
                />
              </label>
            </div>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={handleStepOneNext}>
                다음 단계
              </button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="input-grid">
              <label>
                기본 근무 시작
                <input value={workStartTime} onChange={(event) => setWorkStartTime(event.target.value)} placeholder="09:00" />
              </label>
              <label>
                기본 근무 종료
                <input value={workEndTime} onChange={(event) => setWorkEndTime(event.target.value)} placeholder="18:00" />
              </label>
              <label className="full">
                시간대
                <input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Seoul" />
              </label>
            </div>

            <div className="panel-actions">
              <span className="small muted">근무일</span>
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
                이전 단계
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void handleSubmitSetup()} disabled={submitPending}>
                {submitPending ? "저장 중..." : "온보딩 완료"}
              </button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="small ok">조직 기본 설정이 완료되었습니다.</p>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => router.push("/admin")}>
                대시보드로 이동
              </button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
