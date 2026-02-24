# WI-0387: Korean copy global sweep and regression guard

## Summary
- Recovered corrupted `ko` locale strings (`??` placeholders) introduced during prior automated replacement.
- Completed a key-based Korean copy sweep for approval/admin/payroll locale helper files and normalized mixed English UI labels.
- Prioritized user-reported areas (`원천징수`, `명세서`, `전자계약함`) and closed remaining Korean-mode English leaks:
  - contracts locale bundles (`admin/template-builder/employee-inbox`)
  - payslip/year-end filing labels and timeline badges
  - employee payslip devtools hint copy
- Reduced locale leakage risk by removing `...en` spread reliance in Korean contract copy objects.
- Added WI-0387 regression test to prevent reintroduction of corrupted placeholders and known English residuals in Korean branches.

## Scope
- `src/app/admin/approval-history/page-locale-helpers.ts`
- `src/app/admin/approval-policy/page-locale-helpers.ts`
- `src/app/admin/approval-templates/page-locale-helpers.ts`
- `src/app/employee/page-locale-helpers.ts`
- `src/app/employee/payslips/page-locale-helpers.ts`
- `src/components/admin-approval/ApprovalQueuePanel.tsx`
- `src/components/admin-attendance-live/copy.ts`
- `src/components/admin-kpi/copy.ts`
- `src/components/admin-onboarding/copy.ts`
- `src/components/contracts/copy.ts`
- `src/components/employee-guide/copy.ts`
- `src/components/leave-calendar/copy.ts`
- `src/components/payroll-close/copy.ts`
- `src/components/payroll-insurance/copy.ts`
- `src/components/payroll-payslip-delivery/copy.ts`
- `src/components/payroll-year-end/copy.ts`
- `src/components/payroll-year-end-filing/copy.ts`
- `src/components/payroll-year-end/employee-year-end-input-copy.ts`
- `scripts/tests/e2e-wi0387-korean-copy-global-sweep-regression.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0387-korean-copy-global-sweep-regression.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- `npm.cmd run -s typecheck`
