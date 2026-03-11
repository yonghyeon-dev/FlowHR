import { type FlowLocale } from "@/lib/i18n/locales";

export type EmployeeGuideActionLink = {
  key: "profile" | "attendance" | "leave" | "payslip" | "receipt";
  label: string;
  href: string;
  description: string;
  ctaLabel: string;
  supportLabel: string;
};

export type EmployeeGuideCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  heroMetaLabel: string;
  sourceHint: string;
  productionWarning: string;
  loginCta: string;
  backToHomeLabel: string;
  requestsHubLabel: string;
  nextActionTitle: string;
  nextActionEmptyTitle: string;
  nextActionEmptyDescription: string;
  contextTitle: string;
  organizationIdLabel: string;
  employeeIdLabel: string;
  accessTokenLabel: string;
  loadButton: string;
  loadingLabel: string;
  progressLabel: string;
  journeyTitle: string;
  journeySteps: string[];
  quickActionsTitle: string;
  quickActions: EmployeeGuideActionLink[];
  checklistTitle: string;
  checklist: {
    profile: string;
    attendance: string;
    leave: string;
    payslip: string;
  };
  summaryTitle: string;
  summary: {
    attendance: string;
    leave: string;
    payslip: string;
  };
  logsTitle: string;
  logsEmpty: string;
  doneLabel: string;
  todoLabel: string;
  okLabel: string;
  failLabel: string;
  requestLabels: {
    attendanceRecords: string;
    leaveRequests: string;
    confirmedPayslips: string;
  };
};

const defaultCopy: EmployeeGuideCopy = {
  heroEyebrow: "FlowHR Employee",
  title: "Employee Guide",
  description:
    "Use the shortest route into attendance corrections, leave requests, and payroll documents.",
  heroMetaLabel: "Route-first guide",
  sourceHint:
    "This guide keeps first-run employee work focused on route-first workspaces instead of hidden home sections.",
  productionWarning:
    "Production runtime requires a bearer-token login session before API requests can load.",
  loginCta: "Open login",
  backToHomeLabel: "Employee home",
  requestsHubLabel: "Requests hub",
  nextActionTitle: "Recommended next action",
  nextActionEmptyTitle: "Guide baseline completed",
  nextActionEmptyDescription:
    "The first-run checklist is complete. Continue from the requests hub or open payroll documents directly.",
  contextTitle: "Current guide status",
  organizationIdLabel: "Organization",
  employeeIdLabel: "Signed-in employee number",
  accessTokenLabel: "Connection token",
  loadButton: "Refresh guide status",
  loadingLabel: "Loading guide status...",
  progressLabel: "Guide progress",
  journeyTitle: "Recommended first path",
  journeySteps: [
    "Verify that your employee account context is ready.",
    "Open the attendance correction workspace and review one request path.",
    "Move into leave request work and check request status.",
    "Open payslips and receipt documents to confirm the latest payroll trail."
  ],
  quickActionsTitle: "Start a task now",
  quickActions: [
    {
      key: "profile",
      label: "Profile and account",
      href: "/employee/profile",
      description: "Confirm account basics before moving into self-service work.",
      ctaLabel: "Open profile",
      supportLabel: "Account check"
    },
    {
      key: "attendance",
      label: "Attendance correction",
      href: "/employee/attendance/correction?source=employee-guide",
      description: "Review attendance records and open a correction request.",
      ctaLabel: "Open attendance",
      supportLabel: "Attendance"
    },
    {
      key: "leave",
      label: "Leave request",
      href: "/employee/leave/request?source=employee-guide",
      description: "Draft a leave request and follow its approval state.",
      ctaLabel: "Open leave",
      supportLabel: "Leave"
    },
    {
      key: "payslip",
      label: "Payslips",
      href: "/employee/payslips",
      description: "Review confirmed payroll documents and monthly changes.",
      ctaLabel: "Open payslips",
      supportLabel: "Payroll"
    },
    {
      key: "receipt",
      label: "Receipt confirmations",
      href: "/employee/payslip-receipts",
      description: "Check whether recent payroll receipts were acknowledged.",
      ctaLabel: "Open receipts",
      supportLabel: "Documents"
    }
  ],
  checklistTitle: "Onboarding checklist",
  checklist: {
    profile: "Employee account context is ready",
    attendance: "At least one attendance record exists in the last 14 days",
    leave: "At least one leave request exists in the last 14 days",
    payslip: "At least one confirmed payslip exists in the last 14 days"
  },
  summaryTitle: "Recent activity summary",
  summary: {
    attendance: "Attendance records",
    leave: "Leave requests",
    payslip: "Confirmed payslips"
  },
  logsTitle: "Guide request logs",
  logsEmpty: "No guide requests have been recorded yet.",
  doneLabel: "DONE",
  todoLabel: "TODO",
  okLabel: "OK",
  failLabel: "FAIL",
  requestLabels: {
    attendanceRecords: "attendance records",
    leaveRequests: "leave requests",
    confirmedPayslips: "confirmed payslips"
  }
};

