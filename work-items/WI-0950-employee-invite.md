# WI-0950: Employee Invitation Email with Self-Registration Invite Token

## Scope
- Enhance `POST /api/auth/invites` for admin-driven employee invitation by email.
- Add `GET /api/admin/invites` to list pending invites for the admin organization.
- Persist invite metadata (`organizationId`, `role`, optional `departmentId`, `positionId`, `name`) to Supabase `user_metadata` when creating the invite.
- Ensure invite flow lands on `/auth/callback` and supports invite token exchange.

## Implementation
- Updated `src/features/auth/service.ts`:
  - `inviteUserByEmail` and `generateLink` now pass invite metadata through `options.data` (`user_metadata`).
  - Added conflict mapping for duplicate invite/user email errors to `409`.
  - Added invite metadata fields (`name`, `departmentId`, `positionId`) into audit payload/list projection.
  - Added `invitedAt` on invite creation response model.
- Updated `src/app/api/auth/invites/route.ts`:
  - Accepts WI-0950 payload fields: `email`, optional `name`, `departmentId`, `positionId`, `redirectTo`.
  - Defaults redirect target to `${origin}/auth/callback`.
  - Defaults delivery mode to `email` (token email flow).
  - Enforces duplicate invite conflict (`409`) for existing pending invite email in org context.
  - Returns `{ id, email, invitedAt }` (plus backward-compatible `invite` object).
- Added `src/app/api/admin/invites/route.ts`:
  - Admin-only invite listing.
  - Returns pending invites as `[{ id, email, name, status, invitedAt }]`.
- Updated `src/app/auth/callback/route.ts`:
  - Supports both `code` and `token_hash + type` callback exchanges.
  - Adds metadata fallback from `user_metadata` for role/organization redirect resolution.

## Test
- Added `scripts/tests/e2e-wi0950-employee-invite.test.ts` covering:
  - Admin invite returns `201`.
  - Duplicate email returns `409`.
  - Employee role invite attempt returns `403`.
  - Admin invite listing contains new invite.
  - Supabase invite metadata includes `organizationId`; app metadata includes `organization_id` and `role`.

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0950-employee-invite.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

## Delivery Note
- Backend-only delivery in this WI (API + email flow). UI invite management changes are deferred to a follow-up UI WI.
