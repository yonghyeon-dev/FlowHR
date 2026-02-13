# Production Rollout: Payroll Phase2 Flag

Target flag: `FLOWHR_PAYROLL_DEDUCTIONS_V1`

## Current Baseline

- GitHub environment `production`: created.
- `FLOWHR_PAYROLL_DEDUCTIONS_V1=true` in `production` environment.
- External runtime sync completed on Vercel project `flowhr`.

## Rollout Policy

1. Keep `false` while legacy consumers still rely on gross-only flow.
2. Move to canary (`true`) only after staging CI and consumer checks pass.
3. If issue occurs, immediately revert to `false`.

## CLI Commands

Set `false`:

```bash
gh variable set FLOWHR_PAYROLL_DEDUCTIONS_V1 --env production --body "false" -R yonghyeon-dev/FlowHR
```

Set `true`:

```bash
gh variable set FLOWHR_PAYROLL_DEDUCTIONS_V1 --env production --body "true" -R yonghyeon-dev/FlowHR
```

Verify:

```bash
gh variable list --env production -R yonghyeon-dev/FlowHR
```

## Runtime Note

This GitHub environment variable affects workflows that bind `environment: production`.
If production runtime is hosted outside GitHub Actions (for example Vercel/Render), set the same flag there too.

Vercel sync status:

- Project: `yh-devs-projects/flowhr`
- Production URL: `https://flowhr-two.vercel.app`
- Framework preset is controlled by `vercel.json` (`nextjs`)
- Production env `FLOWHR_PAYROLL_DEDUCTIONS_V1=true`

## Rollback

1. Set `FLOWHR_PAYROLL_DEDUCTIONS_V1=false`.
2. Re-run production smoke/integration workflow if available.
3. Keep gross-only endpoint (`/api/payroll/runs/preview`) as fallback path.
