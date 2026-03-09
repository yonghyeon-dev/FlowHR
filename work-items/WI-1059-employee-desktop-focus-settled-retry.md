# WI-1059: 직원 데스크톱 focus 딥링크 정착 재시도 보강

## 배경

`/employee?focus=...` direct-load 동작은 mobile에서는 안정화됐지만, desktop에서는 여전히 일부 섹션이 `scrollY=0`, `hash=""` 상태로 남아 실제 섹션 이동이 완료되지 않았다.

## 프로덕션 근거

- 리포트: `codex_test/results/prod-completed-items-reverify-2026-03-09T13-37-17-634Z/REPORT.md`
- 결과:
  - desktop focus: `5/12`
  - mobile focus: `12/12`
- 잔여 desktop 실패:
  - `/employee?focus=account`
  - `/employee?focus=submit-checklist`
  - `/employee?focus=request-feedback`
  - `/employee?focus=request-search-sort`
  - `/employee?focus=request-resubmit`
  - `/employee?focus=attendance`
  - `/employee?focus=leave-calendar`

## 문제 정의

현재 effect는 첫 점프 시도 전에 `appliedFocusSectionRef`를 닫아버리거나, 섹션이 실제로 화면에 정착했는지 확인하지 못한 채 한 번의 시도로 종료될 수 있다. 그 결과 desktop direct-load에서는 레이아웃/패널 준비가 조금 늦는 경우 재시도 기회를 잃는다.

## 범위

- focus 점프가 실제로 정착했는지 판단하는 helper 추가
  - `location.hash`
  - 대상 섹션 뷰포트 가시성
- desktop direct-load focus effect를 정착 확인 기반 재시도로 변경
- `appliedFocusSectionRef`는 실제 정착 이후에만 잠그기
- `test:integration`에 회귀 가드 추가
- production progress와 gap inventory에 follow-up WI 반영

## 완료 기준

- desktop direct-load focus는 섹션이 실제로 보이고 해시가 맞을 때까지 재시도한다.
- `appliedFocusSectionRef`는 정착 전에 잠기지 않는다.
- `scripts/tests/e2e-wi1059-employee-desktop-focus-settled-retry.test.ts`가 통과한다.
- `npm run test:integration`에 WI-1059 회귀 테스트가 포함된다.

## 실행 로그

- 2026-03-09: `prod-completed-items-reverify-2026-03-09T13-37-17-634Z` 기준으로 desktop focus 실패가 잔존함을 재확인.
- 2026-03-09: 과거 WI 재사용 대신 현재 잔여 문제를 follow-up WI-1059로 분리.
- 2026-03-09: 정착 판정 helper와 재시도 루프 기반 보강 패치를 시작.
