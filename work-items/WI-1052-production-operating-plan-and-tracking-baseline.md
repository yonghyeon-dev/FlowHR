# WI-1052 Production Operating Plan And Tracking Baseline

## Background

The repository had roadmap, execution, and test documents, but the active working mode had drifted toward QA evidence collection without a compact production operating source of truth. To move FlowHR toward real production readiness, planning and live tracking need a stable entry point that survives session changes and stays aligned with the actual repo delivery flow.

## Goal

Create a compact, always-referenced production operating system for Codex-driven PM + Dev execution.

## Scope

- Add a canonical production operating plan document.
- Add a canonical live progress document.
- Replace `CURRENT-GOAL.md` with a compact pointer to the new canonical docs.
- Add a status note in `docs/execution-plan.md` so older governance references do not compete with the active production plan.
- Keep `.claude/memory/*` out of scope.

## Non-Goals

- Rewrite the entire historical roadmap.
- Delete heavily referenced governance documents immediately.
- Expand CI in the same wave.

## Deliverables

1. `docs/production-operating-plan.md`
2. `docs/production-operating-progress.md`
3. refreshed `CURRENT-GOAL.md`
4. `docs/execution-plan.md` status note

## Acceptance Criteria

1. A new session can identify the current production goal and active queue by opening `CURRENT-GOAL.md`.
2. The active production operating target, epic grouping, and delivery loop are documented in one compact file.
3. Live progress and next queue are documented in one compact file.
4. Historical documents remain available without acting as the default operating entry point.

## Follow-Up Work Bundles

1. Developer-trace audit to WI bundle conversion.
2. Core journey reliability recovery.
3. Navigation and IA hardening.
4. Admin operational controls productization.
5. UX and localization finishing wave.
