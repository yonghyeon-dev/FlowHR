# WI-0935: Leave policy advanced validation

## Summary
- Added `GET /api/leave/policies` with default `status=ACTIVE` filtering.
- Added `DELETE /api/leave/policies/[policyId]` with:
  - admin-only guard
  - statutory-protection guard (`Cannot delete statutory leave policy`)
  - usage guard (`Policy has active usage, cannot delete`)
  - soft-delete behavior (`status = ARCHIVED`)
- Added WI e2e coverage at `scripts/tests/e2e-wi0935-leave-policy-validation.test.ts`.

## Data Changes
- Added migration: `prisma/migrations/202603050007_wi0935_leave_policy_validation/migration.sql`
- Schema updates:
  - `LeavePolicy`:
    - new fields: `name`, `isStatutory`, `status`
    - removed one-policy-per-org unique constraint on `organizationId`
  - `LeaveRequest`:
    - new nullable FK: `policyId -> LeavePolicy.id` (for policy usage tracking)
- Migration also backfills/seeds statutory policy rows (`Annual Leave`, `Sick Leave`) per existing organization.
