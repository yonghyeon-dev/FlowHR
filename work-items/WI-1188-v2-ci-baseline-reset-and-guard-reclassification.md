# WI-1188: V2 CI baseline reset and guard reclassification

Reset the mainline CI baseline so `quality-gates` verifies the current V2 shell and route-first product truth instead of repeatedly enforcing pre-V2 layout assumptions.

## Background

- The current CI chain still mixes historical shell assertions, mid-refactor route assertions, and still-valid domain guards in one long sequence.
- During the V2 shell rollout, repeated failures were often stale pre-V2 shell, nav, and copy expectations rather than real regressions in the intended product direction.
- Without a reset, future V2 work items will keep paying the cost of historical UI contracts that are no longer the release truth.

## Scope

1. Reclassify the `test:integration`, `test:e2e:mvp`, and `test:e2e:ko-guard` chains into current and legacy/full paths.
2. Make the main `quality-gates` job run only the current V2 baseline bundles.
3. Keep the historical exhaustive regression path available through explicit legacy/full scripts.
4. Document the new baseline rule so later V2 work items know which gate they must satisfy.

## Non-Goals

- Deleting historical regression tests.
- Moving the entire production browser suite into CI.
- Completing the full service-readiness program inside this work item.

## Acceptance Criteria

1. `quality-gates` no longer treats pre-V2 shell/home/nav assumptions as current release truth.
2. The current V2 baseline bundles are explicitly named and used by CI.
3. Historical exhaustive guards remain available behind legacy/full script names.
4. The reset rule and rationale are documented in the repo.
