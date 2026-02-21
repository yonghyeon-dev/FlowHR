# WI-0181: Deprecated WI and E2E Archive Cleanup

## Background and Problem

WI-0131~0143 and WI-0145~0172 introduced repeated phase-loop expansions that were removed by WI-0176~WI-0180.
The implementation bloat is already cleaned from product surfaces, but related work-item docs and e2e files still looked active.

Following `docs/codex-guide.md` Phase D, WI-0181 archives those artifacts with explicit deprecation markers while preserving traceability.

## Scope

### In Scope

- Mark WI documents as deprecated for target ranges:
  - `WI-0131~WI-0143`
  - `WI-0145~WI-0172`
- Archive corresponding e2e files as no-op placeholders (files kept, execution removed)
- Remove archived WI e2e files from `test:e2e:mvp` and `test:e2e:full`
- Add WI-0181 regression test:
  - `scripts/tests/e2e-wi0181-deprecated-wi-and-test-archive-cleanup.test.ts`
- Update roadmap/version metadata

### Out of Scope

- New UX features
- Additional ops/infrastructure expansion
- Deleting archived files from history

## User Scenarios

1. Team members can still find deprecated WI history, but immediately see it is no longer active.
2. CI does not spend time executing obsolete phase-loop e2e scenarios.
3. Regression checks prevent archived WI tests from being accidentally re-added to active chains.

## Data and API Changes

- None

## Rollback Plan

- Revert deprecation headers in target work-item files
- Restore original target e2e test contents
- Re-add target e2e entries to `package.json` chains
- Revert WI-0181 regression test and roadmap updates

## Definition of Done (DoD)

- [x] Target WI docs are marked with a deprecation banner and guide reference.
- [x] Target e2e files are retained as traceable archive placeholders.
- [x] Archived tests are removed from active MVP/FULL e2e chains.
- [x] WI-0181 regression test validates archive/deprecation integrity.
