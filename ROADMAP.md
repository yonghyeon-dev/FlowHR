# FlowHR Production Roadmap

> **Last updated**: 2026-02-26
> **Current version**: 0.1.187 (Employee Core Journey Risk Filter + Workspace Decomposition + Scheduling Fairness Helper Extraction)
> **Target**: Production-grade Korean HR SaaS (Shiftee/Flex superior)

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
  - 테스트 스위트 운영: `docs/test-suites.md`
  - 상위호환 KPI 기준: `docs/competitive-scorecard.md`

## 1. 현재 상태 요약

### 완료 WI 목록 (WI-0001 ~ WI-0080)

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
| WI-0035 | employeeId String to FK Migration | 안정성 |
| WI-0036 | RBAC Engine Foundation | 안정성 |
| WI-0037 | Multi-Tenant Isolation Baseline (Supabase RLS) | 인프라 |
| WI-0038 | Phase2 Health 409 Gate Tuning | 운영 |
| WI-0039 | Discord Alert Korean | 운영 |
| WI-0040 | Scheduling Baseline (WorkSchedule API) | 핵심 비즈니스 |
| WI-0041 | Scheduling Overlap Guard (WorkSchedule) | 안정성 |
| WI-0042 | Scheduling Update API (WorkSchedule PATCH) | 핵심 비즈니스 |
| WI-0043 | Scheduling Delete API (WorkSchedule DELETE) | 핵심 비즈니스 |
| WI-0044 | Scheduling Template + Recurring Assignment Baseline | 핵심 비즈니스 |
| WI-0045 | Scheduling to Attendance Anomaly Report Baseline | 핵심 비즈니스 |
| WI-0046 | Scheduling Template Multi-Day Range Assignment Baseline | 핵심 비즈니스 |
| WI-0047 | Scheduling Rotation Assignment Baseline | 핵심 비즈니스 |
| WI-0048 | Attendance Capture Channel Metadata Baseline | 핵심 비즈니스 |
| WI-0049 | Attendance GPS Policy Enforcement Baseline | 핵심 비즈니스 |
| WI-0050 | Attendance Geofence Policy Enforcement Baseline | 핵심 비즈니스 |
| WI-0051 | Scheduling Anomaly Alert Automation Baseline | 핵심 비즈니스 |
| WI-0052 | Attendance Trusted Device Policy Baseline | 핵심 비즈니스 |
| WI-0053 | Attendance Multi-Site Geofence Policy Baseline | 핵심 비즈니스 |
| WI-0054 | Attendance Device Attestation Policy Baseline | 핵심 비즈니스 |
| WI-0055 | Scheduling Anomaly Escalation Policy Baseline | 핵심 비즈니스 |
| WI-0056 | Attendance Anti-Spoofing Policy Baseline | 핵심 비즈니스 |
| WI-0057 | Scheduling Rotation Balance Report Baseline | 핵심 비즈니스 |
| WI-0058 | Scheduling Rotation Optimization Baseline | 핵심 비즈니스 |
| WI-0059 | Scheduling Rotation Fairness Report Baseline | 핵심 비즈니스 |
| WI-0060 | Attendance Anti-Spoofing Signal Fusion Baseline | 핵심 비즈니스 |
| WI-0061 | Scheduling Fairness Write-Back Orchestration Baseline | 핵심 비즈니스 |
| WI-0062 | Attendance External Reputation Integration Baseline | 핵심 비즈니스 |
| WI-0063 | Scheduling Global Fairness Constraint Solver Baseline | 핵심 비즈니스 |
| WI-0064 | Attendance Multi-Provider Reputation Orchestration Baseline | 핵심 비즈니스 |
| WI-0065 | Scheduling Anomaly Cockpit Dashboard Baseline | 핵심 비즈니스 |
| WI-0066 | Attendance Reputation Circuit-Breaker Operations Baseline | 핵심 비즈니스 |
| WI-0067 | Scheduling Anomaly Cockpit Ticket Automation Baseline | 핵심 비즈니스 |
| WI-0068 | Scheduling Anomaly Cockpit Streaming Dashboard Baseline | 핵심 비즈니스 |
| WI-0069 | Scheduling Advanced Fairness Multi-Objective Optimizer | 핵심 비즈니스 |
| WI-0070 | Attendance Reputation Adaptive Routing/Auto-Heal Baseline | 핵심 비즈니스 |
| WI-0071 | Scheduling Anomaly Cockpit Ops Dashboard + Stream Incident Automation | 핵심 비즈니스 |
| WI-0072 | Scheduling Anomaly Incident Lifecycle Command API | 핵심 비즈니스 |
| WI-0073 | Scheduling Anomaly Incident Read-Model API | 핵심 비즈니스 |
| WI-0074 | Production Auth Smoke Stabilization and Incident Auto-Close | 운영 |
| WI-0075 | Scheduling Anomaly Incident Audit-Backed Durable Read-Model | 안정성 |
| WI-0076 | Scheduling Anomaly Incident SLA Monitoring API | 핵심 비즈니스 |
| WI-0077 | Scheduling Anomaly Incident Escalation Automation API | 운영 |
| WI-0078 | Scheduling Anomaly Incident Auto-Action Execution API | 운영 |
| WI-0079 | Scheduling Anomaly Incident Durable Store and Cooldown Persistence | 안정성 |
| WI-0080 | Scheduling Anomaly Incident Archive/Replay/Reconcile API | 운영 |

### 다음 우선순위 (Phase 2 진행)

- ✅ 균형 조정 우선순위(UI-first window) 완료:
  - 관리자 조치시간 단축 UI 재설계 + KPI baseline (WI-0081)
  - 직원 셀프서비스 90초 여정 UI baseline (WI-0082)
  - UI 핵심 여정 e2e + 회귀 차단 게이트 (WI-0083)
  - People 온보딩 UI(조직/직원) baseline (WI-0084)
  - UI 컨텍스트 지속성(테넌트/Actor ID) baseline (WI-0085)
  - 관리자 우선 큐 인라인 조치 UI baseline (WI-0086)
  - 근태 집계 UI baseline (WI-0087)
- 이후 백엔드 고도화:
  - 근무일정/교대/유연근무 고도화(고급 제약/선호 기반 fairness 최적화)
  - 출퇴근 정책 고도화(적응형 라우팅/자동복구 운영)
  - 실시간 근태 현황 고도화(incident 자동 조치 실행 워크플로 + 알림/운영 연동)

### 최근 반영됨 (main)

