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

### 완료 WI 목록 (WI-0001 ~ WI-0031)

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

### 진행 중

- 없음 (WI-0031까지 main에 머지 완료)

### 현재 아키텍처

| 항목 | 현재 상태 | 프로덕션 요구 |
|------|-----------|---------------|
| DB 모델 | 7개 (Employee 테이블 없음) | 25~30개 |
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

31개 WI의 카테고리 분포:

```
핵심 비즈니스: 12개 (39%)  ← 실제 제품 기능
거버넌스/품질: 11개 (35%)  ← CI 게이트, 회귀 테스트
운영/인프라:    6개 (19%)  ← 알림, 이벤트 전송
UI:             2개 ( 6%)  ← 운영 콘솔, 리스트
```

MVP 단계에서 **거버넌스가 비즈니스 기능과 거의 동일한 비중**을 차지.
PR 템플릿 검증(WI-0021), 그 회귀 테스트(WI-0023), Golden 변경 통제(WI-0024) 등은
제품이 성숙한 후에 도입해도 늦지 않는 항목들.

**로드맵 반영**: Phase 1 이후 거버넌스 WI 비율을 20% 이하로 제한. 비즈니스 기능 우선.

#### 2-2. Employee 테이블 부재 — 가장 큰 기술 부채

HR 시스템의 가장 기본적인 엔티티인 Employee가 없음.
모든 테이블이 `employeeId: String`으로 참조하여 **참조 무결성이 전혀 없는 상태**.

```
현재: AttendanceRecord.employeeId → (어디에도 FK 없음)
     LeaveRequest.employeeId     → (어디에도 FK 없음)
     PayrollRun.employeeId       → (어디에도 FK 없음)
```

이로 인해:
- 존재하지 않는 employeeId로 근태/휴가/급여 생성 가능 (데이터 무결성 위반)
- 직원 퇴사/부서이동 시 연쇄 처리 불가
- 멀티테넌트 격리 시 테넌트별 직원 범위 설정 불가

**로드맵 반영**: Phase 1(WI-0032~0048)을 최우선으로 배치. WI-0039에서 기존 string → FK 마이그레이션 전용 WI 할당.

#### 2-3. 수직 강화 편중, 수평 확장 부재

같은 도메인(근태/급여)을 반복적으로 강화하면서 새로운 도메인 진출이 늦음:

```
근태 관련: WI-0001, 0008, 0009, 0016, 0017, 0026, 0031 → 7개 WI
급여 관련: WI-0005, 0006, 0010, 0028, 0030              → 5개 WI
휴가 관련: WI-0002, 0003, 0027                           → 3개 WI
인사 마스터: 0개 ← HR 시스템의 기초
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
     │ 1. Employee/Organization 모델 (Phase 1)     │ ← 기초 부재
     │ 2. employeeId FK 마이그레이션 (Phase 1)      │ ← 무결성 부재
     │ 3. RBAC 엔진 (Phase 1)                      │ ← 하드코딩 제거
     ├─────────────────────────────────────────────┤
높음  │ 4. 멀티테넌트 RLS (Phase 1)                 │ ← SaaS 기반
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
| **인사 마스터** | ✅ 직원/부서/직급/조직도 | ✅ 직원/조직/이력관리 | ❌ Employee 테이블 없음 | Critical |
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

```
Phase 1: 인사 마스터 & 멀티테넌트 ──────────────────────────┐
         (WI-0032 ~ WI-0048)                               │
              │                                              │
              ▼                                              │
Phase 2: 근무일정 & 출퇴근 고도화 ──┐                       │
         (WI-0049 ~ WI-0065)       │                        │
              │                     │                        │
              ▼                     │                        │
Phase 3: 휴가 고도화               │                        │
         (WI-0066 ~ WI-0078)       │                        │
              │                     │                        │
              ├─────────────────────┘                        │
              ▼                                              │
Phase 4: 급여 고도화                                        │
         (WI-0079 ~ WI-0098)                                │
              │                                              │
              ▼                                              │
Phase 5: 전자결재 & 전자계약                                │
         (WI-0099 ~ WI-0112)                                │
              │                                              │
              ├──────────────────────────────────────────────┘
              ▼
Phase 6: 사용자 UI
         (WI-0113 ~ WI-0135)
              │
              ▼
Phase 7: 모바일 & 알림
         (WI-0136 ~ WI-0148)
              │
              ▼
Phase 8: 확장 기능
         (WI-0149 ~ WI-0165+)
