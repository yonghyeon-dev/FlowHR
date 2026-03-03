export type EmployeeWorkspaceHub = {
  key: string;
  title: string;
  description: string;
  links: {
    href: string;
    label: string;
  }[];
};

export function buildEmployeeWorkspaceHubs(isKoLocale: boolean): EmployeeWorkspaceHub[] {
  if (isKoLocale) {
    return [
      {
        key: "worktime",
        title: "출퇴근/근무",
        description: "오늘 출퇴근 기록과 개인 근무 일정을 확인합니다.",
        links: [
          { href: "/employee", label: "출퇴근 기록" },
          { href: "/employee/schedule", label: "내 근무 일정" }
        ]
      },
      {
        key: "leave",
        title: "휴가",
        description: "휴가 요청 상태를 확인하고 잔여 연차를 관리합니다.",
        links: [
          { href: "/employee", label: "휴가 요청/취소" },
          { href: "/employee/year-end-input", label: "연말정산 입력" }
        ]
      },
      {
        key: "pay",
        title: "급여/원천징수",
        description: "급여 명세서와 원천징수 문서를 조회합니다.",
        links: [
          { href: "/employee/payslips", label: "급여 명세서" },
          { href: "/employee/withholding-receipt", label: "원천징수 영수증" }
        ]
      },
      {
        key: "documents",
        title: "전자문서",
        description: "전자계약, 공지, 복리후생, 채용 화면으로 바로 이동합니다.",
        links: [
          { href: "/employee/contracts", label: "전자계약" },
          {
            href: "/employee/contracts?status=pending_response&deadline=due_soon",
            label: "계약 기한 임박"
          },
          {
            href: "/employee/contracts?status=pending_response&deadline=overdue",
            label: "계약 만료/지연"
          },
          { href: "/employee/notices", label: "공지사항" },
          { href: "/employee/benefits?status=SUBMITTED&risk=pending_3d", label: "복리후생 대기" },
          { href: "/employee/recruitment?risk=stalled_7d", label: "채용 정체 추천" }
        ]
      }
    ];
  }

  return [
    {
      key: "worktime",
      title: "Attendance and schedule",
      description: "Review today's attendance logs and personal schedule.",
      links: [
        { href: "/employee", label: "Attendance logs" },
        { href: "/employee/schedule", label: "My schedule" }
      ]
    },
    {
      key: "leave",
      title: "Leave",
      description: "Track leave requests and remaining balance.",
      links: [
        { href: "/employee", label: "Leave requests" },
        { href: "/employee/year-end-input", label: "Year-end input" }
      ]
    },
    {
      key: "pay",
      title: "Payroll and withholding",
      description: "Open payslips and withholding receipts.",
      links: [
        { href: "/employee/payslips", label: "Payslips" },
        { href: "/employee/withholding-receipt", label: "Withholding receipt" }
      ]
    },
    {
      key: "documents",
      title: "Documents",
      description: "Check contracts, notices, benefits queue, and recruitment queue.",
      links: [
        { href: "/employee/contracts", label: "Contracts" },
        {
          href: "/employee/contracts?status=pending_response&deadline=due_soon",
          label: "Contracts due soon"
        },
        {
          href: "/employee/contracts?status=pending_response&deadline=overdue",
          label: "Contracts overdue"
        },
        { href: "/employee/notices", label: "Notices" },
        {
          href: "/employee/benefits?status=SUBMITTED&risk=pending_3d",
          label: "Pending benefits"
        },
        {
          href: "/employee/recruitment?risk=stalled_7d",
          label: "Stalled recruitment"
        }
      ]
    }
  ];
}
