# WI-1054: External operator notification productization

## Background

Discord and Slack style escalation messages still expose internal metadata and developer-oriented payload formatting. Operators do not get an action-oriented message with product wording.

## Goal

Turn external escalation and leave-promotion notifications into operator-readable product messages.

## In Scope

- Hide internal metadata such as `organizationId` and routing channel labels
- Replace raw IDs and enums with human-readable subject lines
- Present stalled state and stage context in operator language
- Add direct action links where approval handling is expected
- Normalize leave-promotion notification wording

## Out Of Scope

- Webhook transport rewrites
- New notification channels
- Admin settings UI for webhook configuration

## Acceptance Criteria

1. External operator messages do not leak internal IDs or routing labels.
2. Messages identify the actor, work item, state, and action in human-readable wording.
3. Approval-related messages provide a direct next-action link when applicable.

## Implementation Progress

- Rewrote approval execution escalation webhook messages away from raw `organizationId`, channel labels, execution IDs, and enum-heavy payload formatting.
- Added operator guidance plus a direct `/admin/approval-executions` link when a public base URL is available.
- Rewrote annual leave promotion webhook messages away from raw organization and employee identifiers toward employee-name and remaining-leave summaries.
- Current follow-up is limited to validating whether any downstream payload consumers rely on the previous raw text format.
