# WI-0007: MVP Operations Console

## Background and Problem

The backend APIs are implemented and tested, but manual end-to-end verification still requires direct API tooling.  
For one-person operations, we need an in-app console to execute the core MVP flows quickly.

## Scope

### In Scope

- Build a single-page operations console at `/`.
- Provide action panels for:
  - attendance create/approve
  - payroll preview/confirm (gross/manual/profile deduction mode)
  - deduction profile upsert/read
  - leave request/approve/balance read
- Add API call log panel for payload/status visibility.

### Out of Scope

- Final production UX polishing and role-based navigation.
- Full auth UI and token issuance flow.
- Dashboard analytics and BI features.

## User Scenarios

1. Operator executes attendance-to-payroll flow without external API client.
2. Operator validates deduction profile mode and run confirmation.
3. Operator verifies leave lifecycle and resulting balance in one screen.

## Payroll Accuracy and Calculation Rules

- Console must not alter domain calculation logic.
- All calculations continue to follow `specs/common/time-and-payroll-rules.md`.
- Console sends typed request payloads only.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| Attendance create | Deny | Deny | Allow | Deny |
| Attendance approve | Deny | Allow | Deny | Deny |
| Payroll preview/confirm | Allow | Deny | Deny | Allow |
| Deduction profile upsert/read | Allow | Deny | Deny | Allow(read) |
| Leave request/approve | Deny | Allow(approve) | Allow(request) | Deny |

## Data Changes (Tables and Migrations)

- None.

## API and Event Changes

- No domain API schema change.
- Uses existing endpoints in attendance/leave/payroll modules.

## Test Plan

- Unit:
  - none (UI-only wiring)
- Integration:
  - `npm run build` to ensure route compilation
- Regression:
  - existing e2e suites stay green
- Authorization:
  - role-specific action routing via actor context in request headers/token
- Payroll accuracy:
  - validated indirectly through existing payroll service tests

## Observability and Audit Logging

- Existing backend audit events are reused.
- Console adds client-side response log panel for manual diagnostics.

## Rollback Plan

- Revert `src/app/page.tsx` and `src/app/globals.css` to previous landing page.
- No DB rollback needed.

## Definition of Ready (DoR)

- [x] Required API endpoints already implemented.
- [x] MVP operator journey is defined.
- [x] No new schema migration required.
- [x] Existing e2e regression exists for backend safety.
- [x] Rollback is low risk.

## Definition of Done (DoD)

- [x] Operations console renders in desktop/mobile.
- [x] Core MVP action panels are wired to runtime APIs.
- [x] Build/lint/typecheck/e2e regression pass.
- [ ] QA Spec Gate and Code Gate are both passed.
