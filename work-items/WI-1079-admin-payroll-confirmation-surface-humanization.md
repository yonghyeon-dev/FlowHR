# WI-1079: 관리자 급여 확정 표면 식별자 정리

## 배경

- 관리자 대시보드의 급여 확정 패널이 `최근 Run ID` 입력칸을 직접 노출한다.
- 운영 표면에서는 내부 `run.id`를 직접 입력하게 하기보다, 사람이 읽을 수 있는 프리뷰 요약으로 선택하게 해야 한다.

## 목표

- 급여 확정 패널에서 raw `run.id` 입력 UI를 제거하고, 최근 프리뷰 목록을 사람 친화적인 선택지로 바꾼다.

## 범위

- `src/components/admin-dashboard/AdminPayrollPanel.tsx`
- `src/app/admin/page-compensation-panels.tsx`
- `src/app/admin/page-panels.tsx`
- `src/app/admin/page-state.ts`
- `scripts/tests/e2e-wi1079-admin-payroll-confirmation-surface-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 관리자 급여 확정 패널이 raw `Run ID` 라벨과 자유 입력칸을 더 이상 노출하지 않는다.
2. 확정 대상은 기간, 상태, 공개 직원 번호 기준의 선택지로 보여 준다.
3. 최근 프리뷰 목록이 바뀌면 현재 선택값이 자동으로 유효한 항목으로 유지된다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`, `npm run build`가 통과한다.
