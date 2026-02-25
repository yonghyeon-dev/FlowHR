"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

const copy = {
  ko: {
    title: "복리후생 워크스페이스",
    subtitle: "복리후생 정책/신청 영역의 기본 라우트입니다.",
    baseline: "현재 상태",
    baselineBody: "복리후생 영역 착수 완료. 다음 WI에서 항목 정의와 신청 처리 UX를 연결합니다.",
    actions: {
      backAdmin: "관리자 대시보드",
      openEmployee: "직원 포털"
    }
  },
  en: {
    title: "Benefits Workspace",
    subtitle: "Baseline route for benefits policy and request surfaces.",
    baseline: "Current Status",
    baselineBody: "Benefits domain kickoff is complete. Next WI will connect benefit catalog and request handling UX.",
    actions: {
      backAdmin: "Admin Dashboard",
      openEmployee: "Employee Portal"
    }
  }
} as const;

export default function AdminBenefitsPage() {
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

      <section id="benefits-baseline" className="panel">
        <h2>{pageCopy.baseline}</h2>
        <p className="small">{pageCopy.baselineBody}</p>
      </section>
    </main>
  );
}
