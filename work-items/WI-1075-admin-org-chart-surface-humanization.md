# WI-1075: 관리자 조직도 표면 식별자 정리

## 배경

- 관리자 인사 화면의 조직도 패널은 직원 pill 제목과 보조 라인에 raw `employee.id`를 그대로 노출한다.
- 조직도는 운영자가 직원을 빠르게 식별하는 표면이므로 내부 식별자 대신 이름, 공개용 사번, 재직 상태만 보여야 한다.

## 목표

- 조직도 패널의 직원 pill에서 raw 내부 직원 식별자가 보이지 않게 한다.
- 조직도 패널은 이름과 공개용 사번, 재직 상태 기준으로만 직원을 식별한다.

## 범위

- `src/app/admin/people/page-view-org-chart-panel.tsx`
- `scripts/tests/e2e-wi1075-admin-org-chart-surface-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 조직도 패널의 직원 pill 제목과 보조 라인에 raw `employee.id`가 직접 노출되지 않는다.
2. 직원 pill은 이름과 공개용 사번, 재직 상태만 표시한다.
3. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`가 통과한다.
