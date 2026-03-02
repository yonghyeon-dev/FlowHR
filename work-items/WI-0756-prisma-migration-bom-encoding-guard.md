# WI-0756 Prisma Migration BOM Encoding Guard

## Summary
- removed UTF-8 BOM bytes from migration file `prisma/migrations/202603020001_wi0755_notices_db_read_model/migration.sql` to fix PostgreSQL parser failure in staging migration deploy.
- added CI guard script `scripts/ci/check_prisma_migration_encoding.py` to block UTF-8 BOM in any `prisma/migrations/**/migration.sql`.
- added regression tests `scripts/ci/test_check_prisma_migration_encoding_regression.py`.
- wired both checks into `.github/workflows/ci.yml` under contract-governance job.

## Scope
- migration encoding reliability only
- no runtime feature behavior change
- no API/contract schema change

## Testing
- `python scripts/ci/check_prisma_migration_encoding.py`
- `python scripts/ci/test_check_prisma_migration_encoding_regression.py`
