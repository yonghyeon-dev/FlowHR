# WI-0909 HR Metrics API

## Scope
- Added admin-only HR metrics aggregation endpoint:
  - `GET /api/admin/metrics`
  - file: `src/app/api/admin/metrics/route.ts`
- Endpoint behavior:
  - only `admin` actor can access
  - actor organization scope is required
  - aggregates and returns:
    - `headcount` (active employees)
    - `departmentCount`
    - `pendingLeaveRequests` (`PENDING`)
    - `pendingApprovals` (`PENDING`)
    - `todayAttendanceCount` (today check-in records)
    - `activeBenefitRequests` (`SUBMITTED`)
    - `openRecruitmentOpenings` (`OPEN`)
- Aggregation implementation uses runtime memory data-access list calls + in-route filter/count.

## Test
- Added e2e:
  - `scripts/tests/e2e-wi0909-hr-metrics.test.ts`
- Coverage:
  - setup: organization, 3 employees, 2 departments, 1 pending leave, 1 attendance today
  - verifies admin call returns expected counts
  - verifies `employee` role receives `403`

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0909-hr-metrics.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
