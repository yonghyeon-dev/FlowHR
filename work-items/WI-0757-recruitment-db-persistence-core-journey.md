# WI-0757 Recruitment DB Persistence Core Journey

## Summary
- replaced recruitment in-memory arrays with runtime data-access backed persistence (`memory`/`prisma`).
- added dedicated recruitment stores (`dataAccess.recruitment`) for openings/referrals CRUD and list filters.
- updated recruitment APIs to await async persistence calls in DB mode:
  - `GET/POST /api/recruitment/openings`
  - `GET/POST /api/recruitment/referrals`
  - `POST /api/recruitment/referrals/{referralId}/stage`
  - `POST /api/recruitment/referrals/{referralId}/withdraw`
- kept existing product journey/UX and stage semantics while moving state durability to DB.

## Scope
- recruitment persistence core journey only
- no new ops/scheduler/cron/actions expansion
- no phase-style UI layering

## Data Changes
- Prisma models: `RecruitmentOpening`, `RecruitmentReferral`
- Migration: `202603020002_wi0757_recruitment_db_persistence`

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0757-recruitment-db-persistence-core-journey.test.ts`
- `python scripts/ci/check_traceability.py`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_prisma_migration_encoding.py`
- `npm.cmd run typecheck`
