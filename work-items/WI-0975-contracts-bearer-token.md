# WI-0975: Contracts API bearer token propagation

## Background and Problem

Some contracts UI components call raw `fetch()` without passing an `Authorization: Bearer <token>` header.
In production this can make actor/session resolution fail and return unauthorized API responses.

## Scope

### In Scope

- Add bearer token headers to raw `fetch()` calls in `src/components/contracts/useAdminContractsWorkspaceActions.ts`.
- Add bearer token headers to template create API call in `src/components/contracts/ContractTemplateBuilder.tsx`.
- Add bearer token headers to document load/respond/signature-evidence API calls in `src/components/contracts/EmployeeContractsInbox.tsx`.
- Read token from `useSupabaseSession()` `snapshot.accessToken`.

### Out of Scope

- API contract/schema/migration changes.
- Contracts route structure changes.

## Test Plan

- `node --experimental-strip-types scripts/tests/e2e-wi0975-contracts-bearer-token.test.ts`
- `npm run typecheck`

## ADR

- Not required: scoped bug fix for missing auth header propagation without architecture changes.