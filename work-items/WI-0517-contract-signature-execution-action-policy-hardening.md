# WI-0517: Contract Signature Execution Action Policy Hardening

## Summary
- Goal: prevent invalid contract lifecycle actions in admin UI and prevent employee response attempts before the document is actually sent.
- Scope:
  - `src/components/contracts/document-action-policy.ts`
  - `src/components/contracts/AdminContractsWorkspace.tsx`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0517-contract-signature-execution-action-policy-hardening.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `document-action-policy.ts` with:
  - `resolveAdminContractDocumentNextStep`
  - `resolveAllowedContractDocumentActions`
  - `canEmployeeRespondToContractDocument`
- Rewired admin contracts lifecycle actions:
  - only policy-allowed actions are rendered per document state.
  - next-step guidance is displayed per document.
- Rewired employee contracts response:
  - pending-response status now aligns with runtime policy (`SENT` only).
  - sign/reject actions are disabled for non-respondable states with explicit guidance copy.
- Preserved line budgets:
  - `AdminContractsWorkspace.tsx` 259 (<=260)
  - `EmployeeContractsInbox.tsx` 298 (<=300)

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0517-contract-signature-execution-action-policy-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0502-employee-contracts-inbox-status-filter-and-pending-count.test.ts`
- [x] `npm.cmd run typecheck`
