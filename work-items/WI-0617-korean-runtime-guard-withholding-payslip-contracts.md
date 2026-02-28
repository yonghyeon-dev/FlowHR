# WI-0617: Korean runtime guard hardening (withholding / payslip / contracts)

## Background

Korean runtime still exposed residual English labels in a few dynamic paths:

- legacy withholding activity labels in API log rows
- contract response history evidence format detail (`JSON`/`TEXT`)

## Scope

- Harden withholding activity label normalization:
  - map legacy English activity aliases to Korean
  - suppress unmapped English labels to Korean-safe fallback
- Localize contract response history evidence format detail with copy keys.
- Add WI-0617 regression guard and roadmap entry.

## Out of Scope

- API/schema changes
- scheduler/ops automation expansion
- new phase-style i18n loop work

## Acceptance Criteria

1. Korean runtime does not leak residual English for known withholding activity labels.
2. Unmapped English activity labels are suppressed to Korean fallback (`요청 실행`).
3. Contract response history evidence detail shows localized labels in both ko/en locales.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0617-korean-runtime-guard-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0587-korean-surface-one-shot-guard-withholding-payslips-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0596-korean-residual-bugpack-withholding-payslips-contracts.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
