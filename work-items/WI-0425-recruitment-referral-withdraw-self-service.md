# WI-0425: Recruitment Referral Withdraw Self-Service

## Summary
- Goal: allow employees to withdraw active referrals they submitted.
- Change:
  - Extended recruitment referral stage model with `WITHDRAWN`.
  - Added withdraw schema/store logic and `POST /api/recruitment/referrals/{referralId}/withdraw`.
  - Updated employee recruitment workspace with withdraw action, withdrawn filter, and withdrawn summary count.
- Outcome:
  - Employees can correct referral submissions in-progress (`SUBMITTED`/`SCREENING`) without admin-side workaround.

## Scope
- `src/features/recruitment/types.ts`
- `src/features/recruitment/schemas.ts`
- `src/features/recruitment/store.ts`
- `src/app/api/recruitment/referrals/[referralId]/withdraw/route.ts`
- `src/components/recruitment/copy.ts`
- `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- `scripts/tests/e2e-wi0425-recruitment-referral-withdraw-self-service.test.ts`
- `work-items/WI-0425-recruitment-referral-withdraw-self-service.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0409-recruitment-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0420-recruitment-referral-filter-and-opening-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0425-recruitment-referral-withdraw-self-service.test.ts`
