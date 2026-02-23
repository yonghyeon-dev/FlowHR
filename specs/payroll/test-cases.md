# Payroll Test Cases (WI-0001 + WI-0005 + WI-0006 Contract)

## Scope

Payroll gross pay preview and confirmation behavior for WI-0001 plus phase2 deduction/tax and deduction-profile contract coverage.

## Functional Cases

1. Run payroll preview for monthly period with approved attendance data.
2. Reject payroll preview requests when `employeeId` does not exist (404).
3. Confirm payroll run by payroll operator.
4. Reject preview request for unauthorized role.
5. Trigger recalculation when corrected attendance event arrives.
6. Run deduction/tax preview with feature flag for phase2 contract path.
7. Create/update deduction profile and read latest profile by ID.
8. Run deduction/tax preview in `profile` mode without explicit deduction values.
9. Reject profile-mode preview when `expectedProfileVersion` is stale.
10. List payroll runs by period (`from`/`to`) and verify role guard (payroll_operator/admin, plus employee self-service for own CONFIRMED only).
11. List deduction profiles (optional filters `active`, `mode`) and verify role guard.
12. Run deduction/tax preview in `statutory_kr_baseline` mode with taxable-base and component breakdown output.
13. Reject statutory baseline preview when `payroll_kr_baseline_v1` feature flag is disabled.
14. Run statutory baseline preview with progressive `incomeTaxBrackets`.
15. Run statutory baseline preview with insurance contribution caps and verify capped bases.
16. Reject statutory baseline preview when bracket ordering/open-ended bracket rule is invalid.
17. Run statutory baseline preview with additive tax-credit fields and verify pre-credit vs post-credit tax values.
18. Reject statutory baseline preview when `requireMonthlyBoundary=true` and period is not monthly boundary in `Asia/Seoul`.
19. Replay statutory golden fixtures (`GC-007`, `GC-008`) and verify deterministic deduction totals/net pay.
20. Employee self-service payslip list returns only own `CONFIRMED` statutory runs with deduction breakdown details, and rejects `PREVIEWED`/other-employee access.
21. Run payroll 4-insurance settlement preview with contribution caps and verify employee/employer component breakdown.
22. Reject 4-insurance settlement preview when `payroll_kr_insurance_settlement_v1` feature flag is disabled.
23. Reject 4-insurance settlement preview when `requireMonthlyBoundary=true` and period is not monthly boundary in `Asia/Seoul`.
24. Preview payroll close-period summary and verify confirmed/previewed run-state counts plus withholding/social/net settlement deltas.
25. Apply payroll close-period and reject when unconfirmed (`PREVIEWED`) runs remain.
26. Reject payroll close-period when `payroll_close_period_v1` feature flag is disabled.
27. Preview/apply payslip distribution for confirmed runs and verify newly distributed/already distributed counts.
28. Confirm payslip receipt for distributed confirmed run and reject non-owner or undistributed run.
29. Reject payslip distribution/receipt APIs when `payroll_payslip_delivery_v1` feature flag is disabled.
30. Preview year-end settlement for employee/year and verify annual totals, tax liability, and withholding delta output.
31. Preview/issue withholding receipt and reject issue when yearly runs include previewed/undistributed/pending-receipt runs.
32. Reject year-end settlement/receipt APIs when `payroll_year_end_v1` feature flag is disabled.
33. Recalculate year-end settlement with deduction-item inputs and verify baseline-vs-recalculated tax/liability delta output.
34. Reject year-end settlement recalculation API when `payroll_year_end_deduction_input_v1` feature flag is disabled.
35. Preview/apply year-end settlement finalization and reject apply when confirmed/distributed/receipt-confirmed prerequisites are missing.
36. Export year-end filing data and reject export before finalization or when `payroll_year_end_filing_export_v1` feature flag is disabled.
37. Export year-end filing data in `json`/`csv`/`jsonl`/`hometax_csv` and validate `basic`/`strict` mode behavior (strict rejects validation-failed exports).
38. Submit/list/ack year-end filing package and reject ACK for unknown/already-acknowledged submission.
39. Resubmit rejected filing package and reject resubmit for pending/non-rejected/already-resubmitted sources.
40. Query filing submission timeline and append evidence note; reject timeline/note for unknown submission.
41. Query filing ACK catalog and reject acknowledgement when ACK code or rejection reason code is outside catalog.
42. Cancel/reopen filing submission and reject invalid transitions (acknowledged cancel, non-canceled reopen, canceled acknowledge).
43. Query filing submission list with status/ackStatus/validationStatus/transport filters and verify summary counters + filtered subsets.
44. Query filing submission list with search/sort (`search`, `sortBy`, `sortDirection`) and verify deterministic ordering + quick-action prefill coverage in admin console.
45. Query filing list/timeline from split ops route (`/admin/payroll-year-end-filing/ops`) and verify status/evidence summary cards align with submission history.
46. Query filing list/timeline from ops dashboard and verify alert-rule severity output and drilldown mode presets (`pending`/`rejected`/`validation_fail`/`evidence_gap`/`timeline_failure`) remain deterministic.
47. Run statutory baseline preview with `incomeTaxLookupTable` and verify lookup-row tax selection plus deterministic withholding aggregation.
48. Run statutory baseline preview with `insuranceRounding` and verify per-component rounding unit/mode is applied deterministically.
49. Reject statutory baseline preview when `incomeTaxBrackets` and `incomeTaxLookupTable` are both provided.
50. Run statutory baseline preview with `incomeTaxLookupPresetId` and verify preset dataset row selection output.
51. Reject statutory baseline preview when unknown `incomeTaxLookupPresetId` is provided.
52. Reject statutory baseline preview when `incomeTaxLookupPresetId` is mixed with `incomeTaxBrackets` or `incomeTaxLookupTable`.
53. Reject statutory baseline preview when lookup-table rows contain non-monotonic `taxKrw` values.
54. Admin payroll preview exposes lookup-preset selector/guide and forwards selected `incomeTaxLookupPresetId` deterministically.
55. Validate statutory baseline taxable/non-taxable split rule: reject when `nonTaxableIncomeKrw` exceeds gross pay or when provided `taxableIncomeKrw` does not satisfy `taxable + nonTaxable = gross`.
56. Validate statutory baseline income split item input (`taxableIncomeItems`, `nonTaxableIncomeItems`) for duplicate-code guard and split-total consistency.
57. Validate statutory baseline income split item preset input (`incomeSplitItemPresetId`) for supported-preset resolution and mutual exclusivity with manual item arrays.
58. Admin payroll preview multi-item input table wires deterministic multi-row `taxableIncomeItems`/`nonTaxableIncomeItems` payload and preserves row-level validation.
59. Admin payroll preview split-item table code input supports dictionary autocomplete and category auto-fill while preserving deterministic payload composition.
60. Statutory baseline split-item input validates code/category pairs against server dictionary by item kind and rejects unsupported/mismatched entries.
61. Admin statutory preview preset/manual consistency guide and client preflight guard show deterministic blocking hints for invalid manual split rows.
62. Admin preset mode sample payload preview shows deterministic request shape and server template application hints for selected `incomeSplitItemPresetId`.
63. Admin preset mode sample payload preview copy/share UX deterministically emits request/template/combined clipboard payloads and share-fallback replay context for selected `incomeSplitItemPresetId`.
64. Admin preset share-link auto-apply UX deterministically parses shared query context (`incomeSplitItemPresetId`, `taxableIncomeKrw`, `nonTaxableIncomeKrw`) and pre-fills statutory preview inputs with invalid-value ignore behavior.
65. Admin preset share-link validation feedback UX deterministically summarizes applied values and ignored invalid query values from shared query context.
66. Admin preset share-link reset/reapply UX deterministically supports clearing share-applied preset/split values and re-applying current shared query context.

