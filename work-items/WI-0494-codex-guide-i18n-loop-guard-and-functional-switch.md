# WI-0494: Codex Guide i18n Loop Guard and Functional Switch

## Summary
- Goal: prevent i18n phase-loop recurrence and enforce automatic switch back to feature-delivery work.
- Scope:
  - `docs/codex-guide.md`
  - `scripts/tests/e2e-wi0494-codex-guide-i18n-loop-guard.test.ts`
  - `ROADMAP.md`

## Delivery
- Added explicit i18n loop prevention rules in `Part 3`:
  - i18n phase repetition ban (`phase N` style 반복 금지)
  - one-pass policy (`전수 스윕 1회 + CI 회귀 가드`로 종료)
  - QA-detected defect-only follow-up policy
- Added automatic stop rule:
  - when i18n WI reaches 3 in a row, stop and switch to feature WI.
- Added priority-based functional switch criteria (payroll accuracy/self-service/admin approval UX).
- Added WI-0494 regression test to guard the new policy text.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0494-codex-guide-i18n-loop-guard.test.ts`
