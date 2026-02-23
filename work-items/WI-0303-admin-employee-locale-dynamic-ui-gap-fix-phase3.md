# WI-0303: Admin/Employee Locale Dynamic UI Gap Fix Phase 3

## Background

After WI-0301 and WI-0302, `/admin` and `/employee` still exposed mixed-language
labels in Korean flow (for example `Organization ID`, `Actor ID`, `ON/OFF`) and
`/employee` had a broken mojibake string (`??? ?? ??`) in the resubmit list
`aria-label`.

## Scope

- `src/app/admin/page.tsx`
  - Apply locale-aware (`ko`/`en`) runtime copy for high-visibility labels:
    - production warning sentence
    - API call KPI title
    - onboarding helper copy + organization label
    - Bearer ON/OFF indicator
    - dev settings labels (`organization`, `actor`, token override, runtime URL)
    - invite labels and payroll preview mode text
  - Replace residual error text `Organization ID가 필요합니다.` -> `조직 ID가 필요합니다.`
- `src/app/employee/page.tsx`
  - Apply locale-aware (`ko`/`en`) runtime copy for high-visibility labels:
    - production warning sentence
    - API success KPI title
    - Bearer ON/OFF indicator
    - dev settings labels (`organization`, token override, auth mode)
    - request search scope/placeholder
    - API log panel title/summary
  - Fix broken `aria-label` text:
    - `??? ?? ??` -> locale-aware `재제출 후보 목록` / `resubmit candidate list`
  - Replace leave type option display with localized labels via `toLeaveTypeLabel`

## Out of Scope

- New feature sections
- Contract/API/schema changes
- Page decomposition work

## Acceptance

1. Targeted admin/employee labels are locale-aware (`ko`/`en`) and no longer fixed English in Korean flow.
2. Broken `???` string is removed from employee resubmit list accessibility label.
3. Typecheck/build/regression tests pass.

## Notes

- Related issue: `#375`
- UI copy-only hardening WI
