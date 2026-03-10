# FlowHR Shared Feedback And Confirmation Primitives

Last updated: 2026-03-11
Purpose: define the common feedback, confirmation, and empty-state primitives that sit on top of the shared workspace interaction contract.

## 1. Why This Exists

FlowHR already has many surfaces that mutate state:

- notices
- approvals
- contracts
- benefits
- recruitment
- employee requests and acknowledgements

The product currently communicates those mutations inconsistently. The same kind of action may produce:

- no visible feedback
- a weak inline sentence
- a blocking alert
- a toast that does not explain what changed
- an empty state that looks like an error

This document fixes that inconsistency before the next UI implementation wave.

## 2. Primitive Set

## 2.1 Inline Status Banner

Use for:

- workspace-level warning
- recoverable error
- cross-section success state that should remain visible

Rules:

- place near the affected workspace zone
- the title must explain the state in product language
- the body must explain the next safe action
- never expose raw runtime or API wording

## 2.2 Toast

Use for:

- low-friction confirmation of a completed action
- short-lived acknowledgement after save/read/acknowledge

Rules:

- toast copy must mention what changed
- do not use toasts for critical recovery guidance
- if the next action matters, pair the toast with inline feedback

## 2.3 Confirmation Dialog

Required for:

- delete
- publish
- send
- finalize
- irreversible approval/rejection state changes

Dialog rules:

- title states the action plainly
- body states impact and what cannot be undone
- primary button uses action language, not generic `확인`
- secondary button keeps the user safely in context

## 2.4 Empty State

Use for:

- true empty
- filtered empty
- access-limited or not-yet-configured state

Rules:

- empty states must say why content is absent
- empty states must include one clear next action when one exists
- filtered empty must not look like system failure

## 2.5 Recovery Panel

Use for:

- recoverable mutation failure
- policy or state conflict
- dependency missing but actionable

Rules:

- explain what blocked the action
- explain what the operator or employee should do next
- prefer recovery steps over generic retry wording

## 3. Severity And Tone

## 3.1 Success

- confirms a completed change
- should feel calm and specific
- must not drown the workspace

## 3.2 Warning

- indicates risk, attention, or pending review
- should point to a follow-up action

## 3.3 Error

- indicates the action did not complete
- must be recovery-oriented
- should avoid technical blame language

## 3.4 Information

- use for non-blocking setup guidance or context
- should not compete visually with warning and error

## 4. Placement Rules

## 4.1 Workspace-Level Actions

- save/publish/send/finalize results should appear in a consistent workspace feedback slot

## 4.2 Row-Level Actions

- local actions may use toast + row-state update
- if the row state affects a detail panel, reflect the change there too

## 4.3 Entry-Level Context

- if the user arrived from dashboard/guide/shortcut, feedback should preserve return confidence instead of dropping the user into a blank or reset state

## 5. Role-Specific Behavior

## 5.1 Customer Admin

- may see denser warnings and confirmation language
- should receive explicit impact wording before irreversible actions

## 5.2 Employee

- feedback should stay narrower and calmer
- employee confirmations should avoid operator jargon and emphasize the personal next step

## 6. First Adoption Targets

Apply these primitives first to:

1. employee shell regrouping destinations
2. admin notices workspace
3. contracts workspace
4. approval review and queue actions

## 7. Next Implementation Mapping

- `WI-1106`: standardize shared product language and date/time formatting so the primitives use the same copy system
- `WI-1107`: apply the primitives inside the first employee shell regrouping slice
- later workspace implementation slices should consume the same primitive set instead of defining local variants

## 8. Definition Of Done

This document is usable only if:

1. the primitive set is concrete enough to guide reusable components
2. confirmation and feedback rules are explicit enough to prevent per-screen reinvention
3. empty, filtered-empty, and recoverable error states are clearly distinguished
4. the next implementation WI can map at least one real surface to these primitives without inventing new interaction language
