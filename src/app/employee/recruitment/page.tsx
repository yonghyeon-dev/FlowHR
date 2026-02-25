"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

const copy = {
  ko: {
    title: "채용",
    subtitle: "직원 추천/채용 현황 baseline 화면입니다.",
    baseline: "현재 상태",
    baselineBody: "직원 채용 영역 착수 완료. 다음 WI에서 추천 등록과 진행 상태 흐름을 연결합니다.",
    actions: {
      backEmployee: "직원 포털",
      openAdmin: "관리자"
    }
  },
  en: {
    title: "Recruitment",
    subtitle: "Baseline screen for employee referral and hiring status.",
    baseline: "Current Status",
    baselineBody: "Employee recruitment domain kickoff is complete. Next WI will connect referral create and progress flows.",
    actions: {
      backEmployee: "Employee Portal",
      openAdmin: "Admin"
    }
  }
} as const;

export default function EmployeeRecruitmentPage() {
  const { locale } = useI18n();
  const pageCopy = locale === "ko" ? copy.ko : copy.en;

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{pageCopy.title}</h1>
          <p className="page-subtitle">{pageCopy.subtitle}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            {pageCopy.actions.backEmployee}
          </Link>
          <Link className="btn btn-secondary" href="/admin">
            {pageCopy.actions.openAdmin}
          </Link>
        </div>
      </header>

      <section id="employee-recruitment-baseline" className="panel">
        <h2>{pageCopy.baseline}</h2>
        <p className="small">{pageCopy.baselineBody}</p>
      </section>
    </main>
  );
}
