# Branch Protection Requirements

Repository administrators must configure branch protection in GitHub settings.

## Target Branch

- `main`

## Required Rules

1. Require pull request before merging.
2. Require approvals:
   - minimum 2 approvals for policy-sensitive changes.
   - enforce `CODEOWNERS` review.
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

CODEOWNERS alone does not block merges unless branch protection enforces code owner review.
