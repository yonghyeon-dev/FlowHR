> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0140: Employee Self-Service UX Phase 6 - Submit Checklist Integration, Bottleneck Feedback, Mobile Submit Guide

## Background and Problem

`/employee` already provides integrated summary, request feedback, resubmit flow, and mobile shortcuts.

Users still lose time before final submission:

- correction/leave/resubmit readiness is split across separate sections
- bottlenecks (pending pileup, validation fail, API fail) are visible but not prioritized
- mobile users need a single submission guide that tells what to fix next

This WI adds an integrated submission assistance layer in the employee portal.

## Scope

### In Scope

- Add integrated submit checklist section in `/employee`
  - attendance correction readiness
  - leave request readiness
  - resubmit flow readiness
  - per-flow pass/total with direct section jump
- Add request bottleneck feedback section
  - pending queue accumulation signal
  - submit validation bottleneck signal
  - API failure bottleneck signal
  - severity-based prioritization with quick jump action
- Add mobile submit guide section
  - per-flow progress label and next action
  - ready/pending/fail tone guide cards
  - one-tap navigation to target forms
- Add employee sidebar anchors for new sections
  - `#submit-checklist`
  - `#request-bottleneck-feedback`
  - `#mobile-submit-guide`
- Add WI-0140 e2e and wire to MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- ops-only dashboard expansion

## User Scenarios

1. 직원이 제출 전 통합 체크리스트에서 정정/휴가/재제출의 통과 여부를 한 번에 확인한다.
2. 직원이 병목 피드백에서 우선 해결해야 할 항목(대기 누적/검증 실패/API 실패)을 즉시 파악한다.
3. 직원이 모바일 제출 가이드 카드에서 다음 조치를 눌러 필요한 폼으로 바로 이동한다.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove submit checklist, bottleneck feedback, and mobile submit guide sections.
- Remove new employee sidebar anchors and related styles.
- Remove WI-0140 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Integrated submit checklist computes and renders correction/leave/resubmit readiness.
- [x] Bottleneck feedback computes priority cards and supports section jump actions.
- [x] Mobile submit guide renders progress cards with next-action navigation.
- [x] Employee sidebar includes new section anchors.
- [x] WI-0140 e2e is added and included in MVP/FULL suites.
