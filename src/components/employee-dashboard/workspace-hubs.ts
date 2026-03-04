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
          { href: "/employee/schedule?source=employee-dashboard", label: "내 근무 일정" }
        ]
      },
      {
        key: "leave",
        title: "휴가",
        description: "휴가 요청 상태를 확인하고 잔여 연차를 관리합니다.",
        links: [
          { href: "/employee", label: "휴가 요청/취소" },
          { href: "/employee/year-end-input?source=employee-dashboard", label: "연말정산 입력" }
        ]
      },
      {
        key: "pay",
        title: "급여/원천징수",
        description: "급여 명세서와 원천징수 문서를 조회합니다.",
        links: [
          { href: "/employee/payslips?source=employee-dashboard", label: "급여 명세서" },
          {
            href: "/employee/payslip-receipts?source=employee-dashboard",
            label: "명세서 수신 확인"
          },
          {
            href: "/employee/withholding-receipt?source=employee-dashboard",
            label: "원천징수 영수증"
          }
        ]
      },
      {
        key: "documents",
        title: "전자문서",
        description: "전자계약, 공지, 복리후생, 채용 화면으로 바로 이동합니다.",
        links: [
          { href: "/employee/contracts?source=employee-dashboard", label: "전자계약" },
          {
            href: "/employee/contracts?status=pending_response&source=employee-dashboard",
            label: "계약 응답 필요"
          },
          {
            href: "/employee/contracts?status=pending_response&deadline=due_soon&source=employee-dashboard",
            label: "계약 기한 임박"
          },
          {
            href: "/employee/contracts?status=pending_response&deadline=overdue&source=employee-dashboard",
            label: "계약 만료/지연"
          },
          { href: "/employee/notices?source=employee-dashboard", label: "공지사항" },
          {
            href: "/employee/benefits?status=SUBMITTED&risk=pending_3d&source=employee-dashboard",
            label: "복리후생 대기"
          },
          {
            href: "/employee/recruitment?risk=stalled_7d&source=employee-dashboard",
            label: "채용 정체 추천"
          }
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
        { href: "/employee/schedule?source=employee-dashboard", label: "My schedule" }
      ]
    },
    {
      key: "leave",
      title: "Leave",
      description: "Track leave requests and remaining balance.",
      links: [
        { href: "/employee", label: "Leave requests" },
        { href: "/employee/year-end-input?source=employee-dashboard", label: "Year-end input" }
      ]
    },
    {
      key: "pay",
      title: "Payroll and withholding",
      description: "Open payslips and withholding receipts.",
      links: [
        { href: "/employee/payslips?source=employee-dashboard", label: "Payslips" },
        {
          href: "/employee/payslip-receipts?source=employee-dashboard",
          label: "Payslip receipt"
        },
        {
          href: "/employee/withholding-receipt?source=employee-dashboard",
          label: "Withholding receipt"
        }
      ]
    },
    {
      key: "documents",
      title: "Documents",
      description: "Check contracts, notices, benefits queue, and recruitment queue.",
      links: [
        { href: "/employee/contracts?source=employee-dashboard", label: "Contracts" },
        {
          href: "/employee/contracts?status=pending_response&source=employee-dashboard",
          label: "Contracts action needed"
        },
        {
          href: "/employee/contracts?status=pending_response&deadline=due_soon&source=employee-dashboard",
          label: "Contracts due soon"
        },
        {
          href: "/employee/contracts?status=pending_response&deadline=overdue&source=employee-dashboard",
          label: "Contracts overdue"
        },
        { href: "/employee/notices?source=employee-dashboard", label: "Notices" },
        {
          href: "/employee/benefits?status=SUBMITTED&risk=pending_3d&source=employee-dashboard",
          label: "Pending benefits"
        },
        {
          href: "/employee/recruitment?risk=stalled_7d&source=employee-dashboard",
          label: "Stalled recruitment"
        }
      ]
    }
  ];
}
