# WI-0285: Payroll Year-End Input Vector Hash Trace

## Background

연말정산 preview/recalculation/finalization 결과는 `settlementHash` 중심으로 추적되고 있었지만,
입력 벡터 동일성(`same input -> same output`)을 빠르게 검증할 수 있는 별도 지문이 없었습니다.
재현성 검증과 감사 추적 강화를 위해 입력 벡터 해시가 필요합니다.

## Scope

### In Scope

- 연말정산 API 응답 필드에 `inputVectorHash` 추가:
  - `POST /payroll/year-end/preview-settlement`
  - `POST /payroll/year-end/recalculate-settlement`
  - `POST /payroll/year-end/finalize-settlement`
- 입력 벡터 정규화 후 SHA-256 해시를 생성하는 서비스 헬퍼 추가
- 동일 입력 재실행 시 동일 해시, 입력 변경 시 해시 변경 보장
- 관리자 연말정산 콘솔 응답 패널에 `Input Vector Hash` 표시
- payroll spec(`api.yaml`, `contract.yaml`, `test-cases.md`) 업데이트 및 버전 `1.57.0` 반영
- WI-0285 e2e 회귀 테스트 추가

### Out of Scope

- 연말정산 계산식 자체 변경
- 스케줄러/ops 자동화 확장
- 신고 제출/ACK 워크플로 확장

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0285-payroll-year-end-input-vector-hash-trace.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`

