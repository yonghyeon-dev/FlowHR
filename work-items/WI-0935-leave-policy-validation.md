# WI-0935: Leave Policy Advanced Validation

## Background and Problem

Leave policy deletion currently lacks domain-level protections for statutory rows and rows already referenced by leave usage.
This creates data-integrity and compliance risks.

## Scope

### In Scope

- Add leave policy delete guards for:
  - statutory policies
  - policies with active leave-request usage
- Implement soft-delete behavior for leave policies (`ACTIVE` -> `ARCHIVED`).
- Expose leave policy list API with `usageCount` and `isStatutory`.
- Add schema/migration updates needed for policy status/statutory metadata and request-policy usage linkage.

### Out of Scope

- UI redesign for leave policy management.
- Historical data repair for previously deleted leave policy records.

## Data Changes (Tables and Migrations)

- Tables:
  - `LeavePolicy`
  - `LeaveRequest`
- Migration IDs:
  - `202603050007_wi0935_leave_policy_validation`
- Backward compatibility plan:
  - additive schema with soft-delete status and nullable request-policy reference
  - existing leave policy read/upsert behavior remains available via non-statutory active policy selection

## API and Event Changes

- Endpoints:
  - `GET /api/leave/policies`
  - `DELETE /api/leave/policies/{policyId}`
- Events published:
  - none
- Events consumed:
  - none

## Test Plan

- Integration:
  - statutory policy delete returns `400`
  - policy with usage delete returns `400`
  - unused non-statutory policy delete archives successfully
  - default policy list excludes archived rows
  - employee role delete attempt returns `403`
- Regression:
  - existing leave request lifecycle (`/api/leave/requests`) remains functional
  - existing leave policy read/upsert (`/api/leave/policy`) remains functional

## Rollback Plan

- Feature rollback:
  - disable new leave policy deletion/list usage path
- DB rollback method:
  - revert migration and restore previous leave policy uniqueness model if required
- Recovery target time:
  - 30 minutes
