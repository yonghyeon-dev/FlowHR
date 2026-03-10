# WI-1076: 관리자 근무 일정 표면 식별자 정리

## 배경

- 관리자 대시보드의 근무 일정 목록이 `schedule.employeeId`와 `schedule.id`를 그대로 노출한다.
- 근무 일정은 운영자가 자주 보는 표면이라 내부 식별자 대신 공개용 직원 번호와 일정 정보만 보여야 한다.

## 목표

- 근무 일정 목록에서 raw `employeeId` 노출을 제거한다.
- 근무 일정 목록에서 raw `schedule.id` 노출을 제거한다.

## 범위

- `src/components/admin-dashboard/AdminSchedulingPanel.tsx`
- `scripts/tests/e2e-wi1076-admin-scheduling-surface-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 근무 일정 목록이 raw `employeeId` 대신 공개용 직원 번호만 보여준다.
2. 근무 일정 목록이 raw `schedule.id`를 화면에 노출하지 않는다.
3. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`, `npm run build`가 통과한다.
