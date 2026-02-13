# Agent Operating Model (Initial 4-Agent Setup)

This document defines the initial multi-agent structure for a 2-person team and the expansion rules.

## Initial Agent Set

1. Orchestrator
2. Attendance Agent
3. Payroll Agent
4. QA Agent

## Identity Model

- Default: one GitHub account, multiple agent personas.
- Persona separation is enforced by artifacts and checklists, not separate Git identities.
- If team grows, map personas to dedicated reviewers/teams.

## Role Definitions

### Orchestrator

- Owns backlog priority, dependency ordering, and merge readiness.
- Splits work items and routes them to domain agents.
- Ensures PR includes contract, tests, and QA evidence.

### Attendance Agent

- Owns attendance-related contracts, schema/API changes, and tests.
- Delivers attendance events required by downstream payroll.
- Must not directly modify payroll-owned tables.

### Payroll Agent

- Owns payroll gross-pay contract, calculation logic, and tests.
- Consumes approved attendance data through API/events/projections.
- Maintains deterministic calculation and audit trace requirements.

### QA Agent

- Owns Spec Gate and Code Gate checks.
- Has merge veto before gate pass.
- Verifies authorization, payroll accuracy, migration safety, and auditability.

## Expansion Triggers

Split into more agents only when one or more conditions are met:

- Changes or defects concentrate repeatedly in one domain.
- Integration complexity increases (ERP, access-control devices, external APIs).
- Release lead time increases due to review bottlenecks.

## Candidate Future Agents

- Approval/Workflow Agent (electronic approvals and policy routing)
- Integration Agent (ERP/API, SSO, groupware)
- Security/Compliance Agent (privacy/audit controls)

## Operating Guardrails

- Contract-first: code changes must follow contract updates.
- No cross-domain direct DB writes.
- QA gate required for merge (except break-glass policy).
- Breaking changes require ADR and versioning policy compliance.
