# WI-1061: 운영 재검증 false positive 정리

## 배경

- `WI-1060` 배포 후 운영 재검증에서 `employee focus`는 모두 닫혔지만, `production-completed-items-reverify.mjs`가 두 건을 계속 실패로 분류했다.
- 실제 제품 동작 확인 결과:
  - `/admin#approvals`는 `/admin/approval-executions`으로 정상 리다이렉트된다.
  - `/admin/leave-promotion`은 dev-tools off 운영 정책상 의도된 404다.

## 목표

1. 운영 재검증 스크립트가 실제 제품 의도와 동작을 기준으로 pass/fail을 판정한다.
2. 이미 닫힌 제품 결함이 false positive로 다시 열리지 않게 한다.

## 구현

- `/admin#approvals`는 `#approvals` 앵커 가시성뿐 아니라 `/admin/approval-executions` 리다이렉트도 pass로 인정한다.
- `/admin/leave-promotion`은 dev-tools off 상태의 의도된 404를 pass로 인정한다.
- 해당 판정 기준을 regression guard로 고정한다.

## 완료 기준

1. `production-completed-items-reverify.mjs`가 위 두 케이스를 false positive로 분류하지 않는다.
2. regression guard가 `test:integration`에 포함된다.
3. 운영 재검증 결과에서 실제 남은 실패만 남는다.
