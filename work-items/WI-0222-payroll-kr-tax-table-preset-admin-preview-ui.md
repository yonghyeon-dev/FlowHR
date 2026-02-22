# WI-0222: Payroll KR Tax-Table Preset Admin Preview UX

## Background

WI-0221에서 `incomeTaxLookupPresetId`와 검증 가드가 추가되었지만, 관리자 급여 프리뷰 화면에는
프리셋을 쉽게 선택하고 입력 규칙을 확인할 수 있는 UI가 없었습니다.

## Scope

### In Scope

- `/admin` 급여 프리뷰(`법정공제(KR baseline)`) 입력 영역에 프리셋 선택 UI 추가
- 프리셋 선택/규칙 안내를 별도 컴포넌트로 분리
- 프리셋 선택 시 `incomeTaxLookupPresetId`가 프리뷰 API payload로 전달되도록 연동
- 브라우저 로케일(`ko`/`en`)에 맞춘 가이드 문구 노출
- WI-0222 UI 회귀 테스트 추가

### Out of Scope

- 신규 세액표 프리셋 데이터셋 추가
- 백엔드 API/DB 스키마 변경
- 스케줄러/ops 워크플로 확장

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0222-payroll-admin-preset-selector-and-guide.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0221-payroll-kr-tax-table-preset-and-validation-guard.test.ts`
- `npm.cmd run build`
