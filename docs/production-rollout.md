# Production Rollout: Payroll Phase2 Flag

Target flags: `FLOWHR_PAYROLL_DEDUCTIONS_V1`, `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1`

## Current Baseline

- GitHub environment `production`: created.
- `FLOWHR_PAYROLL_DEDUCTIONS_V1=true` in `production` environment.
- `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1=false` in `production` environment.
- External runtime sync completed on Vercel project `flowhr`.

## Rollout Policy

1. Keep `false` while legacy consumers still rely on gross-only flow.
2. Move to canary (`true`) only after staging CI and consumer checks pass.
3. If issue occurs, immediately revert to `false`.
4. Keep `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1=false` until business sign-off for profile-mode rollout.

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
- Production env `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1=false`

## Production Auth Smoke (GitHub Actions)

Manual workflow: `.github/workflows/production-auth-smoke.yml`
Scheduled: daily (`00:20 UTC`)

Required production environment variable:

- `FLOWHR_PRODUCTION_BASE_URL` (example: `https://flowhr-two.vercel.app`)

Required production environment secrets:

- `FLOWHR_PRODUCTION_SUPABASE_URL`
- `FLOWHR_PRODUCTION_ANON_KEY`
- `FLOWHR_PRODUCTION_SERVICE_ROLE_KEY`
- `FLOWHR_PRODUCTION_DATABASE_URL`
- `FLOWHR_PRODUCTION_DIRECT_URL`

Run command:

```bash
gh workflow run production-auth-smoke.yml -R yonghyeon-dev/FlowHR
```

## Phase2 Health Monitoring (GitHub Actions)

Workflow: `.github/workflows/payroll-phase2-health.yml`

- Runs hourly and can be triggered manually.
- Reads audit events:
  - `payroll.deductions_calculated`
  - `payroll.preview_with_deductions.failed`
  - `payroll.confirmed`
- Tracks `403` / `409` failure ratios for phase2 preview path.
- Health gate behavior:
  - When `FLOWHR_PAYROLL_DEDUCTIONS_V1=false`, the workflow reports metrics but skips failing the job (no incident noise while phase2 is disabled).
  - `409` failures caused by disabled rollout flags (e.g. `payroll_deduction_profile_v1 feature flag is disabled`) are counted separately as "expected" when the corresponding flag is off, and excluded from the gate ratio.
- Creates GitHub issue on failure and can notify Discord/Slack when webhook secrets are configured.
- Webhook notification payload is sent via `scripts/ops/notify-slack-failure.mjs` (Discord/Slack auto-detect).

Tunable production environment variables:

- `FLOWHR_PAYROLL_DEDUCTIONS_V1` (default `false`): gate on/off for phase2 health.
- `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1` (default `false`): profile-mode gate alignment for expected 409 classification.
- `FLOWHR_PHASE2_HEALTH_WINDOW_HOURS` (default `24`)
- `FLOWHR_PHASE2_HEALTH_MIN_ATTEMPTS` (default `1`)
- `FLOWHR_PHASE2_HEALTH_MAX_403_RATIO` (default `0.20`)
- `FLOWHR_PHASE2_HEALTH_MAX_409_RATIO` (default `0.20`)

## Rollback Automation (GitHub Actions)

Workflow: `.github/workflows/payroll-phase2-rollback.yml`

- Manual trigger (`workflow_dispatch`) + weekly scheduled rehearsal (`Monday 00:30 UTC`).
- Manual execution requires confirmation phrase `ROLLBACK_PHASE2`.
- Scheduled execution is forced `dry_run=true` and `deploy_vercel=false`.
- Supports `dry_run=true` for rehearsal without mutating flags.
- Always sets GitHub production variable:
  - `FLOWHR_PAYROLL_DEDUCTIONS_V1=false`
- Optional Vercel sync+deploy (`deploy_vercel=true`):
  - requires production secret `VERCEL_TOKEN`
  - uses production vars:
    - `VERCEL_SCOPE` (default `yh-devs-projects`)
    - `VERCEL_PROJECT_NAME` (default `flowhr`)

## Alert Webhook Smoke Check

Workflow: `.github/workflows/alert-webhook-smoke.yml`

- Manual trigger only.
- Fails fast when neither `FLOWHR_ALERT_DISCORD_WEBHOOK` nor `FLOWHR_ALERT_SLACK_WEBHOOK` is configured.
- Sends one Discord/Slack message to validate webhook connectivity and payload format.

Run command:

```bash
gh workflow run alert-webhook-smoke.yml -R yonghyeon-dev/FlowHR
```

## Rollback

1. Set `FLOWHR_PAYROLL_DEDUCTIONS_V1=false`.
2. Set `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1=false` when profile mode rollout starts.
3. Re-run production smoke/integration workflow if available.
4. Keep gross-only endpoint (`/api/payroll/runs/preview`) as fallback path.
