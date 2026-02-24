# WI-0379: Admin/employee runtime locale format guard

## Summary
- Hardened core admin/employee datetime formatting to require explicit runtime locale input.
- Updated admin and employee page-level datetime helper signatures from optional default locale to required `runtimeLocale: string`.
- Added regression guard to prevent fallback to fixed default locale in core page helpers.

## Scope
- `src/app/admin/page-helpers.ts`
- `src/app/employee/page-helpers.ts`
- `scripts/tests/e2e-wi0379-admin-employee-runtime-locale-format-guard.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0379-admin-employee-runtime-locale-format-guard.test.ts`
- `npm.cmd run -s typecheck`
