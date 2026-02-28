# WI-0640 Korean Surface Copy Completion For Tax Receipt, Payslip, and Contracts

## Summary
- completed korean UX copy normalization across employee tax/payroll/contract core surfaces:
  - `/employee/payslips` copy tone refined for session context labels and CSV export header localization
  - `/employee/withholding-receipt` metadata copy payload now uses localized labels instead of raw english key/value pairs
  - contracts runtime title normalizer keyword coverage expanded (`offer`, `addendum`, `agreement` etc.) to prevent english document titles leaking into ko runtime
- focused on user-facing copy completion only (no new ops flow or phase-loop expansion)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0640-korean-surface-copy-completion-for-tax-receipt-payslip-contracts.test.ts`
- `npm.cmd run typecheck`
