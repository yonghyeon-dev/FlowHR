# WI-0111: Auth Invite Delivery Mode (Link/Email)

## Background and Problem

Current auth invite baseline (`WI-0096`) only returns action links. For SaaS onboarding, admin needs a safer default path to dispatch email invites directly without exposing link secrets.

## Scope

### In Scope

- Add `deliveryMode` (`link` | `email`) to auth invite contract/API.
- Implement delivery mode handling in auth invite service.
- Keep claim provisioning (`role`, `organization_id`, `actor_id`) identical in both modes.
- Update admin invite UI to choose delivery mode and handle nullable `actionLink`.
- Add regression test for service behavior and permission/org validation.

### Out of Scope

- Custom email template/branding.
- Invite revoke/reissue/expiry lifecycle.
- Self-service sign-up UX redesign.

## User Scenarios

1. Admin chooses `link` mode and shares generated action link manually.
2. Admin chooses `email` mode and does not see action link in response.
3. Security reviewer verifies both modes emit audit trails and preserve claim updates.

## Payroll Accuracy and Calculation Rules

- Not applicable (auth onboarding work item).

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Create invite (`link`) | Allow | Deny | Deny | Allow |
| Create invite (`email`) | Allow | Deny | Deny | Allow |
| Set user claims via invite | Allow | Deny | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: API/contract additive change only.

## API and Event Changes

- Endpoints:
  - `POST /auth/invites` (add optional `deliveryMode`)
- Events published: none
- Events consumed: none
- Audit events:
  - `auth.invite.generated`
  - `auth.user.claims.updated`

## Test Plan

- Unit:
  - `createAuthInvite` link mode returns action link and updates metadata.
  - `createAuthInvite` email mode returns `actionLink=null` and updates metadata.
- Integration:
  - permission and organization mismatch guards still block invalid requests.
- Regression:
  - default mode remains `link` when `deliveryMode` omitted.
- Authorization:
  - only `admin`/`system` accepted.
- Payroll accuracy:
  - not applicable.

## Observability and Audit Logging

- Audit events:
  - `auth.invite.generated` (include `deliveryMode`, `hasActionLink`)
  - `auth.user.claims.updated`
- Metrics:
  - `auth_invite_generated_count`
  - `auth_invite_delivery_mode_count`
- Alert conditions:
  - spike in invite failure (502) rates by delivery mode.

## Rollback Plan

- Revert to `link`-only behavior in service and UI.
- Keep contract bump trace in ADR/work-item history.
- Recovery target time: 30m.

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [x] `deliveryMode` support is implemented in auth invite service and API.
- [x] Admin UI supports selecting delivery mode and nullable `actionLink` rendering.
- [x] Auth contract/API/test-cases/RFC are version-updated and aligned.
- [x] Regression test (`e2e-wi0111-auth-invite-delivery-mode`) is added and wired.
- [x] Lint/typecheck/tests/contract/traceability checks pass locally.