## Accuracy Cases

1. Overtime, night, and holiday minute categories are paid with correct multipliers.
2. Gross pay rounding follows common SSoT rules.
3. Deterministic output for repeated same-input calculations.
4. `totalDeductionsKrw` equals sum of deduction components.
5. `netPayKrw` equals `grossPayKrw - totalDeductionsKrw`.
6. Profile-mode calculation stores profile ID/version trace and remains deterministic.
7. Profile-mode stale version guard returns deterministic `409` mismatch error.
8. Statutory baseline mode computes taxable base and component sums deterministically.
9. Statutory baseline mode total/net calculations match component aggregation.
10. Progressive bracket mode computes income tax by bracket segments deterministically.
11. Insurance caps bound each insurance component base deterministically.
12. Tax-credit mode applies credit before local-income-tax and never produces negative income tax.
13. Monthly-boundary guard in `Asia/Seoul` rejects non-monthly periods deterministically.
14. Employee payslip self-service view preserves statutory deduction totals/net values and excludes unauthorized runs.
15. Insurance settlement mode computes employee/employer contribution totals and deltas (`priorWithheldKrw`, `priorEmployerPaidKrw`) deterministically.
16. Insurance settlement contribution caps bind NP/HI/EI bases and keep component sums deterministic.
17. Close-period mode computes withholding/social/net totals from confirmed runs and settlement deltas deterministically.
18. Close-period mode blocks `apply=true` deterministically when previewed runs remain.
19. Payslip distribution updates run delivery fields deterministically and remains idempotent for already distributed runs.
20. Payslip receipt confirmation updates receipt actor/time deterministically and rejects invalid state transitions.
21. Year-end settlement computes annual tax-liability and withholding-delta deterministically for same confirmed run set.
22. Withholding receipt issue guard (confirmed/distributed/receipt-confirmed) remains deterministic.
23. Year-end deduction-item recalculation baseline-vs-recalculated delta remains deterministic for same confirmed run set and input vector.
24. Year-end finalization guard and filing-export row/csv output remain deterministic for same finalized payload and run set.
25. Year-end filing multi-format artifact checksum/content remains deterministic for same finalized payload and format.
26. Year-end filing submission status transition (`submitted` -> `acknowledged`) remains deterministic.
27. Year-end filing resubmission attempt/parent-link transition remains deterministic.
28. Year-end filing timeline ordering and evidence-note replay remain deterministic.
29. Year-end filing ACK code/rejection reason catalog selection remains deterministic.
30. Year-end filing cancel/reopen transitions remain deterministic with single-pending submission invariant.
31. Year-end filing submission summary/filter counters remain deterministic for same query and submission history.
32. Year-end filing submission search/sort ordering remains deterministic for same query and submission history.
33. Year-end filing ops dashboard status/evidence summary cards remain deterministic for same filing list/timeline replay.
34. Year-end filing ops dashboard alert-rule severity and drilldown row subsets remain deterministic for same filing list/timeline replay.
35. Statutory baseline lookup-table mode selects the first matching row by taxable base and remains deterministic under replay.
36. Statutory baseline insurance rounding mode/unit settings produce deterministic component rounding under replay.
37. Statutory baseline preset mode resolves to deterministic lookup rows for same preset ID and taxable base.
38. Statutory baseline lookup-table validation guard rejects malformed non-monotonic tax rows deterministically.
39. Admin payroll preview preset selector/guide wiring remains deterministic for same state/input replay.
40. Statutory baseline taxable/non-taxable split validation and `incomeSplitKrw` breakdown output remain deterministic for same input replay.
41. Statutory baseline income split item list/total validation and `incomeSplitItems` breakdown output remain deterministic for same input replay.
42. Statutory baseline income split item preset resolution and preset-backed `incomeSplitItems` output remain deterministic for same input replay.
43. Admin multi-item split input table payload composition remains deterministic for same UI state/input replay.
44. Admin item-code dictionary autocomplete and category auto-fill remain deterministic for same UI state/input replay.
45. Server dictionary validation guard for split-item code/category parity remains deterministic for same invalid/valid replay vectors.
46. Admin preset/manual split-item preflight consistency hints remain deterministic for same UI state/input replay.
47. Admin preset-mode sample payload preview content remains deterministic for same UI state/input replay.
48. Admin preset-mode sample payload copy/share content (including replay href context) remains deterministic for same UI state/input replay.
49. Admin preset share-link auto-apply parsing and statutory preview prefill behavior remain deterministic for same query replay.
50. Admin preset share-link validation feedback summary (applied/ignored invalid values) remains deterministic for same query replay.
51. Admin preset share-link reset/reapply actions (clear defaults + query re-hydration) remain deterministic for same UI state/query replay.

