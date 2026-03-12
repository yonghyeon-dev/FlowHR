# WI-1172: V2 핵심 라우트 셸 롤아웃

`WI-1170`에서 도입한 V2 셸을 admin/employee 핵심 route 진입면으로 확장해 제품의 첫인상을 V2 기준으로 통일한다.

## Scope

1. admin home, employee home, guide, requests hub, settings 등 핵심 진입 route 를 V2 shell rhythm 으로 맞춘다.
2. shared page header, card, queue, workspace-entry 표현을 재사용 가능한 패턴으로 만든다.
3. 기존 shell stale guard 를 V2 기준으로 갱신한다.

## Acceptance Criteria

1. 대표 admin/employee route 가 V2 shell 에서 이질감 없이 이어진다.
2. stale shell regression guard 가 green 이다.
3. `main` CI 와 production deploy 가 green 이다.
