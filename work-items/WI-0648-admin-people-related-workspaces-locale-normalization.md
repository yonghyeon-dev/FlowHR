# WI-0648 Admin People Related Workspaces Locale Normalization

## Summary
- normalized locale copy for `/admin/people` non-devtools fallback panel
- updated `AdminPeopleRelatedWorkspacesPanel` labels to locale-specific product copy:
  - ko: `관련 화면 이동`, `결재 실행 현황`, `근태 워크스페이스`, `관리자 대시보드`
  - en: `Related workspaces`, `Approval executions`, `Attendance workspace`, `Admin dashboard`
- aligned fallback panel aria-label in `page-view.tsx` to locale-aware wording

## Scope
- admin people fallback-navigation copy normalization only
- no API/schema/contract changes
- no workflow behavior change

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0648-admin-people-related-workspaces-locale-normalization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0647-admin-people-logs-devtools-gate.test.ts`
