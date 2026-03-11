"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import EmployeeAttendanceLeaveWorkspaceClient, {
  type EmployeeLeaveWorkspaceSectionMode
} from "@/app/employee/attendance-leave-workspace-client";

type EmployeeLeaveWorkspacePageClientProps = {
  sectionMode?: EmployeeLeaveWorkspaceSectionMode;
};

export default function EmployeeLeaveWorkspacePageClient({
  sectionMode = "all"
}: EmployeeLeaveWorkspacePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (sectionMode !== "all" || typeof window === "undefined") {
      return;
    }
    if (window.location.hash !== "#leave-calendar") {
      return;
    }
    const nextQuery = searchParams.toString();
    router.replace(
      nextQuery.length > 0
        ? `/employee/leave/calendar?${nextQuery}`
        : "/employee/leave/calendar"
    );
  }, [router, searchParams, sectionMode]);

  return (
    <EmployeeAttendanceLeaveWorkspaceClient
      mode="leave"
      sectionMode={sectionMode}
    />
  );
}
