# Staging Secrets Baseline

`staging-prisma-integration` requires all secrets below on the repository:

- `FLOWHR_STAGING_DATABASE_URL`
- `FLOWHR_STAGING_DIRECT_URL`
- `FLOWHR_STAGING_SUPABASE_URL`
- `FLOWHR_STAGING_ANON_KEY`
- `FLOWHR_STAGING_SERVICE_ROLE_KEY`

## Setup Rule

- Use a dedicated Supabase staging project.
- Do not reuse production project URL/keys in staging secrets.

## CLI Update Example

```bash
gh secret set FLOWHR_STAGING_DATABASE_URL -b"<session-pooler-url>"
gh secret set FLOWHR_STAGING_DIRECT_URL -b"<direct-or-reachable-url>"
gh secret set FLOWHR_STAGING_SUPABASE_URL -b"https://<staging-ref>.supabase.co"
gh secret set FLOWHR_STAGING_ANON_KEY -b"<staging-anon-key>"
gh secret set FLOWHR_STAGING_SERVICE_ROLE_KEY -b"<staging-service-role-key>"
```

## Verification

- `gh secret list` should include all five names.
- On `main` push, `staging-prisma-integration` must run (not skip) and pass.
