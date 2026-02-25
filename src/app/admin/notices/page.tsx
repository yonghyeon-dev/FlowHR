"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

const copy = {
  ko: {
    title: "공지사항 워크스페이스",
    subtitle: "관리자 공지 작성과 게시 이력을 한 화면에서 시작하는 기본 화면입니다.",
    baseline: "현재 상태",
    baselineBody: "공지 도메인 착수 완료. 다음 WI에서 작성/예약/대상 선택 흐름을 확장합니다.",
    actions: {
      backAdmin: "관리자 대시보드",
      openEmployee: "직원 포털"
    }
  },
  en: {
    title: "Notice Workspace",
    subtitle: "Baseline for starting admin notice authoring and publication history in one screen.",
    baseline: "Current Status",
    baselineBody: "Notice domain kickoff is complete. Next WI will extend compose/schedule/audience flows.",
    actions: {
      backAdmin: "Admin Dashboard",
      openEmployee: "Employee Portal"
    }
  }
} as const;

export default function AdminNoticesPage() {
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

      <section id="notice-baseline" className="panel">
        <h2>{pageCopy.baseline}</h2>
        <p className="small">{pageCopy.baselineBody}</p>
      </section>
    </main>
  );
}
