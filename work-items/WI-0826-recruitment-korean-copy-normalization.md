# WI-0826 Recruitment Korean Copy Normalization

## Summary
- Normalized corrupted Korean runtime copy in recruitment locale maps for both admin and employee workspaces.
- Fixed duplicate-referral conflict Korean message in employee recruitment submit flow.
- Replaced broken summary/opening separators in employee recruitment view with stable plain separators.

## Scope
- `src/components/recruitment/copy.ts`
- `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- `src/components/recruitment/EmployeeRecruitmentWorkspaceView.tsx`
- `scripts/tests/e2e-wi0826-recruitment-korean-copy-normalization.test.ts` (new)

## Acceptance
1. Recruitment ko runtime labels/messages render in readable Korean without mojibake tokens.
2. Duplicate active-referral conflict message is readable in Korean.
3. Recruitment employee summary/opening separators no longer contain broken glyphs.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0826-recruitment-korean-copy-normalization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0823-employee-recruitment-deeplink-autoload.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0822-admin-recruitment-deeplink-autoload.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
