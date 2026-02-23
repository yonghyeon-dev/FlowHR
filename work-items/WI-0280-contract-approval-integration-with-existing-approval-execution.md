# WI-0280: Contract Approval Integration with Existing Approval Execution

## Background

Contract send flow required integration with existing approval execution primitives.

## Scope

- add contract approval endpoints
  - `POST /contracts/documents/{documentId}/request-approval`
  - `POST /contracts/documents/{documentId}/approval` (`APPROVE`/`REJECT`)
- reuse approval execution state machine and map state into contract approval status
- enforce send guard based on approval completion

## Out of Scope

- new approval domain enum migration (`CONTRACT`)
- scheduler/escalation automation

## Validation

- e2e contracts lifecycle suite verifies request/approve/reject/send gate behavior
- `npm.cmd run typecheck`
- `npm.cmd run build`
