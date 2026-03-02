# WI-0786 Employee Dashboard KPI Product Copy

## Background

- `/employee` KPI cards still used developer-centric wording (`API success rate`, `Latest Call`).
- Product surfaces should expose user-facing workflow language.

## Scope

- Update employee dashboard KPI copy in `EmployeeDashboardChrome`:
  - `API 성공률` -> `요청 처리 성공률`
  - `API success rate` -> `Request success rate`
  - `최근 실행` -> `최근 처리 작업`
  - `Latest Call` -> `Latest activity`
- Add WI-0786 regression guard test.

## Acceptance Criteria

1. Employee dashboard KPI card copy is product-oriented in both ko/en runtime.
2. Legacy API/Call wording is no longer present in employee dashboard chrome.
3. Work-item and roadmap traceability are updated.

## Notes

- UI copy-only change.
- No API/schema/permission behavior change.
