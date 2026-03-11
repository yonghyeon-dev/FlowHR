# WI-1135: admin payroll preview state isolation

## Background

`WI-1133` and `WI-1134` removed the embedded payroll form from the admin dashboard, but the shared dashboard state and dashboard action builder still own the payroll preview form state used only by `/admin/payroll-close/preview-builder`.

- The admin home route no longer renders payroll form controls.
- The preview-builder route is the only surface that still needs payroll preview draft state and preset-share replay.
- Keeping that draft state in `useAdminDashboardState` keeps the home shell heavier than necessary and blurs the route-first seam.

## Goal

1. Remove payroll preview draft state from `useAdminDashboardState`.
2. Move preview-builder-only payroll draft state and share-link replay into a dedicated hook under `/admin/payroll-close/preview-builder`.
3. Move preview-builder-only preview action wiring out of `buildAdminDashboardActions`.

## Scope

- `src/app/admin/page-state.ts`
- `src/app/admin/page-dashboard-actions.ts`
- `src/app/admin/payroll-close/preview-builder/page-client.tsx`
- `src/app/admin/payroll-close/preview-builder/page-state.ts`
- `src/app/admin/payroll-close/preview-builder/page-actions.ts`
- `scripts/tests/e2e-wi1135-admin-payroll-preview-state-isolation.test.ts`
- `docs/production-operating-progress.md`

## Out of Scope

- Replacing the preview-builder form UI itself
- Reworking payroll close queue summaries on the admin home route
- Decomposing the full admin dashboard state hook beyond this payroll seam

## Done Criteria

1. `useAdminDashboardState` no longer exposes payroll preview draft fields or preset-share replay callbacks.
2. `/admin/payroll-close/preview-builder` uses a dedicated payroll preview builder state hook and action builder.
3. `buildAdminDashboardActions` no longer contains payroll preview draft input dependencies.
4. A regression guard covers the seam so dashboard state ownership does not silently regress.
