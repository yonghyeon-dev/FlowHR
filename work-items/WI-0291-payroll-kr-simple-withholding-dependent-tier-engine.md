# WI-0291: Payroll KR Simple Withholding Dependent-Tier Engine

## Background

KR statutory baseline의 간이세액표(`incomeTaxLookupTable`)는 현재 taxable-base 구간별 단일 `taxKrw`만 지원하여
부양가족 수(`dependentCount`)에 따른 원천세 차이를 정밀하게 반영하기 어려웠습니다.

## Scope

### In Scope

- `incomeTaxLookupTable` row 확장:
  - optional `dependentTaxKrw[]` (`{ dependentCount, taxKrw }`)
- validation guard 추가:
  - `dependentTaxKrw`는 `dependentCount=0`부터 시작
  - `dependentCount`는 strict increasing
  - `taxKrw`는 dependentCount 증가에 대해 non-increasing
- 계산 로직 추가:
  - taxable-base로 lookup row를 먼저 선택
  - 해당 row의 `dependentTaxKrw`에서 `dependentCount` 이하의 최대 tier를 적용
  - row 기본 `taxKrw`는 기존 trace(`selectedIncomeTaxLookupRow`) 호환 유지
  - 적용된 tier는 `selectedIncomeTaxLookupDependentTier`로 trace 출력
- managed preset 데이터셋(`kr_simple_monthly_v2026_01`, `kr_simple_monthly_v2026_07`)에 dependent tier 반영
- payroll spec 버전 `1.58.0` 반영 (`api.yaml`, `contract.yaml`, `test-cases.md`)
- WI-0291 e2e 회귀 테스트 추가

### Out of Scope

- 한국 세법 원문 기반 완전 재현 엔진
- 별도 국가 세액표 모델
- 관리자 화면의 신규 폼 필드 추가

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0291-payroll-kr-simple-withholding-dependent-tier-engine.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0221-payroll-kr-tax-table-preset-and-validation-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0282-payroll-kr-lookup-preset-effective-date-auto-resolution.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`

