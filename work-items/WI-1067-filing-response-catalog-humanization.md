# WI-1067: 신고 응답 분류 선택지 정리

## 배경

- 신고 응답 분류와 반려 사유 선택 상자에는 아직 `code - label`, `OTHER` 같은 내부 코드가 노출된다.
- 카탈로그가 로드된 상태에서도 운영자는 라벨보다 코드 문자열을 먼저 보게 되어 제품 표면이 거칠다.

## 목표

- 신고 응답/반려 분류 선택지에서 raw 코드를 숨기고 제품 라벨만 보이게 한다.
- 카탈로그 미로드 상태에서도 fallback 선택지가 내부값을 그대로 노출하지 않게 한다.

## 범위

- `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
- `src/components/payroll-year-end-filing/copy.ts`
- `scripts/tests/e2e-wi1067-filing-response-catalog-humanization.test.ts`

## 수용 기준

1. 응답 분류/반려 사유 선택지에서 `code - label` 형식이 보이지 않는다.
2. fallback 반려 사유 선택지에서 `OTHER`가 그대로 보이지 않는다.
3. `npm run typecheck`, 전용 WI 테스트, `npm run test:integration`, `npm test`가 통과한다.
