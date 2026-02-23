# WI-0278: Employee Contract Inbox Self-Service

## Background

Employees had no self-service route to view/respond to contract documents.

## Scope

- add employee contract inbox route
  - `/employee/contracts`
- add employee contracts read/respond API usage
  - list own documents
  - sign/reject response actions
- enforce own-scope authorization for employee inbox and response actions

## Out of Scope

- in-app push/email reminder automation

## Validation

- e2e contracts lifecycle suite covers own-scope read/respond behavior
- `npm.cmd run typecheck`
- `npm.cmd run build`
