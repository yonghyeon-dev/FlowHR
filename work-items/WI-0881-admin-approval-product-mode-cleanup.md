# WI-0881 Admin Approval Product-Mode Cleanup

## Summary
- Applied product-mode auth gating to admin approval policy/templates/history pages.
- In production with devtools off, actor header fallback is blocked and login session is required.
- Repaired broken Korean locale copy in three approval locale helper files to stop mojibake output.

## Scope
- `src/app/admin/approval-policy/page.tsx`
- `src/app/admin/approval-templates/page.tsx`
- `src/app/admin/approval-history/page.tsx`
- `src/app/admin/approval-policy/page-locale-helpers.ts`
- `src/app/admin/approval-templates/page-locale-helpers.ts`
- `src/app/admin/approval-history/page-locale-helpers.ts`
- `scripts/tests/e2e-wi0881-admin-approval-product-mode-cleanup.test.ts` (new)

## Acceptance
1. Production runtime + `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` disabled requires bearer session on all three approval pages.
2. Actor header fallback is only allowed in devtools mode or non-production runtime.
3. Broken Korean strings in approval policy/templates/history locale helper files are normalized.
4. Existing product-UX checks (`WI-0644~0646`) continue to pass.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0644-admin-approval-history-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0645-admin-approval-policy-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0646-admin-approval-templates-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0881-admin-approval-product-mode-cleanup.test.ts`
- `npm.cmd run build`
