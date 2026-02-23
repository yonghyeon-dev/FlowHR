# WI-0277: Contract Document Draft and Send Lifecycle

## Background

Contract templates alone were not enough; admins needed per-employee draft/send execution.

## Scope

- add contract document lifecycle API
  - `GET /contracts/documents`
  - `POST /contracts/documents`
  - `POST /contracts/documents/{documentId}/send`
- enforce send preconditions with approval guard when `requiresApproval=true`
- expose document status/approval state/hash metadata in read API

## Out of Scope

- scheduler-based send automation
- multi-channel delivery orchestration

## Validation

- e2e contracts lifecycle suite covers draft creation and send guards
- `npm.cmd run typecheck`
- `npm.cmd run build`
