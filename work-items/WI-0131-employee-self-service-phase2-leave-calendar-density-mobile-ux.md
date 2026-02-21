> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0131: Employee Self-Service Phase 2 - Leave Calendar Density and Mobile UX

## Background and Problem

`/employee`는 휴가 신청/취소와 기본 캘린더 리스트를 제공하지만, 월 단위로 휴가 밀도를 빠르게 파악하기 어렵고
모바일에서 반복 입력 시 조작 단계가 많았습니다. 직원 셀프서비스 핵심 여정(휴가 확인/신청)을 더 빠르게 만들기 위해
시각화와 모바일 조작성 중심으로 2차 UX 고도화를 진행합니다.

## Scope

### In Scope

- `/employee#leave` 휴가 입력 UX 고도화
  - 모바일 친화 `휴가 빠른 입력` 프리셋(오늘 반차/내일 하루/다음주 월요일)
- `/employee#leave-calendar` 캘린더/시각화 고도화
  - 월간 고밀도 캘린더 그리드(일자별 요청 건수/상태 요약)
  - 연차 잔여 시각화(사용률 링 + 부여/사용/잔여/이월 카드)
  - 월 이동 빠른 액션(이전 달/이번 달/다음 달)
  - 모바일 반응형 조정(버튼/그리드 조작성 개선)
- 관련 스타일 갱신(`src/app/globals.css`)
- WI-0131 e2e 회귀 테스트 추가 및 e2e 스위트 연결
- ROADMAP 최신 항목 갱신

### Out of Scope

- 휴가 정책/정산 엔진 규칙 변경
- 스케줄러/cron/GitHub Actions 추가
- webhook/email 등 배달 채널 확장

## User Scenarios

1. 직원은 월간 그리드에서 휴가가 몰린 날짜를 즉시 파악한다.
2. 직원은 모바일에서 빠른 입력 버튼으로 휴가 신청 폼을 신속히 채운다.
3. 직원은 연차 잔여/사용/이월을 시각적으로 확인하고 사용 속도 가이드를 참고한다.

## Data and API Changes

- DB 스키마 변경 없음
- API 스펙 변경 없음
- UI 렌더링/상태 계산 로직만 확장

## Rollback Plan

- 휴가 빠른 입력/밀도 그리드/시각화 UI를 제거하고 기존 리스트 중심 UI로 복귀
- 계약/API/DB 변경이 없어 프론트엔드 파일 단위 롤백으로 즉시 복구 가능
- Recovery target: 30m

## Definition of Done (DoD)

- [x] `/employee#leave`에 모바일 빠른 입력 액션이 제공된다.
- [x] `/employee#leave-calendar`에 월간 밀도 그리드와 잔여 연차 시각화가 표시된다.
- [x] 캘린더 월 이동 빠른 액션과 모바일 반응형 레이아웃이 동작한다.
- [x] WI-0131 e2e 회귀 테스트가 추가되고 스위트에 연결된다.
