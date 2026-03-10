# FlowHR Shared Product Language And Date Time Standardization

Last updated: 2026-03-11
Purpose: define the shared language, status-label, and date/time rules that every admin and employee surface should follow before the shell refactor starts.

## 1. Why This Exists

FlowHR already improved many isolated copy surfaces, but the product still lacks one language system.

The same kind of state may currently appear as:

- English enum text
- mixed Korean and English labels
- ISO-like timestamps
- runtime-flavored error strings
- different role names for the same actor

Without a shared language layer, new UI primitives and shell refactors will drift immediately.

## 2. Product Language Principles

## 2.1 Product Concepts Over Implementation Concepts

- prefer request, approval, notice, document, receipt, and policy language
- avoid raw identifier, enum, code, hash, actor, entity, or runtime wording on customer-facing surfaces

## 2.2 Role-Aware Wording

- customer admin copy may describe workspace impact and team-level risk
- employee copy should stay personal, calm, and action-oriented
- ops-only language must not leak into customer-admin or employee surfaces

## 2.3 Recovery-Oriented Error Language

- explain what happened in product language
- explain what the user can do next
- never render raw backend/runtime phrases directly

## 3. Shared Status Label Rules

## 3.1 Status Taxonomy

Shared status labels should resolve into these product-facing groups:

- pending / waiting
- in progress
- completed
- needs review
- blocked
- cancelled
- failed

Rules:

- product-facing labels should be short and stable
- raw enums may exist internally but must map through one shared layer
- similar states across approvals, requests, filings, and documents should not use unrelated tone

## 3.2 Role Labels

- `customer admin` and `employee` labels should be stable across shell, settings, and feedback surfaces
- avoid ad-hoc synonyms unless the context truly changes ownership

## 4. Date And Time Rules

## 4.1 Default User-Facing Format

- use locale-aware Korean summaries for customer-facing surfaces
- prefer readable summaries such as `2026년 3월 11일 오후 2:30`
- avoid raw ISO timestamps on product surfaces

## 4.2 Dense Workspace Format

- dense admin surfaces may use shorter date summaries
- even dense formats must stay locale-aware and human-readable

## 4.3 Relative Time

- use relative time only when it increases urgency or comprehension
- if a deadline or legal timestamp matters, pair relative wording with an absolute date/time

## 5. Error And Recovery Copy Rules

## 5.1 Error Structure

Every recoverable product-facing error should answer:

1. what failed
2. why the user should care
3. what to do next

## 5.2 Forbidden Patterns

- raw runtime strings
- bare `unauthorized`, `invalid actor`, `entity type`, `organizationId`, `employeeId`
- empty failure text with no next action

## 6. Formatting Ownership

The shared language layer should own:

- status-label mapping
- role-label mapping
- date/time formatting helpers
- recovery copy normalization for known failure classes

Screens should own:

- local context
- action-specific detail
- domain-specific nuance when the shared layer is too generic

## 7. First Adoption Targets

Apply these rules first to:

1. employee shell regrouping destinations
2. admin notices and approval surfaces
3. contract and document status surfaces
4. payroll, year-end, and filing summaries that still need denser but human-readable time and status language

## 8. Next Implementation Mapping

- `WI-1107`: employee self-service IA refactor should use this language layer for route labels, section titles, and shortcut wording
- later shared component work should consume the same date/time and status helpers instead of local formatting logic

## 9. Definition Of Done

This document is usable only if:

1. future UI work can map any new label or timestamp format to a rule in this file
2. status, role, and recovery wording are treated as shared system decisions, not local copy guesses
3. the next IA implementation slice can start without re-deriving product language rules
