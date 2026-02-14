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

Recommended Node.js version: `20.x` (see `.nvmrc`).

```bash
npm install
npm run prisma:generate
npm run dev
```

If you need port `3001` locally:

```bash
npm run dev:3001
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
- Payroll phase2 preview endpoint is gated by `FLOWHR_PAYROLL_DEDUCTIONS_V1=true`.
- Payroll deduction profile mode is additionally gated by `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1=true`.

## Domain Event Publication Adapter

- Service layer emits contract event names (`*.v1`) through `DomainEventPublisher`.
- Default runtime publisher is no-op (`FLOWHR_EVENT_PUBLISHER` unset or `noop`).
- For local verification, set `FLOWHR_EVENT_PUBLISHER=memory`.
- External HTTP transport mode:
  - `FLOWHR_EVENT_PUBLISHER=http`
  - `FLOWHR_EVENT_HTTP_URL=https://...`
  - optional `FLOWHR_EVENT_HTTP_TOKEN`
  - optional `FLOWHR_EVENT_HTTP_TIMEOUT_MS` (default `3000`)
  - optional `FLOWHR_EVENT_HTTP_RETRY_COUNT` (default `2`)
  - optional `FLOWHR_EVENT_HTTP_FAIL_OPEN` (default `true`)

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

Staging Prisma integration is opt-in.
Main-branch push runs Prisma-backed route e2e only when repository variable
`FLOWHR_ENABLE_STAGING_CI=true` is set and these secrets are configured:

- `FLOWHR_STAGING_DATABASE_URL`
- `FLOWHR_STAGING_DIRECT_URL`
- `FLOWHR_STAGING_SUPABASE_URL`
- `FLOWHR_STAGING_ANON_KEY`
- `FLOWHR_STAGING_SERVICE_ROLE_KEY`

Optional staging environment variable:

- `FLOWHR_PAYROLL_DEDUCTIONS_V1` (`true|false`) for phase2 runtime rollout validation.

Details: `docs/staging-secrets.md`
Production rollout: `docs/production-rollout.md`

## Current API Surface (MVP)

- Attendance:
  - `GET /api/attendance/records` (query: `from`, `to`, optional `employeeId`, optional `state`)
  - `GET /api/attendance/aggregates` (query: `from`, `to`, optional `employeeId`)
  - `POST /api/attendance/records`
  - `PATCH /api/attendance/records/{recordId}`
  - `POST /api/attendance/records/{recordId}/approve`
  - `POST /api/attendance/records/{recordId}/reject`
- Payroll:
  - `GET /api/payroll/runs` (query: `from`, `to`, optional `employeeId`, optional `state`)
  - `POST /api/payroll/runs/preview`
  - `POST /api/payroll/runs/preview-with-deductions` (feature flag: `FLOWHR_PAYROLL_DEDUCTIONS_V1=true`, profile mode optional `expectedProfileVersion`)
  - `POST /api/payroll/runs/{runId}/confirm`
  - `GET /api/payroll/deduction-profiles` (optional query: `active`, `mode`)
  - `GET /api/payroll/deduction-profiles/{profileId}`
  - `PUT /api/payroll/deduction-profiles/{profileId}`
- Leave:
  - `GET /api/leave/requests` (query: `from`, `to`, optional `employeeId`, optional `state`)
  - `POST /api/leave/requests`
  - `PATCH /api/leave/requests/{requestId}`
  - `POST /api/leave/requests/{requestId}/approve`
  - `POST /api/leave/requests/{requestId}/reject`
  - `POST /api/leave/requests/{requestId}/cancel`
  - `GET /api/leave/balances/{employeeId}`
  - `POST /api/leave/accrual/settle`

## Payroll Phase 2 Contract Artifacts

- Work item: `work-items/WI-0005-payroll-phase2-deductions-tax-contract.md`
- Contract: `specs/payroll/contract.yaml` (v1.5.0)
- Compatibility matrix: `specs/payroll/phase2-compatibility-matrix.md`
