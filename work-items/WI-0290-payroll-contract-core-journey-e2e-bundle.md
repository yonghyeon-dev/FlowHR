# WI-0290: Payroll + Contract Core Journey E2E Bundle

## Background

급여 연말정산 핵심 흐름(WI-0285/0286/0287)과 전자계약 핵심 흐름(WI-0288/0289)이 각각 구현되었지만,
두 영역을 하나의 사용자 여정으로 검증하는 통합 E2E 시나리오가 필요합니다.

## Scope

### In Scope

- 통합 E2E 추가:
  - 파일: `scripts/tests/e2e-wi0290-payroll-contract-core-journey-e2e-bundle.test.ts`
  - 시나리오:
    - 연말정산 확정(`apply=true`) 및 확정 조회
    - 계약 템플릿 생성 -> 문서 생성 -> 발송 -> 직원 서명
    - 서명 증거 조회(`format=json|text`) 및 권한 가드(`403`) 검증
- 스펙 문구 정합성 점검:
  - payroll contract에 input-vector hash scope 문구 존재
  - contracts contract에 signature evidence read/download scope 문구 존재
- `package.json` e2e 체인에 WI-0285/0286/0290 테스트 포함

### Out of Scope

- 모바일 앱 E2E
- 신고 제출/ACK 전체 회귀
- 전자계약 고급 워크플로(위임/만료자동화)

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0285-payroll-year-end-input-vector-hash-trace.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0286-payroll-year-end-finalization-reapply-conflict-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0290-payroll-contract-core-journey-e2e-bundle.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`

