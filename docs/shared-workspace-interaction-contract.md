# FlowHR Shared Workspace Interaction Contract

Last updated: 2026-03-11
Purpose: define the common interaction model for major admin and employee workspaces so future refactors stop re-implementing core UX states per screen.

## 1. Why This Contract Exists

Major FlowHR surfaces already behave like workspaces:

- notices
- contracts
- benefits
- recruitment
- payroll
- approval
- employee self-service areas

But they still solve the same interaction concerns differently:

- header and return affordance
- status context
- loading and empty behavior
- success/error/warning feedback
- confirmation before irreversible actions

This contract standardizes those patterns.

## 2. Workspace Frame

Every workspace should be composed from these zones.

## 2.1 Header Zone

Must include:

- workspace title
- one-line purpose/description
- return/back affordance when entered from another context
- optional source hint when the user came from analytics/dashboard/guide

Must not include:

- raw route text as the primary affordance
- internal identifiers as context explanation

## 2.2 Summary Zone

Use for:

- high-level counts
- health summary
- current risk or pending state
- concise progress indicators

Rules:

- summary should explain why the workspace matters now
- summary should not replace the actual queue or work area

## 2.3 Work Area Zone

Use for:

- list/table/queue
- editor/form
- primary work controls

Rules:

- the work area is the main task surface
- if the surface exists to process items, the queue/list takes priority over decorative cards

## 2.4 Context Zone

Use for:

- selected item detail
- blockers and history
- next action guidance
- impact or dependency explanation

Rules:

- context must help the user decide what to do next
- context should not duplicate the list row verbatim

## 2.5 Feedback Zone

Use for:

- inline success/warning/error messages
- pending status
- recovery guidance

Rules:

- feedback must be visible near the action or in a consistent workspace-level slot
- feedback tone must be distinct, not hidden in generic small text

## 3. Standard Interaction States

## 3.1 Loading

Rules:

- never show a blank workspace without explanation
- show loading in the zone that is actually waiting
- preserve frame stability where possible

## 3.2 Empty

Rules:

- explain why there is no content
- explain what the user can do next
- separate true empty from filtered-empty

## 3.3 Success

Rules:

- show visible success feedback after meaningful write actions
- success feedback should mention what changed, not only that something succeeded

## 3.4 Warning

Rules:

- use warning for recoverable risk or pending attention
- warnings should point to the next safe action

## 3.5 Error

Rules:

- error copy must be recovery-oriented
- technical failure text should be normalized before rendering

## 3.6 Confirmation

Required for:

- delete
- publish/send/finalize
- any irreversible or high-impact state change

Not required for:

- low-risk filter changes
- reversible view toggles

## 4. Shared Behavior Rules

## 4.1 Return And Source Context

- if the workspace is entered from dashboard, analytics, or guide, preserve a clear return action
- source context should be helpful, not noisy

## 4.2 Pending Lock

- while a high-impact mutation is pending, duplicate actions must be blocked
- the UI should explain what is currently in progress

## 4.3 Search And Filter Behavior

- filtered-empty must not look like true empty
- search reset and filter reset should be explicit

## 4.4 Action Priority

- one primary action per local context
- destructive and secondary actions should be visually subordinated

## 5. Role-Specific Density

## 5.1 Customer Admin Workspaces

- may be dense
- should prefer queue/workspace/context composition
- should surface risk and next actions clearly

## 5.2 Employee Workspaces

- should remain calmer and narrower in scope
- should emphasize the current request, required next step, and document access

## 6. Immediate Adoption Targets

This contract should be applied first to:

1. employee shell regrouping follow-up surfaces
2. admin notice workspace
3. contracts workspace
4. approval review surfaces

## 7. Acceptance Criteria

1. The workspace frame is defined in reusable zones.
2. The standard interaction states are explicitly defined.
3. Admin and employee density differences are acknowledged without splitting into separate design systems.
4. The contract is concrete enough to guide the next shell and workspace implementation WI.
