# WI-0089: MVP 테스트 스위트 분리 (SaaS 우선 배송)

## 배경/문제

현재 `npm run test:e2e`가 ops/anti-spoofing/anomaly/incident 등 **제품 MVP와 무관한 고급 운영 기능**까지
포함한 “풀스위트”를 기본으로 실행한다.

이 구조는 다음 문제를 만든다.

- SaaS 핵심(UI/휴가/급여/결재) 배송 속도가 느려진다.
- MVP 범위를 넘어선 기능이 CI에서 머지를 막는다.
- “제품 가치”보다 “운영 기능 깊이”가 우선되는 방향으로 팀이 끌려간다.

## 목표

- CI 기본 e2e는 **MVP SaaS 코어만** 검증한다.
- 고급 운영 기능은 별도의 full 스위트로 유지하되, 기본 게이트에서 분리한다.

## 범위 (In)

- `package.json` e2e 스크립트 분리:
  - `test:e2e` = `test:e2e:mvp`
  - `test:e2e:full` = 기존 풀스위트 유지
- 문서 추가: `docs/test-suites.md`
- 로드맵에 테스트 운영 문서 링크 추가

## 범위 (Out)

- 풀스위트 테스트 삭제
- ops 기능 자체 삭제/리팩터링
- 신규 스케줄(nightly) 워크플로 자동화

## 검증

- `npm run test:e2e` 실행 시 MVP 스위트만 수행되고 통과한다.
- `npm run test:e2e:full`로 기존 풀스위트를 계속 실행할 수 있다.
- CI에서 `npm run test:e2e`가 통과한다.

## 롤백

- `package.json`에서 `test:e2e`를 기존 풀스위트로 되돌리고, `test:e2e:full` 추가를 제거한다.

