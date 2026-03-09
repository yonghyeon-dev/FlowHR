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
        title: "결재/확인",
        description: "결재 대기 건 처리와 실행 현황을 확인합니다.",
        links: [
          { href: "/admin/approval-executions", label: "결재 실행" },
          { href: "/admin/approval-templates", label: "결재 템플릿" }
        ]
      },
      {
        key: "people",
        title: "인사/온보딩",
        description: "직원, 조직, 온보딩 상태를 관리합니다.",
        links: [
          { href: "/admin/people", label: "인사 관리" },
          { href: "/admin/onboarding", label: "온보딩" }
        ]
      },
      {
        key: "worktime",
        title: "근무/휴가",
        description: "근무 일정과 휴가 정책, 휴가 캘린더를 운영합니다.",
        links: [
          { href: "/admin/scheduling", label: "근무 일정" },
          { href: "/admin/leave-policies", label: "휴가 정책" },
          { href: "/admin/attendance-security", label: "출퇴근 보안" },
          { href: "/admin/leave-calendar", label: "휴가 캘린더" }
        ]
      },
      {
        key: "payroll",
        title: "급여/연말정산",
        description: "급여 정산, 명세서 배포, 연말정산 신고를 처리합니다.",
        links: [
          { href: "/admin/payroll-year-end", label: "연말정산" },
          { href: "/admin/payroll-year-end-filing", label: "신고" }
        ]
      },
      {
        key: "communication",
        title: "공지/복리후생/채용/계약",
        description: "직원 커뮤니케이션과 지원 워크플로, 계약 위험 큐를 운영합니다.",
        links: [
          { href: "/admin/operator-alerts", label: "운영 알림 연동" },
          { href: "/admin/notification-defaults", label: "알림 기본값" },
          {
            href: "/admin/notices?status=PUBLISHED&risk=no-read&source=admin-dashboard",
            label: "공지 미확인 위험"
          },
          {
            href: "/admin/benefits?status=SUBMITTED&risk=pending_3d&source=admin-dashboard",
            label: "복리후생 장기 대기"
          },
          {
            href: "/admin/recruitment?risk=stalled_7d&source=admin-dashboard",
            label: "채용 정체 위험"
          },
          { href: "/admin/contracts?decisionQueueOnly=true", label: "계약 의사결정 큐" },
          { href: "/admin/contracts?slaRisk=OVERDUE", label: "계약 SLA 초과" },
          { href: "/admin/contracts?status=SENT", label: "계약 응답 대기" },
          { href: "/admin/contracts?renewalCandidateOnly=true", label: "계약 갱신 후보" }
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
          { href: "/admin/leave-policies", label: "Leave policies" },
          { href: "/admin/attendance-security", label: "Attendance security" },
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
      title: "Notices, benefits, recruitment, contracts",
      description: "Operate employee communication, support workflows, and contract risk queues.",
      links: [
        { href: "/admin/operator-alerts", label: "Operator alert integrations" },
        { href: "/admin/notification-defaults", label: "Notification defaults" },
        {
          href: "/admin/notices?status=PUBLISHED&risk=no-read&source=admin-dashboard",
          label: "Unread notice risk"
        },
        {
          href: "/admin/benefits?status=SUBMITTED&risk=pending_3d&source=admin-dashboard",
          label: "Aging benefits queue"
        },
        {
          href: "/admin/recruitment?risk=stalled_7d&source=admin-dashboard",
          label: "Stalled recruitment queue"
        },
        { href: "/admin/contracts?decisionQueueOnly=true", label: "Contract decision queue" },
        { href: "/admin/contracts?slaRisk=OVERDUE", label: "Contract SLA overdue" },
        { href: "/admin/contracts?status=SENT", label: "Contract pending responses" },
        { href: "/admin/contracts?renewalCandidateOnly=true", label: "Contract renewal candidates" }
      ]
    }
  ];
}
