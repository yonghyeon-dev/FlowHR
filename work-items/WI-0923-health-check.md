# WI-0923 Health Check Endpoint and Production Readiness

## Scope
- Add a public health check API endpoint for post-deployment monitoring.
- Update `.env.example` with recently introduced runtime variables and one-line comments.
- Add a production-readiness script for build, required-env, and Prisma migration sync checks.
- Add e2e coverage for `GET /api/health`.

## Implementation
- `src/app/api/health/route.ts`
  - Added unauthenticated `GET` handler.
  - Returns `status`, `timestamp`, `version`, and `environment`.
  - Added optional Prisma DB probe (`SELECT 1`) and degrades response status to `degraded` when probe fails.
  - Skips DB probe when running with `FLOWHR_DATA_ACCESS=memory`.

- `.env.example`
  - Added missing runtime variables introduced by recent work items and ops scripts.
  - Added one-line description comments for each variable.
  - Included optional legacy alias keys used as fallbacks in runtime helpers.

- `scripts/check-prod-readiness.ts`
  - Runs `npm run build` and reports success/failure.
  - Parses `.env.example` and validates all required keys are present in effective runtime env (`process.env` + local `.env*`).
  - Runs `prisma migrate status --schema prisma/schema.prisma` to verify migration sync.
  - Exits with non-zero code if any check fails.

- `scripts/tests/e2e-wi0923-health-check.test.ts`
  - Verifies health route file and `GET` handler exist.
  - Verifies `GET /api/health` semantics: HTTP 200, `body.status === "ok"`, and `body.timestamp` present.

## Verification
- `npx tsx scripts/tests/e2e-wi0923-health-check.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

## Notes
- Health endpoint is intentionally public and does not rely on actor headers.
- DB probing is optional and environment-aware to keep memory-mode test runs deterministic.
