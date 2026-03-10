# WI-1077: 관리자 근태 집계 표면 식별자 정리

## 배경

- 관리자 대시보드의 근태 집계 결과 목록이 `aggregate.employeeId`를 그대로 노출한다.
- 집계 결과는 운영자가 반복적으로 확인하는 표면이라 공개용 직원 번호만 보여야 한다.

## 목표

- 근태 집계 결과 목록에서 raw `employeeId` 노출을 제거한다.

## 범위

- `src/components/admin-dashboard/AdminAggregateLeavePanels.tsx`
- `scripts/tests/e2e-wi1077-admin-aggregate-leave-surface-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 근태 집계 결과 목록이 raw `employeeId` 대신 공개용 직원 번호만 보여준다.
2. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`, `npm run build`가 통과한다.
