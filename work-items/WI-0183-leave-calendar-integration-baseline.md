# WI-0183: Leave Calendar Integration Baseline

## Background and Problem

FlowHR has leave request/approval and leave policy engines, but organization-wide leave visibility is still fragmented.
After WI-0182 (auto-grant), Phase 3 requires calendar integration so admins can monitor approved leave by date and department without appending new sections to monolith pages.

## Scope

### In Scope

- Add leave calendar read API:
  - `GET /leave/calendar`
  - query: `from`, `to`, `organizationId?`, `departmentId?`, `includePending?`, `overlapWarningThreshold?`
- Add leave calendar aggregation service:
  - organization and tenant scope guard
  - department filter support
  - day-level occupancy summary in Asia/Seoul day boundaries
  - overlap warning flag when day occupancy reaches threshold
- Add dedicated admin route:
  - `/admin/leave-calendar`
  - run calendar query and inspect day warnings and entry list
- Add WI-0183 regression test:
  - `scripts/tests/e2e-wi0183-leave-calendar-integration-baseline.test.ts`
- Wire WI-0183 test into MVP/FULL e2e chains
- Update leave specs (contract/api/test-cases)

### Out of Scope

- External calendar provider synchronization (Google/Microsoft)
- Push notifications for overlap alerts
- Mobile-native leave calendar UI

## User Scenarios

1. Admin loads department leave calendar for a date range and sees daily occupancy.
2. Admin identifies high-overlap days from warning badges before approving additional leave.
3. Payroll/admin reviews approved and optional pending leave entries in one place.

## Data and API Changes

- New API endpoint: `GET /leave/calendar`
- No DB migration (read model only)

## Rollback Plan

- Revert `src/app/api/leave/calendar/route.ts`
- Revert `src/features/leave/calendar-service.ts` and schema additions
- Remove `/admin/leave-calendar` route and nav link
- Revert WI-0183 e2e and spec updates

## Definition of Done (DoD)

- [x] Leave calendar API returns day summary, overlap warnings, and filtered entries.
- [x] Tenant and role guard blocks unauthorized calendar access.
- [x] Dedicated admin route exists for calendar query and warning review.
- [x] Leave contract/api/test-cases include leave calendar endpoint and behavior.
- [x] WI-0183 regression test is added and wired into MVP/FULL chains.
