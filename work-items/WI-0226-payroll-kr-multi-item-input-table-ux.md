# WI-0226: Payroll KR Multi-Item Input Table UX

## Background

WI-0224/WI-0225에서 과세/비과세 항목 배열 및 프리셋 입력이 가능해졌지만,
`/admin` UI는 단일 항목 입력 형태라 실제 다중 항목 입력 시나리오를 직접 지원하지 못했습니다.

## Scope

### In Scope

- `/admin` 급여 프리뷰(`statutory_kr_baseline`) 항목 입력 UX를 다중 행 테이블로 전환
  - 과세 항목/비과세 항목 각각 행 추가/삭제 지원
  - 행별 `code`, `category`, `amountKrw` 입력
  - 빈 행 제외 payload 변환
- `incomeSplitItemPresetId` 사용 시 수동 테이블 입력 비활성화 유지
- 기존 서버 계약(`taxableIncomeItems`, `nonTaxableIncomeItems`)과 호환되도록 payload 연동
- 스펙/로드맵/회귀 테스트 갱신
  - `specs/payroll/{contract.yaml,api.yaml,test-cases.md,rfc.md}`
  - `scripts/tests/e2e-wi0226-payroll-kr-multi-item-input-table-ux.test.ts`
  - WI-0224/WI-0225 회귀 유지

### Out of Scope

- 다중 항목 템플릿 저장/불러오기 CRUD
- 항목 코드 사전 마스터 관리 UI
- 항목 합계 자동 분배/추천 로직

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0226-payroll-kr-multi-item-input-table-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0225-payroll-kr-income-split-item-preset-dataset.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0224-payroll-kr-income-split-item-code-category-input.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0223-payroll-kr-taxable-non-taxable-split-rule.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
