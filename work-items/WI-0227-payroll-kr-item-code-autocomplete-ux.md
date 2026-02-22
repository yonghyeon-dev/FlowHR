# WI-0227: Payroll KR Item Code Autocomplete UX

## Background

WI-0226에서 `/admin` 다중 항목 입력 테이블을 도입했지만, 코드 입력은 여전히 자유 입력이라
운영자가 코드 문자열을 기억해야 하고 카테고리 오입력 가능성이 남아 있습니다.

## Scope

### In Scope

- 과세/비과세 항목 코드 사전 데이터셋 추가
  - 코드, 기본 카테고리, 라벨 제공
- `/admin` 다중 항목 테이블에 코드 `autocomplete` 적용
  - 코드 입력에 사전 기반 suggestion 제공
  - 사전 코드 선택 시 카테고리 자동 채움
  - 카테고리 수동 수정은 유지
- API/서버 계약은 유지(입력 스키마 변경 없음)
- 스펙/로드맵/회귀 테스트 갱신
  - `specs/payroll/{contract.yaml,api.yaml,test-cases.md,rfc.md}`
  - `scripts/tests/e2e-wi0227-payroll-kr-item-code-autocomplete-ux.test.ts`

### Out of Scope

- 서버 측 코드 사전 강제 검증
- 코드 사전 CRUD 관리자 화면
- 외부 코드 체계(Hometax/NTS) 자동 동기화

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0227-payroll-kr-item-code-autocomplete-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0226-payroll-kr-multi-item-input-table-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0225-payroll-kr-income-split-item-preset-dataset.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0224-payroll-kr-income-split-item-code-category-input.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
