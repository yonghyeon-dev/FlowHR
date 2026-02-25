# WI-0409: Recruitment Core Journey Implementation

## Summary
- Goal: move recruitment from placeholder route to opening/referral/stage core journey.
- Change:
  - Added recruitment domain store with opening and referral seeds.
  - Added API routes:
    - `GET/POST /api/recruitment/openings`
    - `GET/POST /api/recruitment/referrals`
    - `POST /api/recruitment/referrals/{referralId}/stage`
  - Replaced `/admin/recruitment` with `AdminRecruitmentWorkspace` (opening create + referral stage update).
  - Replaced `/employee/recruitment` with `EmployeeRecruitmentWorkspace` (opening browse + referral submit + own referral history).
  - Added recruitment copy maps and WI-0409 regression guard.
- Outcome:
  - Recruitment now supports practical user loop: opening setup -> employee referral -> admin stage transition.

## Scope
- `src/features/recruitment/types.ts`
- `src/features/recruitment/store.ts`
- `src/features/recruitment/schemas.ts`
- `src/app/api/recruitment/openings/route.ts`
- `src/app/api/recruitment/referrals/route.ts`
- `src/app/api/recruitment/referrals/[referralId]/stage/route.ts`
- `src/components/recruitment/copy.ts`
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- `src/app/admin/recruitment/page.tsx`
- `src/app/employee/recruitment/page.tsx`
- `scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- `scripts/tests/e2e-wi0409-recruitment-core-journey-implementation.test.ts`
- `work-items/WI-0409-recruitment-core-journey-implementation.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0409-recruitment-core-journey-implementation.test.ts`
- `npm.cmd run -s build`
