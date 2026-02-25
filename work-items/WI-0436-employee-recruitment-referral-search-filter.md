# WI-0436: Employee Recruitment Referral Search Filter

## Summary
- Goal: improve employee referral history discoverability on recruitment self-service screen.
- Scope:
  - add local search over candidate/opening/note fields
  - preserve existing stage filter behavior
  - add visible-count and search-empty feedback.

## Delivery
- Updated `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
  - added `referralSearchQuery` state
  - added `filteredReferrals` memo using:
    - opening title
    - candidate name/email
    - referral note
  - added search input + clear-search button
  - summary now includes visible referral count
  - referral list empty handling split:
    - no referral history (`emptyReferrals`)
    - no search match (`filteredEmptyReferrals`)
- Updated `src/components/recruitment/copy.ts`
  - added ko/en copy keys:
    - `referralSearchLabel`, `referralSearchPlaceholder`
    - `clearSearchAction`
    - `filteredReferralSummaryLabel`
    - `filteredEmptyReferrals`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0409-recruitment-core-journey-implementation.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0420-recruitment-referral-filter-and-opening-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0425-recruitment-referral-withdraw-self-service.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0436-employee-recruitment-referral-search-filter.test.ts`
