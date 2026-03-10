# WI-1062: 연말정산·신고 표면 식별자 정리

## 배경

- 연말정산/신고 운영 화면에 `inputVectorHash`, `settlementHash`, `finalizationId`, `submissionId`, `ackCode`, `rejectionReasonCode` 같은 내부 식별자가 그대로 노출된다.
- 기능은 동작하더라도 운영형 제품 기준에서는 내부 추적값보다 상태와 후속 조치가 먼저 보여야 한다.

## 목표

- 연말정산/신고 핵심 화면의 요약, 타임라인, 토스트에서 내부 해시·ID·코드 노출을 제거한다.
- 운영자는 동일한 작업을 계속 수행할 수 있어야 하고, 회귀 테스트로 다시 노출되지 않도록 막는다.

## 범위

- `src/components/payroll-year-end/PayrollYearEndConsole.tsx`
- `src/components/payroll-year-end/PayrollYearEndPreflightConsole.tsx`
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `src/components/payroll-year-end-filing/FilingSettlementSummaryPanels.tsx`
- `src/components/payroll-year-end-filing/FilingPreflightBlockerPanel.tsx`
- `src/components/payroll-year-end-filing/FilingSubmissionTimelinePanel.tsx`
- `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
- `src/components/payroll-year-end-filing/value-helpers.ts`
- `scripts/tests/e2e-wi1062-year-end-filing-surface-humanization.test.ts`

## 수용 기준

1. 연말정산 요약 패널에서 입력 해시/정산 해시/확정 ID가 일반 요약 항목으로 노출되지 않는다.
2. 신고 콘솔의 제출 목록, 타임라인, 성공 토스트에서 `submissionId`, `ackCode`, `rejectionReasonCode`가 그대로 노출되지 않는다.
3. 직원 연말정산 입력 화면에서도 확정 ID가 직접 노출되지 않는다.
4. `npm run typecheck`, 신규 WI-1062 회귀 테스트, `npm run test:integration`, `npm test`가 통과한다.
