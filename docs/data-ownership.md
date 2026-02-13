# Domain Data Ownership Policy

## Core Rule

- Cross-domain direct DB access is prohibited.
- Domain integration must happen through versioned API or published events.

Exception:
- Read models (projection tables, replicas) are allowed only when built from domain events.
- Read models must never become system of record.

## Ownership Matrix

| Domain | Owned Tables | Published Events | Allowed Reads |
| --- | --- | --- | --- |
| Attendance | `AttendanceRecord` | `attendance.recorded.v1`, `attendance.corrected.v1`, `attendance.approved.v1` | Own tables, event projections |
| Payroll | `PayrollRun` | `payroll.calculated.v1`, `payroll.confirmed.v1`, `payroll.deductions.calculated.v1` | Own tables, attendance projections only |
| Leave | `LeaveRequest`, `LeaveApproval`, `LeaveBalanceProjection` | `leave.requested.v1`, `leave.approved.v1`, `leave.rejected.v1`, `leave.canceled.v1`, `leave.accrual.settled.v1` | Own tables, attendance/payroll read-model only |
| Platform (Shared) | `AuditLog` | none | Read-only for operations and audits |
| Orchestrator (Process) | none (artifact-driven process) | `workitem.assigned` | Aggregated operational projections |
| QA | none (artifact-driven process) | `qa.gate.passed`, `qa.gate.failed` | All projection datasets for validation only |

## Implementation Rules

- New table must have one and only one owner domain.
- Non-owner write access is disallowed.
- Any ownership transfer requires ADR and migration plan.

## Review Checklist

- Is the read use case solvable by existing API/event?
- If projection is added, is source event versioned and replay-safe?
- Is personally identifiable information minimized in projections?
