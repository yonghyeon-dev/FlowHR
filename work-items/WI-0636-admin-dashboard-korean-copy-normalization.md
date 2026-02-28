# WI-0636 Admin Dashboard Korean Copy Normalization

## Summary
- normalized corrupted Korean strings on `/admin` dashboard to readable UTF-8 copy
- kept dashboard behavior and routing unchanged while improving Korean UX readability
- updated warning/CTA/KPI/panel text to consistent product language

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0636-admin-dashboard-korean-copy-normalization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0618-admin-dashboard-productization-and-session-context.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
