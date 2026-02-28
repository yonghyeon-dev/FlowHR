# WI-0637 Employee Guide Korean Copy Normalization

## Summary
- normalized corrupted Korean copy in `employee-guide/copy.ts` to readable UTF-8 text
- kept key structure and EN defaults unchanged while improving KO readability
- updated legacy locale regression assertions to track normalized Korean labels

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0637-employee-guide-korean-copy-normalization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0238-employee-in-app-guide-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0355-employee-guide-locale-dynamic-ui-gap-fix.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
