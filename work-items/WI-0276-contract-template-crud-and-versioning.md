# WI-0276: Contract Template CRUD and Versioning

## Background

FlowHR had `/admin/contracts` UI baseline but no executable template CRUD API or versioning behavior.

## Scope

- add contracts template API
  - `GET /contracts/templates`
  - `POST /contracts/templates`
  - `PATCH /contracts/templates/{templateId}`
- template content update bumps `version` when mutable content fields change
- audit-backed template snapshots for deterministic read-after-write behavior

## Out of Scope

- external legal clause engines
- e-sign provider integration

## Validation

- e2e contracts lifecycle suite covers template create/update/list and version bump
- `npm.cmd run typecheck`
- `npm.cmd run build`
