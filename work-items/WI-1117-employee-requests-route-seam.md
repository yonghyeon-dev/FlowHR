# WI-1117: 직원 요청 영역 라우트 승격 시임

## 배경

`WI-1107`로 employee 셸을 grouped navigation으로 재정렬했지만,
여전히 일부 self-service 경험은 `?focus=`와 hidden-subpage 구조에 기대고 있습니다.

특히 요청 중심 경험은 다음 문제가 남아 있습니다.

- 요청 탐색과 상태 확인이 실제 페이지인지 같은 페이지 내부 섹션인지 모호하다.
- 대시보드 단축 진입과 가이드 CTA가 숨은 섹션 구조를 전제로 한다.
- employee 홈이 제품 홈이라기보다 구현 세부를 끌어안은 허브처럼 보인다.

## 목표

- employee self-service에서 요청 중심 경험을 숨은 섹션이 아니라 명시적 라우트 시임으로 분리한다.
- `Today` 허브와 `Requests` 영역의 경계를 분명하게 만든다.
- 이후 benefits / leave / attendance / request-status 흐름을 route-first 모델로 옮길 수 있는 첫 안전 지점을 만든다.

## 범위

### In Scope

- 현재 employee `?focus=` / hidden-subpage 중 요청 중심 대상을 재분류
- `Today`에 남길 것과 `Requests`로 승격할 것을 구분
- 첫 번째 route seam 구현 범위 확정
- 대시보드 shortcut / guide CTA 정렬 범위 정의

### Out of Scope

- benefits / notices / documents 전면 재디자인
- admin shell 재작업
- 모바일 전면 개편

## 초기 검토 포인트

- 현재 employee 홈에서 요청 상태와 신청 액션이 어떻게 섞여 있는지
- `?focus=` 기반 진입 중 실제 페이지 승격이 필요한 대상
- `Today` 허브에 남겨야 할 최소 카드/패널
- `Requests` 영역으로 이동해야 할 작업 흐름