- WI-0088 SaaS UI 피벗: `/`, `/admin`, `/employee`, `/employee/payslips` 추가. ops 도구는 `/ops/*`로 격리하고 기본 UI에서 숨김.
- WI-0089 e2e 테스트 스위트 분리(MVP vs Full)로 SaaS 배송 속도 우선
- WI-0090 휴가 정책(조직 단위) 저장/조회 + 정산 기본값 적용 (정책 엔진 베이스라인)
- WI-0091 SaaS 방향성 재정렬 + 스테이징 빌드 안정성(lazy env init, ops UI 격리)
- WI-0092 SaaS Shell(사이드 네비) + `/login` 추가
- WI-0093 production 환경에서 Supabase Auth 세션 기반 Bearer 호출(fallback) 적용
- WI-0094 세션 메뉴(세션 상태/로그아웃) + identity 정리 + 홈 로그인 CTA
- WI-0095 근무 일정(Admin) UI baseline (생성/조회/삭제)
- WI-0096 초대/가입(Auth Invite) baseline (초대 링크 생성 + role/org/actor_id 클레임 세팅)
- WI-0097 관리자 승인 워크플로 UI 고도화 (다건 선택/일괄 승인/반려)
- WI-0098 직원 명세서 UX 고도화 (빠른 기간 선택, KPI, 상세 보기)
- WI-0099 명세서 공제 상세/CSV 다운로드 추가
- WI-0100 관리자 승인 처리 이력 타임라인 UX
- WI-0101 급여 KR 법정공제 baseline 모드 추가 (feature flag: `FLOWHR_PAYROLL_KR_BASELINE_V1`)
- WI-0102 People 도메인 Department/Position 모델 + API + 직원 배정 정합성 검증
- WI-0103 결재선/위임 정책 baseline (정책 API + 위임 API + 승인 게이트 연동 + `/admin/approval-policy` UI)
- WI-0104 휴가 반차/시간단위 정책 고도화 (fractional leave unit + 정책 게이트 + UI + e2e)
- WI-0105 급여 KR baseline 고도화 (누진세 구간 + 보험 상한 + 관리자 UI 법정공제 프리뷰)
- WI-0106 급여 KR baseline 2차 고도화 (세액공제 + 부양가족 공제 + 월경계 강제검증 옵션 + e2e)
- WI-0107 결재 위임 만료 자동화 (dry-run/apply API + Admin UI + e2e)
- WI-0108 결재 위임 만료 스케줄러 (멀티 조직 sweep runner + hourly workflow + incident/alert + e2e)
- WI-0109 전자결재 범용화 1차 (결재선 템플릿 API + 승인 게이트 연동 + `/admin/approval-templates` UI + e2e)
- WI-0110 급여 법정공제 골든 회귀 확장 (GC-007/GC-008 + golden/CI 검증기 확장)
- WI-0111 Auth 초대 delivery mode 확장 (`link`/`email`) + claims/audit 일관성 회귀 테스트 추가
- WI-0112 직원 명세서 회귀 확장 (statutory self-service own-confirmed gate + deduction breakdown 검증)
- WI-0113 결재선 템플릿 조건부 라우팅 baseline (PAYROLL gross-pay 조건 + 정책 폴백 게이트 + e2e)
- WI-0114 휴가 정책 제약 고도화 (`minNoticeDays`, `maxConsecutiveDays` + Admin UI + e2e)
- WI-0115 결재 게이트 프리뷰 API/UX (`/approval/policy/gate-preview` + `/admin/approval-templates` 프리뷰 패널 + e2e)
- WI-0116 결재 단계 이력 baseline (`ApprovalStageHistory` 모델 + `/approval/stage-history` API + `/admin/approval-history` UI + e2e)
- WI-0117 결재선 템플릿 다단계 모델 baseline (`approvalStages` payload + stage-1 게이트 호환 + e2e)
- WI-0118 결재 실행 상태머신 baseline (`ApprovalExecution`/`ApprovalExecutionActionLog` + `/approval/executions` API + 단계별 도메인 최종확정 제어 + e2e)
- WI-0119 결재 실행 가시성 UI baseline (`/admin/approval-executions` + 진행률/단계 로그 패널 + 관리자 네비게이션 연결)
- WI-0120 연차촉진/사내공지 프리뷰 baseline (`LeavePolicy` 연차촉진 필드 + `/leave/policy/promotion-preview` API + `/admin/leave-promotion` UI + e2e)
- WI-0121 결재 실행 우선순위/정체 큐 고도화 (`/approval/executions` sort/stalled filter + `/admin/approval-executions` 요약 KPI/빠른점프 + e2e)
- WI-0122 연차촉진 공지 발송 자동화 (`POST /leave/policy/promotion-notify` + Discord/Slack webhook 연동 + `/admin/leave-promotion` 드라이런/실발송 UX + e2e)
- WI-0123 결재 실행 정체 에스컬레이션 자동화 (`POST /approval/executions/escalate` + `/admin/approval-executions` 드라이런/실행 + 스케줄러 runner/workflow + e2e)
- WI-0124 연차촉진 공지 이메일 템플릿 채널 확장 (`deliveryChannel=email_template` + 템플릿 ID/수신자 메타데이터 + `/admin/leave-promotion` 채널 선택 UX + e2e)
- WI-0125 연차촉진 공지 발송 이력/재시도 모델 (`LeavePromotionDelivery`/`LeavePromotionDeliveryRecipient` + 이력 조회/상세/재시도 API + `/admin/leave-promotion` 이력/재시도 UX + e2e)
- WI-0126 방향 재정렬(UI-first): 연차촉진 화면 `/ops/leave-promotion` 격리 + `/employee` 휴가 캘린더/연차 사용률/출퇴근 정정 보조 UX + e2e
- WI-0127 직원 출퇴근 정정 UX 고도화(정정 대상 셀렉터/선택 기록 자동반영/메모 프리셋/입력 가드/근무시간 변화 프리뷰 + e2e)
- WI-0128 관리자 승인 큐 UX 고도화(큐 포커스 배지 + 큐 검색 + 큐별 정렬 + 모바일 반응형 재배치 + e2e)
- WI-0129 급여 명세서 서식/출력 UX 고도화(문서형 상세 패널 + 공제 항목 설명 + 인쇄/PDF 저장 + print 레이아웃 + e2e)
- WI-0130 관리자 조직도/인사 이력 UI 고도화(`GET /people/employees/{employeeId}/history` + `/admin/people` 트리뷰/비교/이력 카드 + e2e)
- WI-0131 직원 셀프서비스 2차 UX 고도화(휴가 캘린더 밀도 그리드 + 잔여 연차 시각화 + 모바일 빠른 입력/월 이동 + e2e)
- WI-0132 관리자 승인 큐 UX 2차 고도화(긴급/주의 알림 배지 + 검색 범위/긴급 필터 + 정체 우선 정렬 + 모바일 빠른 승인 액션 + e2e)
- WI-0133 직원 셀프서비스 3차 UX 고도화(요청 상태 피드백 카드 + 실패 원인 가시화 + 모바일 단축 흐름 + 네비 앵커 + e2e)
- WI-0134 급여 명세서 UX 2차 고도화(상태/오류 피드백 패널 + 명세 비교 조회 + 모바일 전달 흐름 + 사이드 네비 앵커 + e2e)
- WI-0135 관리자 조직도/인사 이력 UX 2차 고도화(부서/직급/최근변경 필터 + 변경 포인트 하이라이트 + 모바일 섹션 점프 + 사이드 네비 앵커 + e2e)
- WI-0136 직원 셀프서비스 UX 4차 고도화(요청 상태 필터 + 모바일 요청 이력 타임라인 + 제출 직전 검증 피드백 + 사이드 네비 앵커 + e2e)
- WI-0137 관리자 승인 큐 UX 3차 고도화(항목별 이력 요약 + 일괄 처리 직전 검증 피드백 + 모바일 승인 결과 피드백 + 사이드 네비 앵커 + e2e)
- WI-0138 직원 셀프서비스 UX 5차 고도화(근태/휴가 통합 요약 카드 + 요청 수정/재제출 흐름 + 모바일 상태 알림 배지 + 사이드 네비 앵커 + e2e)
- WI-0139 관리자 승인 큐 UX 4차 고도화(승인 근거 프리뷰 + 대기 SLA 타임라인 + 모바일 일괄 검토 시트 + 사이드 네비 앵커 + e2e)
- WI-0140 직원 셀프서비스 UX 6차 고도화(정정/휴가 제출 체크리스트 통합 + 요청 병목 피드백 + 모바일 제출 가이드 + 사이드 네비 앵커 + e2e)
- WI-0141 관리자 승인 큐 UX 5차 고도화(승인 근거 비교 카드 + SLA 임계치 알림 규칙 + 모바일 승인 체크리스트 + 사이드 네비 앵커 + e2e)
- WI-0142 직원 셀프서비스 UX 7차 고도화(요청 검색/정렬 + 승인 대기 예측 피드백 + 모바일 후속 액션 가이드 + 사이드 네비 앵커 + e2e)
- WI-0143 관리자 승인 큐 UX 6차 고도화(승인 대기 검색/정렬 + 승인 처리 예측 피드백 + 모바일 후속 액션 가이드 + 사이드 네비 앵커 + e2e)
- WI-0144 스테이징 CI 배포 안정화(스키마 초기화 후 enum bootstrap 추가로 `staging-prisma-integration` 마이그레이션 실패(P3018) 방지)
- WI-0145 급여 명세서 UX 3차 고도화(명세서 검색/정렬 + 지급 확정 예측 피드백 + 모바일 후속 액션 가이드 + 사이드 네비 앵커 + e2e)
- WI-0146 관리자 조직도/인사 이력 UX 3차 고도화(이력 검색/정렬 + 변경 위험 예측 피드백 + 모바일 후속 액션 가이드 + 사이드 네비 앵커 + e2e)
- WI-0147 직원 셀프서비스 UX 8차 고도화(요청 이력 정렬 정확도 + 승인 지연 위험 예측 피드백 + 모바일 후속 액션 추천 + 사이드 네비 앵커 + e2e)
- WI-0148 관리자 승인 큐 UX 7차 고도화(승인 이력 정렬 정확도 + 처리 지연 위험 예측 피드백 + 모바일 후속 액션 추천 + 사이드 네비 앵커 + e2e)
- WI-0149 급여 명세서 UX 4차 고도화(명세 이력 정렬 정확도 + 지급 지연 위험 예측 피드백 + 모바일 후속 액션 추천 + 사이드 네비 앵커 + e2e)
- WI-0150 관리자 조직도/인사 이력 UX 4차 고도화(이력 정렬 정확도 + 변경 지연 위험 예측 피드백 + 모바일 후속 액션 추천 + 사이드 네비 앵커 + e2e)
- WI-0151 직원 셀프서비스 UX 9차 고도화(요청 이력 정렬 정확도 보강 + 승인 지연 위험 대응 피드백 + 모바일 후속 액션 추천 고도화 + 사이드 네비 앵커 + e2e)
- WI-0152 관리자 승인 큐 UX 8차 고도화(승인 이력 정렬 정확도 보강 + 처리 지연 위험 대응 피드백 + 모바일 후속 액션 추천 고도화 + 사이드 네비 앵커 + e2e)
- WI-0153 급여 명세서 UX 5차 고도화(명세 이력 정렬 정확도 보강 + 지급 지연 위험 대응 피드백 + 모바일 후속 액션 추천 고도화 + 사이드 네비 앵커 + e2e)
- WI-0154 관리자 조직도/인사 이력 UX 5차 고도화(이력 정렬 정확도 보강 + 변경 지연 위험 대응 피드백 + 모바일 후속 액션 추천 고도화 + 사이드 네비 앵커 + e2e)
- WI-0155 직원 셀프서비스 UX 10차 고도화(요청 이력 정렬 정확도 보강 고도화 + 승인 지연 위험 대응 실행 가이드 + 모바일 후속 액션 추천 고도화 2차 + 사이드 네비 앵커 + e2e)
- WI-0156 관리자 승인 큐 UX 9차 고도화(승인 이력 정렬 정확도 보강 고도화 + 처리 지연 위험 대응 실행 가이드 + 모바일 후속 액션 추천 고도화 2차 + 사이드 네비 앵커 + e2e)
- WI-0157 급여 명세서 UX 6차 고도화(명세 이력 정렬 정확도 보강 고도화 + 지급 지연 위험 대응 실행 가이드 + 모바일 후속 액션 추천 고도화 2차 + 사이드 네비 앵커 + e2e)
- WI-0158 관리자 조직도/인사 이력 UX 6차 고도화(이력 정렬 정확도 보강 고도화 + 변경 지연 위험 대응 실행 가이드 + 모바일 후속 액션 추천 고도화 2차 + 사이드 네비 앵커 + e2e)
- WI-0159 직원 셀프서비스 UX 11차 고도화(요청 이력 정렬 정확도 보강+ 실행 카드 + 승인 지연 위험 대응 실행 추적 + 모바일 후속 액션 추천 고도화 3차 + 사이드 네비 앵커 + e2e)
- WI-0160 관리자 승인 큐 UX 10차 고도화(승인 이력 정렬 보강+ 실행 카드 + 처리 지연 위험 대응 실행 추적 + 모바일 후속 액션 추천 고도화 3차 + 사이드 네비 앵커 + e2e)
- WI-0161 급여 명세서 UX 7차 고도화(명세 이력 정렬 보강+ 실행 카드 + 지급 지연 위험 대응 실행 추적 + 모바일 후속 액션 추천 고도화 3차 + 사이드 네비 앵커 + e2e)
- WI-0162 관리자 조직도/인사 이력 UX 7차 고도화(이력 정렬 보강+ 실행 카드 + 변경 지연 위험 대응 실행 추적 + 모바일 후속 액션 추천 고도화 3차 + 사이드 네비 앵커 + e2e)
- WI-0163 직원 셀프서비스 UX 12차 고도화(출퇴근 정정 인사이트 + 잔여 연차 포캐스트 + 휴가 캘린더 인사이트 + 모바일/사이드 네비 점프 + e2e)
- WI-0164 관리자 승인 큐 UX 11차 고도화(승인 이력 실행 추적 + 승인 지연 실행 백로그 + 모바일 후속 액션 추천 고도화 4차 + 사이드 네비 앵커 + e2e)
- WI-0165 급여 명세서 UX 8차 고도화(명세 실행 요약 + 지연 실행 백로그 + 모바일 후속 액션 추천 고도화 4차 + 사이드 네비 앵커 + e2e)
- WI-0166 관리자 조직도/인사 이력 UX 8차 고도화(이력 실행 요약 + 변경 지연 실행 백로그 + 모바일 후속 액션 추천 고도화 4차 + 사이드 네비 앵커 + e2e)
- WI-0167 직원 셀프서비스 UX 13차 고도화(요청 실행 요약 + 승인 지연 실행 백로그 + 모바일 후속 액션 추천 고도화 4차 + 사이드 네비 앵커 + e2e)
- WI-0168 관리자 승인 큐 UX 12차 고도화(승인 이력 실행 요약 + 승인 지연 실행 백로그 다이제스트 + 모바일 후속 액션 추천 고도화 5차 + 사이드 네비 앵커 + e2e)
- WI-0169 급여 명세서 UX 9차 고도화(명세 실행 요약 다이제스트 + 지연 실행 백로그 다이제스트 + 모바일 후속 액션 추천 고도화 5차 + 사이드 네비 앵커 + e2e)
- WI-0170 관리자 조직도/인사 이력 UX 9차 고도화(이력 실행 요약 다이제스트 + 변경 지연 실행 백로그 다이제스트 + 모바일 후속 액션 추천 고도화 5차 + 사이드 네비 앵커 + e2e)
- WI-0171 직원 셀프서비스 UX 14차 고도화(요청 실행 요약 다이제스트 + 승인 지연 실행 백로그 다이제스트 + 모바일 후속 액션 추천 고도화 5차 + 사이드 네비 앵커 + e2e)
- WI-0172 관리자 승인 큐 UX 13차 고도화(승인 이력 실행 요약 다이제스트 + 승인 지연 실행 백로그 다이제스트 + 모바일 후속 액션 추천 고도화 6차 + 사이드 네비 앵커 + e2e)
- WI-0173 프론트엔드 모놀리스 가드레일(페이지 라인 예산 테스트 + e2e 선행 가드 + 분해 원칙 문서화)
- WI-0174 전자계약 Admin UX baseline(`/admin/contracts` 분리 라우트 + 템플릿 라이브러리/서명 준비도 카드 + 사이드 네비 앵커 + e2e)
- WI-0175 운영 정리(Production Auth Smoke teardown FK 정리 + payroll-phase2-health success 시 incident auto-close + e2e)
- WI-0176 직원 셀프서비스 블로트 정리(`src/app/employee/page.tsx` 반복 섹션 27개 제거 + `src/app/employee/layout.tsx` 코어 앵커 축소 + e2e/라인예산 갱신)
- WI-0177 관리자 대시보드 블로트 정리(`src/app/admin/page.tsx` 반복 섹션 31개 제거 + `src/app/admin/layout.tsx` 코어 앵커 축소 + e2e/라인예산 갱신)
- WI-0178 직원 명세서 블로트 정리(`src/app/employee/payslips/page.tsx` 반복 섹션 21개 제거 + `src/app/employee/layout.tsx` payslip 앵커 축소 + e2e/라인예산 갱신)
- WI-0179 관리자 인사 페이지 블로트 정리(`src/app/admin/people/page.tsx` 반복 섹션 22개 제거 + e2e 체인 정리 + 라인예산 갱신)
- WI-0180 `globals.css` 블로트 정리(phase-loop dead selector 대거 제거 + CSS 회귀 테스트 추가 + e2e 체인 반영)
- WI-0181 Deprecated WI/테스트 아카이브 정리(WI-0131~0143, WI-0145~0172 deprecated 마킹 + 관련 e2e no-op 아카이브 + active e2e 체인 제외)
- WI-0182 연차 자동 부여 엔진 baseline(`POST /leave/accrual/auto-grant` + `/admin/leave-accrual` 전용 라우트 + dry-run/apply 요약/상세 결과 + e2e/spec 갱신)
- WI-0183 휴가 캘린더 연동 baseline(`GET /leave/calendar` + `/admin/leave-calendar` 전용 라우트 + 부서 필터/중복 경고 임계치 + e2e/spec 갱신)
- WI-0184 급여 4대보험 정산 baseline(`POST /payroll/runs/preview-insurance-settlement` + `/admin/payroll-insurance` 전용 라우트 + 기여금/정산 delta 요약 + e2e/spec 갱신)
- WI-0185 급여 원천세 정산/마감 baseline(`POST /payroll/runs/close-period` + `/admin/payroll-close` 전용 라우트 + 확정 run 기준 마감 가능 여부/정산 delta 요약 + e2e/spec 갱신)
- WI-0186 급여 명세서 배포/수신 확인 baseline(`POST /payroll/payslips/distribute`, `POST /payroll/payslips/{runId}/acknowledge` + `/admin/payroll-payslip-delivery`, `/employee/payslip-receipts` 전용 라우트 + 배포/수신 확인 상태 추적 + e2e/spec 갱신)
- WI-0187 급여 연말정산/원천징수영수증 baseline(`POST /payroll/year-end/preview-settlement`, `POST /payroll/year-end/withholding-receipts` + `/admin/payroll-year-end`, `/employee/withholding-receipt` 전용 라우트 + 발급 선행조건 가드 + e2e/spec 갱신)
- WI-0188 급여 연말정산 공제항목 입력/재정산 baseline(`POST /payroll/year-end/recalculate-settlement` + `/admin/payroll-year-end` 공제항목 입력/재정산 UX + baseline 대비 세액/원천세 delta 요약 + e2e/spec 갱신)
- WI-0189 급여 연말정산 확정/신고 데이터 내보내기 baseline(`POST /payroll/year-end/finalize-settlement`, `POST /payroll/year-end/export-filing-data` + `/admin/payroll-year-end-filing` 전용 라우트 + 확정 선행조건/신고 익스포트 가드 + e2e/spec 갱신)
- WI-0190 급여 연말정산 신고 익스포트 포맷/검증 확장 baseline(`POST /payroll/year-end/export-filing-data` 다중 포맷 `json/csv/jsonl/hometax_csv` + `validationMode=basic/strict` + 아티팩트 체크섬/검증 요약 + `/admin/payroll-year-end-filing` UX 확장 + e2e/spec 갱신)
- WI-0191 급여 연말정산 신고 패키지 제출 추적/ACK baseline(`GET|POST /payroll/year-end/filing-submissions`, `POST /payroll/year-end/filing-submissions/{submissionId}/ack` + `/admin/payroll-year-end-filing` 제출/ACK/이력 패널 + audit/event 추적 + e2e/spec 갱신)
- WI-0192 급여 연말정산 신고 패키지 재제출/상태 전이 가드 baseline(`POST /payroll/year-end/filing-submissions/{submissionId}/resubmit` + pending/rejected/중복 재제출 전이 가드 + 시도횟수/원본 submission 연결 + `/admin/payroll-year-end-filing` 재제출 UX + e2e/spec 갱신)
- WI-0193 급여 연말정산 신고 패키지 제출 타임라인/증빙 메모 baseline(`GET /payroll/year-end/filing-submissions/{submissionId}/timeline`, `POST /payroll/year-end/filing-submissions/{submissionId}/evidence-note` + `/admin/payroll-year-end-filing` 타임라인/증빙 메모 UX + audit/event 추적 + e2e/spec 갱신)
- WI-0194 급여 연말정산 신고 패키지 ACK 코드 사전/거절 사유 카탈로그 baseline(`GET /payroll/year-end/filing-ack-catalog` + `POST /payroll/year-end/filing-submissions/{submissionId}/ack` 카탈로그 유효성 가드 + `/admin/payroll-year-end-filing` ACK 코드/거절 사유 선택 UX + e2e/spec 갱신)
- WI-0195 급여 연말정산 신고 패키지 제출 취소/재오픈 가드 baseline(`POST /payroll/year-end/filing-submissions/{submissionId}/cancel`, `POST /payroll/year-end/filing-submissions/{submissionId}/reopen` + canceled 상태 전이 가드 + ack 차단 + `/admin/payroll-year-end-filing` 취소/재오픈 UX + e2e/spec 갱신)
- WI-0196 급여 연말정산 신고 패키지 상태 요약/필터 UX baseline(`GET /payroll/year-end/filing-submissions` 필터(status/ackStatus/validationStatus/transport) + summary 카운터 응답 + `/admin/payroll-year-end-filing` 필터/KPI 요약 UX + e2e/spec 갱신)
- WI-0197 급여 연말정산 신고 패키지 검색/정렬/빠른 액션 UX baseline(`GET /payroll/year-end/filing-submissions` 검색/정렬(search/sortBy/sortDirection) + `/admin/payroll-year-end-filing` 검색/정렬 선택 + 행 단위 quick action(ack/cancel/reopen/resubmit) + e2e/spec 갱신)
- WI-0198 급여 연말정산 신고 패키지 운영 대시보드 분리 baseline(`GET /admin/payroll-year-end-filing/ops` 전용 라우트 + 상태/증빙 요약 카드 + 리스트/타임라인 기반 증빙 커버리지 스캔 + 기존 실행 콘솔 분리 + e2e/spec 갱신)
- WI-0199 급여 연말정산 신고 패키지 운영 대시보드 드릴다운/경고 규칙 baseline(`/admin/payroll-year-end-filing/ops` 드릴다운 모드(pending/rejected/validation/evidence-gap/timeline-failure) + 임계치 기반 alert severity(WATCH/CRITICAL) + 필터 프리셋 연동 + e2e/spec 갱신)
- WI-0200 브라우저 로케일 기반 UI 언어 동적 적용 baseline(`Accept-Language` 기반 locale 결정 + `html lang` 동적 반영 + `/`, `/login`, `/admin`/`/employee` shell/`SessionMenu` i18n + e2e 갱신)
- WI-0201 연말정산 신고 운영 대시보드 알림 대응 가이드/소유자 할당 baseline(`/admin/payroll-year-end-filing/ops` 지표별 대응 액션(watch/critical) + 에스컬레이션 경로 + owner(role/actor) 할당 + 드릴다운 점프 + e2e 갱신)
- WI-0202 연말정산 신고 운영 알림 실행 체크리스트/완료 추적 baseline(`/admin/payroll-year-end-filing/ops/checklist` 전용 라우트 + 지표별 실행 체크리스트 + 완료율/완료시각 추적 + ops 대시보드 연동 링크 + e2e 갱신)
- WI-0203 연말정산 신고 운영 체크리스트 실행 로그/검토 루프 baseline(`/admin/payroll-year-end-filing/ops/checklist/review` 전용 라우트 + 실행 로그(done/blocked/follow_up) + required 기준 stage(execute/review/close) 요약 + 체크리스트 연동 링크 + e2e 갱신)
- WI-0204 연말정산 신고 운영 체크리스트 회고 코멘트/검토 승인 스냅샷 baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot` 전용 라우트 + retrospective 코멘트 + role별 승인결정(pending/approved/rework) + ready-to-close 스냅샷 요약 + e2e 갱신)
- WI-0205 연말정산 신고 운영 검토 인수인계/익스포트 스냅샷 baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff` 전용 라우트 + handoff packet(from/to role, note, escalation, dueAt) + export snapshot(format/validation/checksum/artifact) + close-ready 요약 + e2e 갱신)
- WI-0206 연말정산 신고 운영 close-off 패키지/감사 서명 baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off` 전용 라우트 + audit sign-off grid(pending/signed/rejected) + archive package(bundle id, note) + ready-to-archive blocker 요약 + e2e 갱신)
- WI-0207 연말정산 신고 운영 close-off 승인 라우팅/전달 서명 번들 baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature` 전용 라우트 + approval routing stage(status/owner/eta) + delivery signature channel(status/signer/reference) + ready-to-deliver blocker 요약 + e2e 갱신)
- WI-0208 연말정산 신고 운영 전달 패키지 lock/final handover baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock` 전용 라우트 + package lock state(draft/locked/released) + final handover status(pending/sent/ack) + completion blocker 요약 + e2e 갱신)
- WI-0209 연말정산 신고 운영 completion receipt/archive digest baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt` 전용 라우트 + completion receipt status(pending/issued/verified) + archive digest channel state(pending/prepared/sealed) + archive digest readiness blocker 요약 + e2e 갱신)
- WI-0210 연말정산 신고 운영 completion close report baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report` 전용 라우트 + close report status(pending/drafted/published) + publication channel state(pending/queued/published) + final close blocker 요약 + e2e 갱신)
- WI-0211 연말정산 신고 운영 close report distribution sign-off baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff` 전용 라우트 + distribution channel state(pending/distributed/confirmed) + role sign-off state(pending/signed/rejected) + distribution sign-off blocker 요약 + e2e 갱신)
- WI-0212 연말정산 신고 운영 distribution sign-off closure packet baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet` 전용 라우트 + closure packet status(pending/assembled/sealed) + closure packet dispatch state(pending/prepared/released) + closure packet readiness blocker 요약 + e2e 갱신)
- WI-0213 연말정산 신고 운영 closure packet release digest baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest` 전용 라우트 + release digest status(pending/compiled/published) + release digest channel state(pending/queued/delivered) + release digest readiness blocker 요약 + e2e 갱신)
- WI-0214 연말정산 신고 운영 release digest acknowledgment ledger baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger` 전용 라우트 + acknowledgment ledger status(pending/logged/verified) + ack channel state(pending/acknowledged/reconciled) + acknowledgment readiness blocker 요약 + e2e 갱신)
- WI-0215 연말정산 신고 운영 ack ledger exception log baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger/exception-log` 전용 라우트 + exception log status(pending/recorded/closed) + exception category state(open/investigating/resolved) + exception closure blocker 요약 + e2e 갱신)
- WI-0216 연말정산 신고 운영 ack ledger exception closure receipt baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger/exception-log/closure-receipt` 전용 라우트 + exception closure receipt status(pending/issued/verified) + exception closure channel state(pending/sent/acknowledged) + exception closure receipt blocker 요약 + e2e 갱신)
- WI-0217 연말정산 신고 운영 플랫 워크플로우 라우트/컨텍스트 baseline(`GET /admin/payroll-year-end-filing/ops/[step]` 동적 스텝 라우트(alert/checklist-flow/review/close-off/delivery/archive/report) + `FilingWorkflowContext` 기반 공통 상태(currentStep/gates/metadata/actionLog) + 공통 컴포넌트(`FilingDashboard`,`FilingStepPanel`,`FilingGateCard`,`FilingActionLog`,`FilingExportBundle`) + Admin 플랫 네비 + e2e 갱신)
- WI-0218 연말정산 신고 운영 컴포넌트 통합/레거시 정리 baseline(`/admin/payroll-year-end-filing/ops`→`/ops/alert` 리다이렉트 + `/ops/checklist/**` 딥 라우트 제거 + `PayrollYearEndFilingOps*`/`filing-alert-*` 컴포넌트군 제거 + WI-0198~0199, WI-0201~0216 아카이브 no-op + WI-0218 회귀 테스트 추가)
- WI-0219 핵심 여정 IA 단순화 + 승인 큐 컴포넌트 분리 baseline(`src/app/admin/page.tsx` 승인 큐 패널을 `src/components/admin-approval/*`로 분리 + dead bulk-selection 로직 정리 + `src/app/employee/page.tsx` 핵심 여정 바로가기(`EmployeeJourneyShortcutPanel`) 추가 + WI-0219 회귀 테스트 추가)
- WI-0220 급여 엔진 KR 정밀 계산 착수 baseline(`POST /payroll/runs/preview-with-deductions` `statutory_kr_baseline`에 `incomeTaxLookupTable`(간이세액표 룩업) + `insuranceRounding`(4대보험 항목별 단위/모드 라운딩) 추가 + payroll spec/rfc 갱신 + WI-0220 회귀 테스트 추가)
- WI-0221 급여 엔진 KR 세액표 운영 데이터셋/검증 가드 baseline(`statutory_kr_baseline`에 `incomeTaxLookupPresetId` 프리셋 입력 추가 + `incomeTaxBrackets`/`incomeTaxLookupTable`/`incomeTaxLookupPresetId` 상호배타 가드 + 룩업 테이블 단조 세액 검증 + WI-0221 회귀 테스트 추가)
- WI-0222 급여 관리자 프리뷰 KR 세액표 프리셋 선택/가이드 UX baseline(`src/components/payroll/PayrollKrPresetGuidePanel.tsx` 신규 + `/admin` 법정공제 프리뷰 preset selector/payload 연동 + locale-aware(`ko`/`en`) 가이드 문구 + WI-0222 회귀 테스트 추가)
- WI-0223 급여 엔진 KR 과세/비과세 분리 검증 baseline(`statutory_kr_baseline`에 선택 입력 `taxableIncomeKrw` 추가 + `nonTaxableIncomeKrw <= grossPayKrw`, `taxable + nonTaxable = gross` 가드 + `incomeSplitKrw` breakdown + `/admin` 과세소득 입력 연동 + WI-0223 회귀 테스트 추가)
- WI-0224 급여 엔진 KR 과세/비과세 항목 코드/카테고리 입력 baseline(`taxableIncomeItems`/`nonTaxableIncomeItems` 입력 추가 + 항목 코드 중복/항목합계 정합성 가드 + `incomeSplitItems` breakdown + `/admin` 항목 코드/카테고리/금액 입력 연동 + WI-0224 회귀 테스트 추가)
- WI-0225 급여 엔진 KR 과세/비과세 항목 프리셋 데이터셋 baseline(`incomeSplitItemPresetId` 입력 추가 + 지원 preset 검증 + preset/manual item 상호배타 가드 + preset 기반 항목 자동 구성 + `/admin` 항목 프리셋 selector/수동입력 비활성화 + WI-0225 회귀 테스트 추가)
- WI-0226 급여 관리자 KR 과세/비과세 다중 항목 입력 테이블 UX baseline(`/admin` 법정공제 프리뷰에서 과세/비과세 항목 다중 행(add/remove) 입력 지원 + 빈 행 제외 payload 변환 + preset 선택 시 수동 테이블 비활성화 + WI-0226 회귀 테스트 추가)
- WI-0227 급여 관리자 KR 항목 코드 사전 autocomplete UX baseline(`kr-income-split-item-code-dictionary` 추가 + `/admin` 다중 항목 테이블 코드 입력에 datalist 기반 autocomplete + 코드 선택 시 카테고리 자동 채움 + WI-0227 회귀 테스트 추가)
- WI-0228 급여 엔진 KR 항목 코드 사전 서버 검증 가드 baseline(`statutory_kr_baseline` 수동 항목 입력에서 과세/비과세 kind별 코드 사전 검증 + 코드-카테고리 불일치 차단 + 통과 항목 코드/카테고리 canonical 정규화 + WI-0228 회귀 테스트 추가)
- WI-0229 급여 관리자 KR 프리셋/수동 입력 정합성 UX 가이드 baseline(`PayrollKrIncomeSplitConsistencyGuidePanel` 추가 + 수동 행 partial/duplicate/사전불일치 요약 + 프리셋 모드 수동행 무시/초기화 가이드 + `/admin` 제출 전 client preflight 가드 + WI-0229 회귀 테스트 추가)
- WI-0230 급여 관리자 KR 프리셋 모드 샘플 payload 프리뷰 baseline(`PayrollKrIncomeSplitPresetPayloadPreviewPanel` 추가 + `incomeSplitItemPresetId` 선택 시 요청 payload shape/서버 템플릿 적용 샘플 표시 + API 계약 변경 없이 안내 강화 + WI-0230 회귀 테스트 추가)
- WI-0231 급여 관리자 KR 프리셋 모드 샘플 payload 복사/공유 UX baseline(`PayrollKrIncomeSplitPresetPayloadPreviewPanel` copy/share 액션 추가 + 요청/템플릿/통합 프리뷰 복사 + Web Share API/클립보드 fallback + `/admin#payroll` replay href 포함 + WI-0231 회귀 테스트 추가)
- WI-0232 급여 관리자 KR 프리셋 모드 공유 링크 입력 자동 반영 UX baseline(`parsePayrollKrPresetShareContext` 추가 + `/admin` 쿼리(`incomeSplitItemPresetId`/`taxableIncomeKrw`/`nonTaxableIncomeKrw`) 자동 반영 + 유효값 존재 시 `statutory_kr_baseline` 자동 전환 + WI-0232 회귀 테스트 추가)
- WI-0233 급여 관리자 KR 프리셋 공유 링크 유효성 힌트/오류 피드백 UX baseline(`PayrollKrPresetShareLinkFeedbackPanel` 추가 + 적용값/무시된 invalid 쿼리값 요약 표시 + parser resolution(`query`/`invalid`) 확장 + WI-0233 회귀 테스트 추가)
- WI-0234 급여 관리자 KR 프리셋 공유 링크 초기화/재적용 UX baseline(`PayrollKrPresetShareLinkFeedbackPanel` reset/reapply 액션 추가 + `/admin` 공유값 초기화/현재 쿼리 재적용 핸들러 연결 + API 계약 변경 없음 + WI-0234 회귀 테스트 추가)
- WI-0235 관리자 KPI 대시보드 baseline(`src/app/admin/kpi` 신규 라우트 + `/api/approval/executions`/`/api/attendance/aggregates`/`/api/leave/requests`/`/api/payroll/runs` 기반 KPI 카드/이전 기간 비교 + API 로그 패널 + locale-aware copy + 컴포넌트 300줄 제한 분리 + WI-0235 회귀 테스트 추가)
- WI-0236 관리자 실시간 근태 현황 baseline(`src/app/admin/attendance-live` 신규 라우트 + `/api/people/employees`/`/api/people/departments`/`/api/scheduling/schedules`/`/api/attendance/records` 기반 출근/지각/미출근 스냅샷 + 부서/상태/검색 필터 + 경고 배지 + 컴포넌트 분리 + WI-0236 회귀 테스트 추가)
- WI-0237 관리자 온보딩 마법사 baseline(`src/app/admin/onboarding` 신규 라우트 + 조직 컨텍스트/부서·직원 일괄 등록/휴가 정책 기본값 적용 흐름 + 온보딩 체크리스트/진척도 + locale-aware copy + 컴포넌트/유틸 분리 + WI-0237 회귀 테스트 추가)
- WI-0238 직원 인앱 가이드 baseline(`src/app/employee/guide` 신규 라우트 + 최근 14일 근태/휴가/명세 활동 기반 체크리스트 + 빠른 이동 링크/권장 경로 + locale-aware copy + 컴포넌트/훅/체크리스트 분리 + WI-0238 회귀 테스트 추가)
- WI-0239 반응형 모바일 웹 UX baseline(`SaasMobileMenu` 공통 컴포넌트 추가 + Admin/Employee 레이아웃 모바일 토글 메뉴 적용 + `globals.css` 모바일 shell/action 반응형 정리 + `shell.mobileMenu` i18n + WI-0239 회귀 테스트 추가)
- WI-0240 모바일 앱 Shell baseline(`apps/mobile` Expo 스캐폴드 + 로그인 컨텍스트/세션 저장 + Admin/Employee 홈 셸 + 공통 API 클라이언트 + WI-0240 회귀 테스트 추가)
- WI-0241 모바일 푸시 알림 baseline(`apps/mobile` 푸시 권한/토큰 bootstrap + 알림 선호 저장 + 알림 센터 셸 + Admin/Employee 진입 액션 + WI-0241 회귀 테스트 추가)
- WI-0242 모바일 이메일 템플릿 엔진 baseline(`apps/mobile` 거래성 템플릿 카탈로그/치환 렌더러 + locale(`ko`/`en`) 프리뷰 + Admin 템플릿 화면/히스토리 저장 + WI-0242 회귀 테스트 추가)
- WI-0243 인앱 알림 센터 실시간 업데이트 baseline(`apps/mobile` 알림 피드 helper + 30초 polling + 수동 새로고침/라이브 토글 + 카테고리 필터/미확인 카운트 + WI-0243 회귀 테스트 추가)
- WI-0244 모바일 알림 히스토리 검색/보관 baseline(`apps/mobile` 알림 히스토리 helper + 검색/카테고리/읽음/보관 필터 + 보관/복원 액션 + `NotificationHistory` 전용 화면/라우팅 + WI-0244 회귀 테스트 추가)
- WI-0245 모바일 알림 히스토리 일괄 액션 baseline(`apps/mobile` 알림 히스토리 다건 선택 + select-visible/clear-selection + mark-read/archive/unarchive bulk 액션 + WI-0245 회귀 테스트 추가)
- WI-0246 모바일 알림 히스토리 빠른 프리셋 필터 baseline(`apps/mobile` 프리셋 필터 카탈로그(`allOpen`/`approvalUnread`/`resultUnread`/`payslipUnread`/`archived`) + 프리셋별 카운트 + active/custom 프리셋 상태 + WI-0246 회귀 테스트 추가)
- WI-0247 모바일 알림 히스토리 프리셋 고정/최근사용 baseline(`apps/mobile` 프리셋 pin/unpin + recent 프리셋 추적 + `notificationStore` preset-state 영속화 + `Pinned/Recent presets` 섹션 + WI-0247 회귀 테스트 추가)
- WI-0248 모바일 알림 히스토리 프리셋 가져오기/내보내기 baseline(`apps/mobile` 프리셋 transfer payload(`type/version/state`) 직렬화/파서 + `NotificationPresetTransferCard` 내보내기/가져오기 UI + 프리셋 상태 import 적용 + WI-0248 회귀 테스트 추가)
- WI-0249 모바일 관리자 승인 대기 큐 baseline(`apps/mobile` `ApprovalQueueScreen` 신규 + 승인 대기 검색/상태·우선순위 필터/정렬 + approve/reject quick action + `approvalQueueStore` 영속화 + Admin 홈 진입 연결 + WI-0249 회귀 테스트 추가)
- WI-0250 모바일 직원 셀프서비스 요청 제출 baseline(`apps/mobile` `EmployeeRequestSubmitScreen` 신규 + 출퇴근 정정/휴가 요청 submit form + 입력 검증/로컬 영속화 + Employee 홈 빠른 진입 연결 + WI-0250 회귀 테스트 추가)
- WI-0251 모바일 직원 요청 이력/상태 추적 baseline(`apps/mobile` `EmployeeRequestHistoryScreen` 신규 + 요청 이력 검색/요청유형·상태 필터/정렬 + 상태 전환 타임라인 추적 + `EmployeeRequestSubmit`/Employee 홈 이력 진입 연결 + WI-0251 회귀 테스트 추가)
- WI-0252 모바일 직원 요청 알림/후속 액션 baseline(`apps/mobile` `EmployeeRequestFollowUpScreen` 신규 + 상태 기반 follow-up 알림 인박스 + 심각도/상태 필터·우선순위 정렬 + 후속 quick action(검토 이동/승인/반려/재검토) + 요청 이력/제출 화면 연동 + WI-0252 회귀 테스트 추가)
- WI-0253 모바일 직원 요청 후속 템플릿/자동 추천 baseline(`apps/mobile` follow-up template catalog(`triage/decision/recovery/closure`) + 템플릿 자동 추천 helper + `EmployeeRequestFollowUpScreen` 추천 템플릿 섹션/권장 액션 즉시 적용 + WI-0253 회귀 테스트 추가)
- WI-0254 모바일 직원 요청 후속 액션 번들/저장 preset baseline(`apps/mobile` follow-up bundle preset catalog(`allActionRequired/triageQueue/decisionQueue/recoveryQueue`) + pinned/recent preset state 로컬 저장 + `EmployeeRequestFollowUpScreen` preset 적용/빠른 실행/핀 토글 + WI-0254 회귀 테스트 추가)
- WI-0255 모바일 직원 요청 후속 preset 가져오기/내보내기 baseline(`apps/mobile` follow-up preset transfer payload(`type/version/state`) 직렬화/파서 + `EmployeeRequestFollowUpPresetTransferCard` import/export UI + preset import 즉시 적용 + WI-0255 회귀 테스트 추가)
- WI-0256 모바일 분석 대시보드 baseline(`apps/mobile` `mobileAnalytics` helper(기간 필터/KPI snapshot/일별 trend/export payload) + `MobileAnalyticsDashboardScreen` 신규 + 관리자/직원 홈 대시보드 진입 + WI-0256 회귀 테스트 추가)
- WI-0257 모바일 분석 대시보드 공유/필터 preset baseline(`apps/mobile` analytics filter preset catalog(`allActionRequired/approvalRisk/requestFlow/notificationPulse`) + pin/recent preset 저장 + preset transfer payload import/export + `MobileAnalyticsFilterPresetCard` + `MobileAnalyticsDashboardScreen` focus 필터 연동 + WI-0257 회귀 테스트 추가)
- WI-0258 모바일 적층 정리 baseline(`docs/codex-guide.md` 세션 강제 참조 + 모바일 알림 히스토리의 프리셋 pin/recent/import-export 제거 + 모바일 요청 follow-up의 템플릿/번들 프리셋/import-export 제거 + 화면/스토어 단순화 + WI-0258 회귀 테스트 추가)
- WI-0259 급여 4대보험 정산 라운딩 정확도 보강 baseline(`POST /payroll/runs/preview-insurance-settlement`에 `settlement.insuranceRounding`(mode + NP/HI/LTC/EI/IA 단위) 추가 + 라운딩/원시(raw) 기여금 trace 응답 추가 + `/admin/payroll-insurance` 입력/결과 패널 연동 + payroll spec/contract 1.39.0 갱신 + WI-0259 회귀 테스트 추가)

### 진행 중

- 다음: 급여 핵심 병목 지속 — 연말정산(소득공제/세액공제) 정확도 보강(`WI-F`) 착수 (WI-0260 예정)

### 현재 아키텍처

| 항목 | 현재 상태 | 프로덕션 요구 |
|------|-----------|---------------|
| DB 모델 | 17개 (Department/Position + ApprovalPolicy/ApprovalDelegation 포함; employeeId FK/RLS baseline 적용) | 25~30개 |
| API 엔드포인트 | ~47개 | 100+ |
| 인증 | Supabase JWT + 헤더 폴백 + RBAC(permission) | RBAC 엔진 + 테넌트 격리 |
| 역할 | 5개 역할 + permission mapping(seed) | 동적 역할 + 커스텀 권한 |
| 급여 계산 | phase2 수동/프로필 + KR baseline 근사 | 한국 세법 + 4대보험 |
| UI | 관리자 대시보드(`/admin`) + 결재 정책(`/admin/approval-policy`) + 직원 포털(`/employee`) + 명세서(`/employee/payslips`) + 홈(`/`) | 관리자/직원 여정 완성 + 결재/정책/명세서 고도화 |
| 모바일 | ⚠️ `apps/mobile` 셸 + 푸시 + 이메일 템플릿 + 알림센터 실시간 업데이트 + 히스토리 검색/보관/일괄 액션 + 관리자 승인 대기 큐 + 직원 요청 제출 + 요청 이력/상태 추적 + 요청 알림/후속 액션 + 모바일 분석 대시보드 + 분석 대시보드 공유/필터 preset baseline + 모바일 적층 정리 baseline (WI-0258) | 네이티브 앱 (iOS/Android) |
| 멀티테넌트 | baseline 적용 (Supabase RLS + FLOWHR_TENANCY_V1 플래그) | 조직별 완전 격리 |

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

Employee/Organization 마스터는 WI-0034로 도입했고, WI-0035에서 핵심 도메인 테이블에
`Employee` FK를 도입하여 **참조 무결성 부재**를 해소했습니다.

```
현재: AttendanceRecord.employeeId → Employee FK (도입 완료)
     LeaveRequest.employeeId     → Employee FK (도입 완료)
     PayrollRun.employeeId       → Employee FK (nullable; 도입 완료)
```

이로 인해:
- 존재하지 않는 employeeId로 근태/휴가/급여 생성 가능 (데이터 무결성 위반)
- 직원 퇴사/부서이동 시 연쇄 처리 불가
- 멀티테넌트 격리 시 테넌트별 직원 범위 설정 불가

**로드맵 반영**: employeeId FK 마이그레이션(WI-0035) 완료. 다음은 테넌트 격리(WI-0037).

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

**로드맵 반영**: RBAC 엔진 도입 완료(WI-0036). 이후 Phase 4에서 급여 규칙 엔진화 WI를 별도 발행하여 진행.

### 개선 우선순위 요약

```
긴급 ┌─────────────────────────────────────────────┐
     │ 1. Employee/Organization 모델 (완료: WI-0034) │ ← 기초 확보
     │ 2. employeeId FK 마이그레이션 (완료: WI-0035) │ ← 무결성 부재 해소
     │ 3. RBAC 엔진 (완료: WI-0036)                  │ ← 하드코딩 제거
     │ 4. 멀티테넌트 RLS (완료: WI-0037)              │ ← SaaS 기반
     ├─────────────────────────────────────────────┤
높음  │ 5. 근무일정 & 출퇴근 고도화 (Phase 2)         │ ← 핵심 기능 확장
     │ 6. 급여 엔진 고도화 (Phase 4)                 │ ← 세법 미적용
     ├─────────────────────────────────────────────┤
중간  │ 7. SaaS UI 런칭 품질 (Phase 6)                │ ← UI 베이스라인은 이미 main에 존재(WI-0088). Phase 6에서 '런칭 품질'로 확장
     │ 8. 모바일 앱 (Phase 7)                        │ ← 채널 부재
     ├─────────────────────────────────────────────┤
낮음  │ 9. 확장 기능 (Phase 8)                       │ ← 부가 모듈
     └─────────────────────────────────────────────┘
```

---

## 3. 프로덕션급 기준 (Shiftee/Flex 상위호환 벤치마크)

### 기능 모듈 매핑

| 모듈 | Shiftee | Flex | FlowHR 현재 | Gap |
|------|---------|------|-------------|-----|
| **인사 마스터** | ✅ 직원/부서/직급/조직도 | ✅ 직원/조직/이력관리 | ⚠️ Organization/Employee 기본 CRUD(WI-0034) + RBAC baseline(WI-0036); Department/Position 미도입 | High |
| **멀티테넌트** | ✅ 회사별 격리 | ✅ 워크스페이스 격리 | ⚠️ baseline 적용(Supabase RLS + `FLOWHR_TENANCY_V1`, WI-0037) | Critical |
| **근무일정** | ✅ 교대근무/유연근무 | ✅ 시차출근/재택 | ⚠️ WorkSchedule CRUD + template 단건/다건 + rotation assign/balance/optimize/fairness/fairness-apply + global fairness constraints baseline(WI-0040~0047, WI-0057, WI-0058, WI-0059, WI-0061, WI-0063); 고급 선호/법규 멀티목적 최적화 미도입 | Medium |
| **출퇴근** | ✅ GPS/비콘/키오스크 | ✅ GPS/Wi-Fi/QR | ⚠️ 채널 메타데이터 + GPS/지오펜스/다중 사업장/디바이스 allowlist/attestation/anti-spoofing + signal fusion + dynamic reputation + multi-provider + circuit-breaker baseline(WI-0048~0056, WI-0060, WI-0062, WI-0064, WI-0066) 완료, 적응형 라우팅/자동복구 운영 미도입 | Medium |
| **근태 집계** | ✅ 자동 집계/이상 감지 | ✅ 실시간 대시보드 | ⚠️ 집계 조회 API(WI-0031) + anomaly 리포트/알림/에스컬레이션 + cockpit/ticket/stream + ops dashboard/incident stream automation + incident lifecycle command/read-model baseline(WI-0045, WI-0051, WI-0055, WI-0065, WI-0067, WI-0068, WI-0071, WI-0072, WI-0073); durable incident store/SLA 자동화 미도입 | Medium |
| **휴가 관리** | ✅ 정책 엔진/잔여일 자동계산 | ✅ 자동 부여/소진 추적 | ⚠️ 휴가 요청/승인/취소 + 잔액/정산 baseline(WI-0002/0003) + 조직 정책 baseline(WI-0090). 시간단위/반차/연차촉진/캘린더 연동 미도입 | Medium |
| **급여 계산** | ✅ 한국 세법/4대보험/연말정산 | ✅ 급여 시뮬레이션/명세서 | ⚠️ 단순 비율 | Critical |
| **전자결재** | ✅ 결재선/양식/위임 | ✅ 승인 워크플로 | ⚠️ 도메인별 승인(출퇴근/휴가/급여 확정) baseline 존재. 범용 결재선/위임/양식/전자서명은 미도입 | High |
| **전자계약** | ✅ 근로계약/전자서명 | ✅ 계약 관리 | ❌ 없음 | Medium |
| **관리자 대시보드** | ✅ 웹 SPA | ✅ 웹 SPA | ⚠️ `/admin` SaaS 대시보드 baseline + ops 콘솔은 `/ops/*`로 격리(기본 숨김) | Critical |
| **직원 셀프서비스** | ✅ 웹 포탈 | ✅ 웹 포탈 | ⚠️ `/employee` baseline + `/employee/payslips` (확정 급여 조회) | Critical |
| **모바일 앱** | ✅ iOS/Android | ✅ iOS/Android | ❌ 없음 | High |
| **알림** | ✅ 푸시/이메일/Slack | ✅ 푸시/Slack/Teams | ⚠️ 웹훅 + 부분 이메일(초대/연차촉진) | Medium |
| **채용 관리** | ✅ ATS | ⚠️ 기본 | ❌ 없음 | Low |
| **성과 평가** | ✅ MBO/OKR | ✅ 리뷰 시스템 | ❌ 없음 | Low |
| **경비 관리** | ⚠️ 기본 | ✅ 경비 청구/정산 | ❌ 없음 | Low |
| **교육 관리** | ⚠️ 기본 | ⚠️ 기본 | ❌ 없음 | Low |
| **분석/리포트** | ✅ 대시보드/엑셀 | ✅ 커스텀 리포트 | ❌ 없음 | Medium |

### 상위호환 승리 조건 (운영 KPI)

| 영역 | 승리 기준 (FlowHR 목표) |
|------|--------------------------|
| 관리자 운영 속도 | 근태 이슈 인지→조치 완료 median 3분 이내 |
| 직원 셀프서비스 속도 | 출퇴근 정정/휴가 신청 median 90초 이내 |
| 급여 정확성 | 골든 케이스 100% 일치 + 릴리즈 후 계산 결함 0건 목표 |
| 변경 안정성 | main 병합 후 rollback 비율 2% 미만 |
| 장애 대응 | P1 incident MTTR 30분 이내 |

### 현재 달성률 추정: ~10-12%

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
Phase 6: Web UI Launch Quality (journeys, onboarding, approvals UX)
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
- UI는 Phase 2부터 병렬로 진행하며, Phase 6에서 '런칭 품질' 수준으로 고도화

---

## 5. Phase 상세

### Phase 1: Production Foundation (완료)

**목표**: 1인 운영에서도 안전하게 확장할 수 있도록 인사 마스터/무결성/권한/테넌트 기반을 먼저 고정합니다.

| WI | 상태 | 요약 |
|----|------|------|
| WI-0033 | Done | 로드맵/실행계획 정합 + Phase 1 WI 시드 |
| WI-0034 | Done | People 도메인(Organization/Employee) + API + Prisma 모델 |
| WI-0035 | Done | 기존 `employeeId: string` → `Employee` FK 마이그레이션 |
| WI-0036 | Done | RBAC 엔진 도입(하드코딩 역할 제거) |
| WI-0037 | Done | 멀티테넌트 격리 baseline (Supabase RLS) |

운영 안정성(상시):

| WI | 상태 | 요약 |
|----|------|------|
| WI-0038 | Done | phase2-health 409 게이트 튜닝(false incident 감소) |

**완료 기준 (DoD)**:
- [x] `Employee`를 참조하는 핵심 도메인 테이블이 FK로 무결성을 보장
- [x] 하드코딩 역할 체크가 RBAC 엔진으로 전환
- [x] 최소 멀티테넌트 격리(앱 레벨 스코프 + RLS baseline)가 적용
- [x] 기존 회귀 테스트 및 거버넌스 게이트가 모두 통과

### Phase 2+ (요약)

- Phase 2: 근무일정/교대/유연근무 + GPS/QR 출퇴근 + 실시간 근태 현황
- Phase 3: 휴가 정책 엔진(자동 부여/소진/연차촉진) + 시간/반차 단위
- Phase 4: 급여 엔진 고도화(세법/4대보험/명세서/마감)
- Phase 5: 전자결재/전자계약(결재선, 문서 양식, 서명)
- Phase 6: 관리자/직원 UI 런칭 품질(여정/온보딩/권한/회귀게이트)
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

- Staging CI는 레포 변수 `FLOWHR_ENABLE_STAGING_CI=true`일 때만 동작합니다. 설정은 `docs/staging-secrets.md`를 따릅니다.
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

- WI-0283 payroll admin preset auto-resolution UX visibility baseline(src/components/payroll/PayrollKrPresetGuidePanel.tsx auto/manual mode controls + /admin#payroll payload wiring for incomeTaxLookupPresetAuto and optional incomeTaxLookupAsOf + manual preset fallback guard + WI-0283 regression test)
- WI-0291 payroll KR simple withholding dependent-tier engine baseline(`incomeTaxLookupTable[].dependentTaxKrw` validation/selection + managed preset dependent tiers + payroll spec v1.58.0 + WI-0291 regression test)
- WI-0292 employee year-end input locale dynamic UI baseline(`/employee/year-end-input` ko/en locale copy wiring via useI18n + runtime log locale mapping(ko-KR/en-US) + WI-0292 regression test)
- WI-0293 employee withholding receipt locale dynamic UI baseline(`/employee/withholding-receipt` ko/en locale copy wiring via useI18n + runtime log locale/krw formatting(ko-KR/en-US) + WI-0293 regression test)
- WI-0294 locale dynamic UI gap fix baseline(`/employee/payslip-receipts` + `/admin/leave-calendar` ko/en locale copy wiring via useI18n + runtime log locale mapping(ko-KR/en-US) + WI-0294 regression test)
- WI-0295 core decomposition phase1 baseline(`src/features/payroll/service.ts` year-end helper split into `year-end-calculation-helpers.ts`, `year-end-filing-artifact-helpers.ts`, `year-end-filing-submission-query-helpers.ts` + `src/app/admin/page.tsx` utility/type extraction to `page-helpers.ts` and `page-types.ts` + WI-0295 regression test)
- WI-0296 employee decomposition phase1 baseline(`src/app/employee/page.tsx` local type/utility extraction to `src/app/employee/page-types.ts` + `src/app/employee/page-helpers.ts` with no behavior change + WI-0296 regression test)
- WI-0297 payroll decomposition phase2 baseline(`src/features/payroll/year-end-audit-payload-helpers.ts` extraction for settlement-hash and filing/finalization audit payload parsers + `src/features/payroll/service.ts` wrapper rewiring + WI-0297 regression test)
- WI-0298 admin decomposition phase1 baseline(src/app/admin/page-queue-helpers.ts extraction for approval-queue wait/SLA/filter/search-sort derived logic + src/app/admin/page.tsx rewiring with no behavior change + WI-0298 regression test)
- WI-0299 admin locale dynamic UI gap fix baseline(/admin locale-aware queue/status/log/fallback text wiring via useI18n + src/app/admin/page-queue-helpers.ts queueLabel locale parameterization + WI-0299 regression test)
- WI-0300 payroll decomposition phase3 baseline(src/features/payroll/kr-statutory-helpers.ts extraction for KR statutory tax/insurance normalize/calc helpers + src/features/payroll/service.ts wrapper rewiring + WI-0300 regression test)
- WI-0301 employee/admin locale dynamic UI gap fix phase2(/employee locale-aware status/badge/work-type/log labels + leave-type display harmonization + /admin invite role/delivery locale labels + WI-0301 regression test)
- WI-0302 payroll decomposition phase4 baseline(src/features/payroll/year-end-filing-lifecycle-helpers.ts extraction for filing submission summary/timeline builders + src/features/payroll/service.ts lifecycle delegation rewiring + WI-0302 regression test)
- WI-0303 admin/employee locale dynamic UI gap fix phase3(`/admin`/`/employee` mixed-language hardcoded label cleanup + resubmit aria-label mojibake(`???`) fix + locale-aware runtime copy refinement + WI-0303 regression test)
- WI-0304 payroll decomposition phase5 baseline(src/features/payroll/year-end-filing-ack-catalog-helpers.ts extraction for filing ack catalog constants/payload resolver + src/features/payroll/service.ts delegation rewiring + WI-0304 regression test)
- WI-0305 admin/employee page decomposition phase2 baseline(`src/app/admin/page.tsx` panel JSX extraction to `src/components/admin-dashboard/*` + `src/app/employee/page.tsx` panel JSX extraction to `src/components/employee-dashboard/*` + request search pending-wait mojibake copy fix + WI-0305 regression test)
- WI-0306 payroll decomposition phase6 baseline(src/features/payroll/year-end-finalization-run-helpers.ts extraction for year-end filing guard + insurance reconciliation monthly breakdown aggregation + src/features/payroll/service.ts delegation rewiring + WI-0306 regression test)
- WI-0307 admin pages locale dynamic UI gap fix phase4(`/admin/approval-executions` + `/admin/people` mixed-language label cleanup + locale-aware(`ko`/`en`) runtime copy/datetime formatting + `/employee` pending-filter feedback copy normalization + WI-0307 regression test)
- WI-0308 payroll decomposition phase7 baseline(`src/features/payroll/year-end-filing-submission-lifecycle-helpers.ts` extraction for filing lifecycle log/summaries/pending guard/submission-id helpers + `src/features/payroll/service.ts` lifecycle helper rewiring + WI-0308 regression test)
- WI-0309 payroll decomposition phase8 baseline(`src/features/payroll/service-runtime-helpers.ts` extraction for payroll feature flags + period/rate/integer validators + Seoul datetime boundary/format helpers + `src/features/payroll/service.ts` runtime helper rewiring + WI-0309 regression test)
- WI-0310 locale dynamic UI residual gap fix baseline(`src/components/admin-dashboard/*`, `src/components/employee-dashboard/*`, `src/app/admin/page.tsx`, `src/app/employee/page.tsx` mixed-language label cleanup + ko/en copy normalization + WI-0310 regression test)
- WI-0311 payroll decomposition phase9 baseline(`src/features/payroll/year-end-withholding-receipt-helpers.ts` extraction for receipt issue guard/payload builder + `src/features/payroll/service.ts` helper delegation rewiring + WI-0311 regression test)
- WI-0312 payroll decomposition phase10 baseline(`src/features/payroll/year-end-calculation-helpers.ts` extraction for year-end settlement tax/withholding math + `src/features/payroll/service.ts` settlement wrapper rewiring + WI-0312 regression test)
- WI-0313 admin page decomposition phase3 baseline(`src/app/admin/page-locale-helpers.ts` extraction for locale label bundle + demo-organization-name fallback helper + `src/app/admin/page.tsx` rewiring + WI-0313 regression test)
- WI-0314 employee locale dynamic UI gap fix phase4 baseline(`src/app/employee/page-locale-helpers.ts` extraction for locale label bundle + locale-aware weekday/note presets/error helpers + `src/app/employee/page.tsx` panel copy ko/en dynamic rewiring + WI-0314 regression test)
- WI-0315 payroll decomposition phase11 baseline(`src/features/payroll/service-statutory-adapter-helpers.ts` extraction for KR statutory wrapper/type adapters + `src/features/payroll/service.ts` helper/type delegation rewiring + WI-0315 regression test)
- WI-0316 employee payslips locale dynamic UI gap fix phase5 baseline(`src/app/employee/payslips/page.tsx` locale-aware runtime formatting + search/sort copy ko/en dynamic rewiring + WI-0316 regression test)
- WI-0317 payroll decomposition phase12 baseline(`src/features/payroll/service-input-types.ts` extraction for payroll input/request type blocks + `src/features/payroll/service.ts` type import rewiring + WI-0317 regression test)
- WI-0318 employee payslips locale helper split phase6 baseline(`src/app/employee/payslips/page-locale-helpers.ts` extraction for locale formatting/search copy helpers + `src/app/employee/payslips/page.tsx` helper import rewiring + WI-0318 regression test)
- WI-0319 employee payslips locale dynamic residual gap fix phase7 baseline(`src/app/employee/payslips/page-locale-helpers.ts` page-level ko/en copy bundle + deduction/state label locale helpers + `src/app/employee/payslips/page.tsx` remaining hardcoded UI copy replacement + WI-0319 regression test)
- WI-0320 employee locale dynamic residual gap fix phase8 baseline(`src/app/employee/page-locale-helpers.ts` surface copy bundle(attendance/leave/calendar/schedule/apiLogs) extraction + `src/app/employee/page.tsx` residual panel-surface ko/en copy rewiring + WI-0320 regression test)
- WI-0321 payroll decomposition phase13 output type split baseline(`src/features/payroll/service-output-types.ts` extraction for payroll output/result type blocks + `src/features/payroll/service.ts` output type import rewiring + WI-0321 regression test)
- WI-0322 employee locale validation/error copy split phase9 baseline(`src/app/employee/page-locale-helpers.ts` validation copy bundle for correction/pre-submit/resubmit/failure-text + `src/app/employee/page.tsx` validation/error/checklist copy rewiring + WI-0322 regression test)
- WI-0323 payroll decomposition phase14 year-end run snapshot helper split baseline(`src/features/payroll/service-year-end-run-snapshot-helpers.ts` extraction for year-end run snapshot loader + payroll totals aggregation + `src/features/payroll/service.ts` helper import rewiring + WI-0323 regression test)
- WI-0324 employee locale summary copy split phase10 baseline(`src/app/employee/page-locale-helpers.ts` summary copy bundle for leave summary/projection/unit labels + `src/app/employee/page.tsx` summary/status locale rewiring + WI-0324 regression test)
- WI-0325 payroll decomposition phase15 service context helper split baseline(`src/features/payroll/service-context-helpers.ts` extraction for service context + permission/event publisher helpers + `src/features/payroll/service.ts` import rewiring + WI-0325 regression test)
- WI-0326 payroll decomposition phase16 computation helper split baseline(`src/features/payroll/service-computation-helpers.ts` extraction for attendance payable-minutes aggregation + gross-pay computation helper/totals constant + `src/features/payroll/service.ts` import rewiring + WI-0326 regression test)
- WI-0327 employee locale section-title copy split phase11 baseline(`src/app/employee/page-locale-helpers.ts` section-title locale copy bundle(attendance/leave/leave-calendar/schedule/api-logs) extraction + `src/app/employee/page.tsx` `<h2>` locale ternary removal rewiring + WI-0327 regression test)
- WI-0328 admin approval-history locale dynamic UI gap fix phase5 baseline(`src/app/admin/approval-history/page-locale-helpers.ts` locale copy/date-format helpers + `src/app/admin/approval-history/page.tsx` useI18n rewiring for hero/filter/result/log copy + WI-0328 regression test)
- WI-0329 admin approval-policy locale dynamic UI gap fix phase6 baseline(`src/app/admin/approval-policy/page-locale-helpers.ts` locale copy/date-format helpers + `src/app/admin/approval-policy/page.tsx` useI18n rewiring for policy/delegation/log copy cleanup + WI-0329 regression test)
- WI-0330 admin approval-templates locale dynamic UI gap fix phase7 baseline(`src/app/admin/approval-templates/page-locale-helpers.ts` locale copy/date-format/krw-format helpers + `src/app/admin/approval-templates/page.tsx` useI18n rewiring for hero/context/create/preview/list/log copy cleanup + WI-0330 regression test)
- WI-0331 admin payroll-close locale dynamic UI gap fix phase8 baseline(`src/components/payroll-close/copy.ts` locale copy bundle + `src/components/payroll-close/PayrollClosePeriodConsole.tsx` useI18n rewiring for hero/input/run-state/totals/log copy + `formatKrw(value, runtimeLocale)` locale formatting update + WI-0331 regression test)
- WI-0332 admin payroll-insurance locale dynamic UI gap fix phase9 baseline(`src/components/payroll-insurance/copy.ts` locale copy bundle + insurance settlement input/summary/components/log panel split + `src/components/payroll-insurance/PayrollInsuranceSettlementConsole.tsx` useI18n rewiring + `formatKrw(value, runtimeLocale)` locale formatting update + WI-0332 regression test)
- WI-0333 admin payroll year-end/preflight/payslip-delivery locale dynamic UI gap fix phase10 baseline(`src/components/payroll-year-end/copy.ts` + `src/components/payroll-payslip-delivery/copy.ts` locale bundles, console rewiring for useI18n/runtime locale, `formatKrw(value, runtimeLocale = "ko-KR")` update, and WI-0333 regression test)
- WI-0334 admin payroll year-end filing locale dynamic UI gap fix baseline(`src/components/payroll-year-end-filing/copy.ts` locale bundle + `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx` useI18n/runtime locale rewiring for headings, filters, actions, summaries, timeline/log copy + filing locale regression tests)
- WI-0335 contracts locale dynamic UI gap fix baseline(`src/components/contracts/copy.ts` locale bundle + contracts admin workspace/template builder/employee inbox useI18n runtime locale rewiring + contract status/category/action label localization + WI-0335 regression test)
- WI-0342 locale residual gap fix (admin payroll panel fields/actions fully ko/en dynamic via `fieldCopy` + locale regression test)
- WI-0343 employee decomposition phase2 (`src/app/employee/page-derived-helpers.ts` extraction for stats/leave-balance derived blocks + regression test)
- WI-0344 admin decomposition phase2 (`src/app/admin/page-queue-helpers.ts` extraction for API-log/queue-badge/alert summary builders + regression test)
- WI-0345 payroll modular split phase17 (`service-year-end-adapter-helpers.ts` expansion for filing timeline and withholding receipt wrappers + `service.ts` rewiring + regression test)
- WI-0346 admin payroll customer-value copy (customer-value KPI narrative cards + locale-aware copy + regression test)
- WI-0347 bloat guard hardening (contracts component <=300 line budget guard + core-surface preset-stacking forbidden-pattern guard)
- WI-0348 employee payslips explanation cards + month-over-month insight (`/employee/payslips` compare insight cards, insight snapshot payload, and responsive compare insight styles + regression test)
- WI-0349 employee year-end input real-time validation + checklist UX (`EmployeeYearEndInputConsole.tsx` live validation checks, checklist rendering, guarded settlement-load action + regression test)
- WI-0350 admin approval queue mobile UX enhancement (`ApprovalQueuePanel.tsx`/`ApprovalQueueSearchSortPanel.tsx` locale-driven copy refactor + mobile sticky quick actions + regression test)
- WI-0351 leave calendar cell click prefill leave form (`/employee` leave calendar day click prefill callback wiring + locale hint copy + clickable/focus styles + regression test)
- WI-0352 employee contract signature journey timeline + recovery guide (`EmployeeContractJourneyPanel.tsx` extraction, inbox integration, journey/recovery styles while preserving <=300 inbox budget + regression test)
- WI-0353 payroll service modular split phase18 withholding receipt flow (`service-year-end-withholding-flow-helpers.ts` extraction + `service.ts` delegation for finalized-settlement/withholding-document/issue receipt paths + regression test)
- WI-0354 admin onboarding locale dynamic UI gap fix (`/admin/onboarding` copy bundle completion + leave-policy/checklist/log status labels locale wiring + request-label localization in onboarding data hook + regression test)
- WI-0355 employee guide locale dynamic UI gap fix (`/employee/guide` hero/log status/request label locale wiring + guide data hook request-label localization + regression test)
- WI-0356 home locale devtools copy gap fix (`src/lib/i18n/messages.ts` 신규 키 추가 + `/` 홈 employee/devtools 링크 라벨 i18n 치환 + regression test)
- WI-0357 payroll service modular split phase19 year-end reporting helpers (`service-year-end-reporting-helpers.ts` extraction for insurance reconciliation report + preflight checklist + `service.ts` delegation + regression test)
- WI-0358 payroll service modular split phase20 deduction profile helpers (`service-deduction-profile-helpers.ts` extraction for read/upsert/list + `service.ts` delegation + regression test)
- WI-0359 payroll service modular split phase21 filing submission creation helper (`service-year-end-filing-submission-helpers.ts` extraction for submission payload/audit/event composition + `service.ts` submit/resubmit delegation + regression test)
- WI-0360 admin-kpi locale residual cleanup (`src/components/admin-kpi/copy.ts` metric/log badge locale keys + `AdminKpiSections.tsx` hardcoded metric/OK/FAIL removal + regression test)
- WI-0361 admin-attendance-live locale residual cleanup (`src/components/admin-attendance-live/copy.ts` table-header/log badge locale keys + `AdminAttendanceLiveSections.tsx` hardcoded header/OK/FAIL removal + regression test)
- WI-0362 payroll service modular split phase22 statutory deduction preview helper (`service-deduction-statutory-preview-helpers.ts` extraction for statutory_kr_baseline deduction math/breakdown + `service.ts` delegation + regression test)
- WI-0363 payroll service modular split phase23 insurance settlement preview helper (`service-insurance-settlement-preview-helpers.ts` extraction for insurance settlement preview flow + `service.ts` delegation + regression test)
- WI-0364 year-end accuracy regression bundle (deterministic statutory deduction accuracy checks + locale-aware KRW formatter regression test)
- WI-0365 employee year-end input UX accuracy guidance improvements (`EmployeeYearEndInputConsole.tsx` locale-driven validation labels + accuracy guidance panel + runtime-locale KRW formatting + regression test)
- WI-0366 employee year-end input copy extraction (`employee-year-end-input-copy.ts` extraction for locale copy/type block + console import rewiring + regression test)
- WI-0367 employee year-end input helper extraction (`employee-year-end-input-helpers.ts` extraction for parse/simulation/accuracy-guidance logic + console helper delegation + regression test)
- WI-0368 payroll service modular split phase24 close period helper (`service-payslip-period-helpers.ts` extraction for close-period preview/apply flow + `service.ts` delegation + regression test)
- WI-0369 payroll service modular split phase25 payslip delivery/receipt helper (`service-payslip-period-helpers.ts` expansion for distribution/receipt flows + `service.ts` delegation + regression test)
- WI-0370 payroll service modular split phase26 year-end settlement flow helper (`service-year-end-settlement-flow-helpers.ts` extraction for settlement preview/recalculation/finalization validation/hash/audit/event flow + `service.ts` delegation + regression test)
- WI-0371 payroll service modular split phase27 filing package mutation helpers (`service-year-end-filing-package-mutation-helpers.ts` extraction for filing submission acknowledge/cancel/reopen validation + audit/event flow + `service.ts` delegation + regression test)
- WI-0372 payroll service modular split phase28 filing export helper (`service-year-end-filing-export-helpers.ts` extraction for filing export/finalization hash-validation/artifact generation + `service.ts` delegation + regression test)
- WI-0373 admin/employee account panels locale residual cleanup (`AdminOnboardingAccountPanels.tsx` + `EmployeeAccountOverviewPanels.tsx` session-error/organization-placeholder/aria-label locale wiring + regression test)
- WI-0374 admin runtime locale and API helper extraction (`src/app/admin/page-api-helpers.ts` extraction for request header/body/log parsing + `src/app/admin/page.tsx` runtime locale timestamp wiring + `formatDateTime(value, runtimeLocale)` rewiring + regression test)
- WI-0375 employee API helper extraction (`src/app/employee/page-api-helpers.ts` extraction for request header/body/log parsing + `src/app/employee/page.tsx` callApi delegation + regression test)
- WI-0376 employee request helper extraction and runtime datetime locale (`src/app/employee/page-request-helpers.ts` extraction for request feedback/search/timeline/failure-cause derivation + `formatDateTime(value, runtimeLocale)` rewiring + regression test)
- WI-0377 admin page action helper extraction (`src/app/admin/page-action-helpers.ts` extraction for employee/invite/schedule/organization/leave-policy/aggregate action flows + `src/app/admin/page.tsx` delegation + regression test)
- WI-0378 employee page action helper extraction (`src/app/employee/page-action-helpers.ts` extraction for snapshot/attendance/leave mutation flows + `src/app/employee/page.tsx` delegation + regression test)
- WI-0379 admin/employee runtime locale format guard (`src/app/admin/page-helpers.ts`, `src/app/employee/page-helpers.ts` formatDateTime runtimeLocale required signature hardening + regression test)
- WI-0380 payroll service modular split phase29 filing query/evidence helpers (`service-year-end-filing-query-evidence-helpers.ts` extraction for filing submissions/ack-catalog/timeline and evidence-note flows + `service.ts` delegation + regression test)
- WI-0381 payroll service modular split phase30 preview helpers (`service-preview-helpers.ts` extraction for payroll preview + deduction-preview run creation/audit/event flows + `service.ts` delegation + regression test)
- WI-0382 admin queue derived helper consolidation (`page-queue-helpers.ts` `buildAdminQueueDerivedState` extraction for wait-hours/SLA/filter/search-sort state + `src/app/admin/page.tsx` single-memo delegation + regression test)
- WI-0383 employee validation helper extraction (`page-validation-helpers.ts` extraction for correction/attendance/leave/resubmit/checklist validation builders + `src/app/employee/page.tsx` memo delegation + regression test)
- WI-0384 employee derived helper phase3 extraction (`page-derived-helpers.ts` expansion for leave-calendar cells/rows, status summaries, resubmit candidates, and summary cards + `src/app/employee/page.tsx` delegation + regression test)
- WI-0385 admin inbox accrual helper extraction (`page-action-helpers.ts` expansion for inbox list fetch, payroll confirm response parsing, and leave accrual settle parsing + `src/app/admin/page.tsx` delegation + regression test)
- WI-0386 employee payroll/contracts Korean copy exhaustive audit (`/employee/withholding-receipt`, `/employee/payslips`, `/employee/payslip-receipts`, `/employee/contracts` ko copy residual English cleanup + locale KRW unit normalization + regression guard test)
- WI-0387 Korean copy global sweep and guard (approval/admin/payroll locale helper recovery from corrupted `??` placeholders + contracts ko copy spread-removal hardening + year-end filing timeline/placeholder Korean normalization + regression guard test)
- WI-0388 admin directory action orchestrator extraction (`src/app/admin/page-directory-actions.ts` 신규 분리 + people/org/schedule 액션 오케스트레이션 이동 + `src/app/admin/page.tsx` wiring 간소화 + regression test)
- WI-0389 employee mutation action orchestrator extraction (`src/app/employee/page-mutation-actions.ts` 신규 분리 + snapshot/attendance/leave 액션 오케스트레이션 이동 + `src/app/employee/page.tsx` wiring 간소화 + regression test)
- WI-0390 vercel main auto-deploy restore (vercel.json github integration re-enabled + main-only deployment policy retained + e2e-wi0284 policy guard updated + regression test)
- WI-0391 vercel scope fallback for main deploy workflow (make VERCEL_SCOPE optional + scoped vercel CLI fallback without --scope + e2e-wi0390 workflow contract hardening)
- WI-0392 vercel scope-candidate fallback (try VERCEL_SCOPE then GITHUB_REPOSITORY_OWNER for scoped Vercel CLI commands + explicit attempted-scope diagnostics + e2e-wi0390 guard update)
- WI-0393 employee payslips UTF-8 encoding guard (`/employee/payslips` compare insight Korean strings UTF-8 recovery + mojibake regression guard test + `.vercel` git ignore hardening)
- WI-0394 Korean copy terminology normalization (`/employee/withholding-receipt`, `/employee/payslip-receipts`, `/employee/contracts` 용어 일관화: 직원 번호/실행/해시값 + contracts ko locale spread 제거 + regression guard test)
- WI-0395 contracts Korean copy residual cleanup and localized request fallback (`/admin/contracts`, `/admin/contracts/builder`, `/employee/contracts` ko 용어 `ID` 잔여 제거 + contracts API fallback 에러문 locale copy 연결 + regression guard test)
- WI-0396 payslip copy regression reversal and people page decomposition (`/employee/payslips` 비교 인사이트 copy/helper 추출로 page 역행 해소 + `/admin/people` view/types/helpers 분해로 `page.tsx` 500줄 미만 회복 + 회귀 테스트 갱신)
- WI-0397 scheduling dedicated admin/employee workspace baseline (`/admin/scheduling` CRUD workspace + `/employee/schedule` own-board summary + i18n nav/copy + regression test)
- WI-0398 payslip page view decomposition and render-orchestrator split (`/employee/payslips` render extract to `page-view.tsx` + orchestration-only `page.tsx` and line-count reduction + regression test)
- WI-0399 notice-benefits-recruitment baseline routes and nav i18n wiring (`/admin/notices`, `/admin/benefits`, `/admin/recruitment`, `/employee/benefits`, `/employee/recruitment` baseline routes + admin/employee nav and ko/en i18n key wiring + regression test)
- WI-0400 mobile root navigator locale-dynamic title baseline (`apps/mobile` navigator title/splash copy locale switch for `ko`/`en` + locale resolver helper + regression test)
- WI-0401 korean copy residual sweep for withholding/payslip/contracts (`/employee/withholding-receipt`, `/employee/payslip-receipts`, `/employee/contracts`, `/admin/contracts` ko copy residual english label cleanup + contracts KPI aria locale copy + regression guard test)
- WI-0402 korean copy residual sweep phase2 (admin/employee/payroll/ops ko label normalization: `직원 ID`/`조직 ID`/`액터 ID`/`API 로그` -> `직원 번호`/`조직 식별자`/`액터 식별자`/`요청 로그` + legacy-term regression guard test)
- WI-0403 employee payslips derived-state hook extraction (`/employee/payslips/page.tsx` derived memo blocks extracted to `use-payslip-derived-state.ts` + page line count reduction 749->517 + decomposition regression test)
- WI-0404 employee interaction handler builder extraction (`/employee/page.tsx` local interaction wrapper functions consolidated into `buildEmployeeInteractionHandlers` wiring + interaction handler delegation hardening in `page-interaction-actions.ts` + line count reduction to 976 + decomposition regression test)
- WI-0405 payslip/contracts residual english token cleanup (`/employee/payslips/page-view.tsx` session line role/org/actor labels localized via locale copy keys + `contracts/http.ts` locale-aware default fallback message + regression test hardening)
- WI-0406 global i18n residual token cleanup (`/admin/notices`, `/admin/benefits`, `/admin/recruitment`, `/employee/benefits`, `/employee/recruitment` ko copy residual 표현 정리 + `apps/mobile` notification/history/preset locale-copy 분기 및 한국어 기본 문구 정리 + regression test)
- WI-0407 notices core journey implementation (`/api/notices` list/create + `/api/notices/{noticeId}/publish` 게시 액션 + `/admin/notices` 작성/게시 워크스페이스 + `/employee/notices` 게시 공지 보드 + notices nav/i18n wiring)
- WI-0408 benefits core journey implementation (`/api/benefits/catalog`, `/api/benefits/requests`, `/api/benefits/requests/{requestId}/decision` + `/admin/benefits` catalog/decision workspace + `/employee/benefits` request submit/history workspace)
- WI-0409 recruitment core journey implementation (`/api/recruitment/openings`, `/api/recruitment/referrals`, `/api/recruitment/referrals/{referralId}/stage` + `/admin/recruitment` opening/referral stage workspace + `/employee/recruitment` referral submit/history workspace)
- WI-0410 schedule user journey enhancement (`/employee/schedule` 기간 단축 액션(이번 달/주/다음 주) + 상태/휴일 필터 + 다음 근무 카드 + 상태 뱃지 목록 + `EmployeeScheduleBoardView` 분리 + regression test)
- WI-0411 payslips page-view section decomposition (`/employee/payslips/page-view.tsx`를 search/status/compare/detail 섹션 컴포넌트로 분해 + `page-view-shared-sections.tsx`/`page-view-detail-panel.tsx` 추가 + 기존 회귀 토큰/id 유지 + regression test)
- WI-0412 admin dashboard actions and compensation panels extraction (`src/app/admin/page-dashboard-actions.ts`로 inbox/payroll/leave-policy/aggregate/dashboard 액션 오케스트레이션 분리 + `src/app/admin/page-compensation-panels.tsx`로 aggregate/payroll/debug 패널 조합 이동 + `src/app/admin/page.tsx` wiring 간소화 + regression test)
- WI-0413 korean label normalization for withholding/payslip/contracts (`/employee/payslips` ko copy에서 API/CSV/PDF/JSON 잔여 표현을 요청/표/문서/구조 데이터 중심으로 정규화 + `/components/withholding-receipt` 문서 format/contentType ko 라벨 매핑 추가 + contracts ko 핵심 라벨 회귀 guard)
- WI-0414 korean runtime fallback guard for withholding/payslip/contracts (`/employee/payslips` ko 런타임에서 영문 오류문구/미매핑 공제키 fallback 한국어화 + `/components/contracts/http.ts` ko 런타임 영문 raw error suppress + `/components/withholding-receipt` 미확인 format/content-type fallback 한국어화 + regression test)
- WI-0415 admin dashboard state and panels decomposition (`src/app/admin/page-state.ts`로 상태/효과 분리 + `src/app/admin/page-panels.tsx`로 패널 렌더링/wiring 분리 + `src/app/admin/page.tsx` orchestration 전용으로 축소(<=500 lines) + regression test)
- WI-0416 korean runtime english residual sweep for withholding/payslip/contracts (`/employee/withholding-receipt` 차단사유/세션오류 원문 한국어 정규화 + `/employee/payslips` production 배지/세션오류 runtime locale 고정 + `/components/contracts` error/detail 추출 및 catch 경로 suppress 강화 + regression test)
- WI-0417 employee runtime session bootstrap extraction (`src/app/employee/page-session-helpers.ts` extraction for supabase session/bearer/runtime bootstrap + `src/app/employee/page.tsx` rewiring + regression test)
- WI-0418 notices read receipt core journey (`noticeReadStore` + `POST /api/notices/{noticeId}/read` + employee notice unread/read badge and mark-as-read action + regression test)
- WI-0419 benefits request filter and name visibility (employee benefits status filter/summary + benefitId->name rendering + locale copy extension + regression test)
- WI-0420 recruitment referral filter and opening visibility (employee recruitment stage filter/summary + openingId->title visibility + locale copy extension + regression test)
- WI-0421 notices admin read coverage visibility (admin notice route returns org-wide read receipts + admin list read-count indicator + regression test)
- WI-0422 mobile employee self-service shortcut bridge (`apps/mobile` employee home shortcut card + notices/benefits/recruitment web bridge callbacks + regression test)
- WI-0423 notices mark-all-read core journey (`POST /api/notices/read-all` + employee notice-board mark-all action + notices copy extension + regression test)
- WI-0424 benefits request cancel self-service (`CANCELED` status + `/api/benefits/requests/{requestId}/cancel` + employee benefits cancel action/filter/summary + regression test)
- WI-0425 recruitment referral withdraw self-service (`WITHDRAWN` stage + `/api/recruitment/referrals/{referralId}/withdraw` + employee recruitment withdraw action/filter/summary + regression test)
- WI-0426 mobile employee shortcut bridge phase2 (schedule/contracts/payslips web-bridge callbacks + employee-home shortcut expansion + regression test)
- WI-0427 korean runtime residual hardening (payslip-receipts runtime error normalizer + withholding Korean wording normalization + contracts response-label normalization + regression test)
- WI-0428 employee request-flow helper extraction (`buildRequestFlowStats`/`resolveSelectedResubmitCandidate` extraction + `src/app/employee/page.tsx` derivation rewiring + regression test)
- WI-0429 korean runtime message and contract title normalization (withholding/payslip/payslip-receipt/contracts common English error-pattern Korean mapping + contracts title fallback normalization hardening + contracts evidence-load ko message hardening + regression test)
- WI-0430 employee request/checklist derived hook extraction (`useEmployeeRequestChecklistDerivedState` 신규 + request feedback/search/timeline/failure/checklist memo 블록 분리 + `src/app/employee/page.tsx` 949->764 라인 축소 + regression test)
- WI-0431 employee dashboard derived hook extraction (`useEmployeeDashboardDerivedState` 신규 + attendance/leave/resubmit/integrated-summary/correction-delta memo/effect 분리 + `src/app/employee/page.tsx` 764->568 라인 축소 + regression test)
- WI-0432 korean runtime latin fallback hardening (`/employee/payslips`, `/employee/payslip-receipts`, `/employee/withholding-receipt`, `/components/contracts/http.ts` ko 런타임 에러 억제 기준을 ASCII 비율에서 "라틴 문자 포함 시 fallback"으로 강화 + regression test)
- WI-0433 employee mutation runtime extraction and line-budget-500 recovery (`src/app/employee/page-mutation-runtime.ts` 신규로 API call/pending/log/mutation wiring 분리 + `src/app/employee/page.tsx` 568->499 라인 예산 회복 + WI-0375/WI-0389 regression 기준 최신화 + regression test)
- WI-0434 employee notices search and unread filter (`EmployeeNoticeBoard`에 제목/본문 키워드 검색 + 미확인 전용 토글 + 필터 초기화/표시 개수/필터-빈결과 안내 추가 + notices ko/en copy 확장 + regression test)
- WI-0435 employee benefits request search filter (`EmployeeBenefitsWorkspace` 내 신청 이력에 항목명/사유 검색 + 검색 초기화 + 표시 건수/검색-빈결과 안내 추가 + benefits ko/en copy 확장 + regression test)
- WI-0436 employee recruitment referral search filter (`EmployeeRecruitmentWorkspace` 내 추천 이력에 후보자/공고/메모 검색 + 검색 초기화 + 표시 건수/검색-빈결과 안내 추가 + recruitment ko/en copy 확장 + regression test)
- WI-0437 employee schedule search filter (`EmployeeScheduleBoard` 일정 목록에 schedule ID/메모 검색 + 검색 초기화 + 표시 건수(visible/total) 추가 + scheduling ko/en copy 확장 + regression test)
- WI-0438 employee contracts inbox search filter (EmployeeContractsInbox.tsx inbox title/document/status/comment search + clear-search + visible-count/filtered-empty states + contracts ko/en copy extension + regression test)
- WI-0439 employee payslip receipts search filter and line-budget hardening (PayslipReceiptConsole.tsx run-list search + clear-search + visible-count/filtered-empty guidance + response/log helper compaction to <=300 lines + payslip-receipts ko/en copy extension + regression tests)
- WI-0440 withholding receipt console panel decomposition phase1 (WithholdingReceiptPanels.tsx summary/log panel extraction + WithholdingReceiptConsole.tsx runRequest boilerplate consolidation + regression-anchor preservation + line count reduction 711->660 + regression test)
- WI-0441 payroll service filing submission context helper and line-budget 500 (service.ts duplicated filing precondition flow extracted to loadFilingSubmissionContext, stale import surface trimmed, submit/resubmit rewired without behavior change, and service line count reduced 546->486 with regression test)
- WI-0442 withholding receipt copy/runtime extraction and line-budget 300 (`copy-runtime.ts`로 locale copy/runtime helper 분리 + `WithholdingReceiptConsole.tsx` orchestration-only 축소(<=300) + regression test)
- WI-0443 payslips runtime locale lock (`setPayslipRuntimeLocale` override 추가 + `/employee/payslips` i18n locale 기반 runtime formatter lock/unlock + regression test)
- WI-0444 contracts journey copy extraction and runtime locale lock (`journey-copy.ts` 신규 + `EmployeeContractJourneyPanel.tsx` locale copy 전환 + `contracts/http.ts` locale override + contracts 화면 3곳 lock 적용 + regression test)
- WI-0445 payslips locale helper split copy/runtime/barrel (`page-locale-copy.ts`/`page-locale-runtime.ts` 분해 + `page-locale-helpers.ts` 배럴 경량화 + regression test)
- WI-0446 employee attendance/leave panel decomposition (`EmployeeAttendanceLeaveFormsPanel.tsx` + `EmployeeLeaveCalendarPanel.tsx` 분리 + `EmployeeAttendanceLeavePanels.tsx` orchestration 축소(<=220) + regression test)
- WI-0447 korean locale residual guard phase2 (`withholding`/`payslip`/`contracts` ko copy 금지 영어 토큰 회귀 가드 테스트 추가)
- WI-0448 korean locale static latin sweep (`withholding`/`payslip`/`contracts` ko copy 블록 전수 스캔 + 허용 토큰 최소화(`FlowHR`) + regression test)
- WI-0449 payslips korean copy token normalization (`/employee/payslips` ko placeholder에서 RUN/ORG/x-actor-* 노출 제거 + 한국어 예시/안내 문구 정규화 + regression test)
- WI-0450 payslips page api hook extraction and line-budget 500 (`use-payslip-api.ts` 신규 + `page.tsx` inline callApi/refresh/logging 제거 + 537->399 line budget 회복 + regression test)
- WI-0451 payslips locale copy modular split (`page-locale-types/search-sort/page-copy/deduction` 분해 + `page-locale-copy.ts` 경량 배럴 전환 + 기존 회귀 테스트 기준 갱신 + regression test)
- WI-0452 scheduling service incident normalizer extraction and line-budget 5500 (`incident-normalizers.ts` 신규 + incident SLA/escalation/archive/replay/reconcile parser/normalizer 분리 + `service.ts` 5616->5471 축소 + regression test)
- WI-0453 core line budget guard (`payslips page/locale/scheduling service` 핵심 파일 예산 가드 + ko 토큰 정규화 회귀 고정 + regression test)
- WI-0454 admin approval-policy type/utility extraction and line-budget 500 (`page-types.ts` 신규 + `page.tsx` 중복 type/util 제거 + 456 lines 회복 + regression test)
- WI-0455 admin people page-view panel decomposition and line-budget 300 (directory/org-chart/compare/history/logs 패널 분리 + `page-view.tsx` orchestration-only 전환 + 290 lines 회복 + regression test)
- WI-0456 scheduling incident audit projection extraction and line-budget 5300 (`incident-audit-projection.ts` 신규 + audit projection 상수/빌더 분리 + `service.ts` 5471->5254 축소 + regression test)
- WI-0457 leave promotion delivery helper extraction and line-budget 3000 (`promotion-delivery-helpers.ts` 신규 + webhook/email-template resolver/sender 분리 + `service.ts` 3176->2928 축소 + regression test)
- WI-0458 korean residual sweep phase3 (approval-policy/people/payslip-receipts/contracts 용어 `조직 식별자`/`관리자 액터 식별자`/`요청 로그`/`직원-0001` 고정 + legacy token 회귀 차단 test)
- WI-0459 core line budget guard phase2 (approval-policy/people/scheduling/leave 핵심 파일+추출 모듈 통합 예산 가드 + decomposition import wiring 고정 + regression test)
- WI-0460 scheduling anomaly automation helper extraction and line-budget 5100 (`anomaly-automation-helpers.ts` 신규 + anomaly alert/escalation/ticket env-parser 및 payload builder 분리 + `service.ts` 중복 helper 제거 + regression test)
- WI-0461 leave promotion history view helper extraction and line-budget 2850 (`promotion-history-views.ts` 신규 + 연차촉진 delivery/recipient/target 뷰 타입/매핑/retry-status helper 분리 + `leave/service.ts` 2928->2740 축소 + regression test)
- WI-0462 korean runtime message guard for withholding/payslip/contracts (runtime error pattern 확장: timeout/internal-server/service-unavailable + ko 런타임 영문 suppress 강화 + runtime-normalizer regression test)
- WI-0463 scheduling incident read-model helper extraction and line-budget 4800 (`incident-read-model-helpers.ts` 신규 + anomaly incident read-model 변환/upsert/audit-store fallback/backfill/list-get orchestration 분리 + `scheduling/service.ts` 5018->4763 축소 + regression test)
- WI-0464 leave policy/time helper extraction and line-budget 2600 (`policy-time-helpers.ts` 신규 + 서울일자/정책 기본값/요청 제약/연차 계산 helper 분리 + `leave/service.ts` 2740->2524 축소 + regression test)
- WI-0465 korean runtime fetch-failure guard for withholding/payslip/contracts (`failed to fetch|fetch failed|econnreset|econnrefused|enotfound|getaddrinfo` ko 패턴 확장 + runtime normalizer regression test)
- WI-0466 core line-budget guard phase3 for scheduling/leave/runtime (scheduling/leave service-helper + payroll/contract runtime helper budgets 고정 + decomposition wiring regression test)
- WI-0467 employee schedule average shift-hours summary (`/employee/schedule` 요약 카드에 교대당 평균 근무시간 추가 + ko/en locale copy 확장 + regression test)
- WI-0468 employee schedule csv export action (`/employee/schedule` 필터 결과 CSV 다운로드 액션 + locale status copy + export helper regression test)
- WI-0469 employee schedule ics export action (`/employee/schedule` 필터 결과 ICS 다운로드 액션 + calendar export helper + locale status copy + regression test)
- WI-0470 korean copy utf8 recovery for withholding/payslip/contracts (원천징수·명세서·전자계약함 ko 카피 깨짐 복구 + 용어 정규화 + existing korean-copy regression suite 재통과)
- WI-0471 korean locale employee-id input normalization for withholding/payslip receipts (`/employee/withholding-receipt`, `/employee/payslip-receipts`의 기본 직원번호 입력값 ko 표시(`직원-1001`)로 통일 + API 호출 시 `EMP-1001` 포맷 자동 정규화 + locale 전환 시 입력값 표기 동기화 + regression test)
- WI-0472 contracts employee-id locale display normalization (`/admin/contracts`에서 직원번호 입력/표시를 locale 친화(`직원-*`)로 통일 + 문서 생성 API는 `EMP-*` 포맷 자동 정규화 + 문서 목록 employeeId 표시 locale 변환 + regression test)
- WI-0473 admin notice workspace view decomposition (`/admin/notices` 화면을 `AdminNoticeWorkspaceView`로 분리해 `AdminNoticeWorkspace.tsx`를 orchestration 전용으로 축소(<=300) + 기존 공지 작성/게시/이력 UI 토큰 유지 + regression test)
- WI-0474 admin benefits workspace view decomposition (`/admin/benefits` 화면을 `AdminBenefitsWorkspaceView`로 분리해 `AdminBenefitsWorkspace.tsx`를 orchestration 전용으로 축소(<=300) + 카탈로그/요청 의사결정 UI 토큰 유지 + regression test)
- WI-0475 admin recruitment workspace view decomposition (`/admin/recruitment` 화면을 `AdminRecruitmentWorkspaceView`로 분리해 `AdminRecruitmentWorkspace.tsx`를 orchestration 전용으로 축소(<=300) + 채용공고/추천 stage UI 토큰 유지 + regression test)
- WI-0476 admin non-payroll workspace line-budget guard (`/admin/notices`, `/admin/benefits`, `/admin/recruitment` line-budget <=300 회귀 가드 + phase-loop 금지 패턴 회귀 차단 테스트 추가)
- WI-0477 korean copy residual sweep for payroll preset preview (`PayrollKrIncomeSplitPresetPayloadPreviewPanel.tsx` ko copy block 독립화 + preset mode 생략 라벨 locale wiring + payroll preset preview 한글 회귀 테스트 추가)
- WI-0478 payslips page-view filter/list panel decomposition (`/employee/payslips`의 page-view에서 필터/개발도구/근태요약 패널과 명세서 목록 패널 분리 + `page-view-types.ts` 타입 추출 + `page-view.tsx` 461->209 line-budget 회복 + regression test)
- WI-0479 payslips helper budget split (`page-helpers.ts`의 비교/인사이트 계산 블록을 `page-compare-helpers.ts`로 분리 + 기존 호출부는 re-export로 호환 유지 + legacy WI-0318/0319/0396/0398 회귀 테스트를 분해 구조에 맞게 보정 + `page-helpers.ts` 394->230)
- WI-0480 korean regression suite alignment after payslips decomposition (`WI-0386`/`WI-0416`의 구식 토큰 검증을 분해 후 파일 구조(`copy-runtime.ts`, `page-view-filter-panel.tsx`) 기준으로 보정 + 회귀 정합성 가드 테스트 추가)
- WI-0481 korean copy residual runtime hardening for withholding/payslip/contracts (깨진 한글 카피 복구: payslip locale/page-runtime + contracts journey/runtime helper + employee-id locale prefix + withholding runtime label/세션 fallback + filter panel separator 토큰 정규화 + 회귀 테스트 추가)
- WI-0482 legacy korean regression anchor alignment for payslip devtools/contracts fallback (`e2e-wi0405`를 분해 후 구조(`page-view-filter-panel.tsx`, `page-locale-page-copy.ts`) 기준으로 보정 + contracts HTTP fallback 회귀 앵커 유지 + 회귀 테스트 재정렬)
- WI-0483 korean runtime mixed-language suppression for withholding/payslip/contracts (ko 런타임에서 혼합 오류문구(한글+영문) 유입 시 known-pattern 한국어 매핑 우선 적용 + 미매핑 혼합 문자열은 한국어 fallback으로 강제 + 회귀 테스트 추가)
- WI-0484 korean runtime mixed-language suppression for payslip receipts (ko 런타임에서 payslip-receipt 혼합 오류문구(한글+영문) 유입 시 known-pattern 한국어 매핑 우선 적용 + 미매핑 혼합 문자열은 한국어 fallback으로 강제 + 회귀 테스트 추가)
- WI-0485 payroll accuracy regression bundle and admin evidence panel (`/admin/payroll-year-end`에 계산 정확성 증빙 패널 추가 + 정산/재계산/보험대사 수치 균형 검사 helper 분리 + 회귀 테스트 추가)
- WI-0486 korean runtime localization sweep for year-end/payslips/contracts (연말정산 콘솔 상태/사유/차단사유 및 세션 오류 한국어 정규화 + payslip 파일명 ko prefix 적용 + contracts 증빙 파일명 ko 표시 정규화 + 회귀 테스트 추가)
- WI-0487 korean surface english suppression for withholding/payslips/contracts (원천징수 문서 파일명 ko 정규화 + ko 환경 원천징수/명세서 raw JSON 영어 노출 억제 + 전자계약 증빙 다운로드 파일명 ko 정규화 + 회귀 테스트 추가)
- WI-0488 scheduling rotation korean copy recovery (`listWorkScheduleRotationBalance` 추천 문구 6종 깨짐 복구 + `e2e-wi0057` 추천 문구 정합성 고정 + `e2e-wi0488` 회귀 가드 추가)
- WI-0489 contracts http fallback runtime alignment (`contracts/http.ts` ko 런타임 계약 도메인 오류 매핑 확장 + 상태 제약/해시 불일치/리소스 미존재 한국어 안내 고정 + `e2e-wi0489` 회귀 테스트 추가)
- WI-0490 contracts permission message korean normalization phase 2 (`contracts/http.ts` 권한/본인문서 제약 오류 한국어 매핑 확장 + generic permission fallback 유지 + `e2e-wi0490` 회귀 테스트 추가)
- WI-0491 scheduling runtime korean error normalization (`scheduling/helpers.ts` 런타임 오류 한국어 정규화 helper 추가 + admin/employee 일정 오류 메시지 매핑 강화 + `e2e-wi0491` 회귀 테스트 추가)
- WI-0492 payslips employee-id locale normalization (`/employee/payslips` 직원번호 입력/표시를 `직원-*`↔`EMP-*` locale helper로 일원화 + API 호출은 `EMP-*` 정규화 고정 + CSV/상세/파일명 표기 한국어화 + `e2e-wi0492` 회귀 테스트 추가)
- WI-0493 payslip/withholding employee-id default restore and line-budget recovery (`/employee/payslip-receipts`, `/employee/withholding-receipt` 빈 직원번호 입력 시 locale 기본값 복원 + 요청/입력 패널 분리로 두 콘솔 모두 <=300 라인 예산 회복 + `e2e-wi0493` 회귀 테스트 추가)
- WI-0494 codex-guide i18n loop guard and functional switch (`docs/codex-guide.md`에 i18n phase 반복 금지 + 전수 스윕 1회/QA 결함 수정-only 규칙 + i18n WI 3연속 시 기능 WI 강제 전환 규칙 추가 + `e2e-wi0494` 회귀 테스트 추가)
- WI-0495 admin contracts workspace action hook extraction and line-budget margin (`AdminContractsWorkspace.tsx`의 API/액션 오케스트레이션을 `useAdminContractsWorkspaceActions.ts`로 분리해 라인 예산 여유 확보 + 기존 UX 앵커 유지 + `e2e-wi0495` 회귀 테스트 추가)
- WI-0496 admin contracts document search/status filter core journey (`/admin/contracts` 문서 라이프사이클 패널에 제목/문서번호/직원번호 검색 + 문서 상태 필터 + visible/total 건수 요약 추가 + 필터 로직/컨트롤 분리로 `AdminContractsWorkspace.tsx` 라인예산(<=260) 유지 + `e2e-wi0496` 회귀 테스트 추가)
- WI-0497 admin benefits request filter/search and benefit-name visibility (`/admin/benefits` 요청 승인 큐에 상태 필터 + 직원/항목/사유 검색 + visible/total 건수 안내 추가 + 요청 행에 benefitId 기반 항목명 표시 + `e2e-wi0497` 회귀 테스트 추가)
- WI-0498 admin recruitment referral filter/search and opening visibility (`/admin/recruitment` 추천 후보자 큐에 단계 필터 + 후보자/공고/추천인/메모 검색 + visible/total 건수 안내 추가 + 추천 행에 openingId 기반 공고명 표시 + `e2e-wi0498` 회귀 테스트 추가)
- WI-0499 admin notices list search and visible-count guidance (`/admin/notices` 공지 목록에 제목/본문 검색 + 검색 초기화 + visible/total 건수 안내 + filtered-empty 안내 추가 + `e2e-wi0499` 회귀 테스트 추가)
- WI-0500 employee payslip receipt status filter and pending focus (`/employee/payslip-receipts` 실행 목록에 상태 필터(전체/수신대기/확인완료/미배포) 추가 + 검색과 조합된 visible 목록/대기 건수 요약 제공 + `PayslipReceiptConsole.tsx` 라인예산(<=300) 유지 + `e2e-wi0500` 회귀 테스트 추가)
- WI-0501 payroll accuracy evidence fail-first filter and json export (`/admin/payroll-year-end` 계산 정확성 증빙 패널에 실패항목 우선 정렬 + 실패항목만 보기 토글(기본) + 현재 뷰 기준 증빙 JSON 다운로드 액션 추가 + `e2e-wi0501` 회귀 테스트 추가)
- WI-0502 employee contracts inbox status filter and pending response count (`/employee/contracts` 받은함에 상태 필터(전체/응답대기/응답완료/만료) 추가 + 검색과 조합된 visible 목록 + 응답대기 건수 요약 추가 + `EmployeeContractsInbox.tsx` 라인예산(<=300) 유지 + `e2e-wi0502` 회귀 테스트 추가)
- WI-0503 scheduling anomaly report helper extraction and line-budget phase 1 (`anomaly-report-helpers.ts` 신규 + 이상탐지 리포트 타입/빌더/권장조치 helper 분리 + `scheduling/service.ts` 4763->4624 축소 + 기존 타입 service re-export 유지 + `e2e-wi0503` 회귀 테스트 추가)
- WI-0504 runtime line-budget recovery for withholding/contracts (`withholding-receipt/copy-runtime.ts` 407->344, `contracts/http.ts` 231->211 축소 + 기존 런타임 에러 정규화/읽기 함수 시그니처 유지 + `e2e-wi0466`, `e2e-wi0489`, `e2e-wi0504` 회귀 테스트 통과)
- WI-0505 admin people directory actions hook extraction and line-budget margin (`useAdminPeopleDirectoryActions` 신규로 `admin/people/page.tsx` API 액션 오케스트레이션 분리 + `page.tsx` 499->377 축소 + `e2e-wi0505` 회귀 테스트 추가)
- WI-0506 scheduling anomaly cockpit projection helper extraction and line-budget phase 2 (`anomaly-cockpit-report-helpers.ts` 신규 + cockpit employee/queue/severity projection 분리 + `scheduling/service.ts` 4624->4551 축소 + `e2e-wi0506` 회귀 테스트 추가)
- WI-0507 employee page interaction orchestrator hook extraction and line-budget margin (`page-interaction-orchestrator.ts` 신규 + `BuildEmployeeInteractionHandlersInput` export + `employee/page.tsx` interaction input 조립 hook 추출 + legacy handler invocation anchor 유지 + `e2e-wi0507` 회귀 테스트 추가)
- WI-0508 scheduling anomaly queue helper extraction and line-budget phase 3 (`anomaly-incident-queue-helpers.ts` 신규 + incident queue 필터/SLA 매칭 빌더 분리 + `scheduling/service.ts` 4551->4505 축소 + `e2e-wi0508` 회귀 테스트 추가)
- WI-0509 scheduling anomaly auto-action helper extraction and line-budget phase 4 (`anomaly-incident-auto-action-helpers.ts` 신규 + auto-action assignment decision/집계 루프 분리 + `scheduling/service.ts` 4505->4411 축소 + `e2e-wi0509` 회귀 테스트 추가)
- WI-0510 scheduling anomaly archive helper extraction and line-budget phase 5 (`anomaly-incident-archive-helpers.ts` 신규 + archive 후보 필터/실행 루프 분리 + `scheduling/service.ts` 4411->4349 축소 + `e2e-wi0510` 회귀 테스트 추가)
- WI-0511 scheduling anomaly replay helper extraction and line-budget phase 6 (`anomaly-incident-replay-helpers.ts` 신규 + replay 대상선택/실행 루프 분리 + `scheduling/service.ts` 4349->4306 축소 + `e2e-wi0511` 회귀 테스트 추가)
- WI-0512 scheduling anomaly reconcile helper extraction and line-budget phase 7 (`anomaly-incident-reconcile-helpers.ts` 신규 + store/audit 비교/카운트/선택 로직 분리 + `scheduling/service.ts` 4306->4236 축소 + `e2e-wi0512` 회귀 테스트 추가)
- WI-0513 scheduling anomaly escalation helper extraction and line-budget phase 8 (`anomaly-incident-escalation-helpers.ts` 신규 + escalation cooldown index/요청 실행 루프 분리 + `scheduling/service.ts` 4236->4172 축소 + `e2e-wi0513` 회귀 테스트 추가)
- WI-0514 scheduling anomaly incident list helper extraction and line-budget phase 9 (`anomaly-incident-list-helpers.ts` 신규 + incident list filter/slice/clone 조립 분리 + `scheduling/service.ts` <=4200 가드 유지 + `e2e-wi0514` 회귀 테스트 추가)
- WI-0515 scheduling anomaly read helper extraction and line-budget phase 10 (`anomaly-incident-read-helpers.ts` 신규 + incident 조회/tenant 경계 검증 분리 + `scheduling/service.ts` 4172->4165 축소 + `e2e-wi0515` 회귀 테스트 추가)
- WI-0516 scheduling anomaly auto-action notification helper extraction and line-budget phase 11 (`anomaly-incident-auto-action-helpers.ts`에 auto-action 실행 알림/실패 감사 분기 helper 추가 + `executeScheduleAnomalyIncidentAutoAction` 본문 slim화 + `e2e-wi0516` 회귀 테스트 추가)
- WI-0517 contract signature execution action policy hardening (`document-action-policy.ts` 신규 + `/admin/contracts` 상태별 실행 가능 액션/다음 단계 가이드 적용 + `/employee/contracts` 응답 가능 상태(`SENT`) 정책 정렬 + `e2e-wi0517` 회귀 테스트 추가)
- WI-0518 contract expiry renewal queue filters (`/admin/contracts` 문서 큐에 만료 임박 기간(`ALL/7/14/30`) 필터 + 갱신 후보 전용 토글 + 만료 임박/갱신 후보 카운터 추가 + `e2e-wi0518` 회귀 테스트 추가)
- WI-0519 admin analytics web baseline and csv export (`/admin/analytics` 신규 라우트 + 관리자 네비/다국어 라벨 연결 + KPI 기반 분석 모드 타이틀/설명 + 현재 뷰 CSV 내보내기 액션 + `e2e-wi0519` 회귀 테스트 추가)
- WI-0520 admin people history action/field filters (`/admin/people` 인사 이력 패널에 액션/변경필드 필터 추가 + visible/total 이력 카운트 + 필터 기준 변경 요약 반영 + `e2e-wi0520` 회귀 테스트 추가)
- WI-0521 mobile employee request API integration with local fallback (모바일 요청 제출/이력/팔로업 화면을 API-first 동기화로 전환 + `/api/leave/requests`/`/api/attendance/records` 매핑 브리지 + API 실패 시 local store fallback 유지 + `e2e-wi0521` 회귀 테스트 추가)
- WI-0522 i18n one-shot sweep and ci guard (`docs/codex-guide.md`에 one-shot i18n 종료 규칙 고정 + ko 핵심 화면 mojibake 토큰 금지 CI 가드 + 최근 로드맵 구간 i18n phase-loop 금지 회귀 테스트(`e2e-wi0522`) 추가)
- WI-0523 admin benefits over-limit risk filter and summary (`/admin/benefits` 승인 큐에 요청 위험 필터(`전체/한도 초과`) 추가 + 한도 초과 요청 건수 요약 + 요청별 초과 배지/초과 금액 표시 + `AdminBenefitsWorkspace.tsx` 라인예산(<=300) 유지 + `e2e-wi0523` 회귀 테스트 추가)
- WI-0524 admin recruitment stalled risk filter and summary (`/admin/recruitment` 추천 큐에 위험 필터(`전체/7일 이상 정체`) 추가 + 비종결 단계 정체 건수 요약 + 정체 후보 배지 표시 + `AdminRecruitmentWorkspace.tsx` 라인예산(<=300) 유지 + `e2e-wi0524` 회귀 테스트 추가)
- WI-0525 employee contracts deadline risk queue (`/employee/contracts` 받은함에 기한 위험 필터(`전체/임박(D-3)/기한초과`) 추가 + 필터된 뷰 기준 임박/초과 건수 요약 + 응답 상세 패널 분리(`EmployeeContractsResponsePanel`)로 라인예산(<=300) 유지 + `e2e-wi0525` 회귀 테스트 추가)
- WI-0526 korean residual sweep one-shot for withholding/payslip/contracts (원천징수/명세서/전자계약함 한국어 표면 잔존 영어 전수 점검 + 명세서 근태 시간 단위 ko 로케일 표기(`시간`) 고정 + 분리된 계약 응답 패널 기준 회귀 테스트 정렬 + `e2e-wi0526` 회귀 테스트 추가)
- WI-0527 employee notice read-status filter and line-budget hardening (`/employee/notices` 조회 패널에 읽음 상태 필터(`전체/미확인/확인함`) 추가 + `EmployeeNoticeBoardList`/`employee-notice-board-helpers` 분해로 보드 오케스트레이션 집중 + 공지 copy 키 확장 + `e2e-wi0527` 회귀 테스트 추가)
- WI-0528 payroll accuracy settlement-recalculation cross-check and mismatch summary (`accuracy-evidence`에 정산/재계산 기준 교차검증 추가 + `/admin/payroll-year-end` 증빙 패널에 불일치 항목 요약 노출 + `e2e-wi0528` 회귀 테스트 추가)
- WI-0529 payslip detail print verification section (`/employee/payslips` 상세 패널에 출력 검증(검증 실수령/명세 실수령/일치여부) 섹션 추가 + locale copy/type 확장 + `e2e-wi0529` 회귀 테스트 추가)
- WI-0530 contract template builder draft validation checklist (`/admin/contracts/builder`에 초안 검증 체크리스트(이름/조항/필수/중복) 추가 + 체크 미통과 시 생성 차단 + checklist helper 분리 + `e2e-wi0530` 회귀 테스트 추가)
- WI-0531 employee schedule conflict candidate guidance (`/employee/schedule` 조회 결과 기반 충돌 후보 건수 계산 helper 추가 + 상태 메시지에 후속 추적 힌트 노출 + 라인예산 유지 + `e2e-wi0531` 회귀 테스트 추가)
- WI-0532 admin analytics focus metric filter and csv alignment (`/admin/analytics` 집중 지표 필터(`all/pending/stalled/attendance/leave/payroll`) 추가 + 현재 포커스 뷰 기준 CSV export 반영 + line-budget 유지 + `e2e-wi0532` 회귀 테스트 추가)
- WI-0533 scheduling template assignment helper reuse and line-budget recovery (`scheduling/service.ts`에 템플릿 범위 윈도우 helper 재사용 + range/rotation assignment의 생성 루프를 `createSchedulesFromGeneratedWindows`로 일원화 + line-budget 축소 + `e2e-wi0533` 회귀 테스트 추가)
- WI-0534 admin notices delivery-risk visibility (`/admin/notices`에서 게시 공지 중 읽음 0건 전달위험 수 요약 추가 + 목록 항목 전달확인 필요 배지 노출 + `e2e-wi0534` 회귀 테스트 추가)
- WI-0535 employee notices unread-aging guidance (`/employee/notices` 미확인 공지 D+경과일 표시 + 3일 이상 지연 배지 추가 + unread aging helper 분리 + `e2e-wi0535` 회귀 테스트 추가)
- WI-0536 admin benefits pending-aging risk summary (`/admin/benefits` 승인대기 3일 이상 요청 요약/배지 추가 + 기존 한도초과 위험 요약과 병행 노출 + `e2e-wi0536` 회귀 테스트 추가)
- WI-0537 employee benefits annual-limit remaining preview (`/employee/benefits` 선택 항목 기준 사용/대기 합계 및 신청 후 예상 잔여 한도 프리뷰 추가 + 초과 예상 경고문 추가 + `e2e-wi0537` 회귀 테스트 추가)
- WI-0538 admin recruitment stalled-risk expansion (`/admin/recruitment` 정체 위험 필터를 7일/14일로 확장 + 14일 이상 임계치 요약/긴급 배지 추가 + `e2e-wi0538` 회귀 테스트 추가)
- WI-0539 employee recruitment stalled-risk self-service filter (`/employee/recruitment` 추천 이력에 정체 위험 필터(7일/14일) + 임계치 카운트/배지 노출 추가 + `e2e-wi0539` 회귀 테스트 추가)
- WI-0540 admin contracts SLA risk filter and summary (`/admin/contracts` 문서 큐에 SLA 위험 필터(`ALL/DUE_SOON/OVERDUE`) + 위험 카운트 요약 + 행 단위 SLA 임박/초과 배지 추가 + `e2e-wi0540` 회귀 테스트 추가)
- WI-0541 contract template builder baseline diff (`/admin/contracts/builder`에 기준본 캡처/초기화 + 생성 본문 라인 단위 diff(추가/삭제/무변경) 패널 추가 + diff helper 분리 + `e2e-wi0541` 회귀 테스트 추가)
- WI-0542 employee contracts risk-priority sort and badge (`/employee/contracts` 받은함을 SLA 위험 우선(기한초과→임박) 정렬 + 문서별 위험 배지 노출 + inbox risk helper 확장 + `e2e-wi0542` 회귀 테스트 추가)
- WI-0543 admin analytics contract SLA overdue metric (`/admin/analytics`에 계약 SLA 기한초과 지표 추가 + 포커스 필터/카드/추세행/CSV 스냅샷 반영 + summary/copy 확장 + `e2e-wi0543` 회귀 테스트 추가)
- WI-0544 admin people history top-change hotspot summary (`/admin/people` 인사이력 패널에 현재 필터 기준 최다 변경 필드(핫스팟) 요약 추가 + line-budget 유지 + `e2e-wi0544` 회귀 테스트 추가)
- WI-0545 contracts risk filter quick toggles (`/admin/contracts` SLA 필터 원클릭 토글 + `/employee/contracts` 기한 필터 원클릭 토글 추가로 위험 큐 전환 속도 개선 + `e2e-wi0545` 회귀 테스트 추가)
- WI-0546 employee notices unread-aging risk filter and summary (`/employee/notices`에 읽음 지연 위험 필터(`all/aging_3d`) + 3일 이상 미확인 요약 카운트 추가 + notice helper에 aging risk 정규화/필터링 로직 확장 + `e2e-wi0546` 회귀 테스트 추가)
- WI-0547 employee benefits pending-aging risk filter and badge (`/employee/benefits` 신청 이력에 승인대기 위험 필터(`all/pending_3d`) + 3일 이상 대기 요약/행 배지/D+일수 표시 + benefits copy/helper 확장 + `e2e-wi0547` 회귀 테스트 추가)
- WI-0548 employee recruitment opening filter and stalled-days visibility (`/employee/recruitment` 추천 이력에 공고 필터(`all/openingId`) + 공고 기준 표시 건수 요약 + 추천별 정체 경과(D+일수) 표시 + `e2e-wi0548` 회귀 테스트 추가)
- WI-0549 employee benefits workspace view decomposition and line-budget recovery (`EmployeeBenefitsWorkspace.tsx`를 orchestration 전용으로 축소 + `EmployeeBenefitsWorkspaceView.tsx`/`employee-benefits-helpers.ts` 분리 + workspace line-budget <=300 유지 + `e2e-wi0549` 회귀 테스트 추가)
- WI-0550 employee recruitment workspace view decomposition and line-budget recovery (`EmployeeRecruitmentWorkspace.tsx`를 orchestration 전용으로 축소 + `EmployeeRecruitmentWorkspaceView.tsx`/`employee-recruitment-helpers.ts` 분리 + workspace line-budget <=300 유지 + `e2e-wi0550` 회귀 테스트 추가)
- WI-0551 scheduling rotation fairness selection helper extraction and line-budget recovery (`rotation-fairness-selection-helpers.ts` 신규 + 추천 선택/advanced summary 집계 helper 분리 + `scheduling/service.ts` 4000 라인 가드 유지 + `e2e-wi0551` 회귀 테스트 추가)
- WI-0552 payroll year-end filing filtered-empty guidance and transport summary localization (`PayrollYearEndFilingConsole.tsx` 제출 목록 패널에 필터 결과 0건 전용 안내(`noSubmissionMatchesFilters`) 추가 + 전송 요약의 `nts_api_mock` 하드코딩을 locale copy(`transportShortNtsApiMockLabel`)로 치환 + `e2e-wi0552` 회귀 테스트 추가)
- WI-0553 withholding receipt document metadata copy action (`WithholdingReceiptPanels.tsx` 문서 요약 패널에 `문서 메타데이터 복사` 액션 추가 + `WithholdingReceiptConsole.tsx` clipboard 복사 핸들러 연결 + copy-runtime 키(`actionCopyDocumentMetadata`, `copiedDocumentMetadataStatus`) 확장 + `e2e-wi0553` 회귀 테스트 추가)
- WI-0554 employee payslip receipt status summary and filter helper extraction (`payslip-receipt-filter-helpers.ts` 신규로 상태/검색/대기건 집계 로직 추출 + `/employee/payslip-receipts` 상태 요약(대기/확인/미배포) 노출 + `PayslipReceiptConsole.tsx` <=300 라인 유지 + `e2e-wi0554` 회귀 테스트 추가)
- WI-0555 admin contracts expiration window quick toggles (`AdminContractsDocumentFilterControls.tsx`에 만료 임박 기간 원클릭 토글(`ALL/7/14/30`) 추가 + 기존 필터 copy 재사용으로 i18n 표면 유지 + `e2e-wi0555` 회귀 테스트 추가)
- WI-0556 admin people history hotspot quick-filter chips (`/admin/people` 이력 변경 요약 칩을 버튼화하여 클릭 시 `historyFieldFilter` 즉시 적용 + hotspot 요약→상세 필터 전환 속도 개선 + `e2e-wi0556` 회귀 테스트 추가)
- WI-0557 scheduling template-date helper extraction and line-budget recovery (`template-date-helpers.ts` 신규로 KST 날짜 파싱/요일 계산/범위 열거 헬퍼 추출 + `scheduling/service.ts` import 재배선 및 <=4000 라인 가드 유지 + `e2e-wi0557` 회귀 테스트 추가)
- WI-0558 payroll year-end filing value helper extraction and line-budget recovery (`value-helpers.ts` extraction for parse/format timeline helpers + `PayrollYearEndFilingConsole.tsx` helper import rewiring + `e2e-wi0558` regression)
- WI-0559 payroll year-end filing submission request helper extraction (`submission-request-helpers.ts` extraction for list-query/submit/ack/resubmit payload builders + `PayrollYearEndFilingConsole.tsx` request payload delegation + `e2e-wi0559` regression)
- WI-0560 payroll year-end filing submission state helper extraction (`submission-state-helpers.ts` extraction for upsert/replace/filter-summary builders + `PayrollYearEndFilingConsole.tsx` state update/active-filter summary delegation + `e2e-wi0560` regression)
- WI-0561 employee contracts response quick comment templates (`EmployeeContractsResponsePanel.tsx` quick comment template actions + `contracts/copy.ts` locale copy extension + `e2e-wi0561` regression)
- WI-0562 admin analytics quick drilldown controls (`AdminKpiSections.tsx` quick metric drilldown button set + `admin-kpi/copy.ts` locale keys extension + line-budget <=300 ���� + `e2e-wi0562` regression)
- WI-0563 scheduling rotation window helper extraction and line-budget recovery (`rotation-window-helpers.ts` extraction for template window/rotation builders + `scheduling/service.ts` helper import rewiring + `e2e-wi0563` regression)
- WI-0564 scheduling rotation optimization evaluation helper extraction and line-budget recovery (`rotation-optimization-evaluation-helpers.ts` extraction for offset evaluation/ranking logic + `scheduling/service.ts` best-rotation flow helper delegation + `e2e-wi0564` regression)
- WI-0565 scheduling anomaly incident core helper extraction (`anomaly-incident-core-helpers.ts` extraction for lifecycle normalization/update payload builders and list/SLA audit/response builders + `scheduling/service.ts` lifecycle/list/SLA helper delegation + `e2e-wi0565` regression)
- WI-0566 employee self-service interaction setter bundle extraction (`page-interaction-setter-bundles.ts` extraction for attendance/leave/request/period setter bundle composition + `employee/page.tsx` orchestration helper delegation + `e2e-wi0566` regression)

- WI-0567 scheduling anomaly auto-action summary/result helper extraction (anomaly-incident-auto-action-helpers.ts extraction for auto-action audit/event summary and service result payload builders + scheduling/service.ts auto-action execution payload delegation + e2e-wi0567 regression)

- WI-0568 scheduling anomaly escalation summary/result helper extraction (anomaly-incident-escalation-helpers.ts extraction for escalation generated audit summary and response payload builders + scheduling/service.ts escalation payload delegation + e2e-wi0568 regression)

- WI-0569 scheduling anomaly escalation request payload helper extraction (anomaly-incident-escalation-helpers.ts extraction for escalation requested/failed payload builders + scheduling/service.ts escalation request payload delegation + e2e-wi0569 regression)

- WI-0570 scheduling anomaly auto-action assign-failed payload helper extraction (anomaly-incident-auto-action-helpers.ts extraction for auto_action.assign.failed audit payload builder + scheduling/service.ts failure-path payload delegation + e2e-wi0570 regression)

- WI-0571 scheduling anomaly auto-action audit entry helper extraction (anomaly-incident-auto-action-audit-helpers.ts extraction for assign-failed/generated/execution audit entry builders + scheduling/service.ts auto-action audit append delegation + e2e-wi0571 regression)

- WI-0572 scheduling anomaly archive summary/result helper extraction (anomaly-incident-archive-helpers.ts extraction for archive action/generated audit payload builders and archive result builder + scheduling/service.ts archive payload/result delegation + e2e-wi0572 regression)

- WI-0573 scheduling anomaly replay summary/result helper extraction (anomaly-incident-replay-helpers.ts extraction for replay action/generated audit payload builders and replay result builder + scheduling/service.ts replay payload/result delegation + e2e-wi0573 regression)

- WI-0574 scheduling anomaly reconcile summary/result helper extraction (anomaly-incident-reconcile-helpers.ts extraction for reconcile generated audit payload and reconcile result builder + scheduling/service.ts reconcile payload/result delegation + e2e-wi0574 regression)

- WI-0575 scheduling anomaly cockpit summary/result helper extraction (anomaly-cockpit-report-helpers.ts extraction for cockpit generated audit payload and cockpit report builder + scheduling/service.ts cockpit payload/result delegation + e2e-wi0575 regression)

- WI-0576 scheduling anomaly read audit payload helper extraction (anomaly-incident-read-helpers.ts extraction for incident read audit payload builder + scheduling/service.ts read-audit payload delegation + e2e-wi0576 regression)

- WI-0577 scheduling anomaly report summary/result helper extraction (anomaly-report-helpers.ts extraction for anomaly report generated audit payload and report result builder + scheduling/service.ts anomaly-report payload/result delegation + e2e-wi0577 regression)

- WI-0578 scheduling anomaly lifecycle audit/response helper extraction (anomaly-incident-core-helpers.ts extraction for lifecycle audit payload and lifecycle response builders + scheduling/service.ts lifecycle payload/result delegation + e2e-wi0578 regression)
- WI-0579 korean residual one-shot and CI guard (contracts/payslips runtime fallback copy corruption fix + template-builder-checklist locale label hardening + e2e-wi0579 CI guard wiring via test:e2e:ko-guard)
- WI-0580 employee contract inbox journey refinement (next-action locale guidance + due-soon/overdue D-day helper + employee inbox urgency badges and response-panel next-step hint + e2e-wi0580 regression)
- WI-0581 employee contract signature input guard (`/employee/contracts` sign flow now requires non-empty signature input before submit + response panel sign action is disabled until input is provided with locale hint/error copy + `e2e-wi0581` regression test added)
- WI-0582 employee contract evidence metadata copy action (`/employee/contracts` response evidence panel now supports clipboard copy for evidence metadata(file/generatedAt/SHA256) + localized success/error feedback via existing message channel + `e2e-wi0582` regression test added)
- WI-0583 employee contract hash copy actions (`/employee/contracts` response detail panel now supports signature/evidence hash clipboard copy actions + localized copy success/error feedback + `e2e-wi0583` regression test added)
- WI-0584 employee contract response history panel (`/employee/contracts` response panel now renders recent response history(signed/rejected/evidence-loaded) with locale copy and descending timeline order + `e2e-wi0584` regression test added)
- WI-0585 employee contract response history filter (/employee/contracts response history now supports event-type filters(all/signed/rejected/evidence), visible-count summary, and filter-aware empty guidance + e2e-wi0585 regression test added)
- WI-0586 employee contract response history status summary (`/employee/contracts` response history now derives per-event counters(signed/rejected/evidence), renders count-badged filter actions, and shows status distribution summary with `e2e-wi0586` regression test added)
- WI-0587 korean surface one-shot guard for withholding/payslips/contracts (`/employee/withholding-receipt`, `/employee/payslips`, `/employee/contracts` KO core labels locked by regression guard to prevent English fallback reintroduction + `e2e-wi0587` test added)
- WI-0588 employee schedule conflict quick correction action (`/employee/schedule` now shows immediate attendance-correction CTA when conflict candidates are detected and links to `/employee#attendance` + `e2e-wi0588` regression test added)
- WI-0589 admin approval queue quick visibility (`ApprovalQueueSearchSortPanel` now exposes visible/critical/watch/selected summary counts and a quick action to focus the highest-critical queue + `e2e-wi0589` regression test added)
- WI-0590 admin contracts decision queue visibility (/admin/contracts ���� ���Ϳ� ��� ó�� ť(REQUEST_APPROVAL/APPROVE_OR_REJECT/SEND_DOCUMENT) ���� ��� + ���� ��� �Ǽ� ��� �߰� + e2e-wi0590 ȸ�� �׽�Ʈ)
- WI-0591 employee contracts action needed queue visibility (/employee/contracts �����Կ� ction_needed(�ӹ�+�ʰ�) ����, ���� ��ȯ ��ư, ��ġ �ʿ� �Ǽ� ��� �߰� + e2e-wi0591 ȸ�� �׽�Ʈ)
- WI-0592 admin analytics contract decision queue KPI (/admin/analytics�� ��� �ǻ���� ť(REQUEST_APPROVAL/APPROVE_OR_REJECT/SEND) ��ǥ �߰� + KPI ī��/������ǥ/�帱�ٿ�/CSV ������ �ݿ� + e2e-wi0592 ȸ�� �׽�Ʈ)
- WI-0593 withholding receipt validation summary (/employee/withholding-receipt ������ ��࿡ ���� ���(���� �׸�/���� ����/��ġ �ʿ� ����) �߰� + ko/en locale ī�� Ȯ�� + e2e-wi0593 ȸ�� �׽�Ʈ)
- WI-0594 admin people org chart staffing summary (/admin/people ������ �гο� ����/�μ�/Ȱ���� ���, ������ ����/�μ� ���� �� ���ü�, �μ��� Ȱ��/��Ȱ�� �ο� ���� �߰� + e2e-wi0594 ȸ�� �׽�Ʈ)
- WI-0595 admin people org-chart risk focus filters (/admin/people ������ �гο� �������� ���(��ü/��Ȱ��/������)�� ��庰 ī��Ʈ �߰� + ���� ��� 0�� �ȳ� + e2e-wi0595 ȸ�� �׽�Ʈ)
- WI-0596 korean residual bugpack for withholding/payslips/contracts inbox (��õ¡�� �α�/��� �� ko ����ȭ + ���ڰ���� ���� fallback ��(�� �� ���� ����/���� ����) �߰� + ������ ��� ������ ������ ����ȭ + e2e-wi0596 ȸ�� �׽�Ʈ)
- WI-0597 scheduling side-effect helper extraction and contracts status fallback hardening (scheduling/service.ts side-effect+input validation helpers extracted to nomaly-side-effect-helpers.ts and schedule-input-normalization-helpers.ts + /admin/contracts and /employee/contracts status labels now use ko-safe fallback resolvers + e2e-wi0597 regression test)
- WI-0598 scheduling service split phase 2 (extract anomaly actor/permission/tenant context into anomaly-service-context-helpers.ts and replace repeated boilerplate across incident lifecycle/list/sla/escalation/auto-action/archive/replay/reconcile/read/cockpit APIs + scheduling/service.ts 3422->3365 + e2e-wi0598 regression test)
- WI-0599 admin payroll year-end filing failure-action UX hardening (/admin/payroll-year-end-filing failure handling now stores latest failed action context and exposes retry/follow-up actions + request-feedback-helpers extraction for API log/error-message normalization + console line budget <=1300 + e2e-wi0599 regression test)
- WI-0600 admin contracts next-step filter and summary (/admin/contracts ���� ���Ϳ� next-step ���� ����(ALL/request/approve/send/wait/renew/no-action) �߰� + next-step ť ���/���� ��� �߰� + ��� ���� ���� hook�� nextStepCounts ���� Ȯ�� + e2e-wi0600 ȸ�� �׽�Ʈ)
- WI-0601 admin payroll year-end filing preflight blocker actions (preflight checklist load + blocker follow-up actions + filing console panel decomposition and line-budget keep <=1300)
- WI-0602 admin payroll year-end filing preflight settlement-hash copy action (clipboard quick-copy + expected-hash guard paste hint in blocker panel)
- WI-0603 admin payroll year-end preflight direct shortcut actions (blocker-key specific direct links to payroll-close and payslip-delivery)
- WI-0604 admin payroll year-end preflight settlement-hash warning action (preflight warning row for settlement_hash_available now provides direct finalization-preview rerun action with localized ko/en labels + e2e-wi0604 regression test)
- WI-0605 admin payroll year-end preflight rejected-submission warning action (new no_rejected_filing_submissions checklist warning + blocker-panel direct action opens rejected submission queue with acknowledged/rejected filter preset + e2e-wi0605 regression test)
- WI-0606 admin payroll year-end failure panel context shortcuts (failure panel now shows preflight reload shortcut for preflight_checklist failures and rejected queue shortcut for submission failure actions + e2e-wi0606 regression test)
- WI-0607 admin payroll preflight shortcut filter normalization (pending/rejected shortcut actions now reset stale settlement-hash filter and default sort to submittedAt/desc before refresh + e2e-wi0607 regression test)
- WI-0608 admin payroll preflight shortcut status feedback (pending/rejected preflight shortcut actions now emit immediate localized queue-open status feedback before refresh completion + e2e-wi0608 regression test)
- WI-0609 admin payroll KR withholding precision default auto preset (statutory payroll preview now defaults incomeTaxLookupPresetAuto=true for KR simple-tax-table precision + WI-0283 expectation sync + e2e-wi0609 regression guard)
- WI-0610 payroll insurance settlement policy preset auto-selection precision (preview-insurance-settlement adds insurancePolicyPresetId + insurancePolicyPresetAuto + optional insurancePolicyAsOf with deterministic preset resolution trace/rate-cap output, manual-rate override compatibility, and e2e-wi0610 regression guard)
- WI-0611 admin payroll-insurance policy preset mode controls (/admin/payroll-insurance input panel adds manual/preset-id/preset-auto controls with insurancePolicyPresetId/insurancePolicyPresetAuto/optional insurancePolicyAsOf payload wiring + summary policy preset/rate/cap trace visibility + e2e-wi0611 regression guard)
- WI-0612 scheduling service incident query helper extraction (anomaly-incident-query-service-helpers.ts extraction for incident list/read query orchestration + scheduling/service.ts delegation + e2e-wi0612 regression test)
- WI-0613 admin scheduling incident query UX summary (/admin/scheduling adds anomaly incident queue panel with state/assignee/topN filters, quick filter buttons, and summary counts via /api/scheduling/anomalies/incidents + e2e-wi0613 regression guard)
- WI-0614 admin scheduling incident lifecycle actions (/admin/scheduling incident panel adds incident selection + acknowledge/assign/resolve actions wired to existing anomaly incident APIs with localized status/pending feedback + e2e-wi0614 regression guard)
- WI-0615 employee schedule attendance correction CTA (/employee/schedule actions add direct link to /employee#attendance with schedule context query (ttendanceSource, romDate, 	oDate) using localized quick-correction copy + e2e-wi0615 regression guard)
- WI-0616 employee attendance correction prefill from schedule context (`/employee` now reads `attendanceSource=schedule&fromDate&toDate` and pre-fills correction form(check-in/check-out/note) + auto-selects latest correction target in schedule range when attendance is loaded + e2e-wi0616 regression guard)
- WI-0617 korean runtime guard hardening for withholding/payslips/contracts (withholding activity label normalizer now maps legacy english aliases and suppresses unmapped english to ko-safe fallback + employee contracts response history evidence format detail uses localized labels instead of raw JSON/TEXT + e2e-wi0617 regression guard)
- WI-0618 admin dashboard productization and session-context guard (/admin converted to summary dashboard + workspace shortcuts, hash-section nav removed in admin layout, and /admin/people manual organization/actor/token inputs replaced with read-only session context + e2e-wi0618 regression guard)
- WI-0619 admin scheduling session-context and devtools log gate (/admin/scheduling now uses session-derived organization/actor/token context, removes manual context inputs, and hides request logs unless devtools flag is enabled + e2e-wi0619 regression guard)
- WI-0620 notices/benefits/recruitment session-context productization (/admin|/employee notices/benefits/recruitment remove manual organization/actor/token inputs, adopt read-only session context metadata, and gate admin request logs behind devtools + e2e-wi0620 regression guard)
- WI-0621 employee schedule session-context productization (/employee/schedule removes manual organization/employee/token inputs, adopts read-only session context metadata, and gates API logs behind devtools + e2e-wi0621 regression guard)
- WI-0622 admin attendance/onboarding/analytics session-context productization (/admin/attendance-live, /admin/onboarding, /admin/analytics remove manual organization/actor/token fields, show read-only session metadata, and gate logs behind devtools where applicable + e2e-wi0622 regression guard)
- WI-0625 employee payslips session-context productization (/employee/payslips removes manual organization/employee/token inputs on filter panel and adopts read-only session context metadata while preserving period/search/compare flows + e2e-wi0625 regression guard)
- WI-0626 admin approval pages session-context productization (/admin/approval-executions, /admin/approval-history, /admin/approval-policy, /admin/approval-templates remove manual organization/admin/token inputs and show read-only session context metadata + e2e-wi0626 regression guard)
- WI-0627 employee withholding/payslip receipts session-context productization (/employee/withholding-receipt and /employee/payslip-receipts remove manual organization/employee/token inputs, show read-only session context metadata, and gate request logs behind devtools + e2e-wi0627 regression guard)
- WI-0628 admin payroll close/payslip-delivery session-context productization (/admin/payroll-close and /admin/payroll-payslip-delivery remove manual organization/actor/token inputs, show read-only session metadata, and gate API logs behind devtools + e2e-wi0628 regression guard)
- WI-0629 admin payroll year-end/preflight session-context productization (/admin/payroll-year-end and /admin/payroll-year-end/preflight remove manual organization/actor/token inputs, show read-only session metadata, and gate API logs behind devtools + e2e-wi0629 regression guard)
- WI-0630 admin payroll year-end filing session-context productization (/admin/payroll-year-end-filing removes manual organization/actor/token inputs, shows read-only session metadata, and gates API logs behind devtools + e2e-wi0630 regression guard)
