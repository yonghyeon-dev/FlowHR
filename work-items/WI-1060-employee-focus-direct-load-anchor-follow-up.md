# WI-1060: 직원 direct-load focus 앵커 후속 안정화

## 배경

- `WI-1059` 배포 후에도 일부 `employee ?focus=` direct-load가 프로덕션에서 불안정하게 남아 있었다.
- 고정 타이머 기반 재시도만으로는 늦게 마운트되는 섹션이나 후행 DOM 교체를 충분히 따라가지 못했다.

## 목표

1. `employee ?focus=` direct-load가 늦은 섹션 마운트 이후에도 안정적으로 목표 섹션으로 정착한다.
2. 해시와 실제 뷰포트 정착을 함께 보장한다.
3. 기존 client-side section jump를 깨지지 않게 유지한다.

## 구현

- direct-load focus effect를 DOM 관찰 기반 후속 재시도 구조로 보강한다.
- section hash를 목표 섹션 기준으로 선동기화한다.
- direct-load가 늦게 붙는 섹션을 다시 따라가는 regression guard를 추가한다.

## 완료 기준

1. employee direct-load focus follow-up이 `account`, `self-service-overview`, `request-feedback`, `request-search-sort`, `request-resubmit`, `leave`, `leave-calendar` 같은 늦은 섹션에서도 정착한다.
2. 관련 regression guard가 `test:integration`에 포함된다.
3. 변경 사항이 운영 진행 문서와 gap inventory에 반영된다.
