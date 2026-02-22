# WI-0223: Payroll KR Taxable/Non-Taxable Split Rule

## Background

현재 `statutory_kr_baseline` 모드는 `nonTaxableIncomeKrw`만 받아 과세표준을 계산합니다.
운영 입력 관점에서는 과세/비과세 분리값 검증 규칙이 없어, 총지급 대비 분리 입력 정합성을
명시적으로 보장하기 어렵습니다.

## Scope

### In Scope

- `statutory_kr_baseline` 입력 확장:
  - `taxableIncomeKrw` (선택)
- 서비스 규칙 추가:
  - `nonTaxableIncomeKrw`는 `grossPayKrw`를 초과할 수 없음
  - `taxableIncomeKrw`가 제공된 경우 `taxableIncomeKrw + nonTaxableIncomeKrw = grossPayKrw` 강제
  - 분리 검증 결과(`incomeSplitKrw`)를 deduction breakdown에 기록
- 관리자 급여 프리뷰(`/admin`)에 과세 소득 선택 입력 추가
- 스펙 문서 갱신:
  - `specs/payroll/contract.yaml`
  - `specs/payroll/api.yaml`
  - `specs/payroll/test-cases.md`
  - `specs/payroll/rfc.md`
- WI-0223 e2e 테스트 추가

### Out of Scope

- 신규 세액표/세법 엔진 정책 추가
- 연말정산 재설계
- ops 스케줄러/워크플로 확장

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0223-payroll-kr-taxable-non-taxable-split-rule.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0221-payroll-kr-tax-table-preset-and-validation-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0222-payroll-admin-preset-selector-and-guide.test.ts`
- `npm.cmd run build`
