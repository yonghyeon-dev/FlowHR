# WI-1159: 연말정산 콘솔 워크스페이스 시각 파동 18

Visual wave 18 for the remaining year-end and withholding route-first consoles.

## Background

- `WI-1158`까지 admin payroll operational consoles were aligned to the shared workspace shell.
- The remaining year-end surfaces still keep the older `hero + panel-grid` presentation even though they behave like active operator or employee workspaces.
- `PayrollYearEndConsole`, `PayrollYearEndFilingConsole`, and `WithholdingReceiptConsole` should follow the same shell, summary-strip, toolbar-card, and note-card rhythm as the rest of the route-first product.

## Scope

1. Align `src/components/payroll-year-end/PayrollYearEndConsole.tsx` to the shared admin workspace shell.
2. Align `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx` to the shared admin workspace shell.
3. Align `src/components/withholding-receipt/WithholdingReceiptConsole.tsx` to the shared employee workspace shell.
4. Add a static regression guard and connect it to `test:integration`.
5. Update `docs/production-operating-progress.md` with the closed `WI-1158` state and the `WI-1159` start marker.

## Non-Goals

- Changing year-end settlement, filing, or withholding APIs
- Reworking the route model or permission model
- Rewriting the inner business panels beyond shell-level visual alignment

## Acceptance Criteria

1. All three consoles render with `workspace-shell`, `workspace-page-header`, and `workspace-summary-strip`.
2. Input and action surfaces use workspace toolbar/content cards instead of the legacy `hero + panel-grid` presentation.
3. Status, source, and session feedback are rendered with the shared workspace inline/source patterns.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
