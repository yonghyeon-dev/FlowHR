# Branch Protection Requirements

Repository administrators must configure branch protection in GitHub settings.

## Target Branch

- `main`

## Required Rules

1. Require pull request before merging.
2. Single-operator default:
   - required approvals: `0`
   - rely on required CI checks and QA checklist evidence
   - optional: enable code-owner review when team has separate reviewers
3. Require status checks to pass:
   - `contract-governance`
   - `quality-gates`
   - `golden-regression`
4. Require branch to be up to date before merging.
5. Restrict direct pushes to `main`.
6. Restrict force pushes and branch deletion.
7. Allow bypass only for admins with documented break-glass use.

## Label and Process Conventions

- `break-glass`: emergency override PR.
- `spec-change`: contract/spec updates.
- `qa-blocked`: QA gate failed, merge not allowed.

## Operational Note

In 1-person operation, persona separation is process-based (Orchestrator/Domain/QA checklists), not account-based.
If team size grows, increase required approvals and enforce code-owner review.