```

**핵심 의존 관계**:
- Phase 2~5는 모두 Phase 1(인사 마스터)에 의존
- Phase 4(급여)는 Phase 2(근태)와 Phase 3(휴가)에 의존
- Phase 6(UI)은 Phase 1~5 API 완성 후 착수
- Phase 7(모바일)은 Phase 6(UI) 컴포넌트 재사용
- Phase 8(확장)은 독립적이나 Phase 1 기반 필요

---

## 5. Phase 상세

---

### Phase 1: 인사 마스터 & 멀티테넌트 (WI-0032 ~ WI-0048)

**목표**: Employee, Organization, Department 등 핵심 엔티티 도입. 멀티테넌트 격리로 SaaS 기반 확립.

**기대 산출물**:
- Organization / Employee / Department / Position Prisma 모델
- 테넌트 격리: 1차 앱 레벨(orgId 스코프) + 2차 Supabase RLS(옵션)
- RBAC 엔진 (동적 역할/권한)
- 기존 `employeeId` string → Employee FK 마이그레이션

**선행 조건**: 없음 (최우선)

| WI | 제목 | 설명 |
|----|-------|------|
| WI-0032 | Organization 모델 & CRUD API | `Organization` 테이블 (name, bizRegNo, plan, settings). 생성/조회/수정 API. 테넌트 시드 스크립트. |
| WI-0033 | Department 모델 & 트리 구조 API | `Department` 테이블 (orgId, parentId, name, code, sortOrder). 트리 조회/생성/이동 API. |
| WI-0034 | Position/JobTitle 모델 & CRUD API | `Position` 테이블 (orgId, name, level, sortOrder). 직급/직책 관리 API. |
| WI-0035 | Employee 마스터 모델 설계 | `Employee` 테이블 (orgId, userId, departmentId, positionId, hireDate, status, employeeNo). 핵심 필드 정의 및 마이그레이션. |
| WI-0036 | Employee CRUD API | 직원 생성/조회/수정/비활성화 API. 리스트 필터링 (부서/상태/입사일). 페이지네이션 커서. |
| WI-0037 | Employee 프로필 확장 필드 | 연락처, 비상연락처, 은행계좌, 주소 등 확장 프로필 JSON 또는 정규화 테이블. |
| WI-0038 | Employee 이력 관리 | `EmployeeHistory` 테이블 (부서이동, 직급변경, 급여변경 이력). 이력 조회 API. |
| WI-0039 | 기존 employeeId → Employee FK 마이그레이션 | AttendanceRecord, LeaveRequest, PayrollRun 등 기존 string employeeId를 Employee 테이블 FK로 전환. 데이터 마이그레이션 스크립트. |
| WI-0040 | 멀티테넌트 격리 정책 설계 | 1차 앱 레벨 스코프 + 2차 Supabase RLS(옵션) 설계. Organization 기반 격리. 테넌트 컨텍스트 JWT claim (`org_id`) 표준화. |
| WI-0041 | 멀티테넌트 미들웨어 구현 | 요청별 테넌트 컨텍스트 주입 + DataAccess 스코프 강제. 1차는 앱 레벨 필터링, 2차로 RLS 강제(가능할 때). |
| WI-0042 | RBAC 엔진 설계 | `Role`, `Permission`, `RolePermission` 모델. 역할 계층 (admin > manager > employee). 커스텀 권한 지원. |
| WI-0043 | RBAC 엔진 구현 | 동적 역할/권한 평가. 기존 `hasAnyRole` 하드코딩 → RBAC 엔진 전환. 역할 관리 API. |
| WI-0044 | 권한 관리 API | 권한 목록 조회, 역할별 권한 할당/해제 API. 역할 생성/수정/삭제 API. |
| WI-0045 | 조직도 API | 부서 트리 + 직원 매핑 조직도 조회 API. 부서별 직원 수 집계. |
| WI-0046 | Employee 일괄 등록 (CSV Import) | CSV 파싱 및 유효성 검증. 중복 검출 (사번/이메일). 일괄 생성 트랜잭션. 에러 리포트. |
| WI-0047 | Employee 검색 & 필터링 고도화 | Full-text 검색 (이름/사번/이메일). 복합 필터 (부서+직급+상태). 정렬 옵션. |
| WI-0048 | Phase 1 통합 테스트 & 마이그레이션 검증 | 전체 CRUD + 테넌트 격리(앱 레벨 + RLS(옵션)) + RBAC 통합 테스트. 기존 WI-0001~0031 회귀 테스트 통과 확인. 마이그레이션 롤백 검증. |

**완료 기준 (DoD)**:
- [ ] Employee/Organization/Department/Position CRUD API 동작
- [ ] 테넌트 격리 검증 (교차 테넌트 데이터 접근 불가; 앱 레벨 필터링 + RLS(옵션))
- [ ] RBAC 엔진으로 기존 하드코딩 역할 전환 완료
- [ ] 기존 WI-0001~0031 회귀 테스트 100% 통과
- [ ] Employee FK 마이그레이션 완료 및 롤백 검증

---

### Phase 2: 근무일정 & 출퇴근 고도화 (WI-0049 ~ WI-0065)

**목표**: 교대근무/유연근무 스케줄링, GPS/QR 기반 출퇴근, 실시간 근태 현황 대시보드.

**기대 산출물**:
- WorkSchedule / Shift / ClockEvent 모델
- 근무 유형 (고정/교대/유연/재택) 엔진
- GPS/QR 출퇴근 기록 API
- 실시간 근태 현황 조회

**선행 조건**: Phase 1 (Employee/Organization 기반)

| WI | 제목 | 설명 |
|----|-------|------|
| WI-0049 | WorkSchedulePolicy 모델 설계 | `WorkSchedulePolicy` 테이블 (orgId, name, type, workDays, workHours, breakTime, overtimeRules). 근무 유형별 정책 정의. |
| WI-0050 | WorkSchedulePolicy CRUD API | 근무일정 정책 생성/조회/수정/삭제 API. 정책 유형: FIXED, SHIFT, FLEXIBLE, REMOTE. |
| WI-0051 | Shift 모델 & 교대근무 스케줄러 | `Shift` 테이블 (policyId, name, startTime, endTime, color). 교대 패턴 정의 (주간/야간/3교대). |
| WI-0052 | EmployeeScheduleAssignment | `ScheduleAssignment` (employeeId, policyId, shiftId, effectiveFrom, effectiveTo). 직원별 근무일정 배정. |
| WI-0053 | 월간 근무표 자동 생성 | 정책 + 교대패턴 기반 월간 스케줄 자동 생성. 공휴일 캘린더 연동. 수동 조정 API. |
| WI-0054 | ClockEvent 모델 & 출퇴근 기록 API | `ClockEvent` 테이블 (employeeId, type, timestamp, method, lat, lng, accuracy, deviceId). 출근/퇴근/외출/복귀 이벤트. |
| WI-0055 | GPS 기반 출퇴근 검증 | 사업장 좌표 등록 (`WorkLocation` 테이블). 출퇴근 시 GPS 좌표 대조. 허용 반경 설정. |
| WI-0056 | QR코드 출퇴근 | QR 토큰 생성/검증 API. 시간 제한 OTP 기반 QR. 키오스크 모드 지원. |
| WI-0057 | ClockEvent → AttendanceRecord 자동 매핑 | 출근+퇴근 이벤트 페어링 → AttendanceRecord 자동 생성. 미퇴근 알림. 자정 넘김 처리. |
| WI-0058 | 유연근무제 코어타임 검증 | 코어타임 (예: 10:00~16:00) 출근 여부 검증. 주간 총 근무시간 추적. 탄력근무 잔여시간 계산. |
| WI-0059 | 재택근무 기록 & 정책 | 재택근무 신청/승인 API. 재택 출퇴근 기록 (GPS 검증 선택적). 재택 일수 집계. |
| WI-0060 | 초과근무 신청 & 사전승인 | `OvertimeRequest` (employeeId, date, plannedHours, reason, state). 사전 승인 워크플로. 월간 초과근무 상한 (52시간제). |
| WI-0061 | 실시간 근태 현황 API | 오늘 출근/미출근/지각/조퇴 실시간 집계. 부서별/전사 현황. WebSocket 또는 폴링 엔드포인트. |
| WI-0062 | 근태 이상 감지 엔진 | 지각, 조퇴, 무단결근, 연속 초과근무 자동 감지. 이상 이벤트 발행. 관리자 알림 트리거. |
| WI-0063 | 공휴일 캘린더 관리 | `Holiday` 테이블 (orgId, date, name, isSubstitute). 법정공휴일 시드 (대한민국). 대체공휴일 지원. |
| WI-0064 | 기존 AttendanceRecord 확장 | checkMethod (MANUAL/GPS/QR/BIOMETRIC) 필드 추가. ClockEvent 참조 FK. 기존 데이터 호환 마이그레이션. |
| WI-0065 | Phase 2 통합 테스트 | 스케줄→출퇴근→근태기록→집계 전체 플로우. GPS/QR 검증 시나리오. 52시간 상한 검증. 회귀 테스트. |

**완료 기준 (DoD)**:
- [ ] 4가지 근무 유형 (고정/교대/유연/재택) 정책 및 배정 동작
- [ ] GPS/QR 출퇴근 기록 및 검증 동작
- [ ] ClockEvent → AttendanceRecord 자동 매핑
- [ ] 52시간제 초과근무 상한 검증
- [ ] 실시간 근태 현황 API 동작
- [ ] 기존 WI-0001~0031 회귀 테스트 통과

---

### Phase 3: 휴가 고도화 (WI-0066 ~ WI-0078)

**목표**: 자동 부여 정책 엔진, 다양한 휴가 유형, 반차/시간 단위 휴가, 연차촉진 기능.

**기대 산출물**:
- LeavePolicy 엔진 (자동 부여/소진 추적)
- 확장 휴가 유형 (경조사, 출산, 육아, 생리, 보건 등)
- 반차/시간 단위 휴가
- 연차촉진 자동 알림

**선행 조건**: Phase 1 (Employee 기반)

| WI | 제목 | 설명 |
|----|-------|------|
| WI-0066 | LeavePolicy 모델 설계 | `LeavePolicy` 테이블 (orgId, leaveType, grantRule, accrualType, carryOverRule, maxDays). 조직별 휴가 정책 정의. |
| WI-0067 | LeavePolicy CRUD API | 휴가 정책 생성/조회/수정 API. 기본 정책 시드 (한국 근로기준법 기반). |
| WI-0068 | 자동 부여 엔진 | 입사일/근속연수 기반 연차 자동 부여. 월 단위 비례 부여 (1년 미만). 근속 연수별 가산 연차 (근기법 제60조). |
| WI-0069 | 확장 휴가 유형 추가 | LeaveType enum 확장: ANNUAL, SICK, UNPAID, MATERNITY, PATERNITY, BEREAVEMENT, MENSTRUAL, FAMILY_CARE, COMPENSATORY, PUBLIC_DUTY. 유형별 유급/무급 구분. |
| WI-0070 | 반차 (AM/PM) 지원 | 반차 단위 신청/승인. `days` 필드 소수점 지원 (0.5). 잔여일 0.5일 단위 차감. |
| WI-0071 | 시간 단위 연차 | 시간 단위 사용 (1h 단위). `hours` 필드 추가. 8시간 = 1일 환산. 연간 시간연차 사용 상한 (24시간). |
| WI-0072 | 연차촉진 자동 알림 | 근기법 제61조 연차촉진. 10일 이상 미사용 시 6개월 전 촉진. 촉진 이력 관리. 알림 이벤트 발행. |
| WI-0073 | 휴가 중복 검증 고도화 | 동일 기간 중복 신청 차단 (기존). 반차+반차 같은 날 허용. 시간 단위 겹침 검증. |
| WI-0074 | 대리 승인 & 승인선 설정 | 부재 시 대리 승인자 지정. 다단계 승인선 (직속→팀장→본부장). 자동 승인 규칙 (3일 이하 직속 승인). |
| WI-0075 | 휴가 달력 API | 팀/부서별 휴가 달력 조회. 일별 부재 인원 집계. 출근율 계산. |
| WI-0076 | 휴가 통계 & 리포트 API | 직원별/부서별 사용 현황. 연차 소진율. 유형별 사용 통계. 엑셀 내보내기 데이터. |
| WI-0077 | LeaveBalance 고도화 | 유형별 잔여일 분리 추적. `LeaveBalance` 테이블 재설계 (현재 단일 행 → 유형별 행). 이력 추적. |
| WI-0078 | Phase 3 통합 테스트 | 자동 부여→신청→승인→잔여일 차감 전체 플로우. 연차촉진 시나리오. 반차/시간연차 경계 케이스. 회귀 테스트. |

**완료 기준 (DoD)**:
- [ ] 10+ 휴가 유형 지원
- [ ] 자동 부여 엔진 (근속 연수 기반) 동작
- [ ] 반차/시간 단위 휴가 동작
- [ ] 연차촉진 이벤트 발행
- [ ] 다단계 승인선 동작
- [ ] 기존 WI-0002/0003 회귀 테스트 통과

---

### Phase 4: 급여 고도화 (WI-0079 ~ WI-0098)

**목표**: 한국 세법 준수 급여 계산 엔진, 4대보험, 급여 명세서, 연말정산 기초 데이터.

**기대 산출물**:
- Korean Tax Engine (소득세법 간이세액표)
- 4대보험 계산 (국민연금/건강보험/고용보험/산재보험)
- 급여 명세서 생성
- 연말정산 기초 데이터

**선행 조건**: Phase 1 (Employee), Phase 2 (근태 고도화), Phase 3 (휴가 고도화)

| WI | 제목 | 설명 |
|----|-------|------|
| WI-0079 | SalaryContract 모델 | `SalaryContract` 테이블 (employeeId, type, baseSalaryKrw, hourlyRateKrw, effectiveFrom, effectiveTo). 연봉제/시급제/월급제 구분. |
| WI-0080 | SalaryContract CRUD API | 급여 계약 생성/조회/수정 API. 이력 관리 (계약 변경 추적). 유효 기간별 조회. |
| WI-0081 | 한국 소득세 간이세액표 엔진 | 근로소득 간이세액표 (국세청 기준). 부양가족 수 기반 세액 조회. 연간 세액표 버전 관리. |
| WI-0082 | 국민연금 계산 모듈 | 표준보수월액 기반 요율 테이블 적용(연도별 버전). 상한/하한액 적용. 사업주/근로자 분담. |
| WI-0083 | 건강보험 계산 모듈 | 보수월액 기반 요율 테이블 적용(장기요양보험 포함, 연도별 버전). 사업주/근로자 분담. |
| WI-0084 | 고용보험 계산 모듈 | 보수월액 기반 요율 테이블 적용(연도별 버전). 사업장 규모별 사업주 부담분 차등. |
| WI-0085 | 산재보험 계산 모듈 | 업종별 요율 테이블. 전액 사업주 부담. 출퇴근 재해 적용. |
| WI-0086 | 4대보험 통합 계산 서비스 | 4대보험 일괄 계산. 월별 보험료 산출. `InsuranceCalculation` 결과 타입 정의. |
| WI-0087 | PayrollRun 고도화 | 기존 단순 비율 → 세법 엔진 + 4대보험 통합. `deductionBreakdown` JSON에 세목별 상세 기록. 기존 호환성 유지. |
| WI-0088 | 급여 시뮬레이션 API | 확정 전 급여 시뮬레이션. What-if 분석 (시급 변경, 초과근무 추가 시 영향). 시뮬레이션 결과 임시 저장. |
| WI-0089 | 급여 명세서 데이터 모델 | `PaySlip` 테이블 (runId, employeeId, items[]). 지급 항목/공제 항목 상세. PDF 생성 데이터 구조. |
| WI-0090 | 급여 명세서 생성 API | PayrollRun 확정 시 PaySlip 자동 생성. 명세서 항목별 금액 상세. 직원 조회 API. |
| WI-0091 | 급여 대장 & 이체 데이터 | 급여 대장 (전 직원 월간 급여 요약). 은행 이체 파일 생성 (CSV/엑셀). 이체 상태 추적. |
| WI-0092 | 수당 체계 설계 | `AllowanceType` 테이블 (name, calculation, taxable). 기본 수당: 식대, 교통비, 직책수당, 자격수당. 비과세 한도 적용. |
| WI-0093 | 수당 CRUD API | 수당 유형 관리 API. 직원별 수당 배정. 급여 계산 시 수당 자동 합산. |
| WI-0094 | 퇴직금 계산 모듈 | 계속근로기간 기반 퇴직금 산출. 평균임금 계산 (3개월 기준). 퇴직금 시뮬레이션. |
| WI-0095 | 연말정산 기초 데이터 수집 | 근로소득 원천징수 영수증 데이터 구조. 월별 급여/세금 누적 데이터. 연간 소득 합계 API. |
| WI-0096 | 급여 마감 & 확정 워크플로 | 급여 마감 프로세스 (미결 근태 확인 → 급여 계산 → 검토 → 확정). 마감 상태 관리. 마감 취소/재계산. |
| WI-0097 | 급여 이력 & 통계 API | 직원별/부서별/월별 급여 이력. 인건비 통계. 전월 대비 변동. 연간 추이. |
| WI-0098 | Phase 4 통합 테스트 | 근태→급여계산→4대보험→명세서 전체 플로우. 간이세액표 정확성 검증. 경계 케이스 (입사/퇴사 월, 중도입사). 회귀 테스트. |

**완료 기준 (DoD)**:
- [ ] 한국 간이세액표 기반 소득세 계산 정확
- [ ] 4대보험 (국민연금/건강/고용/산재) 요율 정확
- [ ] 급여 명세서 데이터 생성
- [ ] 급여 마감 워크플로 동작
- [ ] 기존 WI-0001/0005/0006 회귀 테스트 통과

---

### Phase 5: 전자결재 & 전자계약 (WI-0099 ~ WI-0112)

**목표**: 범용 결재 워크플로 엔진, 문서 양식 관리, 근로계약서 전자서명.

**기대 산출물**:
- 결재 워크플로 엔진 (결재선, 합의선, 참조)
- 문서 양식 템플릿 시스템
- 전자서명 (근로계약서/인사발령)
- 결재 위임 & 대결

**선행 조건**: Phase 1 (Organization/Employee/RBAC)

| WI | 제목 | 설명 |
|----|-------|------|
| WI-0099 | ApprovalWorkflow 엔진 설계 | `ApprovalTemplate` (steps[], conditions). `ApprovalInstance` (templateId, documentId, state). 결재선 모델: 순차/병렬/조건부. |
| WI-0100 | ApprovalTemplate CRUD API | 결재 양식 템플릿 관리. 결재선 단계 정의 (기안→검토→승인→최종승인). 조건부 분기 (금액별, 부서별). |
| WI-0101 | ApprovalInstance 생성 & 상태 관리 | 결재 문서 기안 API. 상태 머신 (DRAFT→PENDING→IN_REVIEW→APPROVED/REJECTED). 단계별 승인/반려/보류. |
| WI-0102 | 결재 알림 & 독촉 | 결재 요청 시 승인자에게 알림 이벤트. 미처리 결재 독촉. 결재 완료/반려 통지. |
| WI-0103 | 결재 위임 & 대결 | 부재 시 결재 위임자 지정. 대결 (부재자 대신 결재) 기능. 위임 기간 설정. |
| WI-0104 | 결재 문서 양식 시스템 | `DocumentForm` (name, fields[], category). 기본 양식: 휴가신청, 초과근무, 경비청구, 인사발령, 출장보고. 커스텀 필드 지원. |
| WI-0105 | 결재 이력 & 감사 추적 | 결재 단계별 처리 이력. 의견 첨부. 첨부 파일 메타데이터. 감사 로그 연동. |
| WI-0106 | 기존 휴가/초과근무 결재 연동 | LeaveRequest 승인 → ApprovalWorkflow 통합. OvertimeRequest → ApprovalWorkflow 통합. 기존 단순 승인 → 결재선 승인 전환. |
| WI-0107 | Contract (근로계약) 모델 | `EmploymentContract` (employeeId, type, startDate, salary, terms, state). 계약 유형: 정규직/계약직/파트타임/인턴. |
| WI-0108 | 근로계약 CRUD API | 계약 생성/조회/수정 API. 계약서 템플릿 기반 생성. 계약 갱신/종료. |
| WI-0109 | 전자서명 인프라 | 서명 요청 생성 API. 서명 상태 관리 (PENDING→SIGNED→EXPIRED). 서명 검증 토큰. 서명 이미지 저장. |
| WI-0110 | 계약서 PDF 생성 | 계약 데이터 → PDF 변환. 서명 영역 삽입. 완료된 계약서 아카이빙. |
| WI-0111 | 인사발령 문서 워크플로 | 발령 유형: 전보/승진/직급변경/보직변경. 발령 기안 → 결재 → 확정 → Employee 자동 반영. |
| WI-0112 | Phase 5 통합 테스트 | 기안→결재선→승인→문서확정 전체 플로우. 위임/대결 시나리오. 전자서명 시나리오. 기존 휴가 결재 호환. |

**완료 기준 (DoD)**:
- [ ] 결재 워크플로 엔진 (순차/병렬/조건부) 동작
- [ ] 기존 휴가/초과근무 승인이 결재 엔진으로 통합
- [ ] 근로계약서 전자서명 플로우 동작
- [ ] 결재 위임/대결 동작
- [ ] PDF 생성 동작

---

### Phase 6: 사용자 UI (WI-0113 ~ WI-0135)

**목표**: 관리자 대시보드와 직원 셀프서비스 포탈. React 기반 SPA.

**기대 산출물**:
- 관리자 대시보드 (전사 현황, 인사관리, 급여관리)
- 직원 셀프서비스 (마이페이지, 휴가신청, 급여명세)
- 공통 UI 컴포넌트 라이브러리
- 반응형 웹 (데스크톱/태블릿)

**선행 조건**: Phase 1~5 API 완성

| WI | 제목 | 설명 |
|----|-------|------|
| WI-0113 | UI 프레임워크 & 디자인 시스템 | Tailwind CSS + shadcn/ui (또는 동급) 셋업. 컬러/타이포/스페이싱 토큰. 다크모드 지원. |
| WI-0114 | 인증 UI (로그인/로그아웃) | Supabase Auth UI. 이메일/비밀번호 로그인. SSO 준비 (SAML/OAuth). 세션 관리. |
| WI-0115 | 레이아웃 & 네비게이션 | 사이드바 + 헤더 레이아웃. 역할별 메뉴 분기. 브레드크럼. 모바일 반응형 (햄버거 메뉴). |
| WI-0116 | 대시보드 홈 (관리자) | 오늘 출근율, 미출근자, 근태 이상 알림. 이번 달 급여 마감 진행률. 주요 지표 카드. |
| WI-0117 | 직원 관리 UI | 직원 목록 (검색/필터/페이지네이션). 직원 상세 (프로필/이력/계약). 직원 등록/수정 폼. CSV 일괄 등록. |
| WI-0118 | 조직도 UI | 트리 뷰 조직도. 드래그 앤 드롭 부서 이동. 부서별 인원 수. 직원 카드 클릭 → 상세. |
| WI-0119 | 근태 관리 UI (관리자) | 일별/주별/월별 근태 현황 테이블. 상태별 필터 (출근/결근/지각/조퇴). 건별 승인/반려. 일괄 승인. |
| WI-0120 | 근태 캘린더 UI | 월간 달력 뷰. 일자별 출퇴근 시간 표시. 이상 근태 하이라이트. 클릭 → 상세 모달. |
| WI-0121 | 휴가 관리 UI (관리자) | 휴가 신청 목록. 상태별 필터. 승인/반려 액션. 팀 휴가 달력. 연차 사용 현황 차트. |
| WI-0122 | 급여 관리 UI (관리자) | 급여 마감 대시보드. 직원별 급여 상세. 급여 대장 테이블. 엑셀 내보내기. 급여 확정 워크플로 UI. |
| WI-0123 | 결재 관리 UI (관리자) | 결재 대기함/처리함/참조함. 결재선 시각화. 결재 상세 (의견/첨부). 결재 양식 관리. |
| WI-0124 | 직원 마이페이지 | 내 프로필 조회/수정. 내 근태 기록. 내 휴가 잔여/이력. 내 급여 명세서. |
| WI-0125 | 직원 출퇴근 UI | 출근/퇴근 버튼. 현재 상태 표시 (근무중/외출/퇴근). GPS 위치 확인. 오늘 근무시간 실시간. |
| WI-0126 | 직원 휴가 신청 UI | 휴가 유형 선택. 날짜 범위 피커. 반차/시간 단위 선택. 잔여일 실시간 표시. 제출 후 결재 현황. |
| WI-0127 | 직원 급여 명세서 UI | 월별 급여 명세서 조회. 지급/공제 항목 상세. PDF 다운로드. 연간 지급 내역. |
| WI-0128 | 직원 결재 UI | 내 결재 대기함. 기안 작성. 결재 진행 상태. 결재 이력. |
| WI-0129 | 알림 센터 UI | 실시간 알림 드롭다운. 알림 목록 (읽음/안읽음). 알림 설정 (이메일/푸시/인앱). |
| WI-0130 | 설정 UI (관리자) | 조직 설정 (근무정책, 휴가정책, 급여정책). 역할/권한 관리. 공휴일 관리. 알림 설정. |
| WI-0131 | 테이블 공통 컴포넌트 | 서버사이드 페이지네이션. 정렬/필터/검색. 컬럼 커스터마이즈. 엑셀 내보내기. |
| WI-0132 | 폼 공통 컴포넌트 | React Hook Form + Zod 통합. 공통 입력 컴포넌트 (텍스트/날짜/셀렉트/체크박스). 유효성 검증 메시지. |
| WI-0133 | 차트 & 데이터 시각화 | 기본 차트 라이브러리 (recharts 또는 동급). 근태 통계 차트. 급여 추이 차트. 인력 현황 파이 차트. |
| WI-0134 | 접근성 & 국제화 기반 | WCAG 2.1 AA 기본 준수. i18n 프레임워크 (ko/en). 날짜/통화 포맷 로케일. |
| WI-0135 | Phase 6 UI E2E 테스트 | Playwright 또는 Cypress 셋업. 핵심 유저 플로우 E2E (로그인→출퇴근→휴가→급여). 반응형 스냅샷 테스트. |

**완료 기준 (DoD)**:
- [ ] 관리자 대시보드 핵심 화면 동작 (인사/근태/휴가/급여/결재)
- [ ] 직원 셀프서비스 핵심 화면 동작 (마이페이지/출퇴근/휴가/급여)
- [ ] 반응형 레이아웃 (데스크톱/태블릿)
- [ ] 핵심 유저 플로우 E2E 테스트 통과
- [ ] 접근성 기본 준수 (WCAG 2.1 AA)

---

### Phase 7: 모바일 & 알림 (WI-0136 ~ WI-0148)

**목표**: 네이티브 모바일 앱 (React Native), 푸시 알림, 이메일 알림 통합.

**기대 산출물**:
- React Native 앱 (iOS/Android)
- 푸시 알림 인프라 (FCM/APNs)
- 이메일 알림 시스템
- 인앱 알림 실시간 전달

**선행 조건**: Phase 6 (UI 컴포넌트 재사용)

| WI | 제목 | 설명 |
|----|-------|------|
| WI-0136 | React Native 프로젝트 셋업 | Expo 또는 bare RN 프로젝트 초기화. 네비게이션 (React Navigation). 인증 연동 (Supabase). 빌드 파이프라인. |
| WI-0137 | 모바일 인증 & 세션 | Supabase Auth 모바일 통합. 생체인증 (Face ID/지문) 잠금. 토큰 갱신. 로그아웃. |
| WI-0138 | 모바일 출퇴근 | GPS 기반 출퇴근 버튼. 백그라운드 위치 수집 (선택). 오프라인 펀치 → 온라인 시 동기화. |
| WI-0139 | 모바일 QR 스캐너 | 카메라 → QR 스캔. 출퇴근 QR 코드 인식 및 API 호출. 결과 즉시 표시. |
| WI-0140 | 모바일 마이페이지 | 프로필 조회. 오늘 근태 상태. 잔여 연차. 최근 급여. |
| WI-0141 | 모바일 휴가 신청/조회 | 휴가 신청 폼. 잔여일 표시. 신청 내역 조회. 상태 변경 알림. |
| WI-0142 | 모바일 결재 | 결재 대기 목록. 승인/반려 액션. 결재 상세 보기. |
| WI-0143 | 푸시 알림 인프라 (FCM/APNs) | Firebase Cloud Messaging 셋업. APNs 인증서 관리. 디바이스 토큰 등록 API. 토큰 갱신 처리. |
| WI-0144 | 알림 서비스 & 템플릿 | `NotificationTemplate` (channel, type, template). 채널: PUSH/EMAIL/INAPP/SLACK. 이벤트→알림 매핑 규칙. |
| WI-0145 | 이메일 알림 통합 | SMTP 또는 SES/SendGrid 연동. 이메일 템플릿 (HTML). 급여 명세서 이메일 발송. 결재 알림 이메일. |
| WI-0146 | 인앱 알림 실시간 전달 | `Notification` 테이블 (recipientId, type, title, body, read, createdAt). 실시간 전달 (Supabase Realtime 또는 SSE). |
| WI-0147 | 알림 설정 & 수신 거부 | 직원별 알림 수신 설정. 채널별 ON/OFF. 방해금지 시간 설정. 필수 알림 (급여/계약) 예외. |
| WI-0148 | Phase 7 통합 테스트 | 모바일 E2E (Detox 또는 수동). 푸시 알림 전달 검증. 이메일 발송 검증. 오프라인 → 온라인 동기화. |

**완료 기준 (DoD)**:
- [ ] iOS/Android 앱 빌드 및 기본 기능 동작
- [ ] GPS 출퇴근, QR 스캔 동작
- [ ] 푸시 알림 전달 (결재/근태/급여)
- [ ] 이메일 알림 발송 (급여명세/결재)
- [ ] 오프라인 출퇴근 → 온라인 동기화

---

### Phase 8: 확장 기능 (WI-0149 ~ WI-0165+)

**목표**: 채용 관리, 성과 평가, 경비 관리, 교육, 분석/리포트 등 부가 모듈.

**기대 산출물**:
- 채용 관리 (ATS)
- 성과 평가 시스템
- 경비 관리
- 분석 대시보드 & 커스텀 리포트

**선행 조건**: Phase 1 (기반), 개별 모듈은 독립 진행 가능

| WI | 제목 | 설명 |
|----|-------|------|
| WI-0149 | 채용 모듈 - JobPosting 모델 & API | `JobPosting` (orgId, title, department, status, description, requirements). 채용공고 CRUD. 상태 관리 (DRAFT→OPEN→CLOSED). |
| WI-0150 | 채용 모듈 - Applicant & Pipeline | `Applicant` (postingId, name, email, resume, stage). 채용 파이프라인 (서류→면접→최종→합격/불합격). 단계 이동 API. |
| WI-0151 | 채용 모듈 - 면접 일정 관리 | `Interview` (applicantId, interviewers[], scheduledAt, feedback). 면접관 배정. 피드백 수집. |
| WI-0152 | 채용 모듈 - 합격자 → 직원 전환 | 합격 확정 → Employee 자동 생성. 초기 정보 사전 입력. 입사 온보딩 체크리스트. |
| WI-0153 | 성과 모듈 - ReviewCycle 모델 | `ReviewCycle` (orgId, name, period, type, state). 평가 유형: MBO, OKR, 다면평가. 평가 주기 설정. |
| WI-0154 | 성과 모듈 - Goal & KPI 설정 | `Goal` (employeeId, cycleId, title, metric, target, actual). 목표 수립 → 중간 점검 → 최종 평가. |
| WI-0155 | 성과 모듈 - PeerReview & 360도 | 동료 평가 요청/수집. 상향/하향/동료 다면 평가. 익명 옵션. 결과 집계. |
| WI-0156 | 성과 모듈 - 평가 결과 & 등급 | 평가 점수 집계. 등급 부여 (S/A/B/C/D). 등급별 분포 강제 (상대평가 옵션). |
| WI-0157 | 경비 모듈 - ExpenseClaim 모델 & API | `ExpenseClaim` (employeeId, category, amount, receipt, state). 경비 유형 (교통비/식비/숙박비/기타). 영수증 첨부. |
| WI-0158 | 경비 모듈 - 결재 연동 & 정산 | 경비 신청 → 결재 워크플로. 승인 후 정산 대기. 급여 연동 (급여에 합산 또는 별도 지급). |
| WI-0159 | 경비 모듈 - 법인카드 연동 | 법인카드 사용 내역 수동 입력/CSV 업로드. 경비 항목 자동 매핑. 미처리 건 알림. |
| WI-0160 | 교육 모듈 - TrainingProgram 모델 | `TrainingProgram` (orgId, title, category, hours, mandatory). 교육 과정 관리. 필수/선택 교육 구분. |
| WI-0161 | 교육 모듈 - 수강 이력 & 수료 | `TrainingEnrollment` (employeeId, programId, status, completedAt). 수강 신청/완료/미수료. 수료증 발급. |
| WI-0162 | 분석 - HR 대시보드 | 인력 현황 (부서별/직급별/연령별). 이직률/근속률. 채용 파이프라인 현황. 급여 총액 추이. |
| WI-0163 | 분석 - 커스텀 리포트 빌더 | 데이터 소스 선택 (인사/근태/급여/휴가). 필터/그룹화/집계 설정. 엑셀/PDF 내보내기. 리포트 저장/스케줄링. |
| WI-0164 | 감사 & 컴플라이언스 리포트 | 감사 로그 조회 UI. 접근 이력 리포트. 개인정보 처리 기록. 컴플라이언스 체크리스트. |
| WI-0165 | SSO & 엔터프라이즈 통합 | SAML 2.0 SSO. Active Directory 연동. Google Workspace 연동. API 키 발급/관리. |

**완료 기준 (DoD)**:
- [ ] 채용 파이프라인 기본 동작 (공고→지원→면접→합격→입사)
- [ ] 성과 평가 사이클 기본 동작 (목표→평가→등급)
- [ ] 경비 청구/정산 기본 동작
- [ ] HR 분석 대시보드 기본 지표 표시
- [ ] SSO (SAML 2.0) 동작

---

## 6. 기술 스택 확장 계획

### 현재 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Framework | Next.js | 15.x |
| Language | TypeScript | 5.7 |
| DB | PostgreSQL (Supabase) | — |
| ORM | Prisma | 6.3 |
| Auth | Supabase Auth | 2.x |
| Validation | Zod | 3.24 |
| Runtime | Node.js | 20.x |

### Phase별 추가 기술

| Phase | 추가 기술 | 목적 |
|-------|-----------|------|
| Phase 1 | Supabase RLS 정책 | 멀티테넌트 행 수준 격리 |
| Phase 2 | WebSocket / Supabase Realtime | 실시간 근태 현황 |
| Phase 4 | PDF 생성 라이브러리 (puppeteer/react-pdf) | 급여 명세서 PDF |
| Phase 5 | 전자서명 라이브러리 | 근로계약 서명 |
| Phase 6 | Tailwind CSS + shadcn/ui | UI 컴포넌트 |
| Phase 6 | React Hook Form | 폼 관리 |
| Phase 6 | recharts 또는 nivo | 차트/시각화 |
| Phase 6 | Playwright 또는 Cypress | UI E2E 테스트 |
| Phase 6 | next-intl 또는 i18next | 국제화 |
| Phase 7 | React Native (Expo) | 모바일 앱 |
| Phase 7 | FCM / APNs | 푸시 알림 |
| Phase 7 | SendGrid / AWS SES | 이메일 발송 |
| Phase 8 | — (기존 스택 활용) | — |

### 인프라 확장

| 항목 | 현재 | 프로덕션 |
|------|------|----------|
| 호스팅 | Vercel | Vercel (Pro 이상) |
| DB | Supabase Free | Supabase Pro + Connection Pooling |
| 파일 저장소 | — | Supabase Storage 또는 S3 |
| CDN | Vercel Edge | Vercel Edge |
| 모니터링 | GitHub Actions | Sentry + Datadog/Grafana |
| CI/CD | GitHub Actions | GitHub Actions + Preview Deploy |
| 시크릿 관리 | Vercel Env | Vault 또는 Vercel Env (Pro) |

---

## 7. WI 번호 요약

| Phase | WI 범위 | 개수 | 핵심 테마 |
|-------|---------|------|-----------|
| — | WI-0001 ~ WI-0031 | 31 | MVP 백엔드 (완료) |
| Phase 1 | WI-0032 ~ WI-0048 | 17 | 인사 마스터 & 멀티테넌트 |
| Phase 2 | WI-0049 ~ WI-0065 | 17 | 근무일정 & 출퇴근 고도화 |
| Phase 3 | WI-0066 ~ WI-0078 | 13 | 휴가 고도화 |
| Phase 4 | WI-0079 ~ WI-0098 | 20 | 급여 고도화 |
| Phase 5 | WI-0099 ~ WI-0112 | 14 | 전자결재 & 전자계약 |
| Phase 6 | WI-0113 ~ WI-0135 | 23 | 사용자 UI |
| Phase 7 | WI-0136 ~ WI-0148 | 13 | 모바일 & 알림 |
| Phase 8 | WI-0149 ~ WI-0165+ | 17+ | 확장 기능 |
| **합계** | **WI-0001 ~ WI-0165+** | **165+** | |

---

## 8. 프로덕션 마일스톤

| 마일스톤 | 포함 Phase | Shiftee/Flex 대비 달성률 |
|----------|------------|------------------------|
| **M1: Backend Foundation** | Phase 1 완료 | ~15% |
| **M2: Core HR Backend** | Phase 1~3 완료 | ~30% |
| **M3: Full Backend** | Phase 1~5 완료 | ~50% |
| **M4: Web Launch** | Phase 1~6 완료 | ~70% |
| **M5: Mobile Launch** | Phase 1~7 완료 | ~85% |
| **M6: Full Product** | Phase 1~8 완료 | ~95%+ |

---

> **Note**: 이 로드맵은 현재 시점(2026-02-14) 기준이며, 각 Phase 착수 시 상세 스펙을 별도로 작성합니다.
> WI 번호는 예약이며, 구현 시 상세 work-item 문서가 생성됩니다.
