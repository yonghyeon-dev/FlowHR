# WI-1002: API Auth Guard Order Fix — Auth Check Before Query Validation

## Background and Problem
Production integration test (2026-03-06) revealed 8 API routes that perform query/body validation BEFORE authentication check. When an unauthenticated request is sent with missing required query parameters, the API returns `400 invalid query` instead of `401 unauthorized`.

While no data is leaked, this violates security best practices: authentication should always be the first check in any protected endpoint.

**Affected endpoints:**
1. `src/app/api/attendance/records/route.ts` — GET handler
2. `src/app/api/attendance/aggregates/route.ts` — GET handler
3. `src/app/api/leave/requests/route.ts` — GET handler
4. `src/app/api/leave/calendar/route.ts` — GET handler
5. `src/app/api/payroll/runs/route.ts` — GET handler
6. `src/app/api/payroll/preview/route.ts` — POST handler
7. `src/app/api/scheduling/schedules/route.ts` — GET handler
8. `src/app/api/scheduling/anomalies/route.ts` — GET handler

**Current pattern (wrong):**
```typescript
const parsed = querySchema.safeParse({...});
if (!parsed.success) return fail(400, "invalid query");  // runs first
// ... later: auth check
```

**Correct pattern (like notifications/route.ts):**
```typescript
const actor = await readActor(request);
if (!actor?.id) return fail(401, "unauthorized");  // runs first
const parsed = querySchema.safeParse({...});
if (!parsed.success) return fail(400, "invalid query");
```

## Scope

### In Scope
- Move auth check (`readActor` + 401 guard) to the top of each GET/POST handler, BEFORE query/body schema validation
- For routes that delegate auth to service layer (like attendance/records and leave/requests which pass actor to service functions), add an explicit early 401 check before schema validation
- Keep all existing behavior unchanged after auth passes

### Out of Scope
- Adding new auth logic or role checks
- Changing response codes for authenticated requests
- Modifying service layer auth logic
- Any schema or DB changes

## Test Plan
- [ ] `curl -s https://flowhr-two.vercel.app/api/attendance/records` returns 401 (not 400)
- [ ] `curl -s https://flowhr-two.vercel.app/api/leave/requests` returns 401 (not 400)
- [ ] `curl -s https://flowhr-two.vercel.app/api/payroll/runs` returns 401 (not 400)
- [ ] `curl -s https://flowhr-two.vercel.app/api/scheduling/schedules` returns 401 (not 400)
- [ ] All 8 endpoints return 401 when accessed without authentication
- [ ] Existing authenticated behavior unchanged (no regression)
- [ ] `npm run build` passes

## ADR
- Auth check must always precede input validation in protected API routes
- Follows the pattern established in `src/app/api/notifications/route.ts` and `src/app/api/employees/route.ts`
- Prevents information disclosure about required parameters to unauthenticated users
