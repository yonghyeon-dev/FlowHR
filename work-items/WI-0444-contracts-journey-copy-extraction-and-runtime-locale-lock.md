# WI-0444: 전자계약 여정 copy 분리 + contracts runtime locale lock

## Summary
- 직원 전자계약 여정 패널 문구를 locale copy 파일로 분리한다.
- contracts HTTP 에러 정규화에서 runtime locale override를 지원해 `ko/en` 일관성을 보장한다.

## Scope
- `src/components/contracts/journey-copy.ts` 신규 추가
- `src/components/contracts/EmployeeContractJourneyPanel.tsx` locale copy 기반 리팩터링
- `src/components/contracts/http.ts`에 `setContractsRuntimeLocale` 추가
- contracts 3개 UI(`AdminContractsWorkspace`, `ContractTemplateBuilder`, `EmployeeContractsInbox`)에서 locale lock 적용

## Acceptance
1. 여정 패널의 locale 문구가 copy 파일에서 일원 관리된다.
2. contracts 에러 fallback 언어가 현재 화면 locale과 일치한다.
3. 기존 계약 생성/응답/증빙 조회 흐름이 회귀 없이 동작한다.
