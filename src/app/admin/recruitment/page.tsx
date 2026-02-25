"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

const copy = {
  ko: {
    title: "채용 워크스페이스",
    subtitle: "채용 파이프라인 확장을 위한 기본 라우트입니다.",
    baseline: "현재 상태",
    baselineBody: "채용 영역 착수 완료. 다음 WI에서 채용 포지션/후보자 단계 흐름을 추가합니다.",
    actions: {
      backAdmin: "관리자 대시보드",
      openEmployee: "직원 포털"
    }
  },
  en: {
    title: "Recruitment Workspace",
    subtitle: "Baseline route for expanding recruitment pipeline features.",
    baseline: "Current Status",
    baselineBody: "Recruitment domain kickoff is complete. Next WI will add role and candidate stage flows.",
    actions: {
      backAdmin: "Admin Dashboard",
      openEmployee: "Employee Portal"
    }
  }
} as const;

export default function AdminRecruitmentPage() {
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
          <Link className="btn btn-secondary" href="/admin">
            {pageCopy.actions.backAdmin}
          </Link>
          <Link className="btn btn-secondary" href="/employee">
            {pageCopy.actions.openEmployee}
          </Link>
        </div>
      </header>

      <section id="recruitment-baseline" className="panel">
        <h2>{pageCopy.baseline}</h2>
        <p className="small">{pageCopy.baselineBody}</p>
      </section>
    </main>
  );
}
