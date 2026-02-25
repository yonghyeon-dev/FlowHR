# WI-0447: 한국어 locale 잔존 영어 회귀 가드 2차 (원천징수/명세/계약)

## Summary
- `ko` copy 블록에 영어 UI 용어가 다시 섞이지 않도록 회귀 가드를 추가한다.
- 대상 영역은 사용자 제보가 있었던 원천징수/명세/전자계약함으로 한정한다.

## Scope
- 신규 e2e 가드 테스트 추가:
  - `withholding` copy
  - `payslip-receipts` copy
  - `contracts journey` copy
  - `payslip search/sort` copy

## Acceptance
1. 지정된 `ko` copy 블록 문자열에서 금지 영어 토큰이 검출되면 테스트가 실패한다.
2. 허용 토큰(예: FlowHR) 외 영어 잔존이 회귀로 유입되지 않는다.
3. ROADMAP에 WI-0447 반영.
