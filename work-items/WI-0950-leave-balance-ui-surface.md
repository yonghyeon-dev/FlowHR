# WI-0950: Leave Balance UI Surface for Request Flow

## Background and Problem

WI-0949 added backend leave-balance guards and an API for available balance
(`total/used/pending/available`), but the employee leave request UI does not yet
surface this summary inline during request creation.

## Scope

### In Scope

- Read `GET /api/leave/balance/[employeeId]` from employee leave request UI.
- Show current available balance and pending usage before submit.
- Display API error details from balance guard in a user-friendly form.

### Out of Scope

- Leave policy redesign.
- Multi-type entitlement pool redesign.

## Rollback Plan

- Remove new UI balance panel and error mapping.
- Keep backend guard/API from WI-0949 unchanged.
