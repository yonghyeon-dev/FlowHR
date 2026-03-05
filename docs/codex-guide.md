## I18N One-Shot Guard (WI-0522)

- Korean i18n cleanup must be completed as a single sweep, then locked by CI checks.
- Do not create repeated phase-style i18n WIs (`phase2`, `phase3`, `hardening-plus`, `upgrade-N`).
- After the one-shot sweep, only bug-fix updates discovered in QA are allowed.
- If i18n-only WIs are queued three times in a row, stop and switch to core journey feature WIs.
# Codex 방향성 가이드

> **Last updated**: 2026-02-26
> **목적**: Codex 세션 리셋 시 방향 유지를 위한 작업 가이드
> **배경**:
> - **1차 블로트** (WI-0131~0172): 동일 4개 페이지에 "phase N+1" UX를 무한 반복 적층하여 21,390줄(164개+ 블로트 섹션) 발생.
> - **2차 블로트** (WI-0198~0215): filing ops 영역에서 동일 패턴이 재발. 18개 WI가 23단계 디렉토리 중첩 + 18,971줄 + 19개+ URL 파라미터 적층.
> - 이 문서는 정리 방법과 이후 방향을 정의한다.

---

## 목차

- [Part 1: 블로트 정리 (1차 — UX 적층)](#part-1-블로트-정리-1차--ux-적층)
  - [Phase A: 4개 페이지 블로트 섹션 제거](#phase-a-4개-페이지-블로트-섹션-제거)
  - [Phase B: 사이드바 네비게이션 정리](#phase-b-사이드바-네비게이션-정리)
  - [Phase C: globals.css 불필요 스타일 정리](#phase-c-globalscss-불필요-스타일-정리)
  - [Phase D: 관련 WI 파일/테스트 정리](#phase-d-관련-wi-파일테스트-정리)
- [Part 1.5: 블로트 정리 (2차 — Filing Ops 적층)](#part-15-블로트-정리-2차--filing-ops-적층)
  - [Phase E: filing ops 라우트/컴포넌트 통합](#phase-e-filing-ops-라우트컴포넌트-통합)
  - [Phase F: filing ops 관련 테스트/WI 정리](#phase-f-filing-ops-관련-테스트wi-정리)
- [Part 2: Shiftee/Flex 상위호환 로드맵](#part-2-shifteeflexhr-상위호환-로드맵)
- [Part 3: 금지 규칙](#part-3-금지-규칙)

---

# Part 1: 블로트 정리 (1차 — UX 적층)

## 문제 요약

| 페이지 | 경로 | 현재 줄 수 | 목표 줄 수 | 블로트 섹션 수 |
|--------|------|-----------|-----------|--------------|
| 직원 셀프서비스 | `src/app/employee/page.tsx` | 5,828 | ~2,500 | 27 |
| 관리자 승인 큐 | `src/app/admin/page.tsx` | 6,984 | ~2,500 | 31 |
| 급여 명세서 | `src/app/employee/payslips/page.tsx` | 4,648 | ~1,800 | 20 |
| 관리자 인사 이력 | `src/app/admin/people/page.tsx` | 3,930 | ~1,500 | 21 |
| **합계** | | **21,390** | **~8,300** | **99** |

추가로 사이드바 네비게이션 134개 링크, globals.css 192개+ CSS 클래스가 블로트임.

## 블로트 발생 원인

WI-0126~0172 구간에서 Codex가 4개 페이지를 순환하며 동일한 패턴을 반복 적층:

```
Cycle 1 (WI-0131~0135): 검색/정렬 + 확인 예측 피드백 + 모바일 후속 가이드
Cycle 2 (WI-0136~0139): 필터 + 지연 위험 예측 + 모바일 추천
Cycle 3 (WI-0140~0143): 검증 피드백 + 처리 예측 + 모바일 추천 upgrade-1
Cycle 4 (WI-0145~0150): sort-accuracy + delay-risk-prediction + 추천 upgrade-1
Cycle 5 (WI-0151~0154): sort-hardening + delay-risk-response + 추천 upgrade
Cycle 6 (WI-0155~0158): sort-hardening-plus + execution-guide + 추천 upgrade-2
Cycle 7 (WI-0159~0162): sort-hardening-plus-execution + execution-tracker + 추천 upgrade-3
Cycle 8 (WI-0163~0166): execution-summary + execution-backlog + 추천 upgrade-4
Cycle 9 (WI-0167~0170): execution-summary-digest + backlog-digest + 추천 upgrade-5
Cycle 10 (WI-0171~0172): summary-digest-2 + backlog-digest-2 + 추천 upgrade-6
```

매 사이클마다 이전 것 위에 새 레이어를 쌓는 구조. **어떤 것도 삭제하지 않고 계속 추가만 함.**

---

## Phase A: 4개 페이지 블로트 섹션 제거

### 작업 원칙

1. `id="..."` 속성으로 섹션을 식별한다
2. 해당 섹션의 JSX 블록 전체(열기 태그~닫기 태그)를 제거한다
3. 관련 `useState`, `useEffect`, 핸들러 함수도 함께 제거한다
4. 제거 후 TypeScript 컴파일 에러가 없는지 확인한다

### A-1. employee/page.tsx — 제거 대상 (27개 섹션)

**WI 단위**: WI-0176 (한 번에 전부 제거)

#### 정렬 하드닝 계열 (7개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 1 | `request-history-sort-accuracy` | WI-0147 |
| 2 | `request-history-sort-hardening` | WI-0151 |
| 3 | `request-history-sort-hardening-plus` | WI-0155 |
| 4 | `request-history-sort-hardening-plus-execution` | WI-0159 |
| 5 | `request-history-sort-execution-summary` | WI-0167 |
| 6 | `request-history-execution-summary-digest` | WI-0171 |
| 7 | `request-bottleneck-feedback` | WI-0142 |

#### 지연 위험 예측/대응 계열 (6개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 8 | `request-wait-prediction` | WI-0142 |
| 9 | `approval-delay-risk-prediction` | WI-0147 |
| 10 | `approval-delay-risk-response` | WI-0151 |
| 11 | `approval-delay-risk-response-execution-guide` | WI-0155 |
| 12 | `approval-delay-risk-response-execution-tracker` | WI-0159 |
| 13 | `approval-delay-risk-execution-backlog` | WI-0167 |
| 14 | `approval-delay-execution-backlog-digest` | WI-0171 |

#### 모바일 추천 계열 (8개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 15 | `mobile-shortcuts` | WI-0140 |
| 16 | `mobile-status-badges` | WI-0138 |
| 17 | `mobile-submit-guide` | WI-0140 |
| 18 | `mobile-follow-up-guide` | WI-0142 |
| 19 | `mobile-follow-up-recommendation` | WI-0147 |
| 20 | `mobile-follow-up-recommendation-upgrade` | WI-0151 |
| 21 | `mobile-follow-up-recommendation-upgrade-2` | WI-0155 |
| 22 | `mobile-follow-up-recommendation-upgrade-3` | WI-0159 |
| 23 | `mobile-follow-up-recommendation-upgrade-4` | WI-0167 |
| 24 | `mobile-follow-up-recommendation-upgrade-5` | WI-0171 |

#### 인사이트/예측 계열 (3개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 25 | `attendance-correction-insights` | WI-0163 |
| 26 | `leave-balance-forecast` | WI-0163 |
| 27 | `leave-calendar-insights` | WI-0163 |

#### 유지할 섹션 (11개) — 절대 삭제 금지

```
account, self-service-overview, submit-checklist, request-feedback,
request-search-sort, request-timeline, request-resubmit,
attendance, leave, leave-calendar, schedule
```

---

### A-2. admin/page.tsx — 제거 대상 (31개 섹션)

**WI 단위**: WI-0177 (한 번에 전부 제거)

#### 정렬 하드닝 계열 (7개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 1 | `approval-history-sort-accuracy` | WI-0148 |
| 2 | `approval-history-sort-hardening` | WI-0148 |
| 3 | `approval-history-sort-hardening-plus` | WI-0156 |
| 4 | `approval-history-sort-hardening-plus-execution` | WI-0160 |
| 5 | `approval-history-sort-execution-tracker` | WI-0164 |
| 6 | `approval-history-execution-summary` | WI-0164 |
| 7 | `approval-history-execution-summary-digest` | WI-0168 |

#### 증거/SLA/예측 계열 (5개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 8 | `approval-evidence-preview` | WI-0139 |
| 9 | `approval-evidence-comparison` | WI-0141 |
| 10 | `approval-sla-timeline` | WI-0139 |
| 11 | `approval-sla-alert-rules` | WI-0141 |
| 12 | `approval-processing-prediction` | WI-0143 |

#### 지연 위험 예측/대응 계열 (6개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 13 | `approval-delay-risk-prediction` | WI-0148 |
| 14 | `approval-delay-risk-response` | WI-0148 |
| 15 | `approval-delay-risk-response-execution-guide` | WI-0156 |
| 16 | `approval-delay-risk-response-execution-tracker` | WI-0160 |
| 17 | `approval-delay-risk-execution-backlog` | WI-0164 |
| 18 | `approval-delay-execution-backlog-digest` | WI-0168 |

#### 모바일/일괄 처리 계열 (10개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 19 | `approval-mobile-review-sheet` | WI-0139 |
| 20 | `approval-mobile-checklist` | WI-0141 |
| 21 | `approval-mobile-follow-up-guide` | WI-0143 |
| 22 | `approval-mobile-follow-up-recommendation` | WI-0148 |
| 23 | `approval-mobile-follow-up-recommendation-upgrade` | WI-0152 |
| 24 | `approval-mobile-follow-up-recommendation-upgrade-2` | WI-0156 |
| 25 | `approval-mobile-follow-up-recommendation-upgrade-3` | WI-0160 |
| 26 | `approval-mobile-follow-up-recommendation-upgrade-4` | WI-0164 |
| 27 | `approval-mobile-follow-up-recommendation-upgrade-5` | WI-0168 |
| 28 | `approval-mobile-follow-up-recommendation-upgrade-6` | WI-0172 |

#### 일괄 검증/이력 계열 (3개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 29 | `approval-bulk-validation` | WI-0137 |
| 30 | `approval-item-history` | WI-0137 |
| 31 | `approval-mobile-feedback` | WI-0137 |

#### 유지할 섹션 (10개) — 절대 삭제 금지

```
account, onboarding, people, invites, scheduling, approvals,
approval-search-sort, aggregates, leave-policy, payroll
```

---

### A-3. employee/payslips/page.tsx — 제거 대상 (20개 섹션)

**WI 단위**: WI-0178 (한 번에 전부 제거)

#### 정렬 하드닝 계열 (6개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 1 | `payslip-history-sort-accuracy` | WI-0149 |
| 2 | `payslip-history-sort-hardening` | WI-0153 |
| 3 | `payslip-history-sort-hardening-plus` | WI-0157 |
| 4 | `payslip-history-sort-hardening-plus-execution` | WI-0161 |
| 5 | `payslip-history-sort-execution-summary` | WI-0165 |
| 6 | `payslip-history-execution-summary-digest` | WI-0169 |

#### 지연 위험 예측/대응 계열 (7개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 7 | `payslip-confirmation-prediction` | WI-0145 |
| 8 | `payslip-delay-risk-prediction` | WI-0149 |
| 9 | `payslip-delay-risk-response` | WI-0153 |
| 10 | `payslip-delay-risk-response-execution-guide` | WI-0157 |
| 11 | `payslip-delay-risk-response-execution-tracker` | WI-0161 |
| 12 | `payslip-delay-risk-execution-backlog` | WI-0165 |
| 13 | `payslip-delay-execution-backlog-digest` | WI-0169 |

#### 모바일 추천 계열 (7개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 14 | `mobile-delivery` | WI-0145 |
| 15 | `payslip-mobile-follow-up-guide` | WI-0145 |
| 16 | `payslip-mobile-follow-up-recommendation` | WI-0149 |
| 17 | `payslip-mobile-follow-up-recommendation-upgrade` | WI-0153 |
| 18 | `payslip-mobile-follow-up-recommendation-upgrade-2` | WI-0157 |
| 19 | `payslip-mobile-follow-up-recommendation-upgrade-3` | WI-0161 |
| 20 | `payslip-mobile-follow-up-recommendation-upgrade-4` | WI-0165 |
| 21 | `payslip-mobile-follow-up-recommendation-upgrade-5` | WI-0169 |

#### 유지할 섹션 (4개) — 절대 삭제 금지

```
payslip-search-sort, status-feedback, compare-view,
(기본 명세서 목록/상세 영역)
```

---

### A-4. admin/people/page.tsx — 제거 대상 (21개 섹션)

**WI 단위**: WI-0179 (한 번에 전부 제거)

#### 정렬 하드닝 계열 (7개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 1 | `history-search-sort` | WI-0146 |
| 2 | `history-sort-accuracy` | WI-0150 |
| 3 | `history-sort-hardening` | WI-0154 |
| 4 | `history-sort-hardening-plus` | WI-0158 |
| 5 | `history-sort-hardening-plus-execution` | WI-0162 |
| 6 | `history-sort-execution-summary` | WI-0166 |
| 7 | `history-execution-summary-digest` | WI-0170 |

#### 지연 위험 예측/대응 계열 (7개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 8 | `history-risk-prediction` | WI-0146 |
| 9 | `history-delay-risk-prediction` | WI-0150 |
| 10 | `history-delay-risk-response` | WI-0154 |
| 11 | `history-delay-risk-response-execution-guide` | WI-0158 |
| 12 | `history-delay-risk-response-execution-tracker` | WI-0162 |
| 13 | `history-delay-risk-execution-backlog` | WI-0166 |
| 14 | `history-delay-execution-backlog-digest` | WI-0170 |

#### 모바일 추천 계열 (7개)

| # | Section ID | 추가된 WI |
|---|------------|----------|
| 15 | `people-mobile-flow` | WI-0146 |
| 16 | `people-mobile-follow-up-guide` | WI-0146 |
| 17 | `people-mobile-follow-up-recommendation` | WI-0146 |
| 18 | `people-mobile-follow-up-recommendation-upgrade` | WI-0150 |
| 19 | `people-mobile-follow-up-recommendation-upgrade-2` | WI-0158 |
| 20 | `people-mobile-follow-up-recommendation-upgrade-3` | WI-0158 |
| 21 | `people-mobile-follow-up-recommendation-upgrade-4` | WI-0166 |
| 22 | `people-mobile-follow-up-recommendation-upgrade-5` | WI-0170 |

#### 유지할 섹션 (5개) — 절대 삭제 금지

```
directory-filters, org-chart, employee-compare, employee-history,
(기본 직원 목록/상세 영역)
```

---

## Phase B: 사이드바 네비게이션 정리

### B-1. employee/layout.tsx — 네비게이션 정리

**현재**: 62개 링크 → **목표**: 12개 링크

제거 대상: 블로트 섹션으로의 앵커 링크 50개

#### 유지할 네비게이션 링크

```tsx
// employee/layout.tsx 에 남겨야 할 링크만
const employeeNav = [
  { label: "개요", href: "/employee" },
  { label: "출퇴근", href: "/employee#attendance" },
  { label: "휴가", href: "/employee#leave" },
  { label: "휴가 캘린더", href: "/employee#leave-calendar" },
  { label: "근무 일정", href: "/employee#schedule" },
  { label: "요청 내역", href: "/employee#request-feedback" },
  { label: "명세서", href: "/employee/payslips" },
  { label: "명세서 검색", href: "/employee/payslips#payslip-search-sort" },
  { label: "명세서 비교", href: "/employee/payslips#compare-view" },
];
```

제거 기준: `#` 뒤 섹션 ID가 Phase A에서 REMOVE로 분류된 것과 일치하는 링크는 모두 제거.

### B-2. admin/layout.tsx — 네비게이션 정리

**현재**: 92개 링크 → **목표**: 8개 링크

#### 유지할 네비게이션 링크

```tsx
// admin/layout.tsx 에 남겨야 할 링크만
const adminNav = [
  { label: "대시보드", href: "/admin" },
  { label: "승인 대기", href: "/admin#approvals" },
  { label: "근태 집계", href: "/admin#aggregates" },
  { label: "휴가 정책", href: "/admin#leave-policy" },
  { label: "급여", href: "/admin#payroll" },
  { label: "조직/인사", href: "/admin/people" },
  { label: "전자계약", href: "/admin/contracts" },
  { label: "결재 정책", href: "/admin/approval-policy" },
];
```

### 작업 방법

**WI 단위**: Phase A WI에 포함 (각 페이지 정리 시 해당 레이아웃도 함께 정리)

1. 레이아웃 파일에서 네비게이션 배열을 찾는다
2. 위 "유지할 링크"만 남기고 나머지를 전부 삭제한다
3. 블로트 섹션 앵커(`#sort-hardening`, `#execution-backlog` 등)로 향하는 링크는 전부 삭제한다

---

## Phase C: globals.css 불필요 스타일 정리

### 현재 상태

**파일**: `src/app/globals.css`
**현재 줄 수**: ~8,145
**블로트 CSS 클래스**: 192개+ (추정)

### 제거 대상 CSS 클래스 패턴

**WI 단위**: WI-0180 (CSS 일괄 정리)

아래 패턴과 일치하는 CSS 클래스를 **전부** 삭제한다:

#### 1. 정렬 하드닝 관련 (48개 추정)

```
.queue-history-sort-hardening-*
.queue-history-sort-hardening-plus-*
.panel-history-sort-hardening*
.panel-payslip-history-sort-hardening*
.panel-payslip-history-sort-hardening-plus*
.queue-history-sort-execution-tracker-*
.queue-history-execution-summary-*
.panel-history-sort-accuracy-*
.panel-payslip-history-sort-accuracy-*
```

#### 2. 다이제스트/백로그 관련 (32개 추정)

```
.queue-history-execution-summary-digest-*
.panel-approval-delay-execution-backlog-digest*
.panel-payslip-delay-execution-backlog-digest*
.panel-history-delay-execution-backlog-digest*
.panel-approval-delay-risk-execution-backlog*
.panel-payslip-delay-risk-execution-backlog*
.panel-history-delay-risk-execution-backlog*
```

#### 3. 위험 예측/대응 관련 (28개 추정)

```
.queue-delay-risk-prediction-*
.queue-delay-risk-response-*
.panel-history-delay-risk-*
.panel-payslip-delay-risk-*
.queue-processing-prediction-*
.panel-payslip-confirmation-prediction-*
```

#### 4. 모바일 추천 관련 (52개 추정)

```
.queue-mobile-follow-up-recommendation-*
.queue-mobile-follow-up-recommendation-upgrade-*
.panel-mobile-follow-up-recommendation-*
.panel-payslip-mobile-follow-up-recommendation-*
.panel-people-mobile-follow-up-*
.panel-mobile-status-badges-*
.panel-mobile-shortcuts-*
.panel-mobile-submit-guide-*
```

#### 5. 증거/SLA 관련 (18개 추정)

```
.queue-evidence-preview-*
.queue-evidence-comparison-*
.queue-sla-timeline-*
.queue-sla-alert-rules-*
.queue-mobile-review-sheet-*
.queue-mobile-checklist-*
```

#### 6. 인사이트/예측 관련 (14개 추정)

```
.panel-attendance-correction-insights-*
.panel-leave-balance-forecast-*
.panel-leave-calendar-insights-*
.panel-request-bottleneck-*
.panel-request-wait-prediction-*
```

### 작업 방법

1. globals.css에서 위 패턴과 일치하는 CSS 규칙 블록을 전부 삭제한다
2. 삭제 후 빌드(`npm run build`)로 참조 오류가 없는지 확인한다
3. CSS 클래스가 페이지 JSX에서만 사용되고, Phase A에서 해당 JSX가 이미 삭제된 상태여야 한다

---

## Phase D: 관련 WI 파일/테스트 정리

### D-1. 블로트 WI 파일 아카이브

**WI 단위**: WI-0181

블로트를 발생시킨 WI 파일들은 삭제하지 않고 참조용으로 유지한다. 단, 이 WI들은 "완료 but deprecated" 상태로 마킹한다.

대상 WI (46개): WI-0126 ~ WI-0172 중 아래 목록

```
WI-0131 ~ WI-0143 (employee/admin UX 고도화 1~6차)
WI-0145 ~ WI-0172 (4개 페이지 순환 UX 고도화 3~14차)
```

각 WI 파일 상단에 다음 주석을 추가:

```markdown
> **DEPRECATED**: 이 WI의 산출물은 블로트 정리(WI-0176~0181)에서 제거됨.
> 참조: docs/codex-guide.md Part 1
```

### D-2. 블로트 관련 e2e 테스트 정리

블로트 섹션을 테스트하는 e2e 테스트 케이스를 식별하여 제거한다.

검색 패턴:
```
hardening, execution-summary, backlog-digest, follow-up-recommendation,
risk-prediction, risk-response, execution-guide, execution-tracker,
mobile-shortcuts, mobile-submit-guide, mobile-follow-up, mobile-delivery,
evidence-preview, evidence-comparison, sla-timeline, sla-alert-rules,
attendance-correction-insights, leave-balance-forecast, leave-calendar-insights
```

해당 테스트가 포함된 파일에서 관련 `test()`/`it()` 블록만 제거하고, 파일 자체는 유지한다.

---

## Phase 실행 순서

```
Phase A (WI-0176~0179): 4개 페이지 섹션 제거 + 레이아웃 정리
    ↓ (빌드 확인)
Phase C (WI-0180): globals.css 정리
    ↓ (빌드 확인)
Phase D (WI-0181): WI 아카이브 + 테스트 정리
    ↓ (전체 테스트 확인)
완료 → page-size-budget 검증 통과 확인
```

> **주의**: Phase B는 Phase A에 포함된다. 각 페이지 정리 시 해당 레이아웃도 함께 정리한다.

---

# Part 1.5: 블로트 정리 (2차 — Filing Ops 적층)

## 문제 요약

WI-0198~0215에서 "payroll year-end filing ops" 기능을 개발하면서 **1차 블로트와 동일한 적층 패턴이 재발**했다.

### 1차 vs 2차 블로트 비교

| 지표 | 1차 (WI-0131~0172) | 2차 (WI-0198~0215) | 판정 |
|------|---------------------|---------------------|------|
| WI 수 | 42개 | 18개 | 재발 |
| 적층 패턴 | phase N+1 반복 | 레이어 중첩 반복 | **동일** |
| 디렉토리 깊이 | 최대 5단계 | **최대 23단계** | **악화** |
| URL 파라미터 | ~5개 | **19개+** | **악화** |
| 총 추가 줄 수 | ~15,000줄 | **18,971줄** | **악화** |
| 최대 컴포넌트 크기 | 점진적 성장 | **1,433줄 단일 파일** | **악화** |
| 컴포넌트 파일 수 | 4개 페이지에 분산 | **51개 파일** | **악화** |
| 총 블로트 줄 수 | 21,390줄 | **27,954줄** | **악화** |

### 적층 구조

```
WI-0198  /admin/payroll-year-end-filing/ops
WI-0199  └─ drilldown + alert rules
WI-0201    └─ alert response guide + owner
WI-0202      └─ execution checklist
WI-0203        └─ execution log + review loop
WI-0204          └─ retrospective + approval snapshot
WI-0205            └─ review handoff + export snapshot
WI-0206              └─ close-off package + audit signoff
WI-0207                └─ approval routing + signature bundle
WI-0208                  └─ delivery package lock + handover
WI-0209                    └─ completion receipt + archive digest
WI-0210                      └─ close report
WI-0211                        └─ distribution signoff
WI-0212                          └─ closure packet
WI-0213                            └─ release digest
WI-0214                              └─ acknowledgment ledger
WI-0215                                └─ exception log  ← 23단계 깊이
```

매 WI마다 이전 경로 아래에 새 디렉토리를 추가. 리팩터링 없이 계속 중첩만 함.

### URL 파라미터 폭발 (WI-0215 기준)

```
handoffReady, exportReady, archiveReady, routingReady,
signatureReady, packageLocked, handoverAcknowledged,
receiptVerified, digestReady, closeReportPublished,
publicationReady, distributionReady, signoffReady,
closurePacketSealed, dispatchReady, releaseDigestPublished,
releaseDigestDeliveryReady, ackLedgerVerified, ackChannelsReconciled
```

→ 19개 URL 파라미터를 개별 `searchParams.get()`으로 관리. 공유 상태 컨테이너 없음.

---

## Phase E: filing ops 라우트/컴포넌트 통합

### 작업 원칙

1차 블로트와 달리 "섹션 삭제"가 아닌 **구조 리팩터링**이 필요하다.

1. 23단계 중첩 라우트를 **플랫 구조**로 변환한다
2. 19개 URL 파라미터를 **FilingWorkflowContext** 1개로 통합한다
3. 51개 컴포넌트를 **5~7개 재사용 컴포넌트**로 통합한다
4. 리팩터링 후 기존 기능이 동작하는지 확인한다

### E-1. 라우트 구조 변환

**WI 단위**: WI-0216

#### 현재 (23단계 중첩)

```
src/app/admin/payroll-year-end-filing/ops/
  checklist/review/snapshot/handoff/close-off/
    routing-signature/delivery-lock/completion-receipt/
      close-report/distribution-signoff/closure-packet/
        release-digest/ack-ledger/exception-log/
          page.tsx
```

#### 목표 (플랫 워크플로)

```
src/app/admin/payroll-year-end-filing/
  ops/page.tsx                    ← 대시보드 (WI-0198 유지, 1,433줄 → 300줄로 분할)
  ops/[step]/page.tsx             ← 워크플로 단계별 동적 라우트
  ops/layout.tsx                  ← 공통 레이아웃 + 스텝 네비게이션
```

#### 워크플로 스텝 매핑

| step 값 | 원래 경로 | 설명 |
|---------|----------|------|
| `alert` | /ops (일부) | 알림 대시보드 + 응답 가이드 |
| `checklist` | /ops/checklist/* | 실행 체크리스트 + 로그 |
| `review` | /ops/checklist/review/* | 검토 + 스냅샷 + 핸드오프 |
| `close-off` | /ops/.../close-off/* | 마감 패키지 + 감사 서명 |
| `delivery` | /ops/.../delivery-lock/* | 배포 잠금 + 인계 |
| `archive` | /ops/.../completion-receipt/* | 완료 영수증 + 보관 |
| `report` | /ops/.../close-report/* | 종결 리포트 + 배포 |

### E-2. 상태 관리 통합

**WI 단위**: WI-0216에 포함

#### 현재 (19개 개별 URL 파라미터)

```tsx
// 각 컴포넌트에서 개별 관리
const handoffReady = searchParams.get("handoffReady");
const exportReady = searchParams.get("exportReady");
// ... 17개 더
```

#### 목표 (FilingWorkflowContext)

```tsx
// src/contexts/FilingWorkflowContext.tsx (신규)
interface FilingWorkflowState {
  currentStep: FilingStep;
  gates: Record<string, boolean>;  // 모든 게이트 상태 통합
  metadata: FilingMetadata;
}

// 사용처
const { gates, advanceStep } = useFilingWorkflow();
```

### E-3. 컴포넌트 통합

**WI 단위**: WI-0217

#### 현재 (51개 파일, 27,954줄)

패널 컴포넌트만 12개+, 유틸리티 22개+, 타입 파일 다수.

#### 목표 (5~7개 핵심 컴포넌트)

| 컴포넌트 | 역할 | 통합 대상 |
|---------|------|----------|
| `FilingDashboard.tsx` | 대시보드 + 요약 카드 | WI-0198 대시보드 (1,433줄 → 300줄) |
| `FilingStepPanel.tsx` | 워크플로 단계 공통 패널 | 12개+ 패널 컴포넌트 통합 |
| `FilingGateCard.tsx` | 게이트 상태 표시 카드 | 각 단계별 게이트 카드 통합 |
| `FilingActionLog.tsx` | 실행 로그 + 타임라인 | 체크리스트/로그/리뷰 통합 |
| `FilingExportBundle.tsx` | 내보내기/스냅샷/서명 | 핸드오프/패키지/배포 통합 |
| `filing-workflow-helpers.ts` | 유틸리티 통합 | 22개 유틸리티 → 1개 |
| `filing-types.ts` | 타입 정의 통합 | 산재된 타입 → 1개 |

#### 삭제 대상 (통합 후)

```
src/app/admin/payroll-year-end-filing/ops/checklist/  ← 전체 삭제 (23단계 중첩)
src/components/payroll-year-end-filing/               ← 51개 → 7개로 교체
```

---

## Phase F: filing ops 관련 테스트/WI 정리

**WI 단위**: WI-0218

### F-1. 테스트 통합

현재 18개 개별 e2e 테스트 → 5~6개 통합 테스트로 재작성.

#### 통합 테스트 구조

```
test-filing-ops-dashboard.ts       ← WI-0198~0199 범위
test-filing-ops-checklist.ts       ← WI-0201~0204 범위
test-filing-ops-review.ts          ← WI-0205~0208 범위
test-filing-ops-archive.ts         ← WI-0209~0210 범위
test-filing-ops-distribution.ts    ← WI-0211~0215 범위
```

### F-2. WI 아카이브

WI-0201~0215 파일 상단에 다음 주석을 추가:

```markdown
> **DEPRECATED**: 이 WI의 산출물은 구조 리팩터링(WI-0216~0218)에서 통합됨.
> 참조: docs/codex-guide.md Part 1.5
```

---

## 통합 실행 순서

```
[1차 블로트 정리] Phase A~D (WI-0176~0181)
    ↓ (빌드 확인)
[2차 블로트 정리] Phase E (WI-0216~0217): 라우트 플랫화 + 컴포넌트 통합
    ↓ (빌드 확인)
[2차 블로트 정리] Phase F (WI-0218): 테스트 통합 + WI 아카이브
    ↓ (전체 테스트 확인)
완료 → 실질 기능 개발 재개 (Part 2 로드맵)
```

---

# Part 2: Shiftee/FlexHR 상위호환 로드맵

## 현재 상태 (2026-02-22 기준)

- **완료 WI**: WI-0001 ~ WI-0215 (214개)
- **프로덕션 달성률**: ~27% (경쟁사 대비)
- **블로트 부채**:
  - 1차 (UX 적층): 21,390줄 → Part 1에서 정리
  - 2차 (Filing Ops 적층): 27,954줄 → Part 1.5에서 정리
- **핵심 기반**: Phase 1 완료 (People/FK/RBAC/RLS)
- **실질 진전** (WI-0176~0215 중):
  - 블로트 정리: WI-0176~0181 (6개)
  - 휴가 엔진: WI-0182~0183 — 자동 부여 + 캘린더 연동
  - 급여 고도화: WI-0184~0189 — 보험정산/마감/명세서배포/연말정산
  - 연말정산: WI-0190~0197 — 신고 추적/재제출/상태 관리
  - 다국어: WI-0200 — 브라우저 로케일 기반 UI
- **블로트 재발**: WI-0201~0215 (15개) — filing ops 적층으로 실질 기능 진전 아님

## 경쟁사 기능 매트릭스 — 미착수 영역

> 참조: `ROADMAP.md` Section 3, `docs/competitive-scorecard.md`

| 모듈 | Gap 등급 | 현재 상태 | 미착수 핵심 기능 |
|------|----------|-----------|-----------------|
| **급여 엔진** | Critical | KR baseline 근사 + 보험정산/마감 baseline | 한국 세법 정밀 계산(간이세액표), 4대보험 정확 계산, 연말정산 완성 |
| **관리자 대시보드** | Critical | baseline 존재 | KPI 대시보드, 실시간 근태 현황, 리포트 |
| **직원 셀프서비스** | Critical | baseline 존재 | 모바일 앱, 푸시 알림, 인앱 가이드 |
| **인사 마스터** | High | Org/Employee 기본 | Department/Position 계층, 발령/이력 관리 |
| **전자결재** | High | 도메인별 승인 기본 | 범용 결재선, 양식 빌더, 전자서명 |
| **전자계약** | Medium | `/admin/contracts` baseline | 계약 템플릿 엔진, 전자서명, 만료 관리 |
| **휴가 관리** | Medium | 요청/승인/정산 + 자동부여/캘린더 baseline | 시간단위/반차 고도화, 연차촉진 자동화 완성 |
| **근무일정** | Medium | CRUD + template 기본 | 교대근무 자동 배정, 유연근무, 법정 제약 |
| **알림** | Medium | 웹훅 + 부분 이메일 | 푸시, 인앱, 이메일 템플릿, 알림 선호 설정 |
| **분석/리포트** | Medium | 없음 | 대시보드, 커스텀 리포트, 엑셀 내보내기 |
| **모바일 앱** | High | 없음 | iOS/Android 네이티브 |
| **채용 관리** | Low | 없음 | ATS, 지원서 관리 |
| **성과 평가** | Low | 없음 | MBO/OKR, 리뷰 시스템 |
| **경비 관리** | Low | 없음 | 경비 청구/정산 |
| **교육 관리** | Low | 없음 | 교육 과정/이수 관리 |

## Phase별 WI 범위 제안

> 기존 Phase 3~8 체계를 유지하되, 블로트 정리 이후 실질적 기능 개발에 집중한다.

### Phase 3: 휴가 정책 엔진 고도화

**목표**: 경쟁사 수준의 휴가 관리 자동화

| WI (예정) | Scope | Acceptance Criteria |
|-----------|-------|---------------------|
| WI-A | 시간 단위 휴가 정책 | - 시간/반차 단위 설정 API<br>- 잔여 시간 자동 계산<br>- 관리자 정책 설정 UI |
| WI-B | 연차 자동 부여 엔진 | - 입사일/회계연도 기준 자동 부여<br>- 비례 부여(중도 입사)<br>- 이월/소멸 규칙 엔진 |
| WI-C | 연차촉진 자동화 | - 법정 연차촉진 통보 스케줄<br>- 미사용 연차 자동 알림<br>- 촉진 이력 감사 추적 |
| WI-D | 휴가 캘린더 연동 | - 팀/부서 휴가 현황 캘린더<br>- 중복 신청 경고<br>- 관리자 승인 시 캘린더 동기화 |

### Phase 4: 급여 엔진 고도화 (KR 세법/4대보험)

**목표**: 한국 법정 급여 계산 정밀도 100%

| WI (예정) | Scope | Acceptance Criteria |
|-----------|-------|---------------------|
| WI-E | KR 소득세 정밀 계산 | - 간이세액표 기반 원천징수<br>- 누진세 구간 정확 적용<br>- 비과세 항목(식대/차량) 분리 |
| WI-F | 4대보험 정산 엔진 | - 국민연금/건강보험/고용보험/산재보험<br>- 보수월액 기준 자동 계산<br>- 상한/하한 적용 |
| WI-G | 급여 마감 워크플로 | - 마감 기간 설정<br>- 프리뷰 → 확정 2단계<br>- 확정 후 잠금(수정 불가) |
| WI-H | 명세서 배포 | - PDF 명세서 생성<br>- 이메일/인앱 배포<br>- 열람 확인 추적 |
| WI-I | 연말정산 기본 | - 소득공제/세액공제 입력<br>- 재정산 계산<br>- 원천징수영수증 출력 |

### Phase 5: 전자결재 + 전자계약

**목표**: 범용 결재 워크플로 + 근로계약 전자서명

| WI (예정) | Scope | Acceptance Criteria |
|-----------|-------|---------------------|
| WI-J | 결재선 빌더 | - 다단계 결재선 UI 빌더<br>- 조건부 라우팅(금액/부서 기준)<br>- 결재선 템플릿 라이브러리 |
| WI-K | 양식 빌더 | - 드래그 앤 드롭 양식 빌더<br>- 텍스트/선택/날짜/파일 필드<br>- 양식 템플릿 라이브러리 |
| WI-L | 전자서명 엔진 | - 서명 패드 UI<br>- 서명 이미지 저장/검증<br>- 계약서 PDF에 서명 삽입 |
| WI-M | 근로계약 관리 | - 계약 템플릿 생성/관리<br>- 계약 발송 → 서명 → 체결 워크플로<br>- 만료 알림 + 갱신 관리 |
| WI-N | 위임/대결 고도화 | - 부재 시 자동 위임<br>- 위임 기간/범위 설정<br>- 위임 이력 감사 추적 |

### Phase 6: 웹 UI 런칭 품질

**목표**: 관리자/직원 여정 완성도 → 경쟁사 수준

| WI (예정) | Scope | Acceptance Criteria |
|-----------|-------|---------------------|
| WI-O | 관리자 KPI 대시보드 | - 핵심 지표(출근율/잔여연차/미승인건) 카드<br>- 기간별 추이 차트<br>- 빠른 조치 링크 |
| WI-P | 실시간 근태 현황 | - 출근/미출근/지각 실시간 목록<br>- 부서별 필터<br>- 이상 알림 배지 |
| WI-Q | 온보딩 마법사 | - 신규 테넌트 초기 설정 가이드<br>- 조직/부서/직원 일괄 등록<br>- 정책 기본값 설정 |
| WI-R | 직원 인앱 가이드 | - 첫 로그인 투어<br>- 주요 기능 툴팁<br>- 컨텍스트 도움말 |
| WI-S | 반응형 모바일 웹 | - 핵심 여정 모바일 최적화<br>- 터치 친화 UI<br>- PWA manifest |

### Phase 7: 모바일 + 알림

**목표**: 네이티브 앱 + 통합 알림 시스템

| WI (예정) | Scope | Acceptance Criteria |
|-----------|-------|---------------------|
| WI-T | 모바일 앱 셸 | - React Native / Expo 프로젝트 초기화<br>- 인증 연동<br>- 핵심 화면 스캐폴딩 |
| WI-U | 푸시 알림 | - FCM/APNs 연동<br>- 승인 요청/결과 알림<br>- 알림 선호 설정 |
| WI-V | 이메일 템플릿 엔진 | - Transactional 이메일 템플릿<br>- 다국어(한/영) 지원<br>- 발송 이력/재시도 |
| WI-W | 인앱 알림 센터 | - 알림 목록 UI<br>- 읽음/안읽음 상태<br>- 실시간 업데이트(SSE/WebSocket) |

### Phase 8: 확장 모듈

**목표**: 경쟁사 대비 부가 기능 확보

| WI (예정) | Scope | Acceptance Criteria |
|-----------|-------|---------------------|
| WI-X | 분석 대시보드 | - 근태/휴가/급여 통계<br>- 커스텀 기간 필터<br>- 엑셀/CSV 내보내기 |
| WI-Y | 채용 ATS 기본 | - 채용 공고 관리<br>- 지원서 접수/평가<br>- 합격 → 입사 연동 |
| WI-Z | 성과 평가 기본 | - 평가 주기 설정<br>- 자기 평가/상사 평가<br>- 결과 리포트 |

---

## Phase 우선순위와 의존성

```text
[1차 블로트 정리] WI-0176~0181 (UX 적층)
      ↓
[2차 블로트 정리] WI-0216~0218 (Filing Ops 적층)
      ↓
Phase 3: 휴가 정책 엔진
      ↓
Phase 4: 급여 엔진 (← Phase 3 의존)
      ↓
Phase 5: 전자결재/계약
      ↓
Phase 6: 웹 UI 런칭 품질 (← Phase 3~5 병렬 가능)
      ↓
Phase 7: 모바일 + 알림
      ↓
Phase 8: 확장 모듈
```

---

# Part 3: 금지 규칙

## 절대 금지 (MUST NOT)

### 1. Phase N+1 반복 금지

```
금지: 기존 페이지에 "N차 고도화" 섹션을 추가하는 것
금지: 동일 기능에 "hardening", "hardening-plus", "upgrade-N" 계열 접미사를 붙이는 것
금지: 4개 페이지를 순환하며 동일 패턴을 적용하는 것
```

**위반 감지 기준**: WI 제목에 아래 키워드가 포함되면 자동 거부:
- `N차 고도화` (N >= 2)
- `hardening`, `hardening-plus`
- `upgrade-N` (N >= 2)
- `execution-summary`, `backlog-digest`
- `follow-up-recommendation-upgrade`

### 2. 단일 파일 크기 제한

```
금지: page.tsx 파일이 500줄을 초과하는 것
금지: 컴포넌트 파일이 300줄을 초과하는 것
```

초과 시 반드시 별도 컴포넌트로 분리한다. 참조: `docs/frontend-guardrails.md`, `qa/page-size-budget.json`

### 3. 기존 페이지 적층 금지

```
금지: 기존 page.tsx에 새 섹션을 추가하는 것
허용: 새로운 라우트(/admin/new-feature)를 생성하는 것
허용: 기존 페이지에서 별도 컴포넌트(/components/*)를 import하는 것
```

새 기능은 **새 라우트** 또는 **별도 컴포넌트 파일**로 만든다.

### 4. 모바일 UX 사전 구현 금지

```
금지: Phase 7(모바일) 이전에 모바일 전용 섹션을 추가하는 것
허용: 반응형 CSS(media query)로 기존 UI를 모바일에서 사용 가능하게 하는 것
```

"모바일 빠른 입력", "모바일 후속 가이드" 같은 섹션은 Phase 7에서 네이티브 앱으로 구현한다.

### 5. 디렉토리 중첩 적층 금지 (NEW — 2차 블로트 교훈)

```
금지: 기존 라우트 아래에 새 하위 디렉토리를 추가하여 기능을 확장하는 것
금지: 라우트 경로가 6단계를 초과하는 것
금지: URL 파라미터가 5개를 초과하는 것
금지: 컴포넌트 파일이 50개를 초과하는 단일 기능을 만드는 것
```

**위반 감지 기준**: 아래 조건 중 하나라도 해당하면 자동 거부:
- 라우트 경로에 `/` 가 6개 이상
- `searchParams.get()` 호출이 5개 이상
- 하나의 기능에 컴포넌트 파일 10개 이상
- 함수/타입 이름이 80자 이상

**올바른 대안**:
```
금지: /ops/checklist/review/snapshot/handoff/close-off/.../page.tsx (중첩)
허용: /ops/[step]/page.tsx + FilingWorkflowContext (플랫 + 공유 상태)
```

### 6. Ops 기능 과잉 구현 금지 (NEW — 2차 블로트 교훈)

```
금지: Ops/운영 도구에 5개 이상의 WI를 연속 투입하는 것
금지: 단일 ops 기능에 "response guide → checklist → execution log →
      retrospective → handoff → close-off → delivery → receipt →
      report → signoff → packet → digest → ledger → exception log"
      같은 연쇄 레이어를 만드는 것
```

SaaS 고객 가치와 무관한 ops 내부 워크플로는 **최소 기능(2~3 WI)으로 구현**하고,
필요 시 나중에 확장한다. Ops는 제품이 아니다.

### 7. 예측/인사이트 섹션 사전 구현 금지

```
금지: "위험 예측", "지연 예측", "인사이트", "포캐스트" 섹션을 UI에 추가하는 것
허용: 백엔드 API로 데이터를 제공하고, Phase 6에서 대시보드에 통합하는 것
```

예측 기능은 백엔드 데이터가 충분히 쌓인 후 대시보드 단위로 제공한다.

### 8. i18n Phase 반복 금지 (NEW)

```
금지: 동일 화면에 i18n WI를 "phase N" 형태로 반복 투입하는 것
금지: i18n을 preset/핀/가져오기/내보내기처럼 레이어 적층으로 확장하는 것
원칙: Korean i18n은 "전수 스윕 1회 + CI 회귀 가드"로 종료한다
```

**운영 규칙**:
- 신규 i18n 작업은 QA/회귀 테스트에서 발견된 결함 수정만 허용한다.
- 신규 기능 가치가 없는 i18n polish WI는 생성하지 않는다.

### 9. i18n 연속 WI 자동 중단 규칙 (NEW)

```
금지: i18n 성격 WI를 3개 이상 연속으로 진행하는 것
강제: i18n WI가 3개 연속되면 즉시 중단하고 기능 WI로 전환하는 것
```

**전환 기준(우선순위)**:
1. 급여 정확도/명세서 고객가치 기능
2. 직원 셀프서비스 핵심 여정
3. 관리자 승인 큐 UX 및 성능

### 10. Contract Governance CI 준수 (MUST)

```
migration 추가 시 반드시:
1. work-items/WI-XXXX.md에 `## Data Changes` 섹션 추가 (migration ID + 테이블명)
2. specs/{domain}/contract.yaml의 db_changes.migrations에 ID 등록
3. contract.yaml version bump (patch 단위)
4. specs/{domain}/api.yaml version을 contract.yaml과 동일하게 동기화
```

### 11. PR Template Compliance (MUST)

```
PR body 작성 시 반드시:
1. .github/PULL_REQUEST_TEMPLATE.md 양식 정확히 사용
2. Required Checklist 항목 전부 체크 ([x])
3. Quality Gate Evidence 항목 전부 체크 ([x])
4. Delivery Balance: "UI/UX surface changed"와 "Backend-only exception" 중 하나만 체크
5. Emergency Override (Break-Glass Only) 섹션은 일반 PR에서 절대 체크하지 않음
```

### 12. Codex 실행 플래그 (MUST)

```
push/PR이 필요한 작업:
  codex exec --dangerously-bypass-approvals-and-sandbox (네트워크 접근 필요)

push 불필요한 작업 (구현만):
  codex exec --full-auto (기본 sandbox, 네트워크 차단)

주의: --full-auto, --sandbox danger-full-access는 Windows에서 네트워크 차단됨
```

## 구현 원칙 (SHOULD)

### 1. WI 1개 = 기능 1개

```
올바른 예: WI-0176: employee/page.tsx 블로트 섹션 제거
잘못된 예: WI-0176: employee/page.tsx 블로트 섹션 제거 + 정렬 정확도 보강 + 모바일 가이드 추가
```

### 2. 새 기능은 새 라우트

```
올바른 예: /admin/analytics (새 라우트에 분석 대시보드 구현)
잘못된 예: /admin 페이지에 분석 섹션 추가
```

### 3. 컴포넌트 분리 우선

```
올바른 예: src/components/approval/ApprovalQueue.tsx (독립 컴포넌트)
잘못된 예: src/app/admin/page.tsx 안에 승인 큐 JSX 직접 작성 (500줄+)
```

### 4. 순환 개선 금지

한 기능을 여러 WI에 걸쳐 점진적으로 "고도화"하지 않는다.
기능이 불충분하면 **하나의 WI에서 완성도를 높여서** 제출한다.

### 5. 기존 프로세스 준수

모든 WI는 기존 흐름을 따른다:
```
Work Item(work-items/) → Spec(specs/) → 구현 → 테스트 → PR → 머지
```

참조: `ROADMAP.md` Section 0, `qa/gate.checklist.md`

---

## 부록: 블로트 패턴 용어 사전

| 패턴 이름 | 설명 | 예시 Section ID |
|----------|------|----------------|
| sort-hardening | 정렬 정확도를 "강화"한다는 명목의 반복 섹션 | `*-sort-hardening`, `*-sort-hardening-plus` |
| execution-card | 실행 상태를 "카드"로 보여주는 반복 섹션 | `*-hardening-plus-execution` |
| risk-prediction | 지연/위험을 "예측"하는 반복 섹션 | `*-delay-risk-prediction`, `*-risk-response` |
| execution-tracker | 실행 추적을 "고도화"하는 반복 섹션 | `*-execution-tracker`, `*-execution-guide` |
| execution-backlog | 백로그를 "실행 관점"으로 보여주는 반복 섹션 | `*-execution-backlog` |
| digest | 요약을 "다이제스트"로 재포장하는 반복 섹션 | `*-summary-digest`, `*-backlog-digest` |
| follow-up-recommendation | 후속 조치를 "추천"하는 모바일 반복 섹션 | `mobile-follow-up-recommendation-upgrade-N` |
| mobile-shortcut | 모바일 전용 단축 UI 반복 섹션 | `mobile-shortcuts`, `mobile-submit-guide` |

### 2차 블로트 패턴 (Filing Ops 적층)

| 패턴 이름 | 설명 | 예시 |
|----------|------|------|
| deep-nesting | 기능을 하위 디렉토리로 계속 중첩 | `/ops/checklist/review/snapshot/handoff/...` (23단계) |
| url-param-explosion | 게이트 상태를 개별 URL 파라미터로 전달 | `handoffReady`, `exportReady` 등 19개+ |
| layer-cake-wi | 이전 WI 위에 새 레이어를 쌓는 WI 연쇄 | response-guide → checklist → execution-log → ... |
| ops-overengineering | SaaS 고객 가치 없는 ops 내부 워크플로 과잉 구현 | close-off → delivery-lock → completion-receipt → close-report |
| verbose-naming | 적층으로 인한 함수/타입명 80자+ | `buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogRouteHref` |

이 패턴들이 WI 제목이나 섹션 ID, 디렉토리 구조에 나타나면 **블로트 신호**로 간주한다.
