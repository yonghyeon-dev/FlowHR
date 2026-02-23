# WI-0293: Employee Withholding Receipt Locale Dynamic UI

## Background

`/employee/withholding-receipt` rendered fixed English copy and log timestamp locale,
while the platform uses browser-locale dynamic UI (`ko`/`en`) in shell and key surfaces.

## Scope

- Apply locale-aware copy wiring (`ko`/`en`) in:
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- Apply runtime locale mapping (`ko-KR`/`en-US`) for API log timestamps and KRW formatting in this console.
- Keep API requests/responses unchanged.
- Add regression test:
  - `scripts/tests/e2e-wi0293-employee-withholding-receipt-locale-dynamic-ui.test.ts`

## Out of Scope

- Withholding receipt issuance policy changes
- Year-end settlement formula changes
- Contract/API version bumps

## Acceptance

1. Browser locale context switches major UI copy on `/employee/withholding-receipt`.
2. API log timestamps follow runtime locale mapping.
3. Regression test verifies locale-copy wiring for key labels/actions.

## Notes

- Related issue: `#355`
- UI-only WI (no contract/schema update required)

