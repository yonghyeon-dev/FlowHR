# Contract Versioning and Deprecation Policy

## Versioning Model

All `contract.yaml` files follow SemVer: `MAJOR.MINOR.PATCH`.

- MAJOR: backward-incompatible contract change.
- MINOR: backward-compatible capability addition.
- PATCH: backward-compatible clarification/fix without behavior change.

## Breaking Change Rule

- If `breaking_changes: true`, MAJOR must increase.
- Breaking changes require ADR reference and consumer impact note.

## Deprecation Window

- Default deprecation window: 90 days.
- During the window, support `N-1` contract version for consumers.
- After window expires, remove deprecated behavior with changelog notice.

## Consumer Communication

For contract changes, PR must include:

- `consumer_impact` summary in contract.
- ADR (required for breaking or cross-domain behavior change).
- Changelog entry in release notes.

## Compatibility Defaults

- Prefer additive fields and optional parameters before removal.
- For events, prefer new event version/topic over mutable payload break.
- DB migrations should use expand/contract with rollback strategy.

## CI Enforcement (Minimum)

CI must fail when:

- `contract.yaml` changes without a version bump.
- `breaking_changes: true` and MAJOR does not increase.
- Required contract fields are missing.
