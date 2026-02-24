# WI-0352: Employee contract signature journey status timeline and recovery guide

## Summary
- Added signature journey timeline + recovery guide to `/employee/contracts`.
- Extracted journey logic into dedicated component to keep inbox component under line-budget guard.
- Added contract journey/recovery styles for desktop and mobile.

## Scope
- `src/components/contracts/EmployeeContractsInbox.tsx`
- `src/components/contracts/EmployeeContractJourneyPanel.tsx`
- `src/app/globals.css`
- `scripts/tests/e2e-wi0352-employee-contract-signature-journey-status-timeline-recovery-guide.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0352-employee-contract-signature-journey-status-timeline-recovery-guide.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
