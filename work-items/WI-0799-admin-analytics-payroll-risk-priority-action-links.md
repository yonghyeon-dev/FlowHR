# WI-0799 Admin Analytics Payroll Risk Priority Action Links

## Background

- `/admin/analytics` now shows payroll/year-end risk counts through WI-0798.
- Admin still needs to manually decide where to go next, which slows risk response.

## Scope

- Extend `AdminPayrollRiskKpiPanel` with priority action routing logic:
  - `previewedRunCount > 0` -> `/admin/payroll-close`
  - `confirmedUndistributedCount > 0` or `distributedUnacknowledgedCount > 0` -> `/admin/payroll-payslip-delivery`
  - no blockers -> `/admin/payroll-year-end`
- Add top-priority action CTA and quick-action links in the panel.
- Add localized copy for action labels and priority reasons.
- Add regression guard for action-link routes and copy keys.

## Acceptance Criteria

1. Payroll risk panel shows one top-priority CTA based on current blocker state.
2. Panel provides quick links to payroll close, payslip delivery, and year-end workspaces.
3. Regression test and roadmap/work-item links are updated.

## Notes

- Product UX enhancement in existing admin analytics surface.
- No API contract/schema change.
