# WI-0281: Manual Contract Expiry and Renewal Management

## Background

Admins needed lifecycle completion after send/sign via manual expiry and renewal actions.

## Scope

- add manual lifecycle actions
  - `POST /contracts/documents/{documentId}/expire`
  - `POST /contracts/documents/{documentId}/renew`
- renewal creates new DRAFT document and marks source as `RENEWED`
- `/admin/contracts` UI exposes expire/renew actions

## Out of Scope

- cron-based auto-expiry/auto-renew policies

## Validation

- e2e contracts lifecycle suite verifies expire/renew status transitions
- `npm.cmd run typecheck`
- `npm.cmd run build`
