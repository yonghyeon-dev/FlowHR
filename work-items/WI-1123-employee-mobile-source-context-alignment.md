# WI-1123: 직원 모바일 진입 맥락 정렬

## 배경

`WI-1121`로 직원 전용 작업면 hero와 source-context를 정렬했지만,
실제 요청 워크스페이스와 모바일 메뉴 진입은 아직 같은 규칙을 따르지 않습니다.

현재 모순:

- `/employee/requests`는 `source` query를 받아도 hero에서 맥락을 보여주지 않습니다.
- 모바일 메뉴의 요청 계열 진입은 route-first 구조로 보이지만, 실제 handoff 맥락은 전달하지 않습니다.
- 같은 employee shell 안에서도 dashboard 진입과 mobile menu 진입의 경험이 다릅니다.

## 목표

- 요청 워크스페이스 hero가 `source` query를 읽어 맥락과 돌아가기 CTA를 맞춥니다.
- 모바일 메뉴의 요청 계열 진입이 `employee-mobile-menu` source를 전달합니다.
- employee workspace source resolver에 모바일 진입 맥락을 추가합니다.

## 범위

### In Scope

- `resolveEmployeeWorkspaceSourceEntry`에 모바일 메뉴 source 추가
- `/employee/requests` hero의 source-context 적용
- employee 모바일 메뉴의 requests 계열 route handoff 정렬
- 관련 회귀 가드 추가 및 progress 최신화

### Out of Scope

- mobile IA 전체 재설계
- requests workspace 내부 레이아웃 재배치
- documents/notices/account 계열 mobile source 체계 확장

## 완료 기준

1. `/employee/requests`가 `source` query를 읽어 source hint와 return CTA를 맞춘다.
2. 모바일 메뉴의 requests 계열 진입이 `employee-mobile-menu` source를 전달한다.
3. `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
