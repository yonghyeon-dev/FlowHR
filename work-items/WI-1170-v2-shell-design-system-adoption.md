# WI-1170: V2 셸 및 디자인 시스템 도입

상위 경로의 `flowhr_V2/flowhr-ui`를 현재 FlowHR 프론트의 기준선으로 채택하고, 공용 셸과 핵심 진입면을 V2 와이어프레임 구조로 올린다.

## Background

- 현재 FlowHR는 route-first 구조 정리는 진행됐지만, 시각 셸과 공통 디자인 언어가 아직 V2 와이어프레임 수준에 못 미친다.
- 사용자는 `flowhr_V2/flowhr-ui`를 완성된 프론트 와이어프레임으로 보고 있으며, 점진적 폴리시보다 이 기준을 실제 제품 표면에 직접 적용하길 원한다.
- 첫 파동은 전면 재구축이 아니라, 공용 셸과 landing/login/admin home/employee home의 디자인 기준을 V2로 교체하는 단계다.

## Scope

1. `flowhr_V2/flowhr-ui/css/design-system.css`를 현재 앱에서 사용할 수 있는 글로벌 디자인 시스템으로 도입한다.
2. landing, login, admin layout, employee layout을 V2 셸 구조 기준으로 재구성한다.
3. admin/employee 홈 진입면이 V2 방향을 따르도록 첫 시각 베이스라인을 반영한다.
4. 진행 문서에 V2 전환 시작점과 목적을 기록한다.

## Non-Goals

- 이번 WI에서 모든 admin/employee 하위 워크스페이스를 V2 수준으로 완성하는 일
- 권한/테넌트 도메인 로직 자체를 바꾸는 일
- `flowhr_V2` HTML 파일을 빌드 산출물로 직접 서빙하는 일

## Acceptance Criteria

1. 루트 landing 과 login 이 기존 panel 스타일이 아니라 V2 톤앤매너로 보인다.
2. admin/employee 공통 셸이 `app-header`, `app-sidebar`, `app-main` 구조로 정렬된다.
3. 기존 라우팅과 로그인 동작은 유지된다.
4. `npm run typecheck` 가 green 이다.
