# WI-0221: Payroll KR Tax-Table Preset Dataset and Validation Guard

## Background

WI-0220에서 `incomeTaxLookupTable`(간이세액표 룩업)와 `insuranceRounding`을 도입했지만, 운영 관점에서는 매 요청마다 테이블을 직접 전달해야 하고 입력 조합 충돌(브라켓/룩업/프리셋)이 발생할 수 있습니다.

## Scope

### In Scope

- `statutory_kr_baseline` 입력 확장:
  - `incomeTaxLookupPresetId` (운영 프리셋 세액표 ID)
- 서비스 규칙 추가:
  - 프리셋 ID로 룩업 테이블 해석
  - `incomeTaxBrackets`, `incomeTaxLookupTable`, `incomeTaxLookupPresetId` 조합의 상호배타 검증
  - 룩업 테이블 세액(`taxKrw`) 단조 증가 검증(운영 데이터셋 가드)
- 스펙 문서 갱신:
  - `specs/payroll/contract.yaml`
  - `specs/payroll/api.yaml`
  - `specs/payroll/test-cases.md`
  - `specs/payroll/rfc.md`
- WI-0221 e2e 테스트 추가

### Out of Scope

- 외부 공공기관 세액표 자동 동기화
- 관리자 UI 리디자인
- 연말정산 전체 엔진 개편

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0221-payroll-kr-tax-table-preset-and-validation-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0220-payroll-kr-simple-tax-table-and-insurance-rounding.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0105-payroll-kr-progressive-cap.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0106-payroll-tax-credit-boundary.test.ts`
- `npm.cmd run build`
