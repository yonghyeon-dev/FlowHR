export type AdminDashboardWorkspaceHub = {
  key: string;
  title: string;
  description: string;
  links: {
    href: string;
    label: string;
  }[];
};

export function buildAdminWorkspaceHubs(isKoLocale: boolean): AdminDashboardWorkspaceHub[] {
  if (isKoLocale) {
    return [
      {
        key: "approvals",
        title: "결재/승인",
        description: "결재 대기 건 처리와 실행 현황 확인",
        links: [
          { href: "/admin/approval-executions", label: "결재 실행" },
          { href: "/admin/approval-templates", label: "결재 템플릿" }
        ]
      },
      {
        key: "people",
        title: "인사/온보딩",
        description: "직원, 조직, 온보딩 상태 관리",
        links: [
          { href: "/admin/people", label: "인사 관리" },
          { href: "/admin/onboarding", label: "온보딩" }
        ]
      },
      {
        key: "worktime",
        title: "근무/휴가",
        description: "근무 일정과 휴가 정책/캘린더 운영",
        links: [
          { href: "/admin/scheduling", label: "근무 일정" },
          { href: "/admin/leave-calendar", label: "휴가 캘린더" }
        ]
      },
      {
        key: "payroll",
        title: "급여/연말정산",
        description: "급여 정산, 명세서 배포, 신고 처리",
        links: [
          { href: "/admin/payroll-year-end", label: "연말정산" },
          { href: "/admin/payroll-year-end-filing", label: "신고" }
        ]
      },
      {
        key: "communication",
        title: "공지/복리후생/채용",
        description: "직원 커뮤니케이션과 지원 워크플로 운영",
        links: [
          { href: "/admin/notices", label: "공지" },
          { href: "/admin/benefits", label: "복리후생" },
          { href: "/admin/recruitment", label: "채용" }
        ]
      }
    ];
  }

  return [
    {
      key: "approvals",
      title: "Approvals",
      description: "Handle pending approvals and execution backlog.",
      links: [
        { href: "/admin/approval-executions", label: "Approval executions" },
        { href: "/admin/approval-templates", label: "Approval templates" }
      ]
    },
    {
      key: "people",
      title: "People and onboarding",
      description: "Manage employees, org structure, and onboarding status.",
      links: [
        { href: "/admin/people", label: "People workspace" },
        { href: "/admin/onboarding", label: "Onboarding" }
      ]
    },
    {
      key: "worktime",
      title: "Scheduling and leave",
      description: "Operate schedules and leave policy/calendar flows.",
      links: [
        { href: "/admin/scheduling", label: "Scheduling" },
        { href: "/admin/leave-calendar", label: "Leave calendar" }
      ]
    },
    {
      key: "payroll",
      title: "Payroll and year-end",
      description: "Run payroll settlement, delivery, and filing.",
      links: [
        { href: "/admin/payroll-year-end", label: "Year-end" },
        { href: "/admin/payroll-year-end-filing", label: "Filing" }
      ]
    },
    {
      key: "communication",
      title: "Notices, benefits, recruitment",
      description: "Operate employee communication and support workflows.",
      links: [
        { href: "/admin/notices", label: "Notices" },
        { href: "/admin/benefits", label: "Benefits" },
        { href: "/admin/recruitment", label: "Recruitment" }
      ]
    }
  ];
}
