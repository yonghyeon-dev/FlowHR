# FlowHR Production Roadmap

> **Last updated**: 2026-02-14
> **Current version**: 0.1.0 (MVP Backend)
> **Target**: Production-grade Korean HR SaaS (Shiftee/Flex parity)

---

## 0. 이 로드맵을 사용하는 방법 (FlowHR 방식)

- 스펙/계약의 단일 소스는 `specs/*/(contract.yaml, api.yaml, test-cases.md)` 입니다.
- 이 문서는 “우선순위/의존성/단계”를 설명하는 참고 문서이며, 변경은 PR로 추적합니다.
- 작업 흐름은 아래 순서를 기본으로 합니다.
  - Work Item(`work-items/`) → Contract/API/Testcases(`specs/`) → 구현/테스트(`src/`, `scripts/tests/`) → 머지
- 운영/거버넌스 문서(필수 기준):
  - 결정권/승인: `docs/raci.md`
  - 데이터 소유권: `docs/data-ownership.md`
  - 긴급 머지(break-glass): `docs/break-glass.md`
  - 계약 버전/폐기: `contracts/versioning.md`
  - QA 게이트: `qa/gate.checklist.md`

## 1. 현재 상태 요약

### 완료 WI 목록 (WI-0001 ~ WI-0038)

| WI | 제목 | 카테고리 |
|----|-------|----------|
| WI-0001 | Attendance → Payroll 수직 슬라이스 | 핵심 비즈니스 |
| WI-0002 | Leave Request/Approval 수직 슬라이스 | 핵심 비즈니스 |
| WI-0003 | Leave Accrual/Carry-over Settlement | 핵심 비즈니스 |
| WI-0004 | Domain Event HTTP Transport | 인프라 |
| WI-0005 | Payroll Phase 2 Deductions/Tax Contract | 핵심 비즈니스 |
| WI-0006 | Payroll Deduction Profile Runtime | 핵심 비즈니스 |
| WI-0007 | MVP Operations Console | UI |
| WI-0008 | State Transition Idempotency Guard | 안정성 |
| WI-0009 | Attendance Rejection Flow | 핵심 비즈니스 |
| WI-0010 | Payroll Profile Version Guard | 안정성 |
| WI-0011 | Slack Alert Unification | 운영 |
| WI-0013 | Discord Alert Webhook Support | 운영 |
| WI-0014 | Alert Webhook Regression Tests | 품질 |
| WI-0015 | Event Governance Traceability Check | 거버넌스 |
| WI-0016 | Attendance Rejection Reason | 핵심 비즈니스 |
| WI-0017 | Attendance Reject Validation Guards | 품질 |
| WI-0018 | Contract/API Version Alignment Gate | 거버넌스 |
| WI-0019 | API/Contract Coupling Gate | 거버넌스 |
| WI-0020 | Contract Governance Regression Tests | 품질 |
| WI-0021 | PR Template Compliance Gate | 거버넌스 |
| WI-0022 | Alert Context Links | 운영 |
| WI-0023 | PR Template Regression Tests | 품질 |
| WI-0024 | Golden Change-Control Gate | 거버넌스 |
| WI-0025 | Local Dev Port and Artifacts | 개발 환경 |
| WI-0026 | Attendance List API | 핵심 비즈니스 |
| WI-0027 | Leave List API | 핵심 비즈니스 |
| WI-0028 | Payroll Run List API | 핵심 비즈니스 |
| WI-0029 | Console List Actions | UI |
| WI-0030 | Deduction Profile List API | 핵심 비즈니스 |
| WI-0031 | Attendance Aggregates API | 핵심 비즈니스 |
| WI-0032 | Reduce Payroll Phase2 Health Incident Noise | 운영 |
| WI-0033 | Roadmap Alignment and Phase 1 Backlog Seeding | 거버넌스 |
| WI-0034 | Employee and Organization Master Model | 핵심 비즈니스 |
| WI-0038 | Phase2 Health 409 Gate Tuning | 운영 |

### Phase 1 백로그 (초안)

| WI | 제목 | 카테고리 |
|----|-------|----------|
| WI-0035 | employeeId String to FK Migration | 안정성 |
| WI-0036 | RBAC Engine Foundation | 안정성 |
| WI-0037 | Multi-Tenant Isolation Baseline (Supabase RLS) | 인프라 |

### 진행 중

- 없음 (WI-0038까지 main에 머지 완료)

### 현재 아키텍처

