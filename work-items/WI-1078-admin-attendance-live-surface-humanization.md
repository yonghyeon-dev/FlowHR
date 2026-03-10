# WI-1078: 관리자 실시간 근태 표면 식별자 정리

## 배경

- 관리자 실시간 근태 현황 테이블의 직원 컬럼이 이름이 비면 raw `employeeId`로 떨어진다.
- 운영 표면에서는 이름과 공개용 직원 번호만 보여야 하며, raw 내부 식별자는 노출되면 안 된다.

## 목표

- 실시간 근태 현황 테이블의 직원 컬럼에서 raw `employeeId` fallback을 제거한다.

## 범위

- `src/components/admin-attendance-live/AdminAttendanceLiveSections.tsx`
- `scripts/tests/e2e-wi1078-admin-attendance-live-surface-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 실시간 근태 현황 테이블이 직원 이름과 공개용 직원 번호만 보여준다.
2. 이름이 비어도 raw `employeeId`가 화면에 직접 노출되지 않는다.
3. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`, `npm run build`가 통과한다.
