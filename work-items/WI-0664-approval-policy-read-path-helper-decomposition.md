# WI-0664 Approval Policy/Gate Read-Path Helper Decomposition

## Summary
- extracted approval policy read-path helpers from
  `src/features/approval/service.ts` into:
  - `src/features/approval/policy-read-helpers.ts`
- moved reusable read-path blocks:
  - policy fallback read-result resolver (`policy + configured`)
  - gate preview actor-context resolver
  - gate preview view-model builder
  - gate preview audit payload builder
- rewired `previewApprovalPolicyGate` and `readApprovalPolicy` to use helper exports and keep service focused on orchestration.
- kept policy/gate read behavior unchanged.
- added WI-0664 regression guard for helper decomposition and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0664-approval-policy-read-path-helper-decomposition.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0115-approval-gate-preview.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0103-approval-policy-delegation.test.ts`
- `npm.cmd run typecheck`
