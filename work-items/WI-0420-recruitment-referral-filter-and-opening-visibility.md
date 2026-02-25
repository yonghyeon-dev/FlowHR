# WI-0420: Recruitment Referral Filter and Opening Visibility

## Summary
- Goal: improve employee recruitment referral tracking quality.
- Change:
  - Employee recruitment workspace now supports stage filtering (`all/submitted/screening/interview/offer/hired/rejected`).
  - Added referral-stage summary counts.
  - Referral rows now display opening title (resolved from opening ID) with localized fallback.
  - Extended locale copy for filter/summary/opening labels.
- Outcome:
  - Referral history is actionable and easier to scan during candidate pipeline follow-up.

## Scope
- `src/components/recruitment/copy.ts`
- `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- `scripts/tests/e2e-wi0420-recruitment-referral-filter-and-opening-visibility.test.ts`
- `work-items/WI-0420-recruitment-referral-filter-and-opening-visibility.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0409-recruitment-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0420-recruitment-referral-filter-and-opening-visibility.test.ts`

