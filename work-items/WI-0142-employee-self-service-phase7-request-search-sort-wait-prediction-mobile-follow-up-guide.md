> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0142: Employee Self-Service UX Phase 7 - Request Search/Sort, Approval Wait Prediction, Mobile Follow-up Guide

## Background and Problem

`/employee` already provides submit checklist, bottleneck feedback, and mobile submit guide (WI-0140).

After submission, users still need clearer follow-up support:

- request history can be filtered by status, but integrated search/sort for follow-up target finding is limited
- approval waiting risk is visible indirectly, but prediction-oriented feedback is not summarized
- mobile users need one panel to decide the next action after submission

This WI adds a post-submit follow-up layer focused on searchability, prediction, and mobile action flow.

## Scope

### In Scope

- Add request search/sort section in `/employee`
  - unified attendance/leave request list
  - search scope (`all`, `request_id`, `status`, `content`)
  - sort options (`pending_first`, `latest_desc`, `oldest_asc`, `status`)
  - quick pending filter/reset actions
  - section anchor: `#request-search-sort`
- Add approval wait prediction feedback section
  - pending wait-time based prediction cards (`all`, `attendance`, `leave`)
  - severity (`normal`/`watch`/`critical`) and ETA labels
  - quick jump actions to related sections
  - section anchor: `#request-wait-prediction`
- Add mobile follow-up action guide section
  - post-submit action cards (pending follow-up, wait prediction, resubmit follow-up, API failure follow-up)
  - one-tap action routing for each card
  - section anchor: `#mobile-follow-up-guide`
- Add employee sidebar anchors for all new sections
- Add WI-0142 e2e and wire to MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- ops-only dashboard expansion

## User Scenarios

1. 직원은 요청 검색/정렬 패널에서 승인 대기 항목을 우선순위로 빠르게 찾는다.
2. 직원은 승인 대기 예측 피드백에서 지연 위험을 확인하고 관련 화면으로 이동한다.
3. 직원은 모바일 후속 액션 가이드에서 제출 이후 필요한 작업을 카드 단위로 바로 수행한다.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove request search/sort, wait prediction, and mobile follow-up guide sections.
- Remove added employee sidebar anchors and related styles.
- Remove WI-0142 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Integrated request search/sort list is computed/rendered with scope and sort controls.
- [x] Approval wait prediction cards render severity/ETA/detail and section jump actions.
- [x] Mobile follow-up guide renders post-submit actions and one-tap routing.
- [x] Employee sidebar includes new anchors.
- [x] WI-0142 e2e is added and included in MVP/FULL suites.
