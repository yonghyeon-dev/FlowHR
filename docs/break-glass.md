# Break-Glass Policy

## Purpose

Break-glass is a controlled exception process to bypass standard QA veto only for urgent production protection.

## Default Rule

- QA gate is mandatory for all merges.
- No merge to `main` without QA pass unless this policy is explicitly invoked.

## Allowed Triggers

Break-glass can be used only for:

- P0 incident that blocks a core production flow.
- Security hotfix requiring immediate containment.
- Legally binding deadline that cannot be delayed.

## Required Approvals

Break-glass requires:

- Human (Final Authority) approval, and
- Either Orchestrator or QA explicit co-sign.

## Required Metadata (Mandatory Fields)

Every break-glass PR must include:

- Incident ID
- Change scope (files and blast radius)
- Risk assessment
- Rollback plan
- Customer impact
- Temporary mitigation (if full fix is deferred)

## Process

1. Open PR with `break-glass` label.
2. Fill Emergency Override section in PR template.
3. Obtain approvals per policy.
4. Merge only the minimum safe fix.
5. Start post-incident cleanup immediately.

## Post-Incident Requirement

- RCA and prevention PR must be created within 48 hours after merge.
- RCA must include root cause, missed controls, action items, and owners.

## Non-Compliance

- Missing mandatory metadata or overdue RCA is treated as process violation.
- Repeated violations should trigger stricter branch protection and incident review.
