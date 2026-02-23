# WI-0286: Payroll Year-End Finalization Reapply Conflict Guard

## Background

연말정산 `apply=true` 호출은 확정 이력을 누적하지만, 동일 입력으로 같은 `settlementHash`를 반복 확정하는
중복 호출을 명시적으로 차단하지 않아 운영/감사 관점에서 노이즈가 발생할 수 있습니다.

## Scope

### In Scope

- `POST /payroll/year-end/finalize-settlement`에 중복 확정 가드 추가:
  - 최신 확정 스냅샷의 `settlementHash`가 현재 계산값과 동일하면 `409` 반환
- `409` 응답 상세에 중복 컨텍스트 포함:
  - `settlementHash`
  - `latestFinalizationId`
  - `latestFinalizedAt`
- 입력이 달라 `settlementHash`가 달라진 경우에는 정상 확정 허용
- payroll contract/test-cases에 duplicate apply conflict guard 규칙 반영
- WI-0286 e2e 회귀 테스트 추가

### Out of Scope

- 확정/취소/재오픈 등 상태머신 확장
- 배치 재시도 정책/백오프 정책
- 신고 파이프라인 변경

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0286-payroll-year-end-finalization-reapply-conflict-guard.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`

