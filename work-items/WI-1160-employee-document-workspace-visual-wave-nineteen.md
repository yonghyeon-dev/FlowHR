# WI-1160: 직원 문서 워크스페이스 시각 파동 19

Visual wave 19 for the remaining employee document consoles.

## Background

- `WI-1159` aligned the withholding receipt console to the shared employee workspace shell.
- `PayslipReceiptConsole` and `EmployeeYearEndInputConsole` still use the legacy `hero + panel-grid` structure even though they behave like active employee document workspaces.
- The employee document lane should present the same shell rhythm, summary strip, source banner, and feedback treatment across receipt, withholding, and year-end input surfaces.

## Scope

1. Align `src/components/payslip-receipts/PayslipReceiptConsole.tsx` to the shared employee workspace shell.
2. Align `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx` to the shared employee workspace shell.
3. Add a static regression guard and connect it to `test:integration`.
4. Update `docs/production-operating-progress.md` with the closed `WI-1159` state and the `WI-1160` start marker.

## Non-Goals

- Changing employee year-end calculation logic
- Changing payslip receipt APIs or state transitions
- Reworking document navigation beyond shell-level alignment

## Acceptance Criteria

1. Both consoles render with `workspace-shell employee-workspace-shell`, `workspace-page-header`, and `workspace-summary-strip`.
2. Input, validation, and document action surfaces use shared workspace card rhythm and inline feedback classes.
3. Employee source-return actions are expressed through the shared header/page-actions pattern.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
