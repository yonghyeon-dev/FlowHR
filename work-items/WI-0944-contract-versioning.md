# WI-0944: Contract Template Version Control with Change History

## Background and Problem

Contract templates can be edited after documents have already been sent/signed.
Without explicit template version history, historical signed contracts can be interpreted using the latest template body, which is incorrect.

## Scope

### In Scope

- Enhance `PATCH /api/contracts/templates/[templateId]` to:
  - snapshot current template state as a version record before update
  - increment template `version` on every PATCH update
  - return updated template with incremented version
- Add `GET /api/contracts/templates/[templateId]/versions`:
  - admin role only
  - returns template version history in descending version order
  - response shape: `[{ version, content, modifiedAt, modifiedBy }]`
- Add `GET /api/contracts/templates/[templateId]/versions/[version]`:
  - admin role only
  - returns one template version record with content
- Add `contractTemplateVersions` store to shared data access:
  - in-memory implementation backed by per-template snapshot array
  - prisma implementation backed by audit log records
- Preserve existing signed-contract behavior:
  - contract documents keep `templateId + templateVersion`
  - existing signed contracts continue to reference historical template version content

### Out of Scope

- Contract template rollback/restore API.
- UI for browsing or diffing template history.
- Prisma schema migration for dedicated `ContractTemplateVersion` table.

## API and Validation Notes

- Template version history APIs reject non-admin actors with `403`.
- Version path parameter is validated as positive integer (`>= 1`).
- Version history returns latest current template version plus snapshot records for prior versions.

## Data Changes

- Shared data-access contract:
  - `ContractTemplateVersionEntity`
  - `ContractTemplateVersionStore`
  - `DataAccess.contractTemplateVersions`
- Memory data access:
  - add snapshot map keyed by `templateId`
- Prisma data access:
  - store/read template-version snapshots via `auditLog`

## Test Plan

- `scripts/tests/e2e-wi0944-contract-versioning.test.ts`
  - create template -> version `1`
  - create/send/sign document using v1 template
  - patch template -> version `2`
  - list versions -> `[v2, v1]` descending
  - get specific `v1` -> correct content
  - verify signed document still references `templateVersion: 1` and v1-based hash
  - employee role receives `403` for version-history APIs

## Rollback Plan

- Remove version-history API routes and service methods.
- Revert template PATCH snapshot/version behavior.
- Remove data-access `contractTemplateVersions` store additions.
- Remove WI-0944 e2e test and this work-item document.
