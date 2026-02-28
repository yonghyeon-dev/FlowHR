# WI-0641 Employee Contracts Response Deadline Status Visibility

## Summary
- improved `/employee/contracts` response detail panel with explicit deadline visibility:
  - added `응답 기한/Expires at` row for selected document
  - added `기한 상태/Deadline status` row with D-day based urgency text (`임박 D-n`, `초과 D+n`, `정상`, `해당 없음`)
- expanded contracts locale copy keys for deadline labels and urgency prefixes in both ko/en
- reused existing inbox deadline helper functions so risk logic stays consistent between list and detail panels

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0641-employee-contracts-response-deadline-status-visibility.test.ts`
- `npm.cmd run typecheck`