| 항목 | 현재 상태 | 프로덕션 요구 |
|------|-----------|---------------|
| DB 모델 | 9개 (Organization/Employee 포함; employeeId FK는 미도입) | 25~30개 |
| API 엔드포인트 | ~18개 | 100+ |
| 인증 | Supabase JWT + 헤더 폴백 | RBAC 엔진 + 테넌트 격리 |
| 역할 | 5개 하드코딩 | 동적 역할 + 커스텀 권한 |
| 급여 계산 | 단순 비율 (hourlyRate × multiplier) | 한국 세법 + 4대보험 |
| UI | MVP 운영 콘솔 (단일 페이지) | 관리자 대시보드 + 직원 포탈 |
| 모바일 | 없음 | 네이티브 앱 (iOS/Android) |
| 멀티테넌트 | 없음 (단일 테넌트) | 조직별 완전 격리 |

---

## 2. 아키텍처 평가 및 개선 과제

> WI-0001 ~ WI-0030 까지의 개발 과정에 대한 구조적 평가.

### 강점

| 항목 | 상세 |
|------|------|
| **Contract-First 개발** | `specs/` 에 api.yaml + contract.yaml을 먼저 작성하고 구현. SemVer, API/Contract 커플링 게이트를 CI로 강제. |
| **DataAccess 추상화** | `memory` / `prisma` 이중 구현으로 테스트(memory)와 런타임(prisma)을 완전 분리. 새 Store 추가 시 인터페이스만 확장. |
| **거버넌스 자동화** | PR 템플릿, Golden Fixture, 변경 통제, 이벤트 추적성 등 1인 운영에서도 품질을 유지할 수 있는 CI 게이트 구축. |
| **감사 추적** | AuditLog가 모든 상태 변경에 내장. 도메인 이벤트와 감사 로그가 일관된 구조. |

### 구조적 문제점

#### 2-1. 거버넌스 과잉 vs 기능 부족

32개 WI의 카테고리 분포:

```
핵심 비즈니스: 12개 (38%)  ← 실제 제품 기능
거버넌스/품질: 11개 (34%)  ← CI 게이트, 회귀 테스트
운영/인프라:    7개 (22%)  ← 알림, 이벤트 전송, 헬스 모니터링
UI:             2개 ( 6%)  ← 운영 콘솔, 리스트
```

MVP 단계에서 **거버넌스가 비즈니스 기능과 거의 동일한 비중**을 차지.
PR 템플릿 검증(WI-0021), 그 회귀 테스트(WI-0023), Golden 변경 통제(WI-0024) 등은
제품이 성숙한 후에 도입해도 늦지 않는 항목들.

**로드맵 반영**: Phase 1 이후 거버넌스 WI 비율을 20% 이하로 제한. 비즈니스 기능 우선.

#### 2-2. employeeId 참조 무결성 부재 (String 참조) — 가장 큰 기술 부채

Employee/Organization 마스터는 WI-0034로 도입했지만, 핵심 도메인 테이블들이 여전히
`employeeId: String`으로만 참조하고 있어 **참조 무결성이 전혀 없는 상태**.

```
현재: AttendanceRecord.employeeId → (어디에도 FK 없음)
     LeaveRequest.employeeId     → (어디에도 FK 없음)
     PayrollRun.employeeId       → (어디에도 FK 없음)
```

이로 인해:
- 존재하지 않는 employeeId로 근태/휴가/급여 생성 가능 (데이터 무결성 위반)
- 직원 퇴사/부서이동 시 연쇄 처리 불가
- 멀티테넌트 격리 시 테넌트별 직원 범위 설정 불가

**로드맵 반영**: Phase 1에서 `employeeId` FK 마이그레이션(WI-0035)을 최우선으로 배치.

#### 2-3. 수직 강화 편중, 수평 확장 부재

같은 도메인(근태/급여)을 반복적으로 강화하면서 새로운 도메인 진출이 늦음:

```
근태 관련: WI-0001, 0008, 0009, 0016, 0017, 0026, 0031 → 7개 WI
급여 관련: WI-0005, 0006, 0010, 0028, 0030              → 5개 WI
휴가 관련: WI-0002, 0003, 0027                           → 3개 WI
인사 마스터: WI-0034(Organization/Employee)만 있고 나머지는 미완
```

근태 반려 사유(WI-0016) + 반려 검증(WI-0017)처럼 한 기능을 2개 WI로 분리하는 대신,
Employee 모델이나 Department 모델을 먼저 만들었어야 함.

**로드맵 반영**: Phase 1에서 인사 마스터를 확립한 후, Phase 2~5에서 도메인을 수평 확장.

#### 2-4. 하드코딩 의존

