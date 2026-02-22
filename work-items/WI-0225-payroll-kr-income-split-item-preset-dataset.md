# WI-0225: Payroll KR Income Split Item Preset Dataset

## Background

WI-0224에서 과세/비과세 항목 입력(`taxableIncomeItems`, `nonTaxableIncomeItems`)을 추가했지만,
초기 운영에서는 코드/카테고리 값을 매번 수동 입력해야 해서 입력 일관성이 떨어집니다.

## Scope

### In Scope

- `statutory_kr_baseline` 입력 확장:
  - `incomeSplitItemPresetId` (선택)
- 서버 프리셋 데이터셋 추가:
  - preset ID 기준 과세/비과세 항목 코드/카테고리 템플릿 제공
  - 분리 총액(`taxableIncomeKrw`, `nonTaxableIncomeKrw`) 기준으로 항목 금액 자동 구성
- 검증 가드:
  - 지원하지 않는 `incomeSplitItemPresetId` 거부
  - `incomeSplitItemPresetId`와 수동 항목 배열(`taxableIncomeItems`, `nonTaxableIncomeItems`) 동시 사용 금지
- 관리자 급여 프리뷰(`/admin`) UI:
  - 항목 프리셋 selector 추가
  - 프리셋 선택 시 수동 항목 입력 비활성화
- 스펙 문서/테스트 갱신:
  - `specs/payroll/contract.yaml`, `api.yaml`, `rfc.md`, `test-cases.md`
  - WI-0225 e2e 회귀 테스트

### Out of Scope

- 프리셋 CRUD(관리자 생성/수정/삭제) 화면
- 외부 세법 코드 사전 자동 동기화
- 다중 항목 템플릿(행 단위 복수 자동 생성) 고도화

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0225-payroll-kr-income-split-item-preset-dataset.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0224-payroll-kr-income-split-item-code-category-input.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0223-payroll-kr-taxable-non-taxable-split-rule.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
