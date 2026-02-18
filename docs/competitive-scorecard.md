# Competitive Scorecard (Shift/Flex Superior)

Date: 2026-02-17

## Purpose

FlowHR의 목표를 "기능 동등(parity)"이 아닌 "운영 성과 우위(superior)"로 고정한다.

## Win Criteria

| Category | FlowHR Win Target | Measurement |
| --- | --- | --- |
| Admin Ops Speed | Attendance/incident action median <= 3 min | UI action log + API timestamps |
| Employee UX Speed | Leave request or attendance correction median <= 90 sec | Journey e2e + manual stopwatch replay |
| Payroll Accuracy | Golden payroll cases 100% pass | `golden-regression` + WI-linked fixture verification |
| Release Safety | Rollback ratio < 2% | weekly release log |
| Incident Recovery | P1 MTTR <= 30 min | incident timeline audit log |

## WI Mapping (Current Window)

| WI | Intent | Expected KPI Impact |
| --- | --- | --- |
| WI-0081 | Admin IA and dashboard clarity | Admin Ops Speed |
| WI-0082 | Employee self-service core flow | Employee UX Speed |
| WI-0083 | Journey e2e + UI regression gate | Payroll Accuracy, Release Safety |

## Operating Rule

- PR마다 최소 1개 KPI에 대한 "before/after" 또는 "baseline" 수치를 남긴다.
- KPI 수치가 없으면 상위호환 진행으로 간주하지 않는다.
