# WI-0144: Staging CI Migration Bootstrap for Schema-Local Enums

## Background and Problem

`main` CI repeatedly failed at `staging-prisma-integration` with Prisma migration error:

- `P3018`
- `ERROR: type "ApprovalStageResolution" does not exist`

The failure occurs in staging schema bootstrap flow (`DROP SCHEMA ... CREATE SCHEMA ...`) while running legacy migrations that check enum existence via `pg_type` without namespace filtering.

In shared Postgres environments, this can cause enum checks to pass against another schema while the target `staging` schema still misses the enum type.

## Scope

### In Scope

- Update `.github/workflows/ci.yml` staging deploy step:
  - keep schema reset (`DROP/CREATE staging`)
  - add schema-local enum bootstrap SQL before `prisma migrate deploy`
  - bootstrap enums:
    - `staging.ApprovalStageResolution`
    - `staging.ApprovalExecutionState`
    - `staging.ApprovalExecutionAction`
- Ensure workflow remains idempotent for repeated runs.

### Out of Scope

- Prisma migration history rewrite
- Existing migration SQL file edits (already applied history)
- API/DB contract changes
- UI changes

## User Scenarios

1. 운영자는 `main` 머지 후에도 `staging-prisma-integration`이 반복 실패하지 않고 통과한다.
2. 스테이징 스키마를 매 실행마다 초기화해도 enum 누락으로 마이그레이션이 중단되지 않는다.

## Data and API Changes

- No DB schema contract changes (CI bootstrap SQL only)
- No API changes

## Rollback Plan

- Remove enum bootstrap SQL block from `.github/workflows/ci.yml`.
- Re-run CI to confirm behavior returns to previous state.

## Definition of Done (DoD)

- [x] `staging-prisma-integration` pre-migration SQL includes schema-local enum bootstrap.
- [x] enum bootstrap SQL is idempotent.
- [x] change is isolated to CI workflow/docs.
