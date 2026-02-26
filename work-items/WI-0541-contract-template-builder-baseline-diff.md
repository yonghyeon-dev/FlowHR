# WI-0541: Contract Template Builder Baseline Diff

## Summary
- Goal: make template edits reviewable by adding baseline capture and line-level diff preview in builder flow.
- Scope:
  - `src/components/contracts/ContractTemplateBuilder.tsx`
  - `src/components/contracts/template-builder-helpers.ts`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0541-contract-template-builder-baseline-diff.test.ts`
  - `ROADMAP.md`

## Delivery
- Added baseline capture/reset flow in template builder.
- Added generated-body diff summary (added/removed lines) with no-change fallback.
- Extracted diff computation into `buildTemplateBodyDiffSummary` helper.
- Extended builder copy bundle with baseline/diff labels and status messages.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0530-contract-template-builder-draft-validation-checklist.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0541-contract-template-builder-baseline-diff.test.ts`