## Regression Linkage

- `GC-001-standard-day.json`
- `GC-002-overnight-boundary.json`
- `GC-003-late-correction.json`
- `GC-004-holiday-overtime.json`
- `GC-005-retroactive-recalc.json`
- `GC-006-phase2-deduction-profile.json`
- `GC-007-statutory-progressive-cap.json`
- `GC-008-statutory-tax-credit-month-boundary.json`

## QA Gate Expectations

- Spec Gate: contract invariants and consumer impact present.
- Code Gate: payroll unit/integration/regression checks pass.
- Compatibility Gate: gross-only consumer path remains valid with phase2 flag off.
- Profile Gate: profile-mode API/auth/audit checks are validated before merge.
- Statutory Gate: statutory_kr_baseline mode must remain feature-flagged and deterministic.
- Progressive/Cap Gate: bracket ordering and insurance-cap calculations must be deterministic and validated.
- Tax-Credit/Boundary Gate: tax-credit ordering and monthly-boundary guard checks must be deterministic and validated.
- Lookup/Rounding Gate: `incomeTaxLookupTable` selection and `insuranceRounding` unit/mode checks must be deterministic and validated.
- Preset/Validation Gate: `incomeTaxLookupPresetId` resolution and lookup-table monotonic-tax validation must be deterministic and validated.
- Admin Preview Preset UX Gate: `/admin` payroll statutory baseline preset selector/guide and payload wiring must remain deterministic and locale-aware (`ko`/`en`).
- Taxable Split Gate: `taxableIncomeKrw` + `nonTaxableIncomeKrw` split validation against `grossPayKrw` must be deterministic and enforced when explicit taxable split is provided.
- Income Split Item Gate: `taxableIncomeItems`/`nonTaxableIncomeItems` code-uniqueness and item-total consistency with split totals must be deterministic and validated.
- Income Split Item Preset Gate: `incomeSplitItemPresetId` resolution and manual-item mutual-exclusion guard must be deterministic and validated.
- Income Split Item Table UX Gate: `/admin` multi-item split table add/remove row wiring must compose deterministic payload with row-level validation parity.
- Income Split Item Autocomplete Gate: `/admin` split item code dictionary autocomplete/category auto-fill must preserve deterministic payload wiring.
- Income Split Item Dictionary Validation Gate: server must reject unsupported split-item code and category mismatch by taxable/non-taxable dictionary kind.
- Income Split Item Consistency UX Gate: `/admin` must expose deterministic preset/manual consistency hints and block invalid manual row submit before API call.
- Income Split Item Preset Payload Preview Gate: `/admin` preset mode must expose deterministic sample request/template preview without changing transmitted contract fields.
- Preset Payload Copy/Share UX Gate: `/admin` preset mode must expose deterministic copy/share actions (request/template/combined + share fallback) without changing transmitted contract fields.
- Preset Share-Link Auto-Apply UX Gate: `/admin` preset mode must deterministically parse shared query values, auto-switch statutory mode when applicable, and ignore invalid preset/numeric query values.
- Preset Share-Link Validation Feedback UX Gate: `/admin` preset mode must expose deterministic feedback for applied values and ignored invalid shared query values.
- Preset Share-Link Reset/Reapply UX Gate: `/admin` preset mode must expose deterministic reset/reapply actions that clear share-applied values and re-hydrate from current shared query values.
- Employee Payslip Gate: employee role can list only their own CONFIRMED payroll runs; other employees and PREVIEWED runs are blocked (403).
- Insurance Settlement Gate: `POST /payroll/runs/preview-insurance-settlement` remains feature-flagged, permission-guarded, and deterministic under repeated replay.
- Close-Period Gate: `POST /payroll/runs/close-period` remains feature-flagged, permission-guarded, and blocks apply when unconfirmed runs exist.
- Payslip Delivery Gate: payslip delivery/receipt APIs remain feature-flagged, permission-guarded, and maintain deterministic distribution/receipt state transitions.
- Year-End Gate: year-end settlement/withholding receipt APIs remain feature-flagged, permission-guarded, and enforce issue prerequisites deterministically.
- Year-End Recalculation Gate: year-end deduction-item recalculation API remains feature-flagged, permission-guarded, and deterministic for baseline-vs-recalculated deltas.
- Year-End Finalization/Export Gate: year-end finalization and filing-export APIs remain feature-flagged, permission-guarded, and deterministic with finalized-settlement precondition.
- Year-End Export Format Gate: filing export multi-format artifact generation and strict validation-mode guard remain deterministic and auditable.
- Year-End Filing Submission Gate: filing submission list/create/ack APIs remain feature-flagged, permission-guarded, and deterministic with auditable status transitions.
- Year-End Filing Resubmission Gate: filing resubmission API enforces pending/rejected/duplicate transition guards deterministically.
- Year-End Filing Timeline/Evidence Gate: filing timeline/evidence-note APIs remain feature-flagged, permission-guarded, and deterministic with auditable event ordering.
- Year-End Filing ACK Catalog Gate: filing ACK catalog API and ACK code/rejection reason validation remain deterministic and permission-guarded.
- Year-End Filing Cancel/Reopen Gate: filing cancel/reopen APIs remain feature-flagged, permission-guarded, and deterministic with auditable state-transition guards.
- Year-End Filing Summary/Filter Gate: filing submission list query filters and summary counters remain deterministic and permission-guarded.
- Year-End Filing Search/Sort Quick-Action Gate: filing submission list search/sort query and admin quick actions remain deterministic, permission-guarded, and auditable.
- Year-End Filing Ops Dashboard Gate: split ops dashboard (`/admin/payroll-year-end-filing/ops`) status/evidence cards remain deterministic and are derived from permission-guarded filing list/timeline APIs.
- Year-End Filing Ops Alert/Drilldown Gate: ops dashboard alert-rule severity and drilldown presets remain deterministic and are derived only from permission-guarded filing list/timeline data.
