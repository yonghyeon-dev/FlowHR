# WI-0790 Employee Layout Focus Query Navigation

## Background

- WI-0789 introduced `?focus=` deep-link resolution on `/employee`.
- Employee layout navigation still used hash links (`/employee#...`) for core sections, which bypassed the new focus-query flow.

## Scope

- Switch employee layout navigation entries from hash links to focus-query routes for `/employee` sections:
  - account
  - self-service-overview
  - submit-checklist
  - request-feedback / request-search-sort / request-timeline / request-resubmit
  - attendance / leave / leave-calendar / schedule
- Extend `resolveEmployeeFocusSectionId` allow-list to include `account`.
- Add WI-0790 regression test and roadmap traceability update.

## Acceptance Criteria

1. Employee sidebar/mobile menu links use `/employee?focus=...` for core in-page sections.
2. `account` is accepted by focus-query resolver.
3. Existing non-employee routes and payslip hash links are unchanged.
4. Regression guard + roadmap/work-item updates are present.

## Notes

- Navigation-only UX consistency improvement.
- No API/schema/permission changes.
