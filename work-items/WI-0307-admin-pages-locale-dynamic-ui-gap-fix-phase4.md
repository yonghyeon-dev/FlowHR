# WI-0307: Admin Pages Locale Dynamic UI Gap Fix Phase 4

## Background

`/admin/approval-executions` and `/admin/people` still had mixed-language copy in
Korean flow (for example `History Limit`, `Department Filter`, `Execution Limit`).
This creates an inconsistent user experience and conflicts with browser-locale
dynamic UI behavior.

## Scope

- `src/app/admin/approval-executions/page.tsx`
  - Apply `useI18n` (`ko`/`en`) locale wiring for high-visibility labels:
    - header and context/filter labels
    - domain/state option labels
    - escalation summary labels
    - stage/history runtime labels and session/log copy
  - Switch runtime date formatting from fixed `ko-KR` to locale-aware (`ko-KR`/`en-US`).
- `src/app/admin/people/page.tsx`
  - Apply `useI18n` (`ko`/`en`) locale wiring for mixed-language filter labels:
    - organization/admin IDs, department/position filters, updated window, history limit, filter reset
    - summary and compare/history labels (`CHANGED`, `changes`, `actor`, aria labels)
  - Switch runtime date formatting from fixed `ko-KR` to locale-aware (`ko-KR`/`en-US`).
- `src/app/employee/page.tsx`
  - Normalize pending-filter feedback and KPI detail wording to locale-aware copy.

## Out of Scope

- New feature sections
- Backend/schema/contract changes
- Large decomposition/refactor work

## Acceptance

1. Targeted admin pages no longer expose fixed English labels in Korean flow.
2. Locale-aware (`ko`/`en`) copy and runtime datetime formatting are applied to the touched labels.
3. WI-0307 regression test and build/typecheck/regression gates pass.

## Notes

- Related issue: `#383`
- Customer-facing localization hardening WI
