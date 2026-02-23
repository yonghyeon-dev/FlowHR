# WI-0287: Employee Year-End Input Self-Service Route

## Background

직원 포털에서는 확정된 연말정산 결과를 조회할 수 있었지만, 본인 입력값(공제/세액공제)에 따른 영향도를
사전에 확인하는 셀프서비스 화면이 부족했습니다.

## Scope

### In Scope

- 직원 라우트 추가: `/employee/year-end-input`
- 직원 내비게이션에 연말정산 입력 링크 추가(ko/en i18n 키 포함)
- 직원 콘솔 컴포넌트 추가:
  - 확정 연말정산 스냅샷 로드
  - 공제/세액공제 입력 기반 영향도 시뮬레이션
  - 예상 세액/추가납부/환급 변화 요약 표시
  - API 호출 로그 및 기존 연말정산 화면 이동 링크 제공

### Out of Scope

- 관리자 확정 API 변경
- 신고 제출/ACK 기능 확장
- 모바일 앱 전용 흐름 분기

## Validation

- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd exec tsx scripts/tests/e2e-wi0290-payroll-contract-core-journey-e2e-bundle.test.ts`

