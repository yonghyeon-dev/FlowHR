# Staging Secrets Baseline

`staging-prisma-integration` requires all secrets below on the repository:

- `FLOWHR_STAGING_DATABASE_URL`
- `FLOWHR_STAGING_DIRECT_URL`
- `FLOWHR_STAGING_SUPABASE_URL`
- `FLOWHR_STAGING_ANON_KEY`
- `FLOWHR_STAGING_SERVICE_ROLE_KEY`

## Execution Toggle

- Staging CI is `OFF` by default.
- Enable only when needed by setting repository variable `FLOWHR_ENABLE_STAGING_CI=true`.

## Setup Rule

- Use the same FlowHR Supabase project but force `schema=staging` for all staging DB URLs.
- Never use a URL without `schema=staging` in staging secrets.

## CLI Update Example

```bash
gh secret set FLOWHR_STAGING_DATABASE_URL -b"<session-pooler-url>?schema=staging"
gh secret set FLOWHR_STAGING_DIRECT_URL -b"<direct-or-reachable-url>?schema=staging"
gh secret set FLOWHR_STAGING_SUPABASE_URL -b"https://<flowhr-project-ref>.supabase.co"
gh secret set FLOWHR_STAGING_ANON_KEY -b"<flowhr-anon-key>"
gh secret set FLOWHR_STAGING_SERVICE_ROLE_KEY -b"<flowhr-service-role-key>"
```

## Verification

- `gh secret list` should include all five names.
- `FLOWHR_STAGING_DATABASE_URL` and `FLOWHR_STAGING_DIRECT_URL` must include `schema=staging`.
- On `main` push, `staging-prisma-integration` must run (not skip) and pass.
