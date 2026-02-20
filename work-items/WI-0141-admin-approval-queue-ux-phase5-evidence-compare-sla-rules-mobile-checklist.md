# WI-0141: Admin Approval Queue UX Phase 5 - Evidence Comparison, SLA Alert Rules, Mobile Approval Checklist

## Background and Problem

`/admin` approval queue already provides evidence preview, SLA timeline, and mobile bulk review sheet (WI-0139).

Operators still need additional judgment support before action:

- evidence preview shows single items, but not side-by-side priority comparison in the same queue
- SLA urgency is visible, but watch/critical thresholds cannot be tuned in UI and rule alerts are not surfaced
- mobile reviewers can execute actions, but checklist-style preflight conditions are not grouped in one panel

This WI adds phase-5 decision support for faster and safer approval triage.

## Scope

### In Scope

- Add approval evidence comparison cards in `/admin`
  - compare top waiting items per queue
  - include wait/fail gap metrics and recommendation text
  - expose section anchor `#approval-evidence-comparison`
- Add SLA alert rule controls and alerts in `/admin`
  - watch/critical threshold inputs + presets
  - rule-based queue alert summaries and quick jump actions
  - dynamic SLA timeline buckets based on current thresholds
  - expose section anchor `#approval-sla-alert-rules`
- Add mobile approval checklist section in `/admin`
  - filter/selection/reject-reason/critical-triage readiness checks
  - direct jump actions to related queue sections
  - expose section anchor `#approval-mobile-checklist`
- Extend admin sidebar anchors for all new sections
- Add WI-0141 e2e and wire to MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email or ops-only channel expansion

## User Scenarios

1. 관리자는 같은 큐의 우선 후보 2건을 비교 카드로 보고 먼저 처리할 항목을 빠르게 정한다.
2. 관리자는 SLA 임계치(Watch/Critical)를 조정하고 알림 규칙 목록으로 긴급 큐를 즉시 확인한다.
3. 모바일 승인 담당자는 체크리스트에서 실행 가능 여부를 점검한 뒤 필요한 섹션으로 바로 이동해 처리한다.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove evidence comparison, SLA alert rule, and mobile checklist sections.
- Remove added admin sidebar anchors and related styles.
- Remove WI-0141 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Evidence comparison cards are computed/rendered from current queue/filter data.
- [x] SLA thresholds are configurable in UI and rule alerts are rendered with quick jump actions.
- [x] SLA timeline buckets follow current watch/critical thresholds.
- [x] Mobile approval checklist panel renders pass/fail checks with section navigation.
- [x] Admin sidebar includes new anchors.
- [x] WI-0141 e2e is added and included in MVP/FULL suites.
