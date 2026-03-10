# WI-1098: 운영 기준 문서 정확도와 UI/UX 마감 트랙 정리

## Background

- 운영 전환 기준 문서는 이미 잡혀 있지만, `CURRENT-GOAL.md` 가독성과 `production-operating-progress.md` 최신 상태 반영이 부족했다.
- Epic E는 존재하지만, 다음 UI/UX 개선 묶음이 어떤 순서로 진행되어야 하는지 문서만 보고 즉시 파악하기 어려웠다.
- 현재 작업 루프는 `문서 생성`이 아니라 `운영 가능한 제품 수렴`이므로, 기준 문서도 실제 실행 순서와 다음 UX 배치를 정확히 반영해야 한다.

## Scope

- `CURRENT-GOAL.md`를 읽기 가능한 한국어 진입점으로 정리한다.
- `docs/production-operating-progress.md`를 최신 머지/배포 상태와 다음 큐 기준으로 보정한다.
- `docs/production-operating-plan.md`에 Epic E의 UI/UX 마감 트랙을 명시적인 실행 계획으로 정리한다.
- `docs/production-gap-inventory.md`에 인벤토리의 역할과 UI/UX 마감 추적 기준을 보강한다.

## Acceptance Criteria

- `CURRENT-GOAL.md`가 깨지지 않은 한국어로 현재 목표와 기준 문서 역할을 설명한다.
- `docs/production-operating-progress.md`는 최신 완료 상태와 다음 큐를 현재 실행 기준에 맞게 반영한다.
- `docs/production-operating-plan.md`는 확인, 피드백, 날짜/시간, IA, 모바일 일관성까지 포함하는 UI/UX 마감 트랙을 명시한다.
- `docs/production-gap-inventory.md`는 인벤토리와 실제 완료 상태의 관계를 설명하고, 다음 UI/UX 추적 축을 연결한다.

## Files

- `CURRENT-GOAL.md`
- `docs/production-operating-plan.md`
- `docs/production-operating-progress.md`
- `docs/production-gap-inventory.md`

## Verification

- `git diff -- CURRENT-GOAL.md docs/production-operating-plan.md docs/production-operating-progress.md docs/production-gap-inventory.md work-items/WI-1098-operating-doc-accuracy-and-ux-finish-track.md`
