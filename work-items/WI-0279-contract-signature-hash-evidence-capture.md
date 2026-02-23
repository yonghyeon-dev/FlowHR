# WI-0279: Signature Hash Evidence Capture

## Background

Contract response needed deterministic evidence output for signed actions.

## Scope

- add signature evidence fields on contract response path
  - `signatureHash`
  - `signatureEvidenceHash`
- enforce `expectedDocumentHash` mismatch guard (`409`)
- persist signature evidence through audit-backed document snapshots

## Out of Scope

- third-party certified signature workflows

## Validation

- e2e contracts lifecycle suite verifies signature hash determinism and mismatch guard
- `npm.cmd run typecheck`
- `npm.cmd run build`
