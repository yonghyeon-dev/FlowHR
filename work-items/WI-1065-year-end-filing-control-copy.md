# WI-1065: 연말정산 신고 제어 문구 정리

## 배경

- `WI-1062`부터 `WI-1064`까지 이어진 정리 이후에도 연말정산/신고 화면에는 제어용 기술 용어가 일부 남아 있다.
- 신고 사전점검 패널의 후속 액션이 여전히 `정산 해시 갱신`으로 보이고, 응답 분류 사전이 비어 있을 때 선택 상자가 `ACK-OK`를 그대로 노출한다.
- 정산 요약 카드 일부도 여전히 `정산 해시`라는 내부 용어를 사용해 운영자 표면이 완전히 정리되지 않았다.

## 목표

- 연말정산/신고 제어 액션과 fallback 선택값을 운영자 언어로 통일한다.
- 정산 요약에서 `정산 해시` 대신 제품화된 기준 용어를 사용한다.

## 범위

- `src/components/payroll-year-end-filing/FilingPreflightBlockerPanel.tsx`
- `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
- `src/components/payroll-year-end-filing/copy.ts`
- `src/components/payroll-year-end/copy.ts`
- `scripts/tests/e2e-wi1065-year-end-filing-control-copy.test.ts`

## 수용 기준

1. 사전점검 패널 액션이 `정산 해시` 표현 없이 운영자 언어로 보인다.
2. 응답 분류 사전이 비어 있어도 화면에는 `ACK-OK`가 그대로 노출되지 않는다.
3. 연말정산/신고 요약 라벨이 `정산 해시` 대신 제품 용어를 사용한다.
4. `npm run typecheck`, 전용 WI 테스트, `npm run test:integration`, `npm test`가 통과한다.
