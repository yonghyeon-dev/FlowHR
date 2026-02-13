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
| Attendance | `attendance_records`, `attendance_corrections`, `attendance_approvals` | `attendance.recorded`, `attendance.corrected`, `attendance.approved` | Own tables, event projections |
| Payroll | `payroll_periods`, `payroll_runs`, `payroll_items` | `payroll.calculated`, `payroll.confirmed` | Own tables, attendance projections only |
| Orchestrator (Process) | `work_items`, `release_decisions` | `workitem.assigned`, `release.approved` | Aggregated operational projections |
| QA | `qa_gate_results`, `risk_assessments` | `qa.gate.passed`, `qa.gate.failed` | All projection datasets for validation only |

## Implementation Rules

- New table must have one and only one owner domain.
- Non-owner write access is disallowed.
- Any ownership transfer requires ADR and migration plan.

## Review Checklist

- Is the read use case solvable by existing API/event?
- If projection is added, is source event versioned and replay-safe?
- Is personally identifiable information minimized in projections?
