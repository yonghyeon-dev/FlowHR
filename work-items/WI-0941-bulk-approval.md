# WI-0941: Bulk Approval and Rejection API for Managers/Admins

## Background and Problem

Managers and admins can currently approve or reject attendance and leave one item at a time.
Operationally, this creates unnecessary overhead for daily queue handling.

## Scope

### In Scope

- Add `POST /api/admin/approvals/bulk`:
  - allow roles `admin` and `manager`
  - input:
    - `action`: `APPROVE` | `REJECT`
    - `items`: array of `{ type: "attendance" | "leave", id: string }`
    - `reason`: required when `action` is `REJECT`
  - max `50` items per request
  - process each item independently (partial success allowed)
  - response:
    - `processed`, `succeeded`, `failed`
    - per-item `results` with `success` or `error`
- Add `GET /api/admin/approvals/pending`:
  - allow roles `admin` and `manager`
  - combine pending items from attendance and leave
  - support query:
    - `type`: `attendance` | `leave`
    - `limit`
    - `offset`
  - response:
    - `items`: `{ type, id, employeeName, date, details }[]`
    - `total`
- Add e2e coverage for approval, rejection, partial failure, limit validation, and role guard.

### Out of Scope

- UI bulk action controls.
- Workflow changes to approval execution policy resolution.
- Background batch job scheduling for approvals.

## API and Validation Notes

- Reject action requires a non-empty `reason`.
- Requests with more than `50` items return `400`.
- Employee role is forbidden (`403`) for bulk approval endpoint.

## Test Plan

- `scripts/tests/e2e-wi0941-bulk-approval.test.ts`
  - create `3` pending attendance + `2` pending leave
  - list pending combined items
  - bulk approve all and verify state transitions
  - bulk reject with reason and verify state transitions
  - partial failure with one invalid ID returns mixed result statuses
  - `51` items returns `400`
  - employee role receives `403`

## Rollback Plan

- Remove `/api/admin/approvals/bulk` and `/api/admin/approvals/pending`.
- Remove shared admin approvals validation/auth helpers.
- Remove WI-0941 e2e test and work-item document.

