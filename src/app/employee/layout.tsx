import Link from "next/link";
import type { ReactNode } from "react";

import SessionMenu from "@/components/SessionMenu";

type EmployeeLayoutProps = {
  children: ReactNode;
};

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const showDevTools = isDevToolsEnabled();

  return (
    <div className="saas-shell">
      <aside className="saas-sidebar">
        <div className="saas-brand">
          <Link href="/">FlowHR</Link>
          <span className="saas-badge">Employee</span>
        </div>

        <nav className="saas-nav" aria-label="Employee navigation">
          <Link href="/employee">Overview</Link>
          <Link href="/employee#self-service-overview">Self-Service Summary</Link>
          <Link href="/employee#submit-checklist">Submit Checklist</Link>
          <Link href="/employee#request-feedback">Request Feedback</Link>
          <Link href="/employee#request-search-sort">Request Search/Sort</Link>
          <Link href="/employee#request-bottleneck-feedback">Bottleneck Feedback</Link>
          <Link href="/employee#request-wait-prediction">Wait Prediction</Link>
          <Link href="/employee#mobile-shortcuts">Mobile Shortcuts</Link>
          <Link href="/employee#mobile-status-badges">Mobile Status Badges</Link>
          <Link href="/employee#mobile-submit-guide">Mobile Submit Guide</Link>
          <Link href="/employee#mobile-follow-up-guide">Mobile Follow-up Guide</Link>
          <Link href="/employee#request-timeline">Request Timeline</Link>
          <Link href="/employee#request-resubmit">Resubmit Flow</Link>
          <Link href="/employee#attendance">Attendance</Link>
          <Link href="/employee#leave">Leave</Link>
          <Link href="/employee#leave-calendar">Leave Calendar</Link>
          <Link href="/employee#schedule">Schedule</Link>
          <Link href="/employee/payslips">Payslips</Link>
          <Link href="/employee/payslips#payslip-search-sort">Payslip Search/Sort</Link>
          <Link href="/employee/payslips#status-feedback">Payslip Status Feedback</Link>
          <Link href="/employee/payslips#compare-view">Payslip Compare</Link>
          <Link href="/employee/payslips#payslip-confirmation-prediction">Payout Confirmation Prediction</Link>
          <Link href="/employee/payslips#mobile-delivery">Payslip Mobile Delivery</Link>
          <Link href="/employee/payslips#payslip-mobile-follow-up-guide">Payslip Mobile Follow-up</Link>
          <Link className="muted-link" href="/employee#account">
            My Account
          </Link>
        </nav>

        <div className="saas-sidebar-footer">
          <SessionMenu />
          {showDevTools ? <Link href="/admin">Admin</Link> : null}
        </div>
      </aside>

      <div className="saas-main">{children}</div>
    </div>
  );
}
