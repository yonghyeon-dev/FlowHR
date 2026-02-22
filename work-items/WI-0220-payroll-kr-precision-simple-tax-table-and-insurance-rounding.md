# WI-0220: Payroll KR Precision Kickoff (Simple Tax Table + Insurance Rounding Rules)

## Background

`ROADMAP.md`의 다음 우선순위는 급여 엔진 KR 정밀 계산 착수입니다. 기존 `statutory_kr_baseline`은 flat/progressive tax + 보험 상한까지는 지원하지만, 실무에서 자주 쓰는 간이세액표 형태의 테이블 입력과 보험료 단위 라운딩 규칙이 부족합니다.

## Scope

### In Scope

- `statutory_kr_baseline` 입력 확장:
  - `incomeTaxLookupTable` (간이세액표 형태의 세액 룩업 테이블)
  - `insuranceRounding` (4대보험 항목별 단위/모드 라운딩 규칙)
- 급여 미리보기(`POST /payroll/runs/preview-with-deductions`) 계산 규칙 확장:
  - 세액 룩업 테이블 기반 소득세 계산
  - 보험료 계산 시 configurable rounding 적용
- 스펙 문서 갱신:
  - `specs/payroll/contract.yaml`
  - `specs/payroll/api.yaml`
  - `specs/payroll/test-cases.md`
  - `specs/payroll/rfc.md`
- WI-0220 e2e 테스트 추가 및 회귀 검증

### Out of Scope

- 연말정산 로직 전면 개편
- 외부 법정요율/세액표 자동 동기화
- 운영 스케줄러/알림/ops 워크플로 확장

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0220-payroll-kr-simple-tax-table-and-insurance-rounding.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0105-payroll-kr-progressive-cap.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0106-payroll-tax-credit-boundary.test.ts`
- `npm.cmd run build`
