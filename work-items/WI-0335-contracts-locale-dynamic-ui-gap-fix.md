# WI-0335: Contracts locale dynamic UI gap fix

## Summary
- Localized contracts surfaces with browser-locale dynamic copy (`ko`/`en`) using `useI18n`.
- Added shared contract copy and label dictionaries for category/status/action text.
- Applied runtime locale date formatting (`ko-KR`/`en-US`) for contracts timestamps.

## Scope
- `src/components/contracts/copy.ts` (new)
- `src/components/contracts/AdminContractsWorkspace.tsx`
- `src/components/contracts/ContractTemplateBuilder.tsx`
- `src/components/contracts/EmployeeContractsInbox.tsx`
- `scripts/tests/e2e-wi0174-admin-contracts-ux-baseline.test.ts`
- `scripts/tests/e2e-wi0335-contracts-locale-dynamic-ui-gap-fix.test.ts` (new)
- `ROADMAP.md`
- `package.json`

## Notes
- No API, contract schema, scheduler, webhook, or ops-infra expansion was added.
- This WI is UI locale consistency hardening only.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0335-contracts-locale-dynamic-ui-gap-fix.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0174-admin-contracts-ux-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0276-0281-contract-lifecycle-bundle.test.ts`
- `npm.cmd run typecheck`