export const employeeGuideCopyByLocale: Record<FlowLocale, EmployeeGuideCopy> = {
  ko: {
    ...defaultCopy,
    heroEyebrow: "FlowHR \uC9C1\uC6D0",
    title: "\uC9C1\uC6D0 \uC774\uC6A9 \uAC00\uC774\uB4DC",
    description:
      "\uCCAB \uB85C\uADF8\uC778 \uC774\uD6C4 \uAC00\uC7A5 \uC790\uC8FC \uC4F0\uB294 \uADFC\uD0DC, \uD734\uAC00, \uAE09\uC5EC \uBB38\uC11C \uC791\uC5C5\uC744 \uD55C \uBC88\uC5D0 \uC775\uD790 \uC218 \uC788\uB3C4\uB85D \uC815\uB9AC\uD55C \uC548\uB0B4 \uD654\uBA74\uC785\uB2C8\uB2E4.",
    heroMetaLabel: "route-first \uC548\uB0B4",
    sourceHint:
      "\uC228\uACA8\uC9C4 \uD648 \uC139\uC158 \uB300\uC2E0, \uC2E4\uC81C \uC5C5\uBB34\uAC00 \uC5F4\uB9AC\uB294 route-first \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4\uB85C \uBC14\uB85C \uC774\uB3D9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    productionWarning:
      "\uC6B4\uC601 \uD658\uACBD\uC5D0\uC11C \uAC00\uC774\uB4DC \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB824\uBA74 \uB85C\uADF8\uC778 \uC138\uC158\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    loginCta: "\uB85C\uADF8\uC778\uC73C\uB85C \uC774\uB3D9",
    backToHomeLabel: "\uC9C1\uC6D0 \uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30",
    requestsHubLabel: "\uC694\uCCAD \uD5C8\uBE0C \uC5F4\uAE30",
    nextActionTitle: "\uB2E4\uC74C \uCD94\uCC9C \uC791\uC5C5",
    nextActionEmptyTitle: "\uAC00\uC774\uB4DC \uAE30\uBCF8 \uC900\uBE44 \uC644\uB8CC",
    nextActionEmptyDescription:
      "\uCCAB \uC774\uC6A9 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8\uB97C \uBAA8\uB450 \uB9C8\uCE5C \uC0C1\uD0DC\uC785\uB2C8\uB2E4. \uC694\uCCAD \uD5C8\uBE0C\uB97C \uC5F4\uAC70\uB098 \uAE09\uC5EC \uBB38\uC11C\uB97C \uBC14\uB85C \uD655\uC778\uD558\uC138\uC694.",
    contextTitle: "\uD604\uC7AC \uAC00\uC774\uB4DC \uC0C1\uD0DC",
    organizationIdLabel: "\uC18C\uC18D \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4",
    employeeIdLabel: "\uB85C\uADF8\uC778\uB41C \uC9C1\uC6D0 \uBC88\uD638",
    accessTokenLabel: "\uC5F0\uACB0 \uC138\uC158",
    loadButton: "\uAC00\uC774\uB4DC \uC0C1\uD0DC \uC0C8\uB85C\uACE0\uCE68",
    loadingLabel: "\uAC00\uC774\uB4DC \uC0C1\uD0DC\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4...",
    progressLabel: "\uAC00\uC774\uB4DC \uC9C4\uD589\uB960",
    journeyTitle: "\uAD8C\uC7A5 \uC2DC\uC791 \uC21C\uC11C",
    journeySteps: [
      "\uACC4\uC815\uACFC \uC9C1\uC6D0 \uBC88\uD638\uAC00 \uC62C\uBC14\uB978\uC9C0 \uBA3C\uC800 \uD655\uC778\uD569\uB2C8\uB2E4.",
      "\uADFC\uD0DC \uC815\uC815 \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4\uB97C \uC5F4\uC5B4 \uC2B9\uC778 \uD750\uB984\uC744 \uD55C \uBC88 \uC0B4\uD3B4\uBD05\uB2C8\uB2E4.",
      "\uD734\uAC00 \uC694\uCCAD \uC791\uC5C5\uC73C\uB85C \uC774\uB3D9\uD574 \uC791\uC131\uACFC \uC0C1\uD0DC \uD655\uC778 \uD750\uB984\uC744 \uC775\uD799\uB2C8\uB2E4.",
      "\uAE09\uC5EC \uBA85\uC138\uC11C\uC640 \uC218\uC2E0 \uD655\uC778 \uBB38\uC11C\uB97C \uC5F4\uC5B4 \uCD5C\uADFC \uAE09\uC5EC \uC774\uB825\uC744 \uD655\uC778\uD569\uB2C8\uB2E4."
    ],
    quickActionsTitle: "\uBC14\uB85C \uC2DC\uC791\uD560 \uC791\uC5C5",
    quickActions: [
      {
        key: "profile",
        label: "\uD504\uB85C\uD544\uACFC \uACC4\uC815",
        href: "/employee/profile",
        description: "\uC790\uAE30 \uACC4\uC815 \uAE30\uBCF8 \uC815\uBCF4\uB97C \uBA3C\uC800 \uD655\uC778\uD558\uACE0 \uC790\uAC00 \uC5C5\uBB34 \uC791\uC5C5\uC73C\uB85C \uC774\uC5B4\uAC11\uB2C8\uB2E4.",
        ctaLabel: "\uD504\uB85C\uD544 \uC5F4\uAE30",
        supportLabel: "\uACC4\uC815 \uD655\uC778"
      },
      {
        key: "attendance",
        label: "\uADFC\uD0DC \uC815\uC815",
        href: "/employee/attendance/correction?source=employee-guide",
        description: "\uCD9C\uD1F4\uADFC \uAE30\uB85D\uC744 \uD655\uC778\uD558\uACE0 \uC815\uC815 \uC694\uCCAD \uD654\uBA74\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.",
        ctaLabel: "\uADFC\uD0DC \uC815\uC815 \uC5F4\uAE30",
        supportLabel: "\uADFC\uD0DC"
      },
      {
        key: "leave",
        label: "\uD734\uAC00 \uC694\uCCAD",
        href: "/employee/leave/request?source=employee-guide",
        description: "\uD734\uAC00 \uC694\uCCAD\uC744 \uC791\uC131\uD558\uACE0 \uC2B9\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD569\uB2C8\uB2E4.",
        ctaLabel: "\uD734\uAC00 \uC694\uCCAD \uC5F4\uAE30",
        supportLabel: "\uD734\uAC00"
      },
      {
        key: "payslip",
        label: "\uAE09\uC5EC \uBA85\uC138\uC11C",
        href: "/employee/payslips",
        description: "\uD655\uC815\uB41C \uAE09\uC5EC \uBA85\uC138\uC640 \uC804\uC6D4 \uBE44\uAD50 \uC815\uBCF4\uB97C \uD655\uC778\uD569\uB2C8\uB2E4.",
        ctaLabel: "\uAE09\uC5EC \uBA85\uC138 \uC5F4\uAE30",
        supportLabel: "\uAE09\uC5EC"
      },
      {
        key: "receipt",
        label: "\uC218\uC2E0 \uD655\uC778",
        href: "/employee/payslip-receipts",
        description: "\uBA85\uC138\uC11C \uC218\uC2E0 \uD655\uC778 \uC0C1\uD0DC\uC640 \uCD5C\uADFC \uBB38\uC11C \uC774\uB825\uC744 \uC810\uAC80\uD569\uB2C8\uB2E4.",
        ctaLabel: "\uC218\uC2E0 \uD655\uC778 \uC5F4\uAE30",
        supportLabel: "\uBB38\uC11C"
      }
    ],
    checklistTitle: "\uC628\uBCF4\uB529 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8",
    checklist: {
      profile: "\uD504\uB85C\uD544\uACFC \uACC4\uC815 \uB9E5\uB77D \uD655\uC778",
      attendance: "\uCD5C\uADFC 14\uC77C \uB0B4 \uADFC\uD0DC \uAE30\uB85D 1\uAC74 \uC774\uC0C1",
      leave: "\uCD5C\uADFC 14\uC77C \uB0B4 \uD734\uAC00 \uC694\uCCAD 1\uAC74 \uC774\uC0C1",
      payslip: "\uCD5C\uADFC 14\uC77C \uB0B4 \uD655\uC815 \uBA85\uC138\uC11C 1\uAC74 \uC774\uC0C1"
    },
    summaryTitle: "\uCD5C\uADFC \uC791\uC5C5 \uC694\uC57D",
    summary: {
      attendance: "\uADFC\uD0DC \uAE30\uB85D",
      leave: "\uD734\uAC00 \uC694\uCCAD",
      payslip: "\uD655\uC815 \uBA85\uC138\uC11C"
    },
    logsTitle: "\uAC00\uC774\uB4DC \uC694\uCCAD \uB85C\uADF8",
    logsEmpty: "\uC544\uC9C1 \uAE30\uB85D\uB41C \uAC00\uC774\uB4DC \uC694\uCCAD \uB85C\uADF8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    doneLabel: "\uC644\uB8CC",
    todoLabel: "\uC9C4\uD589 \uD544\uC694",
    okLabel: "\uC131\uACF5",
    failLabel: "\uC2E4\uD328",
    requestLabels: {
      attendanceRecords: "\uADFC\uD0DC \uAE30\uB85D \uC870\uD68C",
      leaveRequests: "\uD734\uAC00 \uC694\uCCAD \uC870\uD68C",
      confirmedPayslips: "\uD655\uC815 \uBA85\uC138\uC11C \uC870\uD68C"
    }
  },
  en: defaultCopy
};
