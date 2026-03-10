import type { EmployeeAttendanceLeavePanelsProps } from "@/components/employee-dashboard/EmployeeAttendanceLeavePanels";
import { EmployeeAttendanceFormPanel } from "@/components/employee-dashboard/EmployeeAttendanceFormPanel";
import { EmployeeLeaveRequestPanel } from "@/components/employee-dashboard/EmployeeLeaveRequestPanel";

export function EmployeeAttendanceLeaveFormsPanel(props: EmployeeAttendanceLeavePanelsProps) {
  return (
    <>
      <EmployeeAttendanceFormPanel {...props} />
      <EmployeeLeaveRequestPanel {...props} />
    </>
  );
}