| 항목 | 현재 | 문제 |
|------|------|------|
| 역할 | `actor.ts`에 5개 리터럴 배열 | 고객별 커스텀 역할 불가 |
| 급여 규칙 | `payroll-rules.ts`에 한국 전용 로직 인라인 | 다국가/다법인 확장 불가 |
| 야간 시간대 | `00:00~04:00` 하드코딩 | 조직별 야간 기준 변경 불가 |
| 기본 연차 | `15일` 하드코딩 | 정책별 부여일수 변경 불가 |

**로드맵 반영**: Phase 1(WI-0042~0043)에서 RBAC 엔진 도입, Phase 4(WI-0079~)에서 급여 규칙 엔진화.

### 개선 우선순위 요약

```
긴급 ┌─────────────────────────────────────────────┐
     │ 1. Employee/Organization 모델 (완료: WI-0034) │ ← 기초 확보
     │ 2. employeeId FK 마이그레이션 (WI-0035)       │ ← 무결성 부재
     │ 3. RBAC 엔진 (WI-0036)                        │ ← 하드코딩 제거
     ├─────────────────────────────────────────────┤
높음  │ 4. 멀티테넌트 RLS (WI-0037)                  │ ← SaaS 기반
     │ 5. 근무일정 & 출퇴근 고도화 (Phase 2)        │ ← 핵심 기능 부재
     │ 6. 급여 엔진 고도화 (Phase 4)                │ ← 세법 미적용
     ├─────────────────────────────────────────────┤
중간  │ 7. 사용자 UI (Phase 6)                      │ ← UI 전무
     │ 8. 모바일 앱 (Phase 7)                       │ ← 채널 부재
     ├─────────────────────────────────────────────┤
낮음  │ 9. 확장 기능 (Phase 8)                      │ ← 부가 모듈
     └─────────────────────────────────────────────┘
```

---

## 3. 프로덕션급 기준 (Shiftee/Flex 벤치마크)

### 기능 모듈 매핑

| 모듈 | Shiftee | Flex | FlowHR 현재 | Gap |
|------|---------|------|-------------|-----|
| **인사 마스터** | ✅ 직원/부서/직급/조직도 | ✅ 직원/조직/이력관리 | ⚠️ Organization/Employee 기본 CRUD(WI-0034), Department/Position/RBAC 미도입 | High |
| **멀티테넌트** | ✅ 회사별 격리 | ✅ 워크스페이스 격리 | ❌ 없음 | Critical |
| **근무일정** | ✅ 교대근무/유연근무 | ✅ 시차출근/재택 | ❌ 없음 | Critical |
| **출퇴근** | ✅ GPS/비콘/키오스크 | ✅ GPS/Wi-Fi/QR | ⚠️ 수동 기록만 | High |
| **근태 집계** | ✅ 자동 집계/이상 감지 | ✅ 실시간 대시보드 | ⚠️ 집계 조회 API(WI-0031)만 구현 | High |
| **휴가 관리** | ✅ 정책 엔진/잔여일 자동계산 | ✅ 자동 부여/소진 추적 | ⚠️ 기본 CRUD만 | Medium |
| **급여 계산** | ✅ 한국 세법/4대보험/연말정산 | ✅ 급여 시뮬레이션/명세서 | ⚠️ 단순 비율 | Critical |
| **전자결재** | ✅ 결재선/양식/위임 | ✅ 승인 워크플로 | ❌ 없음 | High |
| **전자계약** | ✅ 근로계약/전자서명 | ✅ 계약 관리 | ❌ 없음 | Medium |
| **관리자 대시보드** | ✅ 웹 SPA | ✅ 웹 SPA | ⚠️ 운영 콘솔만 | Critical |
| **직원 셀프서비스** | ✅ 웹 포탈 | ✅ 웹 포탈 | ❌ 없음 | Critical |
| **모바일 앱** | ✅ iOS/Android | ✅ iOS/Android | ❌ 없음 | High |
| **알림** | ✅ 푸시/이메일/Slack | ✅ 푸시/Slack/Teams | ⚠️ 웹훅만 | Medium |
| **채용 관리** | ✅ ATS | ⚠️ 기본 | ❌ 없음 | Low |
| **성과 평가** | ✅ MBO/OKR | ✅ 리뷰 시스템 | ❌ 없음 | Low |
| **경비 관리** | ⚠️ 기본 | ✅ 경비 청구/정산 | ❌ 없음 | Low |
| **교육 관리** | ⚠️ 기본 | ⚠️ 기본 | ❌ 없음 | Low |
| **분석/리포트** | ✅ 대시보드/엑셀 | ✅ 커스텀 리포트 | ❌ 없음 | Medium |

