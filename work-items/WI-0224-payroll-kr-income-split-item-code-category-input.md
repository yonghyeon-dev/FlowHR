# WI-0224: Payroll KR Income Split Item Code/Category Input

## Background

WI-0223에서 과세/비과세 총액 분리 규칙(`taxableIncomeKrw`, `nonTaxableIncomeKrw`)을 도입했지만,
실무 입력에서는 총액만으로는 항목 출처 추적(코드/카테고리)이 부족합니다.

## Scope

### In Scope

- `statutory_kr_baseline` 입력 확장:
  - `taxableIncomeItems[]` (`code`, `category`, `amountKrw`)
  - `nonTaxableIncomeItems[]` (`code`, `category`, `amountKrw`)
- 서비스 규칙 추가:
  - 항목 코드 중복(대소문자 무시) 검증
  - 항목 합계 기반 과세/비과세 분리 검증(총액 입력과 병행 시 정합성 확인)
  - deduction breakdown에 항목 리스트/합계 추적 정보 기록
- 관리자 급여 프리뷰(`/admin`)에 항목 코드/카테고리/금액 입력(최소 baseline) 연동
- 스펙 문서 갱신:
  - `specs/payroll/contract.yaml`
  - `specs/payroll/api.yaml`
  - `specs/payroll/test-cases.md`
  - `specs/payroll/rfc.md`
- WI-0224 e2e 테스트 추가

### Out of Scope

- 항목 코드 사전/마스터 데이터 관리 화면
- 외부 세법 코드 자동 동기화
- 연말정산 항목 엔진 재설계

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0224-payroll-kr-income-split-item-code-category-input.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0223-payroll-kr-taxable-non-taxable-split-rule.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0222-payroll-admin-preset-selector-and-guide.test.ts`
- `npm.cmd run build`
