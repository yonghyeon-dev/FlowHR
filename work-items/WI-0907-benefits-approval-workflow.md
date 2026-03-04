# WI-0907 Benefits Approval Workflow Integration

## Scope
- Linked benefits request creation to approval execution queue:
  - `POST /api/benefits/requests`
  - file: `src/app/api/benefits/requests/route.ts`
- Linked benefits decision endpoint to approval execution state updates:
  - `POST /api/benefits/requests/{requestId}/decision`
  - file: `src/app/api/benefits/requests/[requestId]/decision/route.ts`
- Extended admin approval queue actions so benefit requests can be approved/rejected from `/admin/approval-executions`:
  - files:
    - `src/app/admin/approval-executions/page.tsx`
    - `src/app/admin/approval-executions/page-helpers.ts`
    - `src/app/admin/approval-executions/page-sections-queue.tsx`
- Added end-to-end test:
  - `scripts/tests/e2e-wi0907-benefits-approval.test.ts`

## Backend Behavior
- On benefits request creation, the API now creates a matching approval execution record:
  - `targetEntityType: "BENEFIT_REQUEST"`
  - `targetEntityId: <benefit request id>`
  - `state: "PENDING"`
- On benefits approval/rejection decision, the API now updates the matching approval execution state:
  - `APPROVED` when decision is approved
  - `REJECTED` when decision is rejected
- Legacy safety path:
  - if no execution exists at decision time, the decision endpoint creates one with the finalized state.

## Admin Queue UX
- Approval queue quick-jump now routes `BENEFIT_REQUEST` executions to `/admin/benefits`.
- Approve/Reject actions now support `BENEFIT_REQUEST` execution items.
- Benefit actions call:
  - `POST /api/benefits/requests/{requestId}/decision`
  - approve payload: `{ decision: "APPROVED" }`
  - reject payload: `{ decision: "REJECTED", reviewNote: "..." }`

## E2E Scenario
1. Employee creates a benefits request.
2. Manager reads `GET /api/approval/executions` and sees pending `BENEFIT_REQUEST` item.
3. Manager approves via benefits decision endpoint.
4. Request becomes `APPROVED` and approval execution state becomes `APPROVED`.

## Verification
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd exec tsx scripts/tests/e2e-wi0907-benefits-approval.test.ts`
