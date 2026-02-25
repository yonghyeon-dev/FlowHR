"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

const copy = {
  ko: {
    title: "복리후생",
    subtitle: "직원 복리후생 신청/조회 기본 화면입니다.",
    baseline: "현재 상태",
    baselineBody: "직원 복리후생 영역 착수 완료. 다음 WI에서 신청서/상태 추적 UX를 연결합니다.",
    actions: {
      backEmployee: "직원 포털",
      openAdmin: "관리자"
    }
  },
  en: {
    title: "Benefits",
    subtitle: "Baseline screen for employee benefits request and lookup.",
    baseline: "Current Status",
    baselineBody: "Employee benefits domain kickoff is complete. Next WI will connect request form and status tracking UX.",
    actions: {
      backEmployee: "Employee Portal",
      openAdmin: "Admin"
    }
  }
} as const;

export default function EmployeeBenefitsPage() {
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

      <section id="employee-benefits-baseline" className="panel">
        <h2>{pageCopy.baseline}</h2>
        <p className="small">{pageCopy.baselineBody}</p>
      </section>
    </main>
  );
}
