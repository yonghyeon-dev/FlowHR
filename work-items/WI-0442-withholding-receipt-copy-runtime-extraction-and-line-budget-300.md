# WI-0442: 원천징수영수증 콘솔 copy/runtime 분리 + 라인 예산 300

## Summary
- `WithholdingReceiptConsole.tsx`에서 locale copy/런타임 정규화 로직을 `copy-runtime.ts`로 분리한다.
- 콘솔 파일은 요청 실행/상태 처리 오케스트레이션에 집중한다.

## Scope
- `src/components/withholding-receipt/copy-runtime.ts` 신규 추가
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx` import 전환 및 불필요 중복 제거
- 기존 회귀 앵커(`runRequest`, `isErrorPayload`)는 유지

## Acceptance
1. `WithholdingReceiptConsole.tsx`가 300줄 이하를 유지한다.
2. copy/runtime helper가 별도 파일에서 export되어 재사용 가능하다.
3. 기존 동작(미리보기/정산/문서/로그)이 회귀 없이 유지된다.
