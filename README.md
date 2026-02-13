# FlowHR

Contract-first HRM SaaS starter with Next.js, Supabase, and Prisma.

## Stack

- React + Next.js (App Router, TypeScript)
- Supabase (Auth and platform services)
- PostgreSQL + Prisma
- GitHub Actions CI

## Environment

Copy `.env.example` to `.env.local` and fill real values.

Important:

- `DATABASE_URL` is for Prisma runtime (session pooler).
- `DIRECT_URL` is for Prisma migrations (direct DB endpoint).
- API routes resolve actor context from Supabase JWT bearer token.
- Canonical role claim is `app_metadata.role` (see `docs/role-claims.md`).
- Development fallback: `x-actor-role` and `x-actor-id` headers are accepted only outside production.

## Local Run

```bash
npm install
npm run prisma:generate
npm run dev
```

## Prisma

```bash
npm run prisma:validate
npm run prisma:migrate:dev
```

## Supabase CLI (optional but recommended)

```bash
supabase login
supabase link --project-ref zjritguxyfdzzxuwcizv
supabase db pull
```

Use Supabase CLI for schema sync/inspection while Prisma remains the app ORM and migration tool.

## Test Data Access Mode

- Default runtime uses Prisma.
- For API route tests without database, set `FLOWHR_DATA_ACCESS=memory`.
- For Prisma-backed route smoke test, run `npm run test:e2e:prisma` with DB env set.

## Role Claim Governance

- Canonical role claim: `app_metadata.role` (`docs/role-claims.md`).
- Backfill preview: `npm run roles:backfill:dry`
- Backfill apply: `npm run roles:backfill:apply`
- Enforcement check: `npm run roles:claims:enforce`

## Contribution Flow

1. Create branch: `feature/WI-xxxx-*`
2. Update work item and contract docs first
3. Implement code and tests
4. Open PR with checklist evidence
5. Merge only after required CI checks pass

## Staging Prisma Integration (CI)

Main-branch push can run Prisma-backed route e2e when these repository secrets are configured:

- `FLOWHR_STAGING_DATABASE_URL`
- `FLOWHR_STAGING_DIRECT_URL`
