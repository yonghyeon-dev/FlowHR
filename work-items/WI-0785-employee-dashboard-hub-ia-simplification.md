# WI-0785 Employee Dashboard Hub IA Simplification

## Background

- `/employee` had core data panels, but lacked a clear dedicated-workspace hub entry area.
- Header quick actions still exposed `/login`, which conflicted with session-based product UX.

## Scope

- Add a localized employee workspace hub model for dedicated routes:
  - worktime, leave, payroll/withholding, documents.
- Render a new `workspace-hub` panel in `EmployeeAccountOverviewPanels`.
- Replace employee chrome quick action `/login` with `/employee/contracts`.

## Acceptance Criteria

1. Employee dashboard exposes a visible localized workspace hub section.
2. Hub links include schedule, payslips, contracts, withholding receipt, and year-end input.
3. Employee chrome quick actions no longer include a direct `/login` shortcut.
4. Regression guard verifies WI-0785 behavior and roadmap/work-item traceability.

## Notes

- This WI is IA/product UX improvement only.
- No new devtools/ops panel, scheduler, or delivery channel expansion.
