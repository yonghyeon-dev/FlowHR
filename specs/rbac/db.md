# RBAC Database Notes

## Owned Tables

- `Role`
- `RolePermission`

## Migrations

- `202602150001_rbac_foundation`

## Notes

- The RBAC tables are additive.
- Default roles and permissions are seeded by the migration.
- Existing role claims (`app_metadata.role`) remain the primary role assignment source for now.

