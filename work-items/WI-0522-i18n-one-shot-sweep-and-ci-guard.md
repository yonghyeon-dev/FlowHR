# WI-0522: i18n One-Shot Sweep and CI Guard

## Summary
- Goal: lock i18n cleanup as a one-time sweep and prevent phase-style repetition by adding CI guardrails.
- Scope:
  - `docs/codex-guide.md`
  - `scripts/tests/e2e-wi0522-i18n-one-shot-sweep-ci-guard.test.ts`
  - `ROADMAP.md`

## Delivery
- Added explicit guard section to Codex guide:
  - one-shot i18n sweep rule
  - no `phase2/phase3/hardening-plus/upgrade-N` i18n repeat rule
  - 3 consecutive i18n WI auto-stop and core-journey switch rule
- Added CI regression guard test:
  - verifies guide guard section exists
  - verifies selected Korean UI surfaces do not contain known mojibake tokens
  - verifies recent roadmap block does not reintroduce phase-style Korean i18n loop pattern

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0522-i18n-one-shot-sweep-ci-guard.test.ts`
- [x] `npm.cmd run typecheck`