### 현재 달성률 추정: ~5-8%

---

## 4. Phase 의존성 다이어그램

```text
Phase 1: Production Foundation (People + Integrity + Auth + Tenant)
  |
  v
Phase 2: Scheduling & Clock-in Enhancements
  |
  v
Phase 3: Leave Policy Engine
  |
  v
Phase 4: Payroll Hardening (KR tax/4-insurance)
  |
  v
Phase 5: Approvals + e-Contract
  |
  v
Phase 6: Web UI (Admin + Employee self-service)
  |
  v
Phase 7: Mobile + Notifications
  |
  v
Phase 8: Extensions (ATS, performance, expenses, analytics)
```

**핵심 의존 관계**:
- Phase 2~5는 Phase 1(인사/권한/테넌트 기반)에 의존
- Phase 4(급여)는 Phase 2(근태) + Phase 3(휴가)에 의존
- UI/모바일은 안정화된 API 이후에 진행

---

## 5. Phase 상세

### Phase 1: Production Foundation (현재 우선순위)

**목표**: 1인 운영에서도 안전하게 확장할 수 있도록 인사 마스터/무결성/권한/테넌트 기반을 먼저 고정합니다.

| WI | 상태 | 요약 |
|----|------|------|
| WI-0033 | Done | 로드맵/실행계획 정합 + Phase 1 WI 시드 |
| WI-0034 | Done | People 도메인(Organization/Employee) + API + Prisma 모델 |
| WI-0035 | Next | 기존 `employeeId: string` → `Employee` FK 마이그레이션 |
| WI-0036 | Next | RBAC 엔진 도입(하드코딩 역할 제거) |
| WI-0037 | Next | 멀티테넌트 격리 baseline (Supabase RLS) |

운영 안정성(상시):

| WI | 상태 | 요약 |
|----|------|------|
| WI-0038 | Done | phase2-health 409 게이트 튜닝(false incident 감소) |

**완료 기준 (DoD)**:
- [ ] `Employee`를 참조하는 핵심 도메인 테이블이 FK로 무결성을 보장
- [ ] 하드코딩 역할 체크가 RBAC 엔진으로 전환
- [ ] 최소 멀티테넌트 격리(앱 레벨 스코프 + RLS baseline)가 적용
- [ ] 기존 회귀 테스트(WI-0001~0031) 및 거버넌스 게이트가 모두 통과

### Phase 2+ (요약)

- Phase 2: 근무일정/교대/유연근무 + GPS/QR 출퇴근 + 실시간 근태 현황
- Phase 3: 휴가 정책 엔진(자동 부여/소진/연차촉진) + 시간/반차 단위
- Phase 4: 급여 엔진 고도화(세법/4대보험/명세서/마감)
- Phase 5: 전자결재/전자계약(결재선, 문서 양식, 서명)
- Phase 6: 관리자/직원 UI
- Phase 7: 모바일 + 알림(푸시/이메일/인앱)
- Phase 8: 확장 모듈(채용/성과/경비/교육/분석)

---

## 6. 기술 스택 (현재)

| 레이어 | 기술 | 비고 |
|--------|------|------|
| Framework | Next.js | App Router |
| Language | TypeScript | |
| DB | PostgreSQL (Supabase) | |
| ORM | Prisma | migration 포함 |
| Auth | Supabase Auth | JWT 기반 |
| Validation | Zod | |
| Test | tsx 기반 스크립트 | unit/integration/e2e/golden |

---

## 7. 운영 메모

- Staging CI는 기본 `OFF` 입니다. 설정은 `docs/staging-secrets.md`를 따릅니다.
- Phase2 운영 롤아웃/헬스 모니터링은 `docs/production-rollout.md`를 따릅니다.

---

## 8. 프로덕션 마일스톤

| 마일스톤 | 목표 |
|----------|------|
| **M1: Foundation** | Phase 1 완료(무결성/RBAC/테넌트 기반) |
| **M2: Core HR Backend** | Phase 2~4 완료(근무/휴가/급여 엔진 고도화) |
| **M3: Workflow & Docs** | Phase 5 완료(결재/계약) |
| **M4: Web Launch** | Phase 6 완료(웹 UI) |
| **M5: Mobile Launch** | Phase 7 완료(모바일/알림) |

---

> **Note**: WI 번호 범위는 예약하지 않습니다. 새로운 작업은 `work-items/`에 다음 번호로 생성합니다.