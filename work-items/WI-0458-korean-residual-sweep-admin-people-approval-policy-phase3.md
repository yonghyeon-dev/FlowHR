# WI-0458: Korean Residual Sweep (Admin People/Approval Policy Phase 3)

## Summary
- Goal: Remove legacy Korean terminology drift and lock normalized labels in approval-policy/people/payslip-receipts/contracts copy.
- Scope:
  - Guard against residual legacy terms (`조직 ID`, `관리자 액터 ID`, `직원 ID`, `API 로그`).
  - Keep normalized labels (`조직 식별자`, `관리자 액터 식별자`, `요청 로그`, `직원-0001`) fixed.

## Delivery
- Added `scripts/tests/e2e-wi0458-korean-residual-sweep-admin-people-approval-policy-phase3.test.ts`
  - Legacy-term absence checks across targeted files.
  - Positive-token checks for normalized Korean labels.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0458-korean-residual-sweep-admin-people-approval-policy-phase3.test.ts`
