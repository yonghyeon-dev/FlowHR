# RACI and Decision Rights

This document defines authority boundaries for multi-agent FlowHR delivery.

## Roles

- Human (Final Authority): final sign-off on product scope, legal risk, and emergency overrides.
- Orchestrator (Scope Owner): backlog priority, cross-domain dependency decisions, merge readiness.
- Domain Agent (Spec Owner): domain contract, API/DB change design, implementation and tests.
- QA Agent (Gate Owner): quality gate policy, release-risk assessment, merge veto before gate pass.

## Decision Rights

| Decision | Human | Orchestrator | Domain Agent | QA Agent |
| --- | --- | --- | --- | --- |
| Product scope acceptance | A | R | C | C |
| Work item priority and sequencing | C | A/R | C | C |
| Domain contract contents | C | C | A/R | C |
| API and DB breaking change approval | A | R | R | C |
| QA gate pass/fail | C | C | C | A/R |
| Merge permission to `main` | C | A/R | C | R (veto) |
| Break-glass override | A | R | C | C |

Legend:
- `R` Responsible
- `A` Accountable
- `C` Consulted

## Merge Policy Summary

- PRs touching `/specs`, `/contracts`, `/qa`, `/.github` require Orchestrator and QA approval.
- QA gate veto blocks merge unless break-glass is activated.
- Break-glass requires process in `docs/break-glass.md`.
