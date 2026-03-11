"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import EmployeeAttendanceLeaveWorkspaceClient, {
  type EmployeeAttendanceLeaveWorkspaceSectionMode
} from "@/app/employee/attendance-leave-workspace-client";

type EmployeeAttendanceWorkspacePageClientProps = {
  sectionMode?: EmployeeAttendanceLeaveWorkspaceSectionMode;
};

export default function EmployeeAttendanceWorkspacePageClient({
  sectionMode = "all"
}: EmployeeAttendanceWorkspacePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (sectionMode !== "all" || typeof window === "undefined") {
      return;
    }
    if (window.location.hash !== "#attendance") {
      return;
    }
    const nextQuery = searchParams.toString();
    router.replace(
      nextQuery.length > 0
        ? `/employee/attendance/correction?${nextQuery}`
        : "/employee/attendance/correction"
    );
  }, [router, searchParams, sectionMode]);

  return (
    <EmployeeAttendanceLeaveWorkspaceClient
      mode="attendance"
      sectionMode={sectionMode}
    />
  );
}
