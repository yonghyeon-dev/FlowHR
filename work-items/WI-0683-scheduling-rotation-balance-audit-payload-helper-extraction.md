# WI-0683 Scheduling Rotation-Balance Audit Payload Helper Extraction

## Summary
- extracted rotation-balance report audit payload composition from
  `src/features/scheduling/service.ts` into:
  - `buildRotationBalanceReportGeneratedAuditPayload` in
    `src/features/scheduling/rotation-balance-report-helpers.ts`
- rewired `listWorkScheduleRotationBalance` to append helper-generated payload.
- preserved audit action and report semantics.
- added WI-0683 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0683-scheduling-rotation-balance-audit-payload-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0057-scheduling-rotation-balance-report.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0678-scheduling-rotation-balance-summary-helper-extraction.test.ts`
- `npm.cmd run typecheck`
