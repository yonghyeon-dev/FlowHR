# WI-0908 Notice Department Targeting

## Scope
- Added notice department-targeting payload and persistence fields:
  - `targetDepartmentIds?: string[]` on notice create/update contracts
  - notice entity read model now carries `targetDepartmentIds`
- Updated notices API:
  - `POST /api/notices` stores `targetDepartmentIds`
  - `GET /api/notices` returns, for `employee` role, only:
    - notices targeted to employee's own department
    - notices without department targeting (global)
  - admin/manager behavior remains unchanged (full list)
- Updated admin notice compose UI:
  - added department multi-select (checkbox dropdown) in compose form
  - loads department options from `GET /api/people/departments`
  - no selection means global notice
- Added e2e coverage:
  - `scripts/tests/e2e-wi0908-notice-targeting.test.ts`

## Data Model
- `Notice.targetDepartmentIds` added in Prisma schema as `String[] @default([])`.
- Migration:
  - `prisma/migrations/202603050001_wi0908_notice_department_targeting/migration.sql`

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0908-notice-targeting.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
