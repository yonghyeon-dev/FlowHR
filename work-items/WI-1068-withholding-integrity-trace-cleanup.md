# WI-1068: 원천징수 무결성 식별값 정리

## 배경

- 원천징수영수증 요약과 문서 메타데이터 복사 기능에 아직 `finalizationId`, `settlementHash`, `contentSha256` 같은 내부 무결성 식별값이 남아 있다.
- 이 값들은 운영 사용자에게 직접적인 업무 의미를 주지 않으면서 내부 추적 정보만 노출한다.

## 목표

- 원천징수영수증 화면과 메타데이터 복사 기능에서 내부 무결성 식별값을 숨긴다.
- 상태 메시지 역시 내부 식별값을 덧붙이지 않고 작업 결과만 안내한다.

## 범위

- `src/components/withholding-receipt/WithholdingReceiptPanels.tsx`
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `src/components/withholding-receipt/useWithholdingReceiptRequests.ts`
- `src/components/withholding-receipt/copy-runtime.ts`
- `scripts/tests/e2e-wi1068-withholding-integrity-trace-cleanup.test.ts`

## 수용 기준

1. 원천징수 요약 카드에서 raw `finalizationId`, `settlementHash`, `contentSha256`가 직접 보이지 않는다.
2. 문서 메타데이터 복사 결과에 raw `contentSha256`가 포함되지 않는다.
3. 확정 정산 로드 완료 메시지에 raw `finalizationId`가 붙지 않는다.
4. `npm run typecheck`, 전용 WI 테스트, `npm run test:integration`, `npm test`가 통과한다.
