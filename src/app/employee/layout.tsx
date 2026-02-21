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
          <Link href="/employee#account">Account</Link>
          <Link href="/employee#self-service-overview">Self-Service Overview</Link>
          <Link href="/employee#submit-checklist">Submit Checklist</Link>
          <Link href="/employee#request-feedback">Request Feedback</Link>
          <Link href="/employee#request-search-sort">Request Search/Sort</Link>
          <Link href="/employee#request-timeline">Request Timeline</Link>
          <Link href="/employee#request-resubmit">Request Resubmit</Link>
          <Link href="/employee#attendance">Attendance</Link>
          <Link href="/employee#leave">Leave</Link>
          <Link href="/employee#leave-calendar">Leave Calendar</Link>
          <Link href="/employee#schedule">Schedule</Link>
          <Link href="/employee/payslips">Payslips</Link>
          <Link href="/employee/payslips#payslip-search-sort">Payslip Search/Sort</Link>
          <Link href="/employee/payslips#payslip-history-sort-accuracy">Payslip Sort Accuracy</Link>
          <Link href="/employee/payslips#payslip-history-sort-hardening">Payslip Sort Hardening</Link>
          <Link href="/employee/payslips#payslip-history-sort-hardening-plus">Payslip Sort Hardening+</Link>
          <Link href="/employee/payslips#payslip-history-sort-hardening-plus-execution">
            Payslip Sort Hardening+ Execution
          </Link>
          <Link href="/employee/payslips#payslip-history-sort-execution-summary">Payslip Execution Summary</Link>
          <Link href="/employee/payslips#payslip-history-execution-summary-digest">Payslip Execution Summary Digest</Link>
          <Link href="/employee/payslips#status-feedback">Payslip Status Feedback</Link>
          <Link href="/employee/payslips#compare-view">Payslip Compare</Link>
          <Link href="/employee/payslips#payslip-confirmation-prediction">Payout Confirmation Prediction</Link>
          <Link href="/employee/payslips#payslip-delay-risk-prediction">Payout Delay Risk Prediction</Link>
          <Link href="/employee/payslips#payslip-delay-risk-response">Payout Delay Risk Response</Link>
          <Link href="/employee/payslips#payslip-delay-risk-response-execution-guide">
            Payout Response Execution Guide
          </Link>
          <Link href="/employee/payslips#payslip-delay-risk-response-execution-tracker">
            Payout Response Execution Tracker
          </Link>
          <Link href="/employee/payslips#payslip-delay-risk-execution-backlog">Payout Execution Backlog</Link>
          <Link href="/employee/payslips#payslip-delay-execution-backlog-digest">Payout Backlog Digest</Link>
          <Link href="/employee/payslips#mobile-delivery">Payslip Mobile Delivery</Link>
          <Link href="/employee/payslips#payslip-mobile-follow-up-guide">Payslip Mobile Follow-up</Link>
          <Link href="/employee/payslips#payslip-mobile-follow-up-recommendation">
            Payslip Mobile Recommendation
          </Link>
          <Link href="/employee/payslips#payslip-mobile-follow-up-recommendation-upgrade">
            Payslip Recommendation Upgrade
          </Link>
          <Link href="/employee/payslips#payslip-mobile-follow-up-recommendation-upgrade-2">
            Payslip Recommendation Upgrade 2
          </Link>
          <Link href="/employee/payslips#payslip-mobile-follow-up-recommendation-upgrade-3">
            Payslip Recommendation Upgrade 3
          </Link>
          <Link href="/employee/payslips#payslip-mobile-follow-up-recommendation-upgrade-4">
            Payslip Recommendation Upgrade 4
          </Link>
          <Link href="/employee/payslips#payslip-mobile-follow-up-recommendation-upgrade-5">
            Payslip Recommendation Upgrade 5
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
