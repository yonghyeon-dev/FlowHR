# WI-0900 Attendance GET API Auth Guard

## Summary
- Added a production-only authentication guard to `GET /api/attendance/records`.
- Mirrored the WI-0895 route-level pattern used in notices APIs.
- Preserved existing non-production behavior.

## Scope
- `src/app/api/attendance/records/route.ts`

## Acceptance
1. If `NODE_ENV === "production"` and `readActor(request)` returns `null`, `GET /api/attendance/records` returns `401` with `attendance.list.unauthorized`.
2. If actor is present, the existing attendance list flow continues unchanged.
3. In non-production runtime, current behavior is preserved (no new unauthorized block for null actor).

## Validation
- `npm.cmd run typecheck`
- `npm.cmd run lint`
