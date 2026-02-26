# WI-0539: Employee Recruitment Stalled-Risk Self-Service Filter

## Summary
- Goal: let employees identify delayed referrals in `/employee/recruitment` through stall-risk filters and badges.
- Scope:
  - `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
  - `src/components/recruitment/copy.ts`
  - `scripts/tests/e2e-wi0539-employee-recruitment-stalled-risk-self-service-filter.test.ts`
  - `ROADMAP.md`

## Delivery
- Added employee referral risk filter (`all | stalled_7d | stalled_14d`).
- Added 7-day and 14-day stalled referral counters in summary row.
- Added per-referral stall/critical-stall badges for non-terminal stages.
- Extended employee recruitment copy bundle with localized risk filter/summary/badge labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0539-employee-recruitment-stalled-risk-self-service-filter.test.ts`
