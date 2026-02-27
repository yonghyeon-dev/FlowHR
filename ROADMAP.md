# FlowHR Production Roadmap

> **Last updated**: 2026-02-26
> **Current version**: 0.1.187 (Employee Core Journey Risk Filter + Workspace Decomposition + Scheduling Fairness Helper Extraction)
> **Target**: Production-grade Korean HR SaaS (Shiftee/Flex superior)

---

## 0. ??ë¡œë“œë§µì„ ?¬ìš©?˜ëŠ” ë°©ë²• (FlowHR ë°©ì‹)

- ?¤í™/ê³„ì•½???¨ì¼ ?ŒìŠ¤??`specs/*/(contract.yaml, api.yaml, test-cases.md)` ?…ë‹ˆ??
- ??ë¬¸ì„œ???œìš°? ìˆœ???˜ì¡´???¨ê³„?ë? ?¤ëª…?˜ëŠ” ì°¸ê³  ë¬¸ì„œ?´ë©°, ë³€ê²½ì? PRë¡?ì¶”ì ?©ë‹ˆ??
- ?‘ì—… ?ë¦„?€ ?„ë˜ ?œì„œë¥?ê¸°ë³¸?¼ë¡œ ?©ë‹ˆ??
  - Work Item(`work-items/`) ??Contract/API/Testcases(`specs/`) ??êµ¬í˜„/?ŒìŠ¤??`src/`, `scripts/tests/`) ??ë¨¸ì?
- ?´ì˜/ê±°ë²„?ŒìŠ¤ ë¬¸ì„œ(?„ìˆ˜ ê¸°ì?):
  - ê²°ì •ê¶??¹ì¸: `docs/raci.md`
  - ?°ì´???Œìœ ê¶? `docs/data-ownership.md`
  - ê¸´ê¸‰ ë¨¸ì?(break-glass): `docs/break-glass.md`
  - ê³„ì•½ ë²„ì „/?ê¸°: `contracts/versioning.md`
  - QA ê²Œì´?? `qa/gate.checklist.md`
  - ?ŒìŠ¤???¤ìœ„???´ì˜: `docs/test-suites.md`
  - ?ìœ„?¸í™˜ KPI ê¸°ì?: `docs/competitive-scorecard.md`

## 1. ?„ì¬ ?íƒœ ?”ì•½

### ?„ë£Œ WI ëª©ë¡ (WI-0001 ~ WI-0080)

| WI | ?œëª© | ì¹´í…Œê³ ë¦¬ |
|----|-------|----------|
| WI-0001 | Attendance ??Payroll ?˜ì§ ?¬ë¼?´ìŠ¤ | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0002 | Leave Request/Approval ?˜ì§ ?¬ë¼?´ìŠ¤ | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0003 | Leave Accrual/Carry-over Settlement | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0004 | Domain Event HTTP Transport | ?¸í”„??|
| WI-0005 | Payroll Phase 2 Deductions/Tax Contract | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0006 | Payroll Deduction Profile Runtime | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0007 | MVP Operations Console | UI |
| WI-0008 | State Transition Idempotency Guard | ?ˆì •??|
| WI-0009 | Attendance Rejection Flow | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0010 | Payroll Profile Version Guard | ?ˆì •??|
| WI-0011 | Slack Alert Unification | ?´ì˜ |
| WI-0013 | Discord Alert Webhook Support | ?´ì˜ |
| WI-0014 | Alert Webhook Regression Tests | ?ˆì§ˆ |
| WI-0015 | Event Governance Traceability Check | ê±°ë²„?ŒìŠ¤ |
| WI-0016 | Attendance Rejection Reason | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0017 | Attendance Reject Validation Guards | ?ˆì§ˆ |
| WI-0018 | Contract/API Version Alignment Gate | ê±°ë²„?ŒìŠ¤ |
| WI-0019 | API/Contract Coupling Gate | ê±°ë²„?ŒìŠ¤ |
| WI-0020 | Contract Governance Regression Tests | ?ˆì§ˆ |
| WI-0021 | PR Template Compliance Gate | ê±°ë²„?ŒìŠ¤ |
| WI-0022 | Alert Context Links | ?´ì˜ |
| WI-0023 | PR Template Regression Tests | ?ˆì§ˆ |
| WI-0024 | Golden Change-Control Gate | ê±°ë²„?ŒìŠ¤ |
| WI-0025 | Local Dev Port and Artifacts | ê°œë°œ ?˜ê²½ |
| WI-0026 | Attendance List API | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0027 | Leave List API | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0028 | Payroll Run List API | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0029 | Console List Actions | UI |
| WI-0030 | Deduction Profile List API | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0031 | Attendance Aggregates API | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0032 | Reduce Payroll Phase2 Health Incident Noise | ?´ì˜ |
| WI-0033 | Roadmap Alignment and Phase 1 Backlog Seeding | ê±°ë²„?ŒìŠ¤ |
| WI-0034 | Employee and Organization Master Model | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0035 | employeeId String to FK Migration | ?ˆì •??|
| WI-0036 | RBAC Engine Foundation | ?ˆì •??|
| WI-0037 | Multi-Tenant Isolation Baseline (Supabase RLS) | ?¸í”„??|
| WI-0038 | Phase2 Health 409 Gate Tuning | ?´ì˜ |
| WI-0039 | Discord Alert Korean | ?´ì˜ |
| WI-0040 | Scheduling Baseline (WorkSchedule API) | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0041 | Scheduling Overlap Guard (WorkSchedule) | ?ˆì •??|
| WI-0042 | Scheduling Update API (WorkSchedule PATCH) | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0043 | Scheduling Delete API (WorkSchedule DELETE) | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0044 | Scheduling Template + Recurring Assignment Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0045 | Scheduling to Attendance Anomaly Report Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0046 | Scheduling Template Multi-Day Range Assignment Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0047 | Scheduling Rotation Assignment Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0048 | Attendance Capture Channel Metadata Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0049 | Attendance GPS Policy Enforcement Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0050 | Attendance Geofence Policy Enforcement Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0051 | Scheduling Anomaly Alert Automation Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0052 | Attendance Trusted Device Policy Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0053 | Attendance Multi-Site Geofence Policy Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0054 | Attendance Device Attestation Policy Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0055 | Scheduling Anomaly Escalation Policy Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0056 | Attendance Anti-Spoofing Policy Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0057 | Scheduling Rotation Balance Report Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0058 | Scheduling Rotation Optimization Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0059 | Scheduling Rotation Fairness Report Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0060 | Attendance Anti-Spoofing Signal Fusion Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0061 | Scheduling Fairness Write-Back Orchestration Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0062 | Attendance External Reputation Integration Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0063 | Scheduling Global Fairness Constraint Solver Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0064 | Attendance Multi-Provider Reputation Orchestration Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0065 | Scheduling Anomaly Cockpit Dashboard Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0066 | Attendance Reputation Circuit-Breaker Operations Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0067 | Scheduling Anomaly Cockpit Ticket Automation Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0068 | Scheduling Anomaly Cockpit Streaming Dashboard Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0069 | Scheduling Advanced Fairness Multi-Objective Optimizer | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0070 | Attendance Reputation Adaptive Routing/Auto-Heal Baseline | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0071 | Scheduling Anomaly Cockpit Ops Dashboard + Stream Incident Automation | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0072 | Scheduling Anomaly Incident Lifecycle Command API | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0073 | Scheduling Anomaly Incident Read-Model API | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0074 | Production Auth Smoke Stabilization and Incident Auto-Close | ?´ì˜ |
| WI-0075 | Scheduling Anomaly Incident Audit-Backed Durable Read-Model | ?ˆì •??|
| WI-0076 | Scheduling Anomaly Incident SLA Monitoring API | ?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤ |
| WI-0077 | Scheduling Anomaly Incident Escalation Automation API | ?´ì˜ |
| WI-0078 | Scheduling Anomaly Incident Auto-Action Execution API | ?´ì˜ |
| WI-0079 | Scheduling Anomaly Incident Durable Store and Cooldown Persistence | ?ˆì •??|
| WI-0080 | Scheduling Anomaly Incident Archive/Replay/Reconcile API | ?´ì˜ |

### ?¤ìŒ ?°ì„ ?œìœ„ (Phase 2 ì§„í–‰)

- ??ê· í˜• ì¡°ì • ?°ì„ ?œìœ„(UI-first window) ?„ë£Œ:
  - ê´€ë¦¬ì ì¡°ì¹˜?œê°„ ?¨ì¶• UI ?¬ì„¤ê³?+ KPI baseline (WI-0081)
  - ì§ì› ?€?„ì„œë¹„ìŠ¤ 90ì´??¬ì • UI baseline (WI-0082)
  - UI ?µì‹¬ ?¬ì • e2e + ?Œê? ì°¨ë‹¨ ê²Œì´??(WI-0083)
  - People ?¨ë³´??UI(ì¡°ì§/ì§ì›) baseline (WI-0084)
  - UI ì»¨í…?¤íŠ¸ ì§€?ì„±(?Œë„Œ??Actor ID) baseline (WI-0085)
  - ê´€ë¦¬ì ?°ì„  ???¸ë¼??ì¡°ì¹˜ UI baseline (WI-0086)
  - ê·¼íƒœ ì§‘ê³„ UI baseline (WI-0087)
- ?´í›„ ë°±ì—”??ê³ ë„??
  - ê·¼ë¬´?¼ì •/êµë?/? ì—°ê·¼ë¬´ ê³ ë„??ê³ ê¸‰ ?œì•½/? í˜¸ ê¸°ë°˜ fairness ìµœì ??
  - ì¶œí‡´ê·??•ì±… ê³ ë„???ì‘???¼ìš°???ë™ë³µêµ¬ ?´ì˜)
  - ?¤ì‹œê°?ê·¼íƒœ ?„í™© ê³ ë„??incident ?ë™ ì¡°ì¹˜ ?¤í–‰ ?Œí¬?Œë¡œ + ?Œë¦¼/?´ì˜ ?°ë™)

### ìµœê·¼ ë°˜ì˜??(main)

- WI-0088 SaaS UI ?¼ë²—: `/`, `/admin`, `/employee`, `/employee/payslips` ì¶”ê?. ops ?„êµ¬??`/ops/*`ë¡?ê²©ë¦¬?˜ê³  ê¸°ë³¸ UI?ì„œ ?¨ê?.
- WI-0089 e2e ?ŒìŠ¤???¤ìœ„??ë¶„ë¦¬(MVP vs Full)ë¡?SaaS ë°°ì†¡ ?ë„ ?°ì„ 
- WI-0090 ?´ê? ?•ì±…(ì¡°ì§ ?¨ìœ„) ?€??ì¡°íšŒ + ?•ì‚° ê¸°ë³¸ê°??ìš© (?•ì±… ?”ì§„ ë² ì´?¤ë¼??
- WI-0091 SaaS ë°©í–¥???¬ì •??+ ?¤í…Œ?´ì§• ë¹Œë“œ ?ˆì •??lazy env init, ops UI ê²©ë¦¬)
- WI-0092 SaaS Shell(?¬ì´???¤ë¹„) + `/login` ì¶”ê?
- WI-0093 production ?˜ê²½?ì„œ Supabase Auth ?¸ì…˜ ê¸°ë°˜ Bearer ?¸ì¶œ(fallback) ?ìš©
- WI-0094 ?¸ì…˜ ë©”ë‰´(?¸ì…˜ ?íƒœ/ë¡œê·¸?„ì›ƒ) + identity ?•ë¦¬ + ??ë¡œê·¸??CTA
- WI-0095 ê·¼ë¬´ ?¼ì •(Admin) UI baseline (?ì„±/ì¡°íšŒ/?? œ)
- WI-0096 ì´ˆë?/ê°€??Auth Invite) baseline (ì´ˆë? ë§í¬ ?ì„± + role/org/actor_id ?´ë ˆ???¸íŒ…)
- WI-0097 ê´€ë¦¬ì ?¹ì¸ ?Œí¬?Œë¡œ UI ê³ ë„??(?¤ê±´ ? íƒ/?¼ê´„ ?¹ì¸/ë°˜ë ¤)
- WI-0098 ì§ì› ëª…ì„¸??UX ê³ ë„??(ë¹ ë¥¸ ê¸°ê°„ ? íƒ, KPI, ?ì„¸ ë³´ê¸°)
- WI-0099 ëª…ì„¸??ê³µì œ ?ì„¸/CSV ?¤ìš´ë¡œë“œ ì¶”ê?
- WI-0100 ê´€ë¦¬ì ?¹ì¸ ì²˜ë¦¬ ?´ë ¥ ?€?„ë¼??UX
- WI-0101 ê¸‰ì—¬ KR ë²•ì •ê³µì œ baseline ëª¨ë“œ ì¶”ê? (feature flag: `FLOWHR_PAYROLL_KR_BASELINE_V1`)
- WI-0102 People ?„ë©”??Department/Position ëª¨ë¸ + API + ì§ì› ë°°ì • ?•í•©??ê²€ì¦?
- WI-0103 ê²°ì¬???„ì„ ?•ì±… baseline (?•ì±… API + ?„ì„ API + ?¹ì¸ ê²Œì´???°ë™ + `/admin/approval-policy` UI)
- WI-0104 ?´ê? ë°˜ì°¨/?œê°„?¨ìœ„ ?•ì±… ê³ ë„??(fractional leave unit + ?•ì±… ê²Œì´??+ UI + e2e)
- WI-0105 ê¸‰ì—¬ KR baseline ê³ ë„??(?„ì§„??êµ¬ê°„ + ë³´í—˜ ?í•œ + ê´€ë¦¬ì UI ë²•ì •ê³µì œ ?„ë¦¬ë·?
- WI-0106 ê¸‰ì—¬ KR baseline 2ì°?ê³ ë„??(?¸ì•¡ê³µì œ + ë¶€?‘ê?ì¡?ê³µì œ + ?”ê²½ê³?ê°•ì œê²€ì¦??µì…˜ + e2e)
- WI-0107 ê²°ì¬ ?„ì„ ë§Œë£Œ ?ë™??(dry-run/apply API + Admin UI + e2e)
- WI-0108 ê²°ì¬ ?„ì„ ë§Œë£Œ ?¤ì?ì¤„ëŸ¬ (ë©€??ì¡°ì§ sweep runner + hourly workflow + incident/alert + e2e)
- WI-0109 ?„ìê²°ì¬ ë²”ìš©??1ì°?(ê²°ì¬???œí”Œë¦?API + ?¹ì¸ ê²Œì´???°ë™ + `/admin/approval-templates` UI + e2e)
- WI-0110 ê¸‰ì—¬ ë²•ì •ê³µì œ ê³¨ë“  ?Œê? ?•ì¥ (GC-007/GC-008 + golden/CI ê²€ì¦ê¸° ?•ì¥)
- WI-0111 Auth ì´ˆë? delivery mode ?•ì¥ (`link`/`email`) + claims/audit ?¼ê????Œê? ?ŒìŠ¤??ì¶”ê?
- WI-0112 ì§ì› ëª…ì„¸???Œê? ?•ì¥ (statutory self-service own-confirmed gate + deduction breakdown ê²€ì¦?
- WI-0113 ê²°ì¬???œí”Œë¦?ì¡°ê±´ë¶€ ?¼ìš°??baseline (PAYROLL gross-pay ì¡°ê±´ + ?•ì±… ?´ë°± ê²Œì´??+ e2e)
- WI-0114 ?´ê? ?•ì±… ?œì•½ ê³ ë„??(`minNoticeDays`, `maxConsecutiveDays` + Admin UI + e2e)
- WI-0115 ê²°ì¬ ê²Œì´???„ë¦¬ë·?API/UX (`/approval/policy/gate-preview` + `/admin/approval-templates` ?„ë¦¬ë·??¨ë„ + e2e)
- WI-0116 ê²°ì¬ ?¨ê³„ ?´ë ¥ baseline (`ApprovalStageHistory` ëª¨ë¸ + `/approval/stage-history` API + `/admin/approval-history` UI + e2e)
- WI-0117 ê²°ì¬???œí”Œë¦??¤ë‹¨ê³?ëª¨ë¸ baseline (`approvalStages` payload + stage-1 ê²Œì´???¸í™˜ + e2e)
- WI-0118 ê²°ì¬ ?¤í–‰ ?íƒœë¨¸ì‹  baseline (`ApprovalExecution`/`ApprovalExecutionActionLog` + `/approval/executions` API + ?¨ê³„ë³??„ë©”??ìµœì¢…?•ì • ?œì–´ + e2e)
- WI-0119 ê²°ì¬ ?¤í–‰ ê°€?œì„± UI baseline (`/admin/approval-executions` + ì§„í–‰ë¥??¨ê³„ ë¡œê·¸ ?¨ë„ + ê´€ë¦¬ì ?¤ë¹„ê²Œì´???°ê²°)
- WI-0120 ?°ì°¨ì´‰ì§„/?¬ë‚´ê³µì? ?„ë¦¬ë·?baseline (`LeavePolicy` ?°ì°¨ì´‰ì§„ ?„ë“œ + `/leave/policy/promotion-preview` API + `/admin/leave-promotion` UI + e2e)
- WI-0121 ê²°ì¬ ?¤í–‰ ?°ì„ ?œìœ„/?•ì²´ ??ê³ ë„??(`/approval/executions` sort/stalled filter + `/admin/approval-executions` ?”ì•½ KPI/ë¹ ë¥¸?í”„ + e2e)
- WI-0122 ?°ì°¨ì´‰ì§„ ê³µì? ë°œì†¡ ?ë™??(`POST /leave/policy/promotion-notify` + Discord/Slack webhook ?°ë™ + `/admin/leave-promotion` ?œë¼?´ëŸ°/?¤ë°œ??UX + e2e)
- WI-0123 ê²°ì¬ ?¤í–‰ ?•ì²´ ?ìŠ¤ì»¬ë ˆ?´ì…˜ ?ë™??(`POST /approval/executions/escalate` + `/admin/approval-executions` ?œë¼?´ëŸ°/?¤í–‰ + ?¤ì?ì¤„ëŸ¬ runner/workflow + e2e)
- WI-0124 ?°ì°¨ì´‰ì§„ ê³µì? ?´ë©”???œí”Œë¦?ì±„ë„ ?•ì¥ (`deliveryChannel=email_template` + ?œí”Œë¦?ID/?˜ì‹ ??ë©”í??°ì´??+ `/admin/leave-promotion` ì±„ë„ ? íƒ UX + e2e)
- WI-0125 ?°ì°¨ì´‰ì§„ ê³µì? ë°œì†¡ ?´ë ¥/?¬ì‹œ??ëª¨ë¸ (`LeavePromotionDelivery`/`LeavePromotionDeliveryRecipient` + ?´ë ¥ ì¡°íšŒ/?ì„¸/?¬ì‹œ??API + `/admin/leave-promotion` ?´ë ¥/?¬ì‹œ??UX + e2e)
- WI-0126 ë°©í–¥ ?¬ì •??UI-first): ?°ì°¨ì´‰ì§„ ?”ë©´ `/ops/leave-promotion` ê²©ë¦¬ + `/employee` ?´ê? ìº˜ë¦°???°ì°¨ ?¬ìš©ë¥?ì¶œí‡´ê·??•ì • ë³´ì¡° UX + e2e
- WI-0127 ì§ì› ì¶œí‡´ê·??•ì • UX ê³ ë„???•ì • ?€???€?‰í„°/? íƒ ê¸°ë¡ ?ë™ë°˜ì˜/ë©”ëª¨ ?„ë¦¬???…ë ¥ ê°€??ê·¼ë¬´?œê°„ ë³€???„ë¦¬ë·?+ e2e)
- WI-0128 ê´€ë¦¬ì ?¹ì¸ ??UX ê³ ë„?????¬ì»¤??ë°°ì? + ??ê²€??+ ?ë³„ ?•ë ¬ + ëª¨ë°”??ë°˜ì‘???¬ë°°ì¹?+ e2e)
- WI-0129 ê¸‰ì—¬ ëª…ì„¸???œì‹/ì¶œë ¥ UX ê³ ë„??ë¬¸ì„œ???ì„¸ ?¨ë„ + ê³µì œ ??ª© ?¤ëª… + ?¸ì‡„/PDF ?€??+ print ?ˆì´?„ì›ƒ + e2e)
- WI-0130 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UI ê³ ë„??`GET /people/employees/{employeeId}/history` + `/admin/people` ?¸ë¦¬ë·?ë¹„êµ/?´ë ¥ ì¹´ë“œ + e2e)
- WI-0131 ì§ì› ?€?„ì„œë¹„ìŠ¤ 2ì°?UX ê³ ë„???´ê? ìº˜ë¦°??ë°€??ê·¸ë¦¬??+ ?”ì—¬ ?°ì°¨ ?œê°??+ ëª¨ë°”??ë¹ ë¥¸ ?…ë ¥/???´ë™ + e2e)
- WI-0132 ê´€ë¦¬ì ?¹ì¸ ??UX 2ì°?ê³ ë„??ê¸´ê¸‰/ì£¼ì˜ ?Œë¦¼ ë°°ì? + ê²€??ë²”ìœ„/ê¸´ê¸‰ ?„í„° + ?•ì²´ ?°ì„  ?•ë ¬ + ëª¨ë°”??ë¹ ë¥¸ ?¹ì¸ ?¡ì…˜ + e2e)
- WI-0133 ì§ì› ?€?„ì„œë¹„ìŠ¤ 3ì°?UX ê³ ë„???”ì²­ ?íƒœ ?¼ë“œë°?ì¹´ë“œ + ?¤íŒ¨ ?ì¸ ê°€?œí™” + ëª¨ë°”???¨ì¶• ?ë¦„ + ?¤ë¹„ ?µì»¤ + e2e)
- WI-0134 ê¸‰ì—¬ ëª…ì„¸??UX 2ì°?ê³ ë„???íƒœ/?¤ë¥˜ ?¼ë“œë°??¨ë„ + ëª…ì„¸ ë¹„êµ ì¡°íšŒ + ëª¨ë°”???„ë‹¬ ?ë¦„ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0135 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UX 2ì°?ê³ ë„??ë¶€??ì§ê¸‰/ìµœê·¼ë³€ê²??„í„° + ë³€ê²??¬ì¸???˜ì´?¼ì´??+ ëª¨ë°”???¹ì…˜ ?í”„ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0136 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 4ì°?ê³ ë„???”ì²­ ?íƒœ ?„í„° + ëª¨ë°”???”ì²­ ?´ë ¥ ?€?„ë¼??+ ?œì¶œ ì§ì „ ê²€ì¦??¼ë“œë°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0137 ê´€ë¦¬ì ?¹ì¸ ??UX 3ì°?ê³ ë„????ª©ë³??´ë ¥ ?”ì•½ + ?¼ê´„ ì²˜ë¦¬ ì§ì „ ê²€ì¦??¼ë“œë°?+ ëª¨ë°”???¹ì¸ ê²°ê³¼ ?¼ë“œë°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0138 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 5ì°?ê³ ë„??ê·¼íƒœ/?´ê? ?µí•© ?”ì•½ ì¹´ë“œ + ?”ì²­ ?˜ì •/?¬ì œì¶??ë¦„ + ëª¨ë°”???íƒœ ?Œë¦¼ ë°°ì? + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0139 ê´€ë¦¬ì ?¹ì¸ ??UX 4ì°?ê³ ë„???¹ì¸ ê·¼ê±° ?„ë¦¬ë·?+ ?€ê¸?SLA ?€?„ë¼??+ ëª¨ë°”???¼ê´„ ê²€???œíŠ¸ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0140 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 6ì°?ê³ ë„???•ì •/?´ê? ?œì¶œ ì²´í¬ë¦¬ìŠ¤???µí•© + ?”ì²­ ë³‘ëª© ?¼ë“œë°?+ ëª¨ë°”???œì¶œ ê°€?´ë“œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0141 ê´€ë¦¬ì ?¹ì¸ ??UX 5ì°?ê³ ë„???¹ì¸ ê·¼ê±° ë¹„êµ ì¹´ë“œ + SLA ?„ê³„ì¹??Œë¦¼ ê·œì¹™ + ëª¨ë°”???¹ì¸ ì²´í¬ë¦¬ìŠ¤??+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0142 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 7ì°?ê³ ë„???”ì²­ ê²€???•ë ¬ + ?¹ì¸ ?€ê¸??ˆì¸¡ ?¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ê°€?´ë“œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0143 ê´€ë¦¬ì ?¹ì¸ ??UX 6ì°?ê³ ë„???¹ì¸ ?€ê¸?ê²€???•ë ¬ + ?¹ì¸ ì²˜ë¦¬ ?ˆì¸¡ ?¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ê°€?´ë“œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0144 ?¤í…Œ?´ì§• CI ë°°í¬ ?ˆì •???¤í‚¤ë§?ì´ˆê¸°????enum bootstrap ì¶”ê?ë¡?`staging-prisma-integration` ë§ˆì´ê·¸ë ˆ?´ì…˜ ?¤íŒ¨(P3018) ë°©ì?)
- WI-0145 ê¸‰ì—¬ ëª…ì„¸??UX 3ì°?ê³ ë„??ëª…ì„¸??ê²€???•ë ¬ + ì§€ê¸??•ì • ?ˆì¸¡ ?¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ê°€?´ë“œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0146 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UX 3ì°?ê³ ë„???´ë ¥ ê²€???•ë ¬ + ë³€ê²??„í—˜ ?ˆì¸¡ ?¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ê°€?´ë“œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0147 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 8ì°?ê³ ë„???”ì²­ ?´ë ¥ ?•ë ¬ ?•í™•??+ ?¹ì¸ ì§€???„í—˜ ?ˆì¸¡ ?¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0148 ê´€ë¦¬ì ?¹ì¸ ??UX 7ì°?ê³ ë„???¹ì¸ ?´ë ¥ ?•ë ¬ ?•í™•??+ ì²˜ë¦¬ ì§€???„í—˜ ?ˆì¸¡ ?¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0149 ê¸‰ì—¬ ëª…ì„¸??UX 4ì°?ê³ ë„??ëª…ì„¸ ?´ë ¥ ?•ë ¬ ?•í™•??+ ì§€ê¸?ì§€???„í—˜ ?ˆì¸¡ ?¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0150 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UX 4ì°?ê³ ë„???´ë ¥ ?•ë ¬ ?•í™•??+ ë³€ê²?ì§€???„í—˜ ?ˆì¸¡ ?¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0151 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 9ì°?ê³ ë„???”ì²­ ?´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°• + ?¹ì¸ ì§€???„í—˜ ?€???¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0152 ê´€ë¦¬ì ?¹ì¸ ??UX 8ì°?ê³ ë„???¹ì¸ ?´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°• + ì²˜ë¦¬ ì§€???„í—˜ ?€???¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0153 ê¸‰ì—¬ ëª…ì„¸??UX 5ì°?ê³ ë„??ëª…ì„¸ ?´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°• + ì§€ê¸?ì§€???„í—˜ ?€???¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0154 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UX 5ì°?ê³ ë„???´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°• + ë³€ê²?ì§€???„í—˜ ?€???¼ë“œë°?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0155 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 10ì°?ê³ ë„???”ì²­ ?´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°• ê³ ë„??+ ?¹ì¸ ì§€???„í—˜ ?€???¤í–‰ ê°€?´ë“œ + ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??2ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0156 ê´€ë¦¬ì ?¹ì¸ ??UX 9ì°?ê³ ë„???¹ì¸ ?´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°• ê³ ë„??+ ì²˜ë¦¬ ì§€???„í—˜ ?€???¤í–‰ ê°€?´ë“œ + ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??2ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0157 ê¸‰ì—¬ ëª…ì„¸??UX 6ì°?ê³ ë„??ëª…ì„¸ ?´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°• ê³ ë„??+ ì§€ê¸?ì§€???„í—˜ ?€???¤í–‰ ê°€?´ë“œ + ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??2ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0158 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UX 6ì°?ê³ ë„???´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°• ê³ ë„??+ ë³€ê²?ì§€???„í—˜ ?€???¤í–‰ ê°€?´ë“œ + ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??2ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0159 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 11ì°?ê³ ë„???”ì²­ ?´ë ¥ ?•ë ¬ ?•í™•??ë³´ê°•+ ?¤í–‰ ì¹´ë“œ + ?¹ì¸ ì§€???„í—˜ ?€???¤í–‰ ì¶”ì  + ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??3ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0160 ê´€ë¦¬ì ?¹ì¸ ??UX 10ì°?ê³ ë„???¹ì¸ ?´ë ¥ ?•ë ¬ ë³´ê°•+ ?¤í–‰ ì¹´ë“œ + ì²˜ë¦¬ ì§€???„í—˜ ?€???¤í–‰ ì¶”ì  + ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??3ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0161 ê¸‰ì—¬ ëª…ì„¸??UX 7ì°?ê³ ë„??ëª…ì„¸ ?´ë ¥ ?•ë ¬ ë³´ê°•+ ?¤í–‰ ì¹´ë“œ + ì§€ê¸?ì§€???„í—˜ ?€???¤í–‰ ì¶”ì  + ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??3ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0162 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UX 7ì°?ê³ ë„???´ë ¥ ?•ë ¬ ë³´ê°•+ ?¤í–‰ ì¹´ë“œ + ë³€ê²?ì§€???„í—˜ ?€???¤í–‰ ì¶”ì  + ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??3ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0163 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 12ì°?ê³ ë„??ì¶œí‡´ê·??•ì • ?¸ì‚¬?´íŠ¸ + ?”ì—¬ ?°ì°¨ ?¬ìº?¤íŠ¸ + ?´ê? ìº˜ë¦°???¸ì‚¬?´íŠ¸ + ëª¨ë°”???¬ì´???¤ë¹„ ?í”„ + e2e)
- WI-0164 ê´€ë¦¬ì ?¹ì¸ ??UX 11ì°?ê³ ë„???¹ì¸ ?´ë ¥ ?¤í–‰ ì¶”ì  + ?¹ì¸ ì§€???¤í–‰ ë°±ë¡œê·?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??4ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0165 ê¸‰ì—¬ ëª…ì„¸??UX 8ì°?ê³ ë„??ëª…ì„¸ ?¤í–‰ ?”ì•½ + ì§€???¤í–‰ ë°±ë¡œê·?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??4ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0166 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UX 8ì°?ê³ ë„???´ë ¥ ?¤í–‰ ?”ì•½ + ë³€ê²?ì§€???¤í–‰ ë°±ë¡œê·?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??4ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0167 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 13ì°?ê³ ë„???”ì²­ ?¤í–‰ ?”ì•½ + ?¹ì¸ ì§€???¤í–‰ ë°±ë¡œê·?+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??4ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0168 ê´€ë¦¬ì ?¹ì¸ ??UX 12ì°?ê³ ë„???¹ì¸ ?´ë ¥ ?¤í–‰ ?”ì•½ + ?¹ì¸ ì§€???¤í–‰ ë°±ë¡œê·??¤ì´?œìŠ¤??+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??5ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0169 ê¸‰ì—¬ ëª…ì„¸??UX 9ì°?ê³ ë„??ëª…ì„¸ ?¤í–‰ ?”ì•½ ?¤ì´?œìŠ¤??+ ì§€???¤í–‰ ë°±ë¡œê·??¤ì´?œìŠ¤??+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??5ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0170 ê´€ë¦¬ì ì¡°ì§???¸ì‚¬ ?´ë ¥ UX 9ì°?ê³ ë„???´ë ¥ ?¤í–‰ ?”ì•½ ?¤ì´?œìŠ¤??+ ë³€ê²?ì§€???¤í–‰ ë°±ë¡œê·??¤ì´?œìŠ¤??+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??5ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0171 ì§ì› ?€?„ì„œë¹„ìŠ¤ UX 14ì°?ê³ ë„???”ì²­ ?¤í–‰ ?”ì•½ ?¤ì´?œìŠ¤??+ ?¹ì¸ ì§€???¤í–‰ ë°±ë¡œê·??¤ì´?œìŠ¤??+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??5ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0172 ê´€ë¦¬ì ?¹ì¸ ??UX 13ì°?ê³ ë„???¹ì¸ ?´ë ¥ ?¤í–‰ ?”ì•½ ?¤ì´?œìŠ¤??+ ?¹ì¸ ì§€???¤í–‰ ë°±ë¡œê·??¤ì´?œìŠ¤??+ ëª¨ë°”???„ì† ?¡ì…˜ ì¶”ì²œ ê³ ë„??6ì°?+ ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0173 ?„ë¡ ?¸ì—”??ëª¨ë?ë¦¬ìŠ¤ ê°€?œë ˆ???˜ì´ì§€ ?¼ì¸ ?ˆì‚° ?ŒìŠ¤??+ e2e ? í–‰ ê°€??+ ë¶„í•´ ?ì¹™ ë¬¸ì„œ??
- WI-0174 ?„ìê³„ì•½ Admin UX baseline(`/admin/contracts` ë¶„ë¦¬ ?¼ìš°??+ ?œí”Œë¦??¼ì´ë¸ŒëŸ¬ë¦??œëª… ì¤€ë¹„ë„ ì¹´ë“œ + ?¬ì´???¤ë¹„ ?µì»¤ + e2e)
- WI-0175 ?´ì˜ ?•ë¦¬(Production Auth Smoke teardown FK ?•ë¦¬ + payroll-phase2-health success ??incident auto-close + e2e)
- WI-0176 ì§ì› ?€?„ì„œë¹„ìŠ¤ ë¸”ë¡œ???•ë¦¬(`src/app/employee/page.tsx` ë°˜ë³µ ?¹ì…˜ 27ê°??œê±° + `src/app/employee/layout.tsx` ì½”ì–´ ?µì»¤ ì¶•ì†Œ + e2e/?¼ì¸?ˆì‚° ê°±ì‹ )
- WI-0177 ê´€ë¦¬ì ?€?œë³´??ë¸”ë¡œ???•ë¦¬(`src/app/admin/page.tsx` ë°˜ë³µ ?¹ì…˜ 31ê°??œê±° + `src/app/admin/layout.tsx` ì½”ì–´ ?µì»¤ ì¶•ì†Œ + e2e/?¼ì¸?ˆì‚° ê°±ì‹ )
- WI-0178 ì§ì› ëª…ì„¸??ë¸”ë¡œ???•ë¦¬(`src/app/employee/payslips/page.tsx` ë°˜ë³µ ?¹ì…˜ 21ê°??œê±° + `src/app/employee/layout.tsx` payslip ?µì»¤ ì¶•ì†Œ + e2e/?¼ì¸?ˆì‚° ê°±ì‹ )
- WI-0179 ê´€ë¦¬ì ?¸ì‚¬ ?˜ì´ì§€ ë¸”ë¡œ???•ë¦¬(`src/app/admin/people/page.tsx` ë°˜ë³µ ?¹ì…˜ 22ê°??œê±° + e2e ì²´ì¸ ?•ë¦¬ + ?¼ì¸?ˆì‚° ê°±ì‹ )
- WI-0180 `globals.css` ë¸”ë¡œ???•ë¦¬(phase-loop dead selector ?€ê±??œê±° + CSS ?Œê? ?ŒìŠ¤??ì¶”ê? + e2e ì²´ì¸ ë°˜ì˜)
- WI-0181 Deprecated WI/?ŒìŠ¤???„ì¹´?´ë¸Œ ?•ë¦¬(WI-0131~0143, WI-0145~0172 deprecated ë§ˆí‚¹ + ê´€??e2e no-op ?„ì¹´?´ë¸Œ + active e2e ì²´ì¸ ?œì™¸)
- WI-0182 ?°ì°¨ ?ë™ ë¶€???”ì§„ baseline(`POST /leave/accrual/auto-grant` + `/admin/leave-accrual` ?„ìš© ?¼ìš°??+ dry-run/apply ?”ì•½/?ì„¸ ê²°ê³¼ + e2e/spec ê°±ì‹ )
- WI-0183 ?´ê? ìº˜ë¦°???°ë™ baseline(`GET /leave/calendar` + `/admin/leave-calendar` ?„ìš© ?¼ìš°??+ ë¶€???„í„°/ì¤‘ë³µ ê²½ê³  ?„ê³„ì¹?+ e2e/spec ê°±ì‹ )
- WI-0184 ê¸‰ì—¬ 4?€ë³´í—˜ ?•ì‚° baseline(`POST /payroll/runs/preview-insurance-settlement` + `/admin/payroll-insurance` ?„ìš© ?¼ìš°??+ ê¸°ì—¬ê¸??•ì‚° delta ?”ì•½ + e2e/spec ê°±ì‹ )
- WI-0185 ê¸‰ì—¬ ?ì²œ???•ì‚°/ë§ˆê° baseline(`POST /payroll/runs/close-period` + `/admin/payroll-close` ?„ìš© ?¼ìš°??+ ?•ì • run ê¸°ì? ë§ˆê° ê°€???¬ë?/?•ì‚° delta ?”ì•½ + e2e/spec ê°±ì‹ )
- WI-0186 ê¸‰ì—¬ ëª…ì„¸??ë°°í¬/?˜ì‹  ?•ì¸ baseline(`POST /payroll/payslips/distribute`, `POST /payroll/payslips/{runId}/acknowledge` + `/admin/payroll-payslip-delivery`, `/employee/payslip-receipts` ?„ìš© ?¼ìš°??+ ë°°í¬/?˜ì‹  ?•ì¸ ?íƒœ ì¶”ì  + e2e/spec ê°±ì‹ )
- WI-0187 ê¸‰ì—¬ ?°ë§?•ì‚°/?ì²œì§•ìˆ˜?ìˆ˜ì¦?baseline(`POST /payroll/year-end/preview-settlement`, `POST /payroll/year-end/withholding-receipts` + `/admin/payroll-year-end`, `/employee/withholding-receipt` ?„ìš© ?¼ìš°??+ ë°œê¸‰ ? í–‰ì¡°ê±´ ê°€??+ e2e/spec ê°±ì‹ )
- WI-0188 ê¸‰ì—¬ ?°ë§?•ì‚° ê³µì œ??ª© ?…ë ¥/?¬ì •??baseline(`POST /payroll/year-end/recalculate-settlement` + `/admin/payroll-year-end` ê³µì œ??ª© ?…ë ¥/?¬ì •??UX + baseline ?€ë¹??¸ì•¡/?ì²œ??delta ?”ì•½ + e2e/spec ê°±ì‹ )
- WI-0189 ê¸‰ì—¬ ?°ë§?•ì‚° ?•ì •/? ê³  ?°ì´???´ë³´?´ê¸° baseline(`POST /payroll/year-end/finalize-settlement`, `POST /payroll/year-end/export-filing-data` + `/admin/payroll-year-end-filing` ?„ìš© ?¼ìš°??+ ?•ì • ? í–‰ì¡°ê±´/? ê³  ?µìŠ¤?¬íŠ¸ ê°€??+ e2e/spec ê°±ì‹ )
- WI-0190 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?µìŠ¤?¬íŠ¸ ?¬ë§·/ê²€ì¦??•ì¥ baseline(`POST /payroll/year-end/export-filing-data` ?¤ì¤‘ ?¬ë§· `json/csv/jsonl/hometax_csv` + `validationMode=basic/strict` + ?„í‹°?©íŠ¸ ì²´í¬??ê²€ì¦??”ì•½ + `/admin/payroll-year-end-filing` UX ?•ì¥ + e2e/spec ê°±ì‹ )
- WI-0191 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ?œì¶œ ì¶”ì /ACK baseline(`GET|POST /payroll/year-end/filing-submissions`, `POST /payroll/year-end/filing-submissions/{submissionId}/ack` + `/admin/payroll-year-end-filing` ?œì¶œ/ACK/?´ë ¥ ?¨ë„ + audit/event ì¶”ì  + e2e/spec ê°±ì‹ )
- WI-0192 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ?¬ì œì¶??íƒœ ?„ì´ ê°€??baseline(`POST /payroll/year-end/filing-submissions/{submissionId}/resubmit` + pending/rejected/ì¤‘ë³µ ?¬ì œì¶??„ì´ ê°€??+ ?œë„?Ÿìˆ˜/?ë³¸ submission ?°ê²° + `/admin/payroll-year-end-filing` ?¬ì œì¶?UX + e2e/spec ê°±ì‹ )
- WI-0193 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ?œì¶œ ?€?„ë¼??ì¦ë¹™ ë©”ëª¨ baseline(`GET /payroll/year-end/filing-submissions/{submissionId}/timeline`, `POST /payroll/year-end/filing-submissions/{submissionId}/evidence-note` + `/admin/payroll-year-end-filing` ?€?„ë¼??ì¦ë¹™ ë©”ëª¨ UX + audit/event ì¶”ì  + e2e/spec ê°±ì‹ )
- WI-0194 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ACK ì½”ë“œ ?¬ì „/ê±°ì ˆ ?¬ìœ  ì¹´íƒˆë¡œê·¸ baseline(`GET /payroll/year-end/filing-ack-catalog` + `POST /payroll/year-end/filing-submissions/{submissionId}/ack` ì¹´íƒˆë¡œê·¸ ? íš¨??ê°€??+ `/admin/payroll-year-end-filing` ACK ì½”ë“œ/ê±°ì ˆ ?¬ìœ  ? íƒ UX + e2e/spec ê°±ì‹ )
- WI-0195 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ?œì¶œ ì·¨ì†Œ/?¬ì˜¤??ê°€??baseline(`POST /payroll/year-end/filing-submissions/{submissionId}/cancel`, `POST /payroll/year-end/filing-submissions/{submissionId}/reopen` + canceled ?íƒœ ?„ì´ ê°€??+ ack ì°¨ë‹¨ + `/admin/payroll-year-end-filing` ì·¨ì†Œ/?¬ì˜¤??UX + e2e/spec ê°±ì‹ )
- WI-0196 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ?íƒœ ?”ì•½/?„í„° UX baseline(`GET /payroll/year-end/filing-submissions` ?„í„°(status/ackStatus/validationStatus/transport) + summary ì¹´ìš´???‘ë‹µ + `/admin/payroll-year-end-filing` ?„í„°/KPI ?”ì•½ UX + e2e/spec ê°±ì‹ )
- WI-0197 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ê²€???•ë ¬/ë¹ ë¥¸ ?¡ì…˜ UX baseline(`GET /payroll/year-end/filing-submissions` ê²€???•ë ¬(search/sortBy/sortDirection) + `/admin/payroll-year-end-filing` ê²€???•ë ¬ ? íƒ + ???¨ìœ„ quick action(ack/cancel/reopen/resubmit) + e2e/spec ê°±ì‹ )
- WI-0198 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ?´ì˜ ?€?œë³´??ë¶„ë¦¬ baseline(`GET /admin/payroll-year-end-filing/ops` ?„ìš© ?¼ìš°??+ ?íƒœ/ì¦ë¹™ ?”ì•½ ì¹´ë“œ + ë¦¬ìŠ¤???€?„ë¼??ê¸°ë°˜ ì¦ë¹™ ì»¤ë²„ë¦¬ì? ?¤ìº” + ê¸°ì¡´ ?¤í–‰ ì½˜ì†” ë¶„ë¦¬ + e2e/spec ê°±ì‹ )
- WI-0199 ê¸‰ì—¬ ?°ë§?•ì‚° ? ê³  ?¨í‚¤ì§€ ?´ì˜ ?€?œë³´???œë¦´?¤ìš´/ê²½ê³  ê·œì¹™ baseline(`/admin/payroll-year-end-filing/ops` ?œë¦´?¤ìš´ ëª¨ë“œ(pending/rejected/validation/evidence-gap/timeline-failure) + ?„ê³„ì¹?ê¸°ë°˜ alert severity(WATCH/CRITICAL) + ?„í„° ?„ë¦¬???°ë™ + e2e/spec ê°±ì‹ )
- WI-0200 ë¸Œë¼?°ì? ë¡œì???ê¸°ë°˜ UI ?¸ì–´ ?™ì  ?ìš© baseline(`Accept-Language` ê¸°ë°˜ locale ê²°ì • + `html lang` ?™ì  ë°˜ì˜ + `/`, `/login`, `/admin`/`/employee` shell/`SessionMenu` i18n + e2e ê°±ì‹ )
- WI-0201 ?°ë§?•ì‚° ? ê³  ?´ì˜ ?€?œë³´???Œë¦¼ ?€??ê°€?´ë“œ/?Œìœ ??? ë‹¹ baseline(`/admin/payroll-year-end-filing/ops` ì§€?œë³„ ?€???¡ì…˜(watch/critical) + ?ìŠ¤ì»¬ë ˆ?´ì…˜ ê²½ë¡œ + owner(role/actor) ? ë‹¹ + ?œë¦´?¤ìš´ ?í”„ + e2e ê°±ì‹ )
- WI-0202 ?°ë§?•ì‚° ? ê³  ?´ì˜ ?Œë¦¼ ?¤í–‰ ì²´í¬ë¦¬ìŠ¤???„ë£Œ ì¶”ì  baseline(`/admin/payroll-year-end-filing/ops/checklist` ?„ìš© ?¼ìš°??+ ì§€?œë³„ ?¤í–‰ ì²´í¬ë¦¬ìŠ¤??+ ?„ë£Œ???„ë£Œ?œê° ì¶”ì  + ops ?€?œë³´???°ë™ ë§í¬ + e2e ê°±ì‹ )
- WI-0203 ?°ë§?•ì‚° ? ê³  ?´ì˜ ì²´í¬ë¦¬ìŠ¤???¤í–‰ ë¡œê·¸/ê²€??ë£¨í”„ baseline(`/admin/payroll-year-end-filing/ops/checklist/review` ?„ìš© ?¼ìš°??+ ?¤í–‰ ë¡œê·¸(done/blocked/follow_up) + required ê¸°ì? stage(execute/review/close) ?”ì•½ + ì²´í¬ë¦¬ìŠ¤???°ë™ ë§í¬ + e2e ê°±ì‹ )
- WI-0204 ?°ë§?•ì‚° ? ê³  ?´ì˜ ì²´í¬ë¦¬ìŠ¤???Œê³  ì½”ë©˜??ê²€???¹ì¸ ?¤ëƒ…??baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot` ?„ìš© ?¼ìš°??+ retrospective ì½”ë©˜??+ roleë³??¹ì¸ê²°ì •(pending/approved/rework) + ready-to-close ?¤ëƒ…???”ì•½ + e2e ê°±ì‹ )
- WI-0205 ?°ë§?•ì‚° ? ê³  ?´ì˜ ê²€???¸ìˆ˜?¸ê³„/?µìŠ¤?¬íŠ¸ ?¤ëƒ…??baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff` ?„ìš© ?¼ìš°??+ handoff packet(from/to role, note, escalation, dueAt) + export snapshot(format/validation/checksum/artifact) + close-ready ?”ì•½ + e2e ê°±ì‹ )
- WI-0206 ?°ë§?•ì‚° ? ê³  ?´ì˜ close-off ?¨í‚¤ì§€/ê°ì‚¬ ?œëª… baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off` ?„ìš© ?¼ìš°??+ audit sign-off grid(pending/signed/rejected) + archive package(bundle id, note) + ready-to-archive blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0207 ?°ë§?•ì‚° ? ê³  ?´ì˜ close-off ?¹ì¸ ?¼ìš°???„ë‹¬ ?œëª… ë²ˆë“¤ baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature` ?„ìš© ?¼ìš°??+ approval routing stage(status/owner/eta) + delivery signature channel(status/signer/reference) + ready-to-deliver blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0208 ?°ë§?•ì‚° ? ê³  ?´ì˜ ?„ë‹¬ ?¨í‚¤ì§€ lock/final handover baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock` ?„ìš© ?¼ìš°??+ package lock state(draft/locked/released) + final handover status(pending/sent/ack) + completion blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0209 ?°ë§?•ì‚° ? ê³  ?´ì˜ completion receipt/archive digest baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt` ?„ìš© ?¼ìš°??+ completion receipt status(pending/issued/verified) + archive digest channel state(pending/prepared/sealed) + archive digest readiness blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0210 ?°ë§?•ì‚° ? ê³  ?´ì˜ completion close report baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report` ?„ìš© ?¼ìš°??+ close report status(pending/drafted/published) + publication channel state(pending/queued/published) + final close blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0211 ?°ë§?•ì‚° ? ê³  ?´ì˜ close report distribution sign-off baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff` ?„ìš© ?¼ìš°??+ distribution channel state(pending/distributed/confirmed) + role sign-off state(pending/signed/rejected) + distribution sign-off blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0212 ?°ë§?•ì‚° ? ê³  ?´ì˜ distribution sign-off closure packet baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet` ?„ìš© ?¼ìš°??+ closure packet status(pending/assembled/sealed) + closure packet dispatch state(pending/prepared/released) + closure packet readiness blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0213 ?°ë§?•ì‚° ? ê³  ?´ì˜ closure packet release digest baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest` ?„ìš© ?¼ìš°??+ release digest status(pending/compiled/published) + release digest channel state(pending/queued/delivered) + release digest readiness blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0214 ?°ë§?•ì‚° ? ê³  ?´ì˜ release digest acknowledgment ledger baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger` ?„ìš© ?¼ìš°??+ acknowledgment ledger status(pending/logged/verified) + ack channel state(pending/acknowledged/reconciled) + acknowledgment readiness blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0215 ?°ë§?•ì‚° ? ê³  ?´ì˜ ack ledger exception log baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger/exception-log` ?„ìš© ?¼ìš°??+ exception log status(pending/recorded/closed) + exception category state(open/investigating/resolved) + exception closure blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0216 ?°ë§?•ì‚° ? ê³  ?´ì˜ ack ledger exception closure receipt baseline(`/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger/exception-log/closure-receipt` ?„ìš© ?¼ìš°??+ exception closure receipt status(pending/issued/verified) + exception closure channel state(pending/sent/acknowledged) + exception closure receipt blocker ?”ì•½ + e2e ê°±ì‹ )
- WI-0217 ?°ë§?•ì‚° ? ê³  ?´ì˜ ?Œë« ?Œí¬?Œë¡œ???¼ìš°??ì»¨í…?¤íŠ¸ baseline(`GET /admin/payroll-year-end-filing/ops/[step]` ?™ì  ?¤í… ?¼ìš°??alert/checklist-flow/review/close-off/delivery/archive/report) + `FilingWorkflowContext` ê¸°ë°˜ ê³µí†µ ?íƒœ(currentStep/gates/metadata/actionLog) + ê³µí†µ ì»´í¬?ŒíŠ¸(`FilingDashboard`,`FilingStepPanel`,`FilingGateCard`,`FilingActionLog`,`FilingExportBundle`) + Admin ?Œë« ?¤ë¹„ + e2e ê°±ì‹ )
- WI-0218 ?°ë§?•ì‚° ? ê³  ?´ì˜ ì»´í¬?ŒíŠ¸ ?µí•©/?ˆê±°???•ë¦¬ baseline(`/admin/payroll-year-end-filing/ops`??/ops/alert` ë¦¬ë‹¤?´ë ‰??+ `/ops/checklist/**` ???¼ìš°???œê±° + `PayrollYearEndFilingOps*`/`filing-alert-*` ì»´í¬?ŒíŠ¸êµ??œê±° + WI-0198~0199, WI-0201~0216 ?„ì¹´?´ë¸Œ no-op + WI-0218 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0219 ?µì‹¬ ?¬ì • IA ?¨ìˆœ??+ ?¹ì¸ ??ì»´í¬?ŒíŠ¸ ë¶„ë¦¬ baseline(`src/app/admin/page.tsx` ?¹ì¸ ???¨ë„??`src/components/admin-approval/*`ë¡?ë¶„ë¦¬ + dead bulk-selection ë¡œì§ ?•ë¦¬ + `src/app/employee/page.tsx` ?µì‹¬ ?¬ì • ë°”ë¡œê°€ê¸?`EmployeeJourneyShortcutPanel`) ì¶”ê? + WI-0219 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0220 ê¸‰ì—¬ ?”ì§„ KR ?•ë? ê³„ì‚° ì°©ìˆ˜ baseline(`POST /payroll/runs/preview-with-deductions` `statutory_kr_baseline`??`incomeTaxLookupTable`(ê°„ì´?¸ì•¡??ë£©ì—…) + `insuranceRounding`(4?€ë³´í—˜ ??ª©ë³??¨ìœ„/ëª¨ë“œ ?¼ìš´?? ì¶”ê? + payroll spec/rfc ê°±ì‹  + WI-0220 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0221 ê¸‰ì—¬ ?”ì§„ KR ?¸ì•¡???´ì˜ ?°ì´?°ì…‹/ê²€ì¦?ê°€??baseline(`statutory_kr_baseline`??`incomeTaxLookupPresetId` ?„ë¦¬???…ë ¥ ì¶”ê? + `incomeTaxBrackets`/`incomeTaxLookupTable`/`incomeTaxLookupPresetId` ?í˜¸ë°°í? ê°€??+ ë£©ì—… ?Œì´ë¸??¨ì¡° ?¸ì•¡ ê²€ì¦?+ WI-0221 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0222 ê¸‰ì—¬ ê´€ë¦¬ì ?„ë¦¬ë·?KR ?¸ì•¡???„ë¦¬??? íƒ/ê°€?´ë“œ UX baseline(`src/components/payroll/PayrollKrPresetGuidePanel.tsx` ? ê·œ + `/admin` ë²•ì •ê³µì œ ?„ë¦¬ë·?preset selector/payload ?°ë™ + locale-aware(`ko`/`en`) ê°€?´ë“œ ë¬¸êµ¬ + WI-0222 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0223 ê¸‰ì—¬ ?”ì§„ KR ê³¼ì„¸/ë¹„ê³¼??ë¶„ë¦¬ ê²€ì¦?baseline(`statutory_kr_baseline`??? íƒ ?…ë ¥ `taxableIncomeKrw` ì¶”ê? + `nonTaxableIncomeKrw <= grossPayKrw`, `taxable + nonTaxable = gross` ê°€??+ `incomeSplitKrw` breakdown + `/admin` ê³¼ì„¸?Œë“ ?…ë ¥ ?°ë™ + WI-0223 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0224 ê¸‰ì—¬ ?”ì§„ KR ê³¼ì„¸/ë¹„ê³¼????ª© ì½”ë“œ/ì¹´í…Œê³ ë¦¬ ?…ë ¥ baseline(`taxableIncomeItems`/`nonTaxableIncomeItems` ?…ë ¥ ì¶”ê? + ??ª© ì½”ë“œ ì¤‘ë³µ/??ª©?©ê³„ ?•í•©??ê°€??+ `incomeSplitItems` breakdown + `/admin` ??ª© ì½”ë“œ/ì¹´í…Œê³ ë¦¬/ê¸ˆì•¡ ?…ë ¥ ?°ë™ + WI-0224 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0225 ê¸‰ì—¬ ?”ì§„ KR ê³¼ì„¸/ë¹„ê³¼????ª© ?„ë¦¬???°ì´?°ì…‹ baseline(`incomeSplitItemPresetId` ?…ë ¥ ì¶”ê? + ì§€??preset ê²€ì¦?+ preset/manual item ?í˜¸ë°°í? ê°€??+ preset ê¸°ë°˜ ??ª© ?ë™ êµ¬ì„± + `/admin` ??ª© ?„ë¦¬??selector/?˜ë™?…ë ¥ ë¹„í™œ?±í™” + WI-0225 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0226 ê¸‰ì—¬ ê´€ë¦¬ì KR ê³¼ì„¸/ë¹„ê³¼???¤ì¤‘ ??ª© ?…ë ¥ ?Œì´ë¸?UX baseline(`/admin` ë²•ì •ê³µì œ ?„ë¦¬ë·°ì—??ê³¼ì„¸/ë¹„ê³¼????ª© ?¤ì¤‘ ??add/remove) ?…ë ¥ ì§€??+ ë¹????œì™¸ payload ë³€??+ preset ? íƒ ???˜ë™ ?Œì´ë¸?ë¹„í™œ?±í™” + WI-0226 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0227 ê¸‰ì—¬ ê´€ë¦¬ì KR ??ª© ì½”ë“œ ?¬ì „ autocomplete UX baseline(`kr-income-split-item-code-dictionary` ì¶”ê? + `/admin` ?¤ì¤‘ ??ª© ?Œì´ë¸?ì½”ë“œ ?…ë ¥??datalist ê¸°ë°˜ autocomplete + ì½”ë“œ ? íƒ ??ì¹´í…Œê³ ë¦¬ ?ë™ ì±„ì? + WI-0227 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0228 ê¸‰ì—¬ ?”ì§„ KR ??ª© ì½”ë“œ ?¬ì „ ?œë²„ ê²€ì¦?ê°€??baseline(`statutory_kr_baseline` ?˜ë™ ??ª© ?…ë ¥?ì„œ ê³¼ì„¸/ë¹„ê³¼??kindë³?ì½”ë“œ ?¬ì „ ê²€ì¦?+ ì½”ë“œ-ì¹´í…Œê³ ë¦¬ ë¶ˆì¼ì¹?ì°¨ë‹¨ + ?µê³¼ ??ª© ì½”ë“œ/ì¹´í…Œê³ ë¦¬ canonical ?•ê·œ??+ WI-0228 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0229 ê¸‰ì—¬ ê´€ë¦¬ì KR ?„ë¦¬???˜ë™ ?…ë ¥ ?•í•©??UX ê°€?´ë“œ baseline(`PayrollKrIncomeSplitConsistencyGuidePanel` ì¶”ê? + ?˜ë™ ??partial/duplicate/?¬ì „ë¶ˆì¼ì¹??”ì•½ + ?„ë¦¬??ëª¨ë“œ ?˜ë™??ë¬´ì‹œ/ì´ˆê¸°??ê°€?´ë“œ + `/admin` ?œì¶œ ??client preflight ê°€??+ WI-0229 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0230 ê¸‰ì—¬ ê´€ë¦¬ì KR ?„ë¦¬??ëª¨ë“œ ?˜í”Œ payload ?„ë¦¬ë·?baseline(`PayrollKrIncomeSplitPresetPayloadPreviewPanel` ì¶”ê? + `incomeSplitItemPresetId` ? íƒ ???”ì²­ payload shape/?œë²„ ?œí”Œë¦??ìš© ?˜í”Œ ?œì‹œ + API ê³„ì•½ ë³€ê²??†ì´ ?ˆë‚´ ê°•í™” + WI-0230 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0231 ê¸‰ì—¬ ê´€ë¦¬ì KR ?„ë¦¬??ëª¨ë“œ ?˜í”Œ payload ë³µì‚¬/ê³µìœ  UX baseline(`PayrollKrIncomeSplitPresetPayloadPreviewPanel` copy/share ?¡ì…˜ ì¶”ê? + ?”ì²­/?œí”Œë¦??µí•© ?„ë¦¬ë·?ë³µì‚¬ + Web Share API/?´ë¦½ë³´ë“œ fallback + `/admin#payroll` replay href ?¬í•¨ + WI-0231 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0232 ê¸‰ì—¬ ê´€ë¦¬ì KR ?„ë¦¬??ëª¨ë“œ ê³µìœ  ë§í¬ ?…ë ¥ ?ë™ ë°˜ì˜ UX baseline(`parsePayrollKrPresetShareContext` ì¶”ê? + `/admin` ì¿¼ë¦¬(`incomeSplitItemPresetId`/`taxableIncomeKrw`/`nonTaxableIncomeKrw`) ?ë™ ë°˜ì˜ + ? íš¨ê°?ì¡´ì¬ ??`statutory_kr_baseline` ?ë™ ?„í™˜ + WI-0232 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0233 ê¸‰ì—¬ ê´€ë¦¬ì KR ?„ë¦¬??ê³µìœ  ë§í¬ ? íš¨???ŒíŠ¸/?¤ë¥˜ ?¼ë“œë°?UX baseline(`PayrollKrPresetShareLinkFeedbackPanel` ì¶”ê? + ?ìš©ê°?ë¬´ì‹œ??invalid ì¿¼ë¦¬ê°??”ì•½ ?œì‹œ + parser resolution(`query`/`invalid`) ?•ì¥ + WI-0233 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0234 ê¸‰ì—¬ ê´€ë¦¬ì KR ?„ë¦¬??ê³µìœ  ë§í¬ ì´ˆê¸°???¬ì ??UX baseline(`PayrollKrPresetShareLinkFeedbackPanel` reset/reapply ?¡ì…˜ ì¶”ê? + `/admin` ê³µìœ ê°?ì´ˆê¸°???„ì¬ ì¿¼ë¦¬ ?¬ì ???¸ë“¤???°ê²° + API ê³„ì•½ ë³€ê²??†ìŒ + WI-0234 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0235 ê´€ë¦¬ì KPI ?€?œë³´??baseline(`src/app/admin/kpi` ? ê·œ ?¼ìš°??+ `/api/approval/executions`/`/api/attendance/aggregates`/`/api/leave/requests`/`/api/payroll/runs` ê¸°ë°˜ KPI ì¹´ë“œ/?´ì „ ê¸°ê°„ ë¹„êµ + API ë¡œê·¸ ?¨ë„ + locale-aware copy + ì»´í¬?ŒíŠ¸ 300ì¤??œí•œ ë¶„ë¦¬ + WI-0235 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0236 ê´€ë¦¬ì ?¤ì‹œê°?ê·¼íƒœ ?„í™© baseline(`src/app/admin/attendance-live` ? ê·œ ?¼ìš°??+ `/api/people/employees`/`/api/people/departments`/`/api/scheduling/schedules`/`/api/attendance/records` ê¸°ë°˜ ì¶œê·¼/ì§€ê°?ë¯¸ì¶œê·??¤ëƒ…??+ ë¶€???íƒœ/ê²€???„í„° + ê²½ê³  ë°°ì? + ì»´í¬?ŒíŠ¸ ë¶„ë¦¬ + WI-0236 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0237 ê´€ë¦¬ì ?¨ë³´??ë§ˆë²•??baseline(`src/app/admin/onboarding` ? ê·œ ?¼ìš°??+ ì¡°ì§ ì»¨í…?¤íŠ¸/ë¶€?œÂ·ì§???¼ê´„ ?±ë¡/?´ê? ?•ì±… ê¸°ë³¸ê°??ìš© ?ë¦„ + ?¨ë³´??ì²´í¬ë¦¬ìŠ¤??ì§„ì²™??+ locale-aware copy + ì»´í¬?ŒíŠ¸/? í‹¸ ë¶„ë¦¬ + WI-0237 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0238 ì§ì› ?¸ì•± ê°€?´ë“œ baseline(`src/app/employee/guide` ? ê·œ ?¼ìš°??+ ìµœê·¼ 14??ê·¼íƒœ/?´ê?/ëª…ì„¸ ?œë™ ê¸°ë°˜ ì²´í¬ë¦¬ìŠ¤??+ ë¹ ë¥¸ ?´ë™ ë§í¬/ê¶Œì¥ ê²½ë¡œ + locale-aware copy + ì»´í¬?ŒíŠ¸/??ì²´í¬ë¦¬ìŠ¤??ë¶„ë¦¬ + WI-0238 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0239 ë°˜ì‘??ëª¨ë°”????UX baseline(`SaasMobileMenu` ê³µí†µ ì»´í¬?ŒíŠ¸ ì¶”ê? + Admin/Employee ?ˆì´?„ì›ƒ ëª¨ë°”??? ê? ë©”ë‰´ ?ìš© + `globals.css` ëª¨ë°”??shell/action ë°˜ì‘???•ë¦¬ + `shell.mobileMenu` i18n + WI-0239 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0240 ëª¨ë°”????Shell baseline(`apps/mobile` Expo ?¤ìº?´ë“œ + ë¡œê·¸??ì»¨í…?¤íŠ¸/?¸ì…˜ ?€??+ Admin/Employee ????+ ê³µí†µ API ?´ë¼?´ì–¸??+ WI-0240 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0241 ëª¨ë°”???¸ì‹œ ?Œë¦¼ baseline(`apps/mobile` ?¸ì‹œ ê¶Œí•œ/? í° bootstrap + ?Œë¦¼ ? í˜¸ ?€??+ ?Œë¦¼ ?¼í„° ??+ Admin/Employee ì§„ì… ?¡ì…˜ + WI-0241 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0242 ëª¨ë°”???´ë©”???œí”Œë¦??”ì§„ baseline(`apps/mobile` ê±°ë˜???œí”Œë¦?ì¹´íƒˆë¡œê·¸/ì¹˜í™˜ ?Œë”??+ locale(`ko`/`en`) ?„ë¦¬ë·?+ Admin ?œí”Œë¦??”ë©´/?ˆìŠ¤? ë¦¬ ?€??+ WI-0242 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0243 ?¸ì•± ?Œë¦¼ ?¼í„° ?¤ì‹œê°??…ë°?´íŠ¸ baseline(`apps/mobile` ?Œë¦¼ ?¼ë“œ helper + 30ì´?polling + ?˜ë™ ?ˆë¡œê³ ì¹¨/?¼ì´ë¸?? ê? + ì¹´í…Œê³ ë¦¬ ?„í„°/ë¯¸í™•??ì¹´ìš´??+ WI-0243 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0244 ëª¨ë°”???Œë¦¼ ?ˆìŠ¤? ë¦¬ ê²€??ë³´ê? baseline(`apps/mobile` ?Œë¦¼ ?ˆìŠ¤? ë¦¬ helper + ê²€??ì¹´í…Œê³ ë¦¬/?½ìŒ/ë³´ê? ?„í„° + ë³´ê?/ë³µì› ?¡ì…˜ + `NotificationHistory` ?„ìš© ?”ë©´/?¼ìš°??+ WI-0244 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0245 ëª¨ë°”???Œë¦¼ ?ˆìŠ¤? ë¦¬ ?¼ê´„ ?¡ì…˜ baseline(`apps/mobile` ?Œë¦¼ ?ˆìŠ¤? ë¦¬ ?¤ê±´ ? íƒ + select-visible/clear-selection + mark-read/archive/unarchive bulk ?¡ì…˜ + WI-0245 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0246 ëª¨ë°”???Œë¦¼ ?ˆìŠ¤? ë¦¬ ë¹ ë¥¸ ?„ë¦¬???„í„° baseline(`apps/mobile` ?„ë¦¬???„í„° ì¹´íƒˆë¡œê·¸(`allOpen`/`approvalUnread`/`resultUnread`/`payslipUnread`/`archived`) + ?„ë¦¬?‹ë³„ ì¹´ìš´??+ active/custom ?„ë¦¬???íƒœ + WI-0246 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0247 ëª¨ë°”???Œë¦¼ ?ˆìŠ¤? ë¦¬ ?„ë¦¬??ê³ ì •/ìµœê·¼?¬ìš© baseline(`apps/mobile` ?„ë¦¬??pin/unpin + recent ?„ë¦¬??ì¶”ì  + `notificationStore` preset-state ?ì†??+ `Pinned/Recent presets` ?¹ì…˜ + WI-0247 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0248 ëª¨ë°”???Œë¦¼ ?ˆìŠ¤? ë¦¬ ?„ë¦¬??ê°€?¸ì˜¤ê¸??´ë³´?´ê¸° baseline(`apps/mobile` ?„ë¦¬??transfer payload(`type/version/state`) ì§ë ¬???Œì„œ + `NotificationPresetTransferCard` ?´ë³´?´ê¸°/ê°€?¸ì˜¤ê¸?UI + ?„ë¦¬???íƒœ import ?ìš© + WI-0248 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0249 ëª¨ë°”??ê´€ë¦¬ì ?¹ì¸ ?€ê¸???baseline(`apps/mobile` `ApprovalQueueScreen` ? ê·œ + ?¹ì¸ ?€ê¸?ê²€???íƒœÂ·?°ì„ ?œìœ„ ?„í„°/?•ë ¬ + approve/reject quick action + `approvalQueueStore` ?ì†??+ Admin ??ì§„ì… ?°ê²° + WI-0249 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0250 ëª¨ë°”??ì§ì› ?€?„ì„œë¹„ìŠ¤ ?”ì²­ ?œì¶œ baseline(`apps/mobile` `EmployeeRequestSubmitScreen` ? ê·œ + ì¶œí‡´ê·??•ì •/?´ê? ?”ì²­ submit form + ?…ë ¥ ê²€ì¦?ë¡œì»¬ ?ì†??+ Employee ??ë¹ ë¥¸ ì§„ì… ?°ê²° + WI-0250 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0251 ëª¨ë°”??ì§ì› ?”ì²­ ?´ë ¥/?íƒœ ì¶”ì  baseline(`apps/mobile` `EmployeeRequestHistoryScreen` ? ê·œ + ?”ì²­ ?´ë ¥ ê²€???”ì²­? í˜•Â·?íƒœ ?„í„°/?•ë ¬ + ?íƒœ ?„í™˜ ?€?„ë¼??ì¶”ì  + `EmployeeRequestSubmit`/Employee ???´ë ¥ ì§„ì… ?°ê²° + WI-0251 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0252 ëª¨ë°”??ì§ì› ?”ì²­ ?Œë¦¼/?„ì† ?¡ì…˜ baseline(`apps/mobile` `EmployeeRequestFollowUpScreen` ? ê·œ + ?íƒœ ê¸°ë°˜ follow-up ?Œë¦¼ ?¸ë°•??+ ?¬ê°???íƒœ ?„í„°Â·?°ì„ ?œìœ„ ?•ë ¬ + ?„ì† quick action(ê²€???´ë™/?¹ì¸/ë°˜ë ¤/?¬ê??? + ?”ì²­ ?´ë ¥/?œì¶œ ?”ë©´ ?°ë™ + WI-0252 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0253 ëª¨ë°”??ì§ì› ?”ì²­ ?„ì† ?œí”Œë¦??ë™ ì¶”ì²œ baseline(`apps/mobile` follow-up template catalog(`triage/decision/recovery/closure`) + ?œí”Œë¦??ë™ ì¶”ì²œ helper + `EmployeeRequestFollowUpScreen` ì¶”ì²œ ?œí”Œë¦??¹ì…˜/ê¶Œì¥ ?¡ì…˜ ì¦‰ì‹œ ?ìš© + WI-0253 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0254 ëª¨ë°”??ì§ì› ?”ì²­ ?„ì† ?¡ì…˜ ë²ˆë“¤/?€??preset baseline(`apps/mobile` follow-up bundle preset catalog(`allActionRequired/triageQueue/decisionQueue/recoveryQueue`) + pinned/recent preset state ë¡œì»¬ ?€??+ `EmployeeRequestFollowUpScreen` preset ?ìš©/ë¹ ë¥¸ ?¤í–‰/?€ ? ê? + WI-0254 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0255 ëª¨ë°”??ì§ì› ?”ì²­ ?„ì† preset ê°€?¸ì˜¤ê¸??´ë³´?´ê¸° baseline(`apps/mobile` follow-up preset transfer payload(`type/version/state`) ì§ë ¬???Œì„œ + `EmployeeRequestFollowUpPresetTransferCard` import/export UI + preset import ì¦‰ì‹œ ?ìš© + WI-0255 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0256 ëª¨ë°”??ë¶„ì„ ?€?œë³´??baseline(`apps/mobile` `mobileAnalytics` helper(ê¸°ê°„ ?„í„°/KPI snapshot/?¼ë³„ trend/export payload) + `MobileAnalyticsDashboardScreen` ? ê·œ + ê´€ë¦¬ì/ì§ì› ???€?œë³´??ì§„ì… + WI-0256 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0257 ëª¨ë°”??ë¶„ì„ ?€?œë³´??ê³µìœ /?„í„° preset baseline(`apps/mobile` analytics filter preset catalog(`allActionRequired/approvalRisk/requestFlow/notificationPulse`) + pin/recent preset ?€??+ preset transfer payload import/export + `MobileAnalyticsFilterPresetCard` + `MobileAnalyticsDashboardScreen` focus ?„í„° ?°ë™ + WI-0257 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0258 ëª¨ë°”???ì¸µ ?•ë¦¬ baseline(`docs/codex-guide.md` ?¸ì…˜ ê°•ì œ ì°¸ì¡° + ëª¨ë°”???Œë¦¼ ?ˆìŠ¤? ë¦¬???„ë¦¬??pin/recent/import-export ?œê±° + ëª¨ë°”???”ì²­ follow-up???œí”Œë¦?ë²ˆë“¤ ?„ë¦¬??import-export ?œê±° + ?”ë©´/?¤í† ???¨ìˆœ??+ WI-0258 ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0259 ê¸‰ì—¬ 4?€ë³´í—˜ ?•ì‚° ?¼ìš´???•í™•??ë³´ê°• baseline(`POST /payroll/runs/preview-insurance-settlement`??`settlement.insuranceRounding`(mode + NP/HI/LTC/EI/IA ?¨ìœ„) ì¶”ê? + ?¼ìš´???ì‹œ(raw) ê¸°ì—¬ê¸?trace ?‘ë‹µ ì¶”ê? + `/admin/payroll-insurance` ?…ë ¥/ê²°ê³¼ ?¨ë„ ?°ë™ + payroll spec/contract 1.39.0 ê°±ì‹  + WI-0259 ?Œê? ?ŒìŠ¤??ì¶”ê?)

### ì§„í–‰ ì¤?

- ?¤ìŒ: ê¸‰ì—¬ ?µì‹¬ ë³‘ëª© ì§€?????°ë§?•ì‚°(?Œë“ê³µì œ/?¸ì•¡ê³µì œ) ?•í™•??ë³´ê°•(`WI-F`) ì°©ìˆ˜ (WI-0260 ?ˆì •)

### ?„ì¬ ?„í‚¤?ì²˜

| ??ª© | ?„ì¬ ?íƒœ | ?„ë¡œ?•ì…˜ ?”êµ¬ |
|------|-----------|---------------|
| DB ëª¨ë¸ | 17ê°?(Department/Position + ApprovalPolicy/ApprovalDelegation ?¬í•¨; employeeId FK/RLS baseline ?ìš©) | 25~30ê°?|
| API ?”ë“œ?¬ì¸??| ~47ê°?| 100+ |
| ?¸ì¦ | Supabase JWT + ?¤ë” ?´ë°± + RBAC(permission) | RBAC ?”ì§„ + ?Œë„Œ??ê²©ë¦¬ |
| ??•  | 5ê°???•  + permission mapping(seed) | ?™ì  ??•  + ì»¤ìŠ¤?€ ê¶Œí•œ |
| ê¸‰ì—¬ ê³„ì‚° | phase2 ?˜ë™/?„ë¡œ??+ KR baseline ê·¼ì‚¬ | ?œêµ­ ?¸ë²• + 4?€ë³´í—˜ |
| UI | ê´€ë¦¬ì ?€?œë³´??`/admin`) + ê²°ì¬ ?•ì±…(`/admin/approval-policy`) + ì§ì› ?¬í„¸(`/employee`) + ëª…ì„¸??`/employee/payslips`) + ??`/`) | ê´€ë¦¬ì/ì§ì› ?¬ì • ?„ì„± + ê²°ì¬/?•ì±…/ëª…ì„¸??ê³ ë„??|
| ëª¨ë°”??| ? ï¸ `apps/mobile` ??+ ?¸ì‹œ + ?´ë©”???œí”Œë¦?+ ?Œë¦¼?¼í„° ?¤ì‹œê°??…ë°?´íŠ¸ + ?ˆìŠ¤? ë¦¬ ê²€??ë³´ê?/?¼ê´„ ?¡ì…˜ + ê´€ë¦¬ì ?¹ì¸ ?€ê¸???+ ì§ì› ?”ì²­ ?œì¶œ + ?”ì²­ ?´ë ¥/?íƒœ ì¶”ì  + ?”ì²­ ?Œë¦¼/?„ì† ?¡ì…˜ + ëª¨ë°”??ë¶„ì„ ?€?œë³´??+ ë¶„ì„ ?€?œë³´??ê³µìœ /?„í„° preset baseline + ëª¨ë°”???ì¸µ ?•ë¦¬ baseline (WI-0258) | ?¤ì´?°ë¸Œ ??(iOS/Android) |
| ë©€?°í…Œ?ŒíŠ¸ | baseline ?ìš© (Supabase RLS + FLOWHR_TENANCY_V1 ?Œë˜ê·? | ì¡°ì§ë³??„ì „ ê²©ë¦¬ |

---

## 2. ?„í‚¤?ì²˜ ?‰ê? ë°?ê°œì„  ê³¼ì œ

> WI-0001 ~ WI-0030 ê¹Œì???ê°œë°œ ê³¼ì •???€??êµ¬ì¡°???‰ê?.

### ê°•ì 

| ??ª© | ?ì„¸ |
|------|------|
| **Contract-First ê°œë°œ** | `specs/` ??api.yaml + contract.yaml??ë¨¼ì? ?‘ì„±?˜ê³  êµ¬í˜„. SemVer, API/Contract ì»¤í”Œë§?ê²Œì´?¸ë? CIë¡?ê°•ì œ. |
| **DataAccess ì¶”ìƒ??* | `memory` / `prisma` ?´ì¤‘ êµ¬í˜„?¼ë¡œ ?ŒìŠ¤??memory)?€ ?°í???prisma)???„ì „ ë¶„ë¦¬. ??Store ì¶”ê? ???¸í„°?˜ì´?¤ë§Œ ?•ì¥. |
| **ê±°ë²„?ŒìŠ¤ ?ë™??* | PR ?œí”Œë¦? Golden Fixture, ë³€ê²??µì œ, ?´ë²¤??ì¶”ì ????1???´ì˜?ì„œ???ˆì§ˆ??? ì??????ˆëŠ” CI ê²Œì´??êµ¬ì¶•. |
| **ê°ì‚¬ ì¶”ì ** | AuditLogê°€ ëª¨ë“  ?íƒœ ë³€ê²½ì— ?´ì¥. ?„ë©”???´ë²¤?¸ì? ê°ì‚¬ ë¡œê·¸ê°€ ?¼ê???êµ¬ì¡°. |

### êµ¬ì¡°??ë¬¸ì œ??

#### 2-1. ê±°ë²„?ŒìŠ¤ ê³¼ì‰ vs ê¸°ëŠ¥ ë¶€ì¡?

32ê°?WI??ì¹´í…Œê³ ë¦¬ ë¶„í¬:

```
?µì‹¬ ë¹„ì¦ˆ?ˆìŠ¤: 12ê°?(38%)  ???¤ì œ ?œí’ˆ ê¸°ëŠ¥
ê±°ë²„?ŒìŠ¤/?ˆì§ˆ: 11ê°?(34%)  ??CI ê²Œì´?? ?Œê? ?ŒìŠ¤??
?´ì˜/?¸í”„??    7ê°?(22%)  ???Œë¦¼, ?´ë²¤???„ì†¡, ?¬ìŠ¤ ëª¨ë‹ˆ?°ë§
UI:             2ê°?( 6%)  ???´ì˜ ì½˜ì†”, ë¦¬ìŠ¤??
```

MVP ?¨ê³„?ì„œ **ê±°ë²„?ŒìŠ¤ê°€ ë¹„ì¦ˆ?ˆìŠ¤ ê¸°ëŠ¥ê³?ê±°ì˜ ?™ì¼??ë¹„ì¤‘**??ì°¨ì?.
PR ?œí”Œë¦?ê²€ì¦?WI-0021), ê·??Œê? ?ŒìŠ¤??WI-0023), Golden ë³€ê²??µì œ(WI-0024) ?±ì?
?œí’ˆ???±ìˆ™???„ì— ?„ì…?´ë„ ??? ?ŠëŠ” ??ª©??

**ë¡œë“œë§?ë°˜ì˜**: Phase 1 ?´í›„ ê±°ë²„?ŒìŠ¤ WI ë¹„ìœ¨??20% ?´í•˜ë¡??œí•œ. ë¹„ì¦ˆ?ˆìŠ¤ ê¸°ëŠ¥ ?°ì„ .

#### 2-2. employeeId ì°¸ì¡° ë¬´ê²°??ë¶€??(String ì°¸ì¡°) ??ê°€????ê¸°ìˆ  ë¶€ì±?

Employee/Organization ë§ˆìŠ¤?°ëŠ” WI-0034ë¡??„ì…?ˆê³ , WI-0035?ì„œ ?µì‹¬ ?„ë©”???Œì´ë¸”ì—
`Employee` FKë¥??„ì…?˜ì—¬ **ì°¸ì¡° ë¬´ê²°??ë¶€??*ë¥??´ì†Œ?ˆìŠµ?ˆë‹¤.

```
?„ì¬: AttendanceRecord.employeeId ??Employee FK (?„ì… ?„ë£Œ)
     LeaveRequest.employeeId     ??Employee FK (?„ì… ?„ë£Œ)
     PayrollRun.employeeId       ??Employee FK (nullable; ?„ì… ?„ë£Œ)
```

?´ë¡œ ?¸í•´:
- ì¡´ì¬?˜ì? ?ŠëŠ” employeeIdë¡?ê·¼íƒœ/?´ê?/ê¸‰ì—¬ ?ì„± ê°€??(?°ì´??ë¬´ê²°???„ë°˜)
- ì§ì› ?´ì‚¬/ë¶€?œì´?????°ì‡„ ì²˜ë¦¬ ë¶ˆê?
- ë©€?°í…Œ?ŒíŠ¸ ê²©ë¦¬ ???Œë„Œ?¸ë³„ ì§ì› ë²”ìœ„ ?¤ì • ë¶ˆê?

**ë¡œë“œë§?ë°˜ì˜**: employeeId FK ë§ˆì´ê·¸ë ˆ?´ì…˜(WI-0035) ?„ë£Œ. ?¤ìŒ?€ ?Œë„Œ??ê²©ë¦¬(WI-0037).

#### 2-3. ?˜ì§ ê°•í™” ?¸ì¤‘, ?˜í‰ ?•ì¥ ë¶€??

ê°™ì? ?„ë©”??ê·¼íƒœ/ê¸‰ì—¬)??ë°˜ë³µ?ìœ¼ë¡?ê°•í™”?˜ë©´???ˆë¡œ???„ë©”??ì§„ì¶œ????Œ:

```
ê·¼íƒœ ê´€?? WI-0001, 0008, 0009, 0016, 0017, 0026, 0031 ??7ê°?WI
ê¸‰ì—¬ ê´€?? WI-0005, 0006, 0010, 0028, 0030              ??5ê°?WI
?´ê? ê´€?? WI-0002, 0003, 0027                           ??3ê°?WI
?¸ì‚¬ ë§ˆìŠ¤?? WI-0034(Organization/Employee)ë§??ˆê³  ?˜ë¨¸ì§€??ë¯¸ì™„
```

ê·¼íƒœ ë°˜ë ¤ ?¬ìœ (WI-0016) + ë°˜ë ¤ ê²€ì¦?WI-0017)ì²˜ëŸ¼ ??ê¸°ëŠ¥??2ê°?WIë¡?ë¶„ë¦¬?˜ëŠ” ?€??
Employee ëª¨ë¸?´ë‚˜ Department ëª¨ë¸??ë¨¼ì? ë§Œë“¤?ˆì–´????

**ë¡œë“œë§?ë°˜ì˜**: Phase 1?ì„œ ?¸ì‚¬ ë§ˆìŠ¤?°ë? ?•ë¦½???? Phase 2~5?ì„œ ?„ë©”?¸ì„ ?˜í‰ ?•ì¥.

#### 2-4. ?˜ë“œì½”ë”© ?˜ì¡´

| ??ª© | ?„ì¬ | ë¬¸ì œ |
|------|------|------|
| ??•  | `actor.ts`??5ê°?ë¦¬í„°??ë°°ì—´ | ê³ ê°ë³?ì»¤ìŠ¤?€ ??•  ë¶ˆê? |
| ê¸‰ì—¬ ê·œì¹™ | `payroll-rules.ts`???œêµ­ ?„ìš© ë¡œì§ ?¸ë¼??| ?¤êµ­ê°€/?¤ë²•???•ì¥ ë¶ˆê? |
| ?¼ê°„ ?œê°„?€ | `00:00~04:00` ?˜ë“œì½”ë”© | ì¡°ì§ë³??¼ê°„ ê¸°ì? ë³€ê²?ë¶ˆê? |
| ê¸°ë³¸ ?°ì°¨ | `15?? ?˜ë“œì½”ë”© | ?•ì±…ë³?ë¶€?¬ì¼??ë³€ê²?ë¶ˆê? |

**ë¡œë“œë§?ë°˜ì˜**: RBAC ?”ì§„ ?„ì… ?„ë£Œ(WI-0036). ?´í›„ Phase 4?ì„œ ê¸‰ì—¬ ê·œì¹™ ?”ì§„??WIë¥?ë³„ë„ ë°œí–‰?˜ì—¬ ì§„í–‰.

### ê°œì„  ?°ì„ ?œìœ„ ?”ì•½

```
ê¸´ê¸‰ ?Œâ??€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€??
     ??1. Employee/Organization ëª¨ë¸ (?„ë£Œ: WI-0034) ????ê¸°ì´ˆ ?•ë³´
     ??2. employeeId FK ë§ˆì´ê·¸ë ˆ?´ì…˜ (?„ë£Œ: WI-0035) ????ë¬´ê²°??ë¶€???´ì†Œ
     ??3. RBAC ?”ì§„ (?„ë£Œ: WI-0036)                  ?????˜ë“œì½”ë”© ?œê±°
     ??4. ë©€?°í…Œ?ŒíŠ¸ RLS (?„ë£Œ: WI-0037)              ????SaaS ê¸°ë°˜
     ?œâ??€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€??
?’ìŒ  ??5. ê·¼ë¬´?¼ì • & ì¶œí‡´ê·?ê³ ë„??(Phase 2)         ?????µì‹¬ ê¸°ëŠ¥ ?•ì¥
     ??6. ê¸‰ì—¬ ?”ì§„ ê³ ë„??(Phase 4)                 ?????¸ë²• ë¯¸ì ??
     ?œâ??€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€??
ì¤‘ê°„  ??7. SaaS UI ?°ì¹­ ?ˆì§ˆ (Phase 6)                ????UI ë² ì´?¤ë¼?¸ì? ?´ë? main??ì¡´ì¬(WI-0088). Phase 6?ì„œ '?°ì¹­ ?ˆì§ˆ'ë¡??•ì¥
     ??8. ëª¨ë°”????(Phase 7)                        ????ì±„ë„ ë¶€??
     ?œâ??€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€??
??Œ  ??9. ?•ì¥ ê¸°ëŠ¥ (Phase 8)                       ????ë¶€ê°€ ëª¨ë“ˆ
     ?”â??€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€??
```

---

## 3. ?„ë¡œ?•ì…˜ê¸?ê¸°ì? (Shiftee/Flex ?ìœ„?¸í™˜ ë²¤ì¹˜ë§ˆí¬)

### ê¸°ëŠ¥ ëª¨ë“ˆ ë§¤í•‘

| ëª¨ë“ˆ | Shiftee | Flex | FlowHR ?„ì¬ | Gap |
|------|---------|------|-------------|-----|
| **?¸ì‚¬ ë§ˆìŠ¤??* | ??ì§ì›/ë¶€??ì§ê¸‰/ì¡°ì§??| ??ì§ì›/ì¡°ì§/?´ë ¥ê´€ë¦?| ? ï¸ Organization/Employee ê¸°ë³¸ CRUD(WI-0034) + RBAC baseline(WI-0036); Department/Position ë¯¸ë„??| High |
| **ë©€?°í…Œ?ŒíŠ¸** | ???Œì‚¬ë³?ê²©ë¦¬ | ???Œí¬?¤í˜?´ìŠ¤ ê²©ë¦¬ | ? ï¸ baseline ?ìš©(Supabase RLS + `FLOWHR_TENANCY_V1`, WI-0037) | Critical |
| **ê·¼ë¬´?¼ì •** | ??êµë?ê·¼ë¬´/? ì—°ê·¼ë¬´ | ???œì°¨ì¶œê·¼/?¬íƒ | ? ï¸ WorkSchedule CRUD + template ?¨ê±´/?¤ê±´ + rotation assign/balance/optimize/fairness/fairness-apply + global fairness constraints baseline(WI-0040~0047, WI-0057, WI-0058, WI-0059, WI-0061, WI-0063); ê³ ê¸‰ ? í˜¸/ë²•ê·œ ë©€?°ëª©??ìµœì ??ë¯¸ë„??| Medium |
| **ì¶œí‡´ê·?* | ??GPS/ë¹„ì½˜/?¤ì˜¤?¤í¬ | ??GPS/Wi-Fi/QR | ? ï¸ ì±„ë„ ë©”í??°ì´??+ GPS/ì§€?¤íœ???¤ì¤‘ ?¬ì—…???”ë°”?´ìŠ¤ allowlist/attestation/anti-spoofing + signal fusion + dynamic reputation + multi-provider + circuit-breaker baseline(WI-0048~0056, WI-0060, WI-0062, WI-0064, WI-0066) ?„ë£Œ, ?ì‘???¼ìš°???ë™ë³µêµ¬ ?´ì˜ ë¯¸ë„??| Medium |
| **ê·¼íƒœ ì§‘ê³„** | ???ë™ ì§‘ê³„/?´ìƒ ê°ì? | ???¤ì‹œê°??€?œë³´??| ? ï¸ ì§‘ê³„ ì¡°íšŒ API(WI-0031) + anomaly ë¦¬í¬???Œë¦¼/?ìŠ¤ì»¬ë ˆ?´ì…˜ + cockpit/ticket/stream + ops dashboard/incident stream automation + incident lifecycle command/read-model baseline(WI-0045, WI-0051, WI-0055, WI-0065, WI-0067, WI-0068, WI-0071, WI-0072, WI-0073); durable incident store/SLA ?ë™??ë¯¸ë„??| Medium |
| **?´ê? ê´€ë¦?* | ???•ì±… ?”ì§„/?”ì—¬???ë™ê³„ì‚° | ???ë™ ë¶€???Œì§„ ì¶”ì  | ? ï¸ ?´ê? ?”ì²­/?¹ì¸/ì·¨ì†Œ + ?”ì•¡/?•ì‚° baseline(WI-0002/0003) + ì¡°ì§ ?•ì±… baseline(WI-0090). ?œê°„?¨ìœ„/ë°˜ì°¨/?°ì°¨ì´‰ì§„/ìº˜ë¦°???°ë™ ë¯¸ë„??| Medium |
| **ê¸‰ì—¬ ê³„ì‚°** | ???œêµ­ ?¸ë²•/4?€ë³´í—˜/?°ë§?•ì‚° | ??ê¸‰ì—¬ ?œë??ˆì´??ëª…ì„¸??| ? ï¸ ?¨ìˆœ ë¹„ìœ¨ | Critical |
| **?„ìê²°ì¬** | ??ê²°ì¬???‘ì‹/?„ì„ | ???¹ì¸ ?Œí¬?Œë¡œ | ? ï¸ ?„ë©”?¸ë³„ ?¹ì¸(ì¶œí‡´ê·??´ê?/ê¸‰ì—¬ ?•ì •) baseline ì¡´ì¬. ë²”ìš© ê²°ì¬???„ì„/?‘ì‹/?„ì?œëª…?€ ë¯¸ë„??| High |
| **?„ìê³„ì•½** | ??ê·¼ë¡œê³„ì•½/?„ì?œëª… | ??ê³„ì•½ ê´€ë¦?| ???†ìŒ | Medium |
| **ê´€ë¦¬ì ?€?œë³´??* | ????SPA | ????SPA | ? ï¸ `/admin` SaaS ?€?œë³´??baseline + ops ì½˜ì†”?€ `/ops/*`ë¡?ê²©ë¦¬(ê¸°ë³¸ ?¨ê?) | Critical |
| **ì§ì› ?€?„ì„œë¹„ìŠ¤** | ?????¬íƒˆ | ?????¬íƒˆ | ? ï¸ `/employee` baseline + `/employee/payslips` (?•ì • ê¸‰ì—¬ ì¡°íšŒ) | Critical |
| **ëª¨ë°”????* | ??iOS/Android | ??iOS/Android | ???†ìŒ | High |
| **?Œë¦¼** | ???¸ì‹œ/?´ë©”??Slack | ???¸ì‹œ/Slack/Teams | ? ï¸ ?¹í›… + ë¶€ë¶??´ë©”??ì´ˆë?/?°ì°¨ì´‰ì§„) | Medium |
| **ì±„ìš© ê´€ë¦?* | ??ATS | ? ï¸ ê¸°ë³¸ | ???†ìŒ | Low |
| **?±ê³¼ ?‰ê?** | ??MBO/OKR | ??ë¦¬ë·° ?œìŠ¤??| ???†ìŒ | Low |
| **ê²½ë¹„ ê´€ë¦?* | ? ï¸ ê¸°ë³¸ | ??ê²½ë¹„ ì²?µ¬/?•ì‚° | ???†ìŒ | Low |
| **êµìœ¡ ê´€ë¦?* | ? ï¸ ê¸°ë³¸ | ? ï¸ ê¸°ë³¸ | ???†ìŒ | Low |
| **ë¶„ì„/ë¦¬í¬??* | ???€?œë³´???‘ì? | ??ì»¤ìŠ¤?€ ë¦¬í¬??| ???†ìŒ | Medium |

### ?ìœ„?¸í™˜ ?¹ë¦¬ ì¡°ê±´ (?´ì˜ KPI)

| ?ì—­ | ?¹ë¦¬ ê¸°ì? (FlowHR ëª©í‘œ) |
|------|--------------------------|
| ê´€ë¦¬ì ?´ì˜ ?ë„ | ê·¼íƒœ ?´ìŠˆ ?¸ì??’ì¡°ì¹??„ë£Œ median 3ë¶??´ë‚´ |
| ì§ì› ?€?„ì„œë¹„ìŠ¤ ?ë„ | ì¶œí‡´ê·??•ì •/?´ê? ? ì²­ median 90ì´??´ë‚´ |
| ê¸‰ì—¬ ?•í™•??| ê³¨ë“  ì¼€?´ìŠ¤ 100% ?¼ì¹˜ + ë¦´ë¦¬ì¦???ê³„ì‚° ê²°í•¨ 0ê±?ëª©í‘œ |
| ë³€ê²??ˆì •??| main ë³‘í•© ??rollback ë¹„ìœ¨ 2% ë¯¸ë§Œ |
| ?¥ì•  ?€??| P1 incident MTTR 30ë¶??´ë‚´ |

### ?„ì¬ ?¬ì„±ë¥?ì¶”ì •: ~10-12%

---

## 4. Phase ?˜ì¡´???¤ì´?´ê·¸??

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

**?µì‹¬ ?˜ì¡´ ê´€ê³?*:
- Phase 2~5??Phase 1(?¸ì‚¬/ê¶Œí•œ/?Œë„Œ??ê¸°ë°˜)???˜ì¡´
- Phase 4(ê¸‰ì—¬)??Phase 2(ê·¼íƒœ) + Phase 3(?´ê?)???˜ì¡´
- UI??Phase 2ë¶€??ë³‘ë ¬ë¡?ì§„í–‰?˜ë©°, Phase 6?ì„œ '?°ì¹­ ?ˆì§ˆ' ?˜ì??¼ë¡œ ê³ ë„??

---

## 5. Phase ?ì„¸

### Phase 1: Production Foundation (?„ë£Œ)

**ëª©í‘œ**: 1???´ì˜?ì„œ???ˆì „?˜ê²Œ ?•ì¥?????ˆë„ë¡??¸ì‚¬ ë§ˆìŠ¤??ë¬´ê²°??ê¶Œí•œ/?Œë„Œ??ê¸°ë°˜??ë¨¼ì? ê³ ì •?©ë‹ˆ??

| WI | ?íƒœ | ?”ì•½ |
|----|------|------|
| WI-0033 | Done | ë¡œë“œë§??¤í–‰ê³„íš ?•í•© + Phase 1 WI ?œë“œ |
| WI-0034 | Done | People ?„ë©”??Organization/Employee) + API + Prisma ëª¨ë¸ |
| WI-0035 | Done | ê¸°ì¡´ `employeeId: string` ??`Employee` FK ë§ˆì´ê·¸ë ˆ?´ì…˜ |
| WI-0036 | Done | RBAC ?”ì§„ ?„ì…(?˜ë“œì½”ë”© ??•  ?œê±°) |
| WI-0037 | Done | ë©€?°í…Œ?ŒíŠ¸ ê²©ë¦¬ baseline (Supabase RLS) |

?´ì˜ ?ˆì •???ì‹œ):

| WI | ?íƒœ | ?”ì•½ |
|----|------|------|
| WI-0038 | Done | phase2-health 409 ê²Œì´???œë‹(false incident ê°ì†Œ) |

**?„ë£Œ ê¸°ì? (DoD)**:
- [x] `Employee`ë¥?ì°¸ì¡°?˜ëŠ” ?µì‹¬ ?„ë©”???Œì´ë¸”ì´ FKë¡?ë¬´ê²°?±ì„ ë³´ì¥
- [x] ?˜ë“œì½”ë”© ??•  ì²´í¬ê°€ RBAC ?”ì§„?¼ë¡œ ?„í™˜
- [x] ìµœì†Œ ë©€?°í…Œ?ŒíŠ¸ ê²©ë¦¬(???ˆë²¨ ?¤ì½”??+ RLS baseline)ê°€ ?ìš©
- [x] ê¸°ì¡´ ?Œê? ?ŒìŠ¤??ë°?ê±°ë²„?ŒìŠ¤ ê²Œì´?¸ê? ëª¨ë‘ ?µê³¼

### Phase 2+ (?”ì•½)

- Phase 2: ê·¼ë¬´?¼ì •/êµë?/? ì—°ê·¼ë¬´ + GPS/QR ì¶œí‡´ê·?+ ?¤ì‹œê°?ê·¼íƒœ ?„í™©
- Phase 3: ?´ê? ?•ì±… ?”ì§„(?ë™ ë¶€???Œì§„/?°ì°¨ì´‰ì§„) + ?œê°„/ë°˜ì°¨ ?¨ìœ„
- Phase 4: ê¸‰ì—¬ ?”ì§„ ê³ ë„???¸ë²•/4?€ë³´í—˜/ëª…ì„¸??ë§ˆê°)
- Phase 5: ?„ìê²°ì¬/?„ìê³„ì•½(ê²°ì¬?? ë¬¸ì„œ ?‘ì‹, ?œëª…)
- Phase 6: ê´€ë¦¬ì/ì§ì› UI ?°ì¹­ ?ˆì§ˆ(?¬ì •/?¨ë³´??ê¶Œí•œ/?Œê?ê²Œì´??
- Phase 7: ëª¨ë°”??+ ?Œë¦¼(?¸ì‹œ/?´ë©”???¸ì•±)
- Phase 8: ?•ì¥ ëª¨ë“ˆ(ì±„ìš©/?±ê³¼/ê²½ë¹„/êµìœ¡/ë¶„ì„)

---

## 6. ê¸°ìˆ  ?¤íƒ (?„ì¬)

| ?ˆì´??| ê¸°ìˆ  | ë¹„ê³  |
|--------|------|------|
| Framework | Next.js | App Router |
| Language | TypeScript | |
| DB | PostgreSQL (Supabase) | |
| ORM | Prisma | migration ?¬í•¨ |
| Auth | Supabase Auth | JWT ê¸°ë°˜ |
| Validation | Zod | |
| Test | tsx ê¸°ë°˜ ?¤í¬ë¦½íŠ¸ | unit/integration/e2e/golden |

---

## 7. ?´ì˜ ë©”ëª¨

- Staging CI???ˆí¬ ë³€??`FLOWHR_ENABLE_STAGING_CI=true`???Œë§Œ ?™ì‘?©ë‹ˆ?? ?¤ì •?€ `docs/staging-secrets.md`ë¥??°ë¦…?ˆë‹¤.
- Phase2 ?´ì˜ ë¡¤ì•„???¬ìŠ¤ ëª¨ë‹ˆ?°ë§?€ `docs/production-rollout.md`ë¥??°ë¦…?ˆë‹¤.

---

## 8. ?„ë¡œ?•ì…˜ ë§ˆì¼?¤í†¤

| ë§ˆì¼?¤í†¤ | ëª©í‘œ |
|----------|------|
| **M1: Foundation** | Phase 1 ?„ë£Œ(ë¬´ê²°??RBAC/?Œë„Œ??ê¸°ë°˜) |
| **M2: Core HR Backend** | Phase 2~4 ?„ë£Œ(ê·¼ë¬´/?´ê?/ê¸‰ì—¬ ?”ì§„ ê³ ë„?? |
| **M3: Workflow & Docs** | Phase 5 ?„ë£Œ(ê²°ì¬/ê³„ì•½) |
| **M4: Web Launch** | Phase 6 ?„ë£Œ(??UI) |
| **M5: Mobile Launch** | Phase 7 ?„ë£Œ(ëª¨ë°”???Œë¦¼) |

---

> **Note**: WI ë²ˆí˜¸ ë²”ìœ„???ˆì•½?˜ì? ?ŠìŠµ?ˆë‹¤. ?ˆë¡œ???‘ì—…?€ `work-items/`???¤ìŒ ë²ˆí˜¸ë¡??ì„±?©ë‹ˆ??

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
- WI-0356 home locale devtools copy gap fix (`src/lib/i18n/messages.ts` ? ê·œ ??ì¶”ê? + `/` ??employee/devtools ë§í¬ ?¼ë²¨ i18n ì¹˜í™˜ + regression test)
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
- WI-0388 admin directory action orchestrator extraction (`src/app/admin/page-directory-actions.ts` ? ê·œ ë¶„ë¦¬ + people/org/schedule ?¡ì…˜ ?¤ì??¤íŠ¸?ˆì´???´ë™ + `src/app/admin/page.tsx` wiring ê°„ì†Œ??+ regression test)
- WI-0389 employee mutation action orchestrator extraction (`src/app/employee/page-mutation-actions.ts` ? ê·œ ë¶„ë¦¬ + snapshot/attendance/leave ?¡ì…˜ ?¤ì??¤íŠ¸?ˆì´???´ë™ + `src/app/employee/page.tsx` wiring ê°„ì†Œ??+ regression test)
- WI-0390 vercel main auto-deploy restore (vercel.json github integration re-enabled + main-only deployment policy retained + e2e-wi0284 policy guard updated + regression test)
- WI-0391 vercel scope fallback for main deploy workflow (make VERCEL_SCOPE optional + scoped vercel CLI fallback without --scope + e2e-wi0390 workflow contract hardening)
- WI-0392 vercel scope-candidate fallback (try VERCEL_SCOPE then GITHUB_REPOSITORY_OWNER for scoped Vercel CLI commands + explicit attempted-scope diagnostics + e2e-wi0390 guard update)
- WI-0393 employee payslips UTF-8 encoding guard (`/employee/payslips` compare insight Korean strings UTF-8 recovery + mojibake regression guard test + `.vercel` git ignore hardening)
- WI-0394 Korean copy terminology normalization (`/employee/withholding-receipt`, `/employee/payslip-receipts`, `/employee/contracts` ?©ì–´ ?¼ê??? ì§ì› ë²ˆí˜¸/?¤í–‰/?´ì‹œê°?+ contracts ko locale spread ?œê±° + regression guard test)
- WI-0395 contracts Korean copy residual cleanup and localized request fallback (`/admin/contracts`, `/admin/contracts/builder`, `/employee/contracts` ko ?©ì–´ `ID` ?”ì—¬ ?œê±° + contracts API fallback ?ëŸ¬ë¬?locale copy ?°ê²° + regression guard test)
- WI-0396 payslip copy regression reversal and people page decomposition (`/employee/payslips` ë¹„êµ ?¸ì‚¬?´íŠ¸ copy/helper ì¶”ì¶œë¡?page ??–‰ ?´ì†Œ + `/admin/people` view/types/helpers ë¶„í•´ë¡?`page.tsx` 500ì¤?ë¯¸ë§Œ ?Œë³µ + ?Œê? ?ŒìŠ¤??ê°±ì‹ )
- WI-0397 scheduling dedicated admin/employee workspace baseline (`/admin/scheduling` CRUD workspace + `/employee/schedule` own-board summary + i18n nav/copy + regression test)
- WI-0398 payslip page view decomposition and render-orchestrator split (`/employee/payslips` render extract to `page-view.tsx` + orchestration-only `page.tsx` and line-count reduction + regression test)
- WI-0399 notice-benefits-recruitment baseline routes and nav i18n wiring (`/admin/notices`, `/admin/benefits`, `/admin/recruitment`, `/employee/benefits`, `/employee/recruitment` baseline routes + admin/employee nav and ko/en i18n key wiring + regression test)
- WI-0400 mobile root navigator locale-dynamic title baseline (`apps/mobile` navigator title/splash copy locale switch for `ko`/`en` + locale resolver helper + regression test)
- WI-0401 korean copy residual sweep for withholding/payslip/contracts (`/employee/withholding-receipt`, `/employee/payslip-receipts`, `/employee/contracts`, `/admin/contracts` ko copy residual english label cleanup + contracts KPI aria locale copy + regression guard test)
- WI-0402 korean copy residual sweep phase2 (admin/employee/payroll/ops ko label normalization: `ì§ì› ID`/`ì¡°ì§ ID`/`?¡í„° ID`/`API ë¡œê·¸` -> `ì§ì› ë²ˆí˜¸`/`ì¡°ì§ ?ë³„??/`?¡í„° ?ë³„??/`?”ì²­ ë¡œê·¸` + legacy-term regression guard test)
- WI-0403 employee payslips derived-state hook extraction (`/employee/payslips/page.tsx` derived memo blocks extracted to `use-payslip-derived-state.ts` + page line count reduction 749->517 + decomposition regression test)
- WI-0404 employee interaction handler builder extraction (`/employee/page.tsx` local interaction wrapper functions consolidated into `buildEmployeeInteractionHandlers` wiring + interaction handler delegation hardening in `page-interaction-actions.ts` + line count reduction to 976 + decomposition regression test)
- WI-0405 payslip/contracts residual english token cleanup (`/employee/payslips/page-view.tsx` session line role/org/actor labels localized via locale copy keys + `contracts/http.ts` locale-aware default fallback message + regression test hardening)
- WI-0406 global i18n residual token cleanup (`/admin/notices`, `/admin/benefits`, `/admin/recruitment`, `/employee/benefits`, `/employee/recruitment` ko copy residual ?œí˜„ ?•ë¦¬ + `apps/mobile` notification/history/preset locale-copy ë¶„ê¸° ë°??œêµ­??ê¸°ë³¸ ë¬¸êµ¬ ?•ë¦¬ + regression test)
- WI-0407 notices core journey implementation (`/api/notices` list/create + `/api/notices/{noticeId}/publish` ê²Œì‹œ ?¡ì…˜ + `/admin/notices` ?‘ì„±/ê²Œì‹œ ?Œí¬?¤í˜?´ìŠ¤ + `/employee/notices` ê²Œì‹œ ê³µì? ë³´ë“œ + notices nav/i18n wiring)
- WI-0408 benefits core journey implementation (`/api/benefits/catalog`, `/api/benefits/requests`, `/api/benefits/requests/{requestId}/decision` + `/admin/benefits` catalog/decision workspace + `/employee/benefits` request submit/history workspace)
- WI-0409 recruitment core journey implementation (`/api/recruitment/openings`, `/api/recruitment/referrals`, `/api/recruitment/referrals/{referralId}/stage` + `/admin/recruitment` opening/referral stage workspace + `/employee/recruitment` referral submit/history workspace)
- WI-0410 schedule user journey enhancement (`/employee/schedule` ê¸°ê°„ ?¨ì¶• ?¡ì…˜(?´ë²ˆ ??ì£??¤ìŒ ì£? + ?íƒœ/?´ì¼ ?„í„° + ?¤ìŒ ê·¼ë¬´ ì¹´ë“œ + ?íƒœ ë±ƒì? ëª©ë¡ + `EmployeeScheduleBoardView` ë¶„ë¦¬ + regression test)
- WI-0411 payslips page-view section decomposition (`/employee/payslips/page-view.tsx`ë¥?search/status/compare/detail ?¹ì…˜ ì»´í¬?ŒíŠ¸ë¡?ë¶„í•´ + `page-view-shared-sections.tsx`/`page-view-detail-panel.tsx` ì¶”ê? + ê¸°ì¡´ ?Œê? ? í°/id ? ì? + regression test)
- WI-0412 admin dashboard actions and compensation panels extraction (`src/app/admin/page-dashboard-actions.ts`ë¡?inbox/payroll/leave-policy/aggregate/dashboard ?¡ì…˜ ?¤ì??¤íŠ¸?ˆì´??ë¶„ë¦¬ + `src/app/admin/page-compensation-panels.tsx`ë¡?aggregate/payroll/debug ?¨ë„ ì¡°í•© ?´ë™ + `src/app/admin/page.tsx` wiring ê°„ì†Œ??+ regression test)
- WI-0413 korean label normalization for withholding/payslip/contracts (`/employee/payslips` ko copy?ì„œ API/CSV/PDF/JSON ?”ì—¬ ?œí˜„???”ì²­/??ë¬¸ì„œ/êµ¬ì¡° ?°ì´??ì¤‘ì‹¬?¼ë¡œ ?•ê·œ??+ `/components/withholding-receipt` ë¬¸ì„œ format/contentType ko ?¼ë²¨ ë§¤í•‘ ì¶”ê? + contracts ko ?µì‹¬ ?¼ë²¨ ?Œê? guard)
- WI-0414 korean runtime fallback guard for withholding/payslip/contracts (`/employee/payslips` ko ?°í??„ì—???ë¬¸ ?¤ë¥˜ë¬¸êµ¬/ë¯¸ë§¤??ê³µì œ??fallback ?œêµ­?´í™” + `/components/contracts/http.ts` ko ?°í????ë¬¸ raw error suppress + `/components/withholding-receipt` ë¯¸í™•??format/content-type fallback ?œêµ­?´í™” + regression test)
- WI-0415 admin dashboard state and panels decomposition (`src/app/admin/page-state.ts`ë¡??íƒœ/?¨ê³¼ ë¶„ë¦¬ + `src/app/admin/page-panels.tsx`ë¡??¨ë„ ?Œë”ë§?wiring ë¶„ë¦¬ + `src/app/admin/page.tsx` orchestration ?„ìš©?¼ë¡œ ì¶•ì†Œ(<=500 lines) + regression test)
- WI-0416 korean runtime english residual sweep for withholding/payslip/contracts (`/employee/withholding-receipt` ì°¨ë‹¨?¬ìœ /?¸ì…˜?¤ë¥˜ ?ë¬¸ ?œêµ­???•ê·œ??+ `/employee/payslips` production ë°°ì?/?¸ì…˜?¤ë¥˜ runtime locale ê³ ì • + `/components/contracts` error/detail ì¶”ì¶œ ë°?catch ê²½ë¡œ suppress ê°•í™” + regression test)
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
- WI-0430 employee request/checklist derived hook extraction (`useEmployeeRequestChecklistDerivedState` ? ê·œ + request feedback/search/timeline/failure/checklist memo ë¸”ë¡ ë¶„ë¦¬ + `src/app/employee/page.tsx` 949->764 ?¼ì¸ ì¶•ì†Œ + regression test)
- WI-0431 employee dashboard derived hook extraction (`useEmployeeDashboardDerivedState` ? ê·œ + attendance/leave/resubmit/integrated-summary/correction-delta memo/effect ë¶„ë¦¬ + `src/app/employee/page.tsx` 764->568 ?¼ì¸ ì¶•ì†Œ + regression test)
- WI-0432 korean runtime latin fallback hardening (`/employee/payslips`, `/employee/payslip-receipts`, `/employee/withholding-receipt`, `/components/contracts/http.ts` ko ?°í????ëŸ¬ ?µì œ ê¸°ì???ASCII ë¹„ìœ¨?ì„œ "?¼í‹´ ë¬¸ì ?¬í•¨ ??fallback"?¼ë¡œ ê°•í™” + regression test)
- WI-0433 employee mutation runtime extraction and line-budget-500 recovery (`src/app/employee/page-mutation-runtime.ts` ? ê·œë¡?API call/pending/log/mutation wiring ë¶„ë¦¬ + `src/app/employee/page.tsx` 568->499 ?¼ì¸ ?ˆì‚° ?Œë³µ + WI-0375/WI-0389 regression ê¸°ì? ìµœì‹ ??+ regression test)
- WI-0434 employee notices search and unread filter (`EmployeeNoticeBoard`???œëª©/ë³¸ë¬¸ ?¤ì›Œ??ê²€??+ ë¯¸í™•???„ìš© ? ê? + ?„í„° ì´ˆê¸°???œì‹œ ê°œìˆ˜/?„í„°-ë¹ˆê²°ê³??ˆë‚´ ì¶”ê? + notices ko/en copy ?•ì¥ + regression test)
- WI-0435 employee benefits request search filter (`EmployeeBenefitsWorkspace` ??? ì²­ ?´ë ¥????ª©ëª??¬ìœ  ê²€??+ ê²€??ì´ˆê¸°??+ ?œì‹œ ê±´ìˆ˜/ê²€??ë¹ˆê²°ê³??ˆë‚´ ì¶”ê? + benefits ko/en copy ?•ì¥ + regression test)
- WI-0436 employee recruitment referral search filter (`EmployeeRecruitmentWorkspace` ??ì¶”ì²œ ?´ë ¥???„ë³´??ê³µê³ /ë©”ëª¨ ê²€??+ ê²€??ì´ˆê¸°??+ ?œì‹œ ê±´ìˆ˜/ê²€??ë¹ˆê²°ê³??ˆë‚´ ì¶”ê? + recruitment ko/en copy ?•ì¥ + regression test)
- WI-0437 employee schedule search filter (`EmployeeScheduleBoard` ?¼ì • ëª©ë¡??schedule ID/ë©”ëª¨ ê²€??+ ê²€??ì´ˆê¸°??+ ?œì‹œ ê±´ìˆ˜(visible/total) ì¶”ê? + scheduling ko/en copy ?•ì¥ + regression test)
- WI-0438 employee contracts inbox search filter (EmployeeContractsInbox.tsx inbox title/document/status/comment search + clear-search + visible-count/filtered-empty states + contracts ko/en copy extension + regression test)
- WI-0439 employee payslip receipts search filter and line-budget hardening (PayslipReceiptConsole.tsx run-list search + clear-search + visible-count/filtered-empty guidance + response/log helper compaction to <=300 lines + payslip-receipts ko/en copy extension + regression tests)
- WI-0440 withholding receipt console panel decomposition phase1 (WithholdingReceiptPanels.tsx summary/log panel extraction + WithholdingReceiptConsole.tsx runRequest boilerplate consolidation + regression-anchor preservation + line count reduction 711->660 + regression test)
- WI-0441 payroll service filing submission context helper and line-budget 500 (service.ts duplicated filing precondition flow extracted to loadFilingSubmissionContext, stale import surface trimmed, submit/resubmit rewired without behavior change, and service line count reduced 546->486 with regression test)
- WI-0442 withholding receipt copy/runtime extraction and line-budget 300 (`copy-runtime.ts`ë¡?locale copy/runtime helper ë¶„ë¦¬ + `WithholdingReceiptConsole.tsx` orchestration-only ì¶•ì†Œ(<=300) + regression test)
- WI-0443 payslips runtime locale lock (`setPayslipRuntimeLocale` override ì¶”ê? + `/employee/payslips` i18n locale ê¸°ë°˜ runtime formatter lock/unlock + regression test)
- WI-0444 contracts journey copy extraction and runtime locale lock (`journey-copy.ts` ? ê·œ + `EmployeeContractJourneyPanel.tsx` locale copy ?„í™˜ + `contracts/http.ts` locale override + contracts ?”ë©´ 3ê³?lock ?ìš© + regression test)
- WI-0445 payslips locale helper split copy/runtime/barrel (`page-locale-copy.ts`/`page-locale-runtime.ts` ë¶„í•´ + `page-locale-helpers.ts` ë°°ëŸ´ ê²½ëŸ‰??+ regression test)
- WI-0446 employee attendance/leave panel decomposition (`EmployeeAttendanceLeaveFormsPanel.tsx` + `EmployeeLeaveCalendarPanel.tsx` ë¶„ë¦¬ + `EmployeeAttendanceLeavePanels.tsx` orchestration ì¶•ì†Œ(<=220) + regression test)
- WI-0447 korean locale residual guard phase2 (`withholding`/`payslip`/`contracts` ko copy ê¸ˆì? ?ì–´ ? í° ?Œê? ê°€???ŒìŠ¤??ì¶”ê?)
- WI-0448 korean locale static latin sweep (`withholding`/`payslip`/`contracts` ko copy ë¸”ë¡ ?„ìˆ˜ ?¤ìº” + ?ˆìš© ? í° ìµœì†Œ??`FlowHR`) + regression test)
- WI-0449 payslips korean copy token normalization (`/employee/payslips` ko placeholder?ì„œ RUN/ORG/x-actor-* ?¸ì¶œ ?œê±° + ?œêµ­???ˆì‹œ/?ˆë‚´ ë¬¸êµ¬ ?•ê·œ??+ regression test)
- WI-0450 payslips page api hook extraction and line-budget 500 (`use-payslip-api.ts` ? ê·œ + `page.tsx` inline callApi/refresh/logging ?œê±° + 537->399 line budget ?Œë³µ + regression test)
- WI-0451 payslips locale copy modular split (`page-locale-types/search-sort/page-copy/deduction` ë¶„í•´ + `page-locale-copy.ts` ê²½ëŸ‰ ë°°ëŸ´ ?„í™˜ + ê¸°ì¡´ ?Œê? ?ŒìŠ¤??ê¸°ì? ê°±ì‹  + regression test)
- WI-0452 scheduling service incident normalizer extraction and line-budget 5500 (`incident-normalizers.ts` ? ê·œ + incident SLA/escalation/archive/replay/reconcile parser/normalizer ë¶„ë¦¬ + `service.ts` 5616->5471 ì¶•ì†Œ + regression test)
- WI-0453 core line budget guard (`payslips page/locale/scheduling service` ?µì‹¬ ?Œì¼ ?ˆì‚° ê°€??+ ko ? í° ?•ê·œ???Œê? ê³ ì • + regression test)
- WI-0454 admin approval-policy type/utility extraction and line-budget 500 (`page-types.ts` ? ê·œ + `page.tsx` ì¤‘ë³µ type/util ?œê±° + 456 lines ?Œë³µ + regression test)
- WI-0455 admin people page-view panel decomposition and line-budget 300 (directory/org-chart/compare/history/logs ?¨ë„ ë¶„ë¦¬ + `page-view.tsx` orchestration-only ?„í™˜ + 290 lines ?Œë³µ + regression test)
- WI-0456 scheduling incident audit projection extraction and line-budget 5300 (`incident-audit-projection.ts` ? ê·œ + audit projection ?ìˆ˜/ë¹Œë” ë¶„ë¦¬ + `service.ts` 5471->5254 ì¶•ì†Œ + regression test)
- WI-0457 leave promotion delivery helper extraction and line-budget 3000 (`promotion-delivery-helpers.ts` ? ê·œ + webhook/email-template resolver/sender ë¶„ë¦¬ + `service.ts` 3176->2928 ì¶•ì†Œ + regression test)
- WI-0458 korean residual sweep phase3 (approval-policy/people/payslip-receipts/contracts ?©ì–´ `ì¡°ì§ ?ë³„??/`ê´€ë¦¬ì ?¡í„° ?ë³„??/`?”ì²­ ë¡œê·¸`/`ì§ì›-0001` ê³ ì • + legacy token ?Œê? ì°¨ë‹¨ test)
- WI-0459 core line budget guard phase2 (approval-policy/people/scheduling/leave ?µì‹¬ ?Œì¼+ì¶”ì¶œ ëª¨ë“ˆ ?µí•© ?ˆì‚° ê°€??+ decomposition import wiring ê³ ì • + regression test)
- WI-0460 scheduling anomaly automation helper extraction and line-budget 5100 (`anomaly-automation-helpers.ts` ? ê·œ + anomaly alert/escalation/ticket env-parser ë°?payload builder ë¶„ë¦¬ + `service.ts` ì¤‘ë³µ helper ?œê±° + regression test)
- WI-0461 leave promotion history view helper extraction and line-budget 2850 (`promotion-history-views.ts` ? ê·œ + ?°ì°¨ì´‰ì§„ delivery/recipient/target ë·??€??ë§¤í•‘/retry-status helper ë¶„ë¦¬ + `leave/service.ts` 2928->2740 ì¶•ì†Œ + regression test)
- WI-0462 korean runtime message guard for withholding/payslip/contracts (runtime error pattern ?•ì¥: timeout/internal-server/service-unavailable + ko ?°í????ë¬¸ suppress ê°•í™” + runtime-normalizer regression test)
- WI-0463 scheduling incident read-model helper extraction and line-budget 4800 (`incident-read-model-helpers.ts` ? ê·œ + anomaly incident read-model ë³€??upsert/audit-store fallback/backfill/list-get orchestration ë¶„ë¦¬ + `scheduling/service.ts` 5018->4763 ì¶•ì†Œ + regression test)
- WI-0464 leave policy/time helper extraction and line-budget 2600 (`policy-time-helpers.ts` ? ê·œ + ?œìš¸?¼ì/?•ì±… ê¸°ë³¸ê°??”ì²­ ?œì•½/?°ì°¨ ê³„ì‚° helper ë¶„ë¦¬ + `leave/service.ts` 2740->2524 ì¶•ì†Œ + regression test)
- WI-0465 korean runtime fetch-failure guard for withholding/payslip/contracts (`failed to fetch|fetch failed|econnreset|econnrefused|enotfound|getaddrinfo` ko ?¨í„´ ?•ì¥ + runtime normalizer regression test)
- WI-0466 core line-budget guard phase3 for scheduling/leave/runtime (scheduling/leave service-helper + payroll/contract runtime helper budgets ê³ ì • + decomposition wiring regression test)
- WI-0467 employee schedule average shift-hours summary (`/employee/schedule` ?”ì•½ ì¹´ë“œ??êµë????‰ê·  ê·¼ë¬´?œê°„ ì¶”ê? + ko/en locale copy ?•ì¥ + regression test)
- WI-0468 employee schedule csv export action (`/employee/schedule` ?„í„° ê²°ê³¼ CSV ?¤ìš´ë¡œë“œ ?¡ì…˜ + locale status copy + export helper regression test)
- WI-0469 employee schedule ics export action (`/employee/schedule` ?„í„° ê²°ê³¼ ICS ?¤ìš´ë¡œë“œ ?¡ì…˜ + calendar export helper + locale status copy + regression test)
- WI-0470 korean copy utf8 recovery for withholding/payslip/contracts (?ì²œì§•ìˆ˜Â·ëª…ì„¸?œÂ·ì „?ê³„?½í•¨ ko ì¹´í”¼ ê¹¨ì§ ë³µêµ¬ + ?©ì–´ ?•ê·œ??+ existing korean-copy regression suite ?¬í†µê³?
- WI-0471 korean locale employee-id input normalization for withholding/payslip receipts (`/employee/withholding-receipt`, `/employee/payslip-receipts`??ê¸°ë³¸ ì§ì›ë²ˆí˜¸ ?…ë ¥ê°?ko ?œì‹œ(`ì§ì›-1001`)ë¡??µì¼ + API ?¸ì¶œ ??`EMP-1001` ?¬ë§· ?ë™ ?•ê·œ??+ locale ?„í™˜ ???…ë ¥ê°??œê¸° ?™ê¸°??+ regression test)
- WI-0472 contracts employee-id locale display normalization (`/admin/contracts`?ì„œ ì§ì›ë²ˆí˜¸ ?…ë ¥/?œì‹œë¥?locale ì¹œí™”(`ì§ì›-*`)ë¡??µì¼ + ë¬¸ì„œ ?ì„± API??`EMP-*` ?¬ë§· ?ë™ ?•ê·œ??+ ë¬¸ì„œ ëª©ë¡ employeeId ?œì‹œ locale ë³€??+ regression test)
- WI-0473 admin notice workspace view decomposition (`/admin/notices` ?”ë©´??`AdminNoticeWorkspaceView`ë¡?ë¶„ë¦¬??`AdminNoticeWorkspace.tsx`ë¥?orchestration ?„ìš©?¼ë¡œ ì¶•ì†Œ(<=300) + ê¸°ì¡´ ê³µì? ?‘ì„±/ê²Œì‹œ/?´ë ¥ UI ? í° ? ì? + regression test)
- WI-0474 admin benefits workspace view decomposition (`/admin/benefits` ?”ë©´??`AdminBenefitsWorkspaceView`ë¡?ë¶„ë¦¬??`AdminBenefitsWorkspace.tsx`ë¥?orchestration ?„ìš©?¼ë¡œ ì¶•ì†Œ(<=300) + ì¹´íƒˆë¡œê·¸/?”ì²­ ?˜ì‚¬ê²°ì • UI ? í° ? ì? + regression test)
- WI-0475 admin recruitment workspace view decomposition (`/admin/recruitment` ?”ë©´??`AdminRecruitmentWorkspaceView`ë¡?ë¶„ë¦¬??`AdminRecruitmentWorkspace.tsx`ë¥?orchestration ?„ìš©?¼ë¡œ ì¶•ì†Œ(<=300) + ì±„ìš©ê³µê³ /ì¶”ì²œ stage UI ? í° ? ì? + regression test)
- WI-0476 admin non-payroll workspace line-budget guard (`/admin/notices`, `/admin/benefits`, `/admin/recruitment` line-budget <=300 ?Œê? ê°€??+ phase-loop ê¸ˆì? ?¨í„´ ?Œê? ì°¨ë‹¨ ?ŒìŠ¤??ì¶”ê?)
- WI-0477 korean copy residual sweep for payroll preset preview (`PayrollKrIncomeSplitPresetPayloadPreviewPanel.tsx` ko copy block ?…ë¦½??+ preset mode ?ëµ ?¼ë²¨ locale wiring + payroll preset preview ?œê? ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0478 payslips page-view filter/list panel decomposition (`/employee/payslips`??page-view?ì„œ ?„í„°/ê°œë°œ?„êµ¬/ê·¼íƒœ?”ì•½ ?¨ë„ê³?ëª…ì„¸??ëª©ë¡ ?¨ë„ ë¶„ë¦¬ + `page-view-types.ts` ?€??ì¶”ì¶œ + `page-view.tsx` 461->209 line-budget ?Œë³µ + regression test)
- WI-0479 payslips helper budget split (`page-helpers.ts`??ë¹„êµ/?¸ì‚¬?´íŠ¸ ê³„ì‚° ë¸”ë¡??`page-compare-helpers.ts`ë¡?ë¶„ë¦¬ + ê¸°ì¡´ ?¸ì¶œë¶€??re-exportë¡??¸í™˜ ? ì? + legacy WI-0318/0319/0396/0398 ?Œê? ?ŒìŠ¤?¸ë? ë¶„í•´ êµ¬ì¡°??ë§ê²Œ ë³´ì • + `page-helpers.ts` 394->230)
- WI-0480 korean regression suite alignment after payslips decomposition (`WI-0386`/`WI-0416`??êµ¬ì‹ ? í° ê²€ì¦ì„ ë¶„í•´ ???Œì¼ êµ¬ì¡°(`copy-runtime.ts`, `page-view-filter-panel.tsx`) ê¸°ì??¼ë¡œ ë³´ì • + ?Œê? ?•í•©??ê°€???ŒìŠ¤??ì¶”ê?)
- WI-0481 korean copy residual runtime hardening for withholding/payslip/contracts (ê¹¨ì§„ ?œê? ì¹´í”¼ ë³µêµ¬: payslip locale/page-runtime + contracts journey/runtime helper + employee-id locale prefix + withholding runtime label/?¸ì…˜ fallback + filter panel separator ? í° ?•ê·œ??+ ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0482 legacy korean regression anchor alignment for payslip devtools/contracts fallback (`e2e-wi0405`ë¥?ë¶„í•´ ??êµ¬ì¡°(`page-view-filter-panel.tsx`, `page-locale-page-copy.ts`) ê¸°ì??¼ë¡œ ë³´ì • + contracts HTTP fallback ?Œê? ?µì»¤ ? ì? + ?Œê? ?ŒìŠ¤???¬ì •??
- WI-0483 korean runtime mixed-language suppression for withholding/payslip/contracts (ko ?°í??„ì—???¼í•© ?¤ë¥˜ë¬¸êµ¬(?œê?+?ë¬¸) ? ì… ??known-pattern ?œêµ­??ë§¤í•‘ ?°ì„  ?ìš© + ë¯¸ë§¤???¼í•© ë¬¸ì?´ì? ?œêµ­??fallback?¼ë¡œ ê°•ì œ + ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0484 korean runtime mixed-language suppression for payslip receipts (ko ?°í??„ì—??payslip-receipt ?¼í•© ?¤ë¥˜ë¬¸êµ¬(?œê?+?ë¬¸) ? ì… ??known-pattern ?œêµ­??ë§¤í•‘ ?°ì„  ?ìš© + ë¯¸ë§¤???¼í•© ë¬¸ì?´ì? ?œêµ­??fallback?¼ë¡œ ê°•ì œ + ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0485 payroll accuracy regression bundle and admin evidence panel (`/admin/payroll-year-end`??ê³„ì‚° ?•í™•??ì¦ë¹™ ?¨ë„ ì¶”ê? + ?•ì‚°/?¬ê³„??ë³´í—˜?€???˜ì¹˜ ê· í˜• ê²€??helper ë¶„ë¦¬ + ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0486 korean runtime localization sweep for year-end/payslips/contracts (?°ë§?•ì‚° ì½˜ì†” ?íƒœ/?¬ìœ /ì°¨ë‹¨?¬ìœ  ë°??¸ì…˜ ?¤ë¥˜ ?œêµ­???•ê·œ??+ payslip ?Œì¼ëª?ko prefix ?ìš© + contracts ì¦ë¹™ ?Œì¼ëª?ko ?œì‹œ ?•ê·œ??+ ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0487 korean surface english suppression for withholding/payslips/contracts (?ì²œì§•ìˆ˜ ë¬¸ì„œ ?Œì¼ëª?ko ?•ê·œ??+ ko ?˜ê²½ ?ì²œì§•ìˆ˜/ëª…ì„¸??raw JSON ?ì–´ ?¸ì¶œ ?µì œ + ?„ìê³„ì•½ ì¦ë¹™ ?¤ìš´ë¡œë“œ ?Œì¼ëª?ko ?•ê·œ??+ ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0488 scheduling rotation korean copy recovery (`listWorkScheduleRotationBalance` ì¶”ì²œ ë¬¸êµ¬ 6ì¢?ê¹¨ì§ ë³µêµ¬ + `e2e-wi0057` ì¶”ì²œ ë¬¸êµ¬ ?•í•©??ê³ ì • + `e2e-wi0488` ?Œê? ê°€??ì¶”ê?)
- WI-0489 contracts http fallback runtime alignment (`contracts/http.ts` ko ?°í???ê³„ì•½ ?„ë©”???¤ë¥˜ ë§¤í•‘ ?•ì¥ + ?íƒœ ?œì•½/?´ì‹œ ë¶ˆì¼ì¹?ë¦¬ì†Œ??ë¯¸ì¡´???œêµ­???ˆë‚´ ê³ ì • + `e2e-wi0489` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0490 contracts permission message korean normalization phase 2 (`contracts/http.ts` ê¶Œí•œ/ë³¸ì¸ë¬¸ì„œ ?œì•½ ?¤ë¥˜ ?œêµ­??ë§¤í•‘ ?•ì¥ + generic permission fallback ? ì? + `e2e-wi0490` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0491 scheduling runtime korean error normalization (`scheduling/helpers.ts` ?°í????¤ë¥˜ ?œêµ­???•ê·œ??helper ì¶”ê? + admin/employee ?¼ì • ?¤ë¥˜ ë©”ì‹œì§€ ë§¤í•‘ ê°•í™” + `e2e-wi0491` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0492 payslips employee-id locale normalization (`/employee/payslips` ì§ì›ë²ˆí˜¸ ?…ë ¥/?œì‹œë¥?`ì§ì›-*`??EMP-*` locale helperë¡??¼ì›??+ API ?¸ì¶œ?€ `EMP-*` ?•ê·œ??ê³ ì • + CSV/?ì„¸/?Œì¼ëª??œê¸° ?œêµ­?´í™” + `e2e-wi0492` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0493 payslip/withholding employee-id default restore and line-budget recovery (`/employee/payslip-receipts`, `/employee/withholding-receipt` ë¹?ì§ì›ë²ˆí˜¸ ?…ë ¥ ??locale ê¸°ë³¸ê°?ë³µì› + ?”ì²­/?…ë ¥ ?¨ë„ ë¶„ë¦¬ë¡???ì½˜ì†” ëª¨ë‘ <=300 ?¼ì¸ ?ˆì‚° ?Œë³µ + `e2e-wi0493` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0494 codex-guide i18n loop guard and functional switch (`docs/codex-guide.md`??i18n phase ë°˜ë³µ ê¸ˆì? + ?„ìˆ˜ ?¤ìœ• 1??QA ê²°í•¨ ?˜ì •-only ê·œì¹™ + i18n WI 3?°ì† ??ê¸°ëŠ¥ WI ê°•ì œ ?„í™˜ ê·œì¹™ ì¶”ê? + `e2e-wi0494` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0495 admin contracts workspace action hook extraction and line-budget margin (`AdminContractsWorkspace.tsx`??API/?¡ì…˜ ?¤ì??¤íŠ¸?ˆì´?˜ì„ `useAdminContractsWorkspaceActions.ts`ë¡?ë¶„ë¦¬???¼ì¸ ?ˆì‚° ?¬ìœ  ?•ë³´ + ê¸°ì¡´ UX ?µì»¤ ? ì? + `e2e-wi0495` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0496 admin contracts document search/status filter core journey (`/admin/contracts` ë¬¸ì„œ ?¼ì´?„ì‚¬?´í´ ?¨ë„???œëª©/ë¬¸ì„œë²ˆí˜¸/ì§ì›ë²ˆí˜¸ ê²€??+ ë¬¸ì„œ ?íƒœ ?„í„° + visible/total ê±´ìˆ˜ ?”ì•½ ì¶”ê? + ?„í„° ë¡œì§/ì»¨íŠ¸ë¡?ë¶„ë¦¬ë¡?`AdminContractsWorkspace.tsx` ?¼ì¸?ˆì‚°(<=260) ? ì? + `e2e-wi0496` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0497 admin benefits request filter/search and benefit-name visibility (`/admin/benefits` ?”ì²­ ?¹ì¸ ?ì— ?íƒœ ?„í„° + ì§ì›/??ª©/?¬ìœ  ê²€??+ visible/total ê±´ìˆ˜ ?ˆë‚´ ì¶”ê? + ?”ì²­ ?‰ì— benefitId ê¸°ë°˜ ??ª©ëª??œì‹œ + `e2e-wi0497` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0498 admin recruitment referral filter/search and opening visibility (`/admin/recruitment` ì¶”ì²œ ?„ë³´???ì— ?¨ê³„ ?„í„° + ?„ë³´??ê³µê³ /ì¶”ì²œ??ë©”ëª¨ ê²€??+ visible/total ê±´ìˆ˜ ?ˆë‚´ ì¶”ê? + ì¶”ì²œ ?‰ì— openingId ê¸°ë°˜ ê³µê³ ëª??œì‹œ + `e2e-wi0498` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0499 admin notices list search and visible-count guidance (`/admin/notices` ê³µì? ëª©ë¡???œëª©/ë³¸ë¬¸ ê²€??+ ê²€??ì´ˆê¸°??+ visible/total ê±´ìˆ˜ ?ˆë‚´ + filtered-empty ?ˆë‚´ ì¶”ê? + `e2e-wi0499` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0500 employee payslip receipt status filter and pending focus (`/employee/payslip-receipts` ?¤í–‰ ëª©ë¡???íƒœ ?„í„°(?„ì²´/?˜ì‹ ?€ê¸??•ì¸?„ë£Œ/ë¯¸ë°°?? ì¶”ê? + ê²€?‰ê³¼ ì¡°í•©??visible ëª©ë¡/?€ê¸?ê±´ìˆ˜ ?”ì•½ ?œê³µ + `PayslipReceiptConsole.tsx` ?¼ì¸?ˆì‚°(<=300) ? ì? + `e2e-wi0500` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0501 payroll accuracy evidence fail-first filter and json export (`/admin/payroll-year-end` ê³„ì‚° ?•í™•??ì¦ë¹™ ?¨ë„???¤íŒ¨??ª© ?°ì„  ?•ë ¬ + ?¤íŒ¨??ª©ë§?ë³´ê¸° ? ê?(ê¸°ë³¸) + ?„ì¬ ë·?ê¸°ì? ì¦ë¹™ JSON ?¤ìš´ë¡œë“œ ?¡ì…˜ ì¶”ê? + `e2e-wi0501` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0502 employee contracts inbox status filter and pending response count (`/employee/contracts` ë°›ì??¨ì— ?íƒœ ?„í„°(?„ì²´/?‘ë‹µ?€ê¸??‘ë‹µ?„ë£Œ/ë§Œë£Œ) ì¶”ê? + ê²€?‰ê³¼ ì¡°í•©??visible ëª©ë¡ + ?‘ë‹µ?€ê¸?ê±´ìˆ˜ ?”ì•½ ì¶”ê? + `EmployeeContractsInbox.tsx` ?¼ì¸?ˆì‚°(<=300) ? ì? + `e2e-wi0502` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0503 scheduling anomaly report helper extraction and line-budget phase 1 (`anomaly-report-helpers.ts` ? ê·œ + ?´ìƒ?ì? ë¦¬í¬???€??ë¹Œë”/ê¶Œì¥ì¡°ì¹˜ helper ë¶„ë¦¬ + `scheduling/service.ts` 4763->4624 ì¶•ì†Œ + ê¸°ì¡´ ?€??service re-export ? ì? + `e2e-wi0503` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0504 runtime line-budget recovery for withholding/contracts (`withholding-receipt/copy-runtime.ts` 407->344, `contracts/http.ts` 231->211 ì¶•ì†Œ + ê¸°ì¡´ ?°í????ëŸ¬ ?•ê·œ???½ê¸° ?¨ìˆ˜ ?œê·¸?ˆì²˜ ? ì? + `e2e-wi0466`, `e2e-wi0489`, `e2e-wi0504` ?Œê? ?ŒìŠ¤???µê³¼)
- WI-0505 admin people directory actions hook extraction and line-budget margin (`useAdminPeopleDirectoryActions` ? ê·œë¡?`admin/people/page.tsx` API ?¡ì…˜ ?¤ì??¤íŠ¸?ˆì´??ë¶„ë¦¬ + `page.tsx` 499->377 ì¶•ì†Œ + `e2e-wi0505` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0506 scheduling anomaly cockpit projection helper extraction and line-budget phase 2 (`anomaly-cockpit-report-helpers.ts` ? ê·œ + cockpit employee/queue/severity projection ë¶„ë¦¬ + `scheduling/service.ts` 4624->4551 ì¶•ì†Œ + `e2e-wi0506` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0507 employee page interaction orchestrator hook extraction and line-budget margin (`page-interaction-orchestrator.ts` ? ê·œ + `BuildEmployeeInteractionHandlersInput` export + `employee/page.tsx` interaction input ì¡°ë¦½ hook ì¶”ì¶œ + legacy handler invocation anchor ? ì? + `e2e-wi0507` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0508 scheduling anomaly queue helper extraction and line-budget phase 3 (`anomaly-incident-queue-helpers.ts` ? ê·œ + incident queue ?„í„°/SLA ë§¤ì¹­ ë¹Œë” ë¶„ë¦¬ + `scheduling/service.ts` 4551->4505 ì¶•ì†Œ + `e2e-wi0508` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0509 scheduling anomaly auto-action helper extraction and line-budget phase 4 (`anomaly-incident-auto-action-helpers.ts` ? ê·œ + auto-action assignment decision/ì§‘ê³„ ë£¨í”„ ë¶„ë¦¬ + `scheduling/service.ts` 4505->4411 ì¶•ì†Œ + `e2e-wi0509` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0510 scheduling anomaly archive helper extraction and line-budget phase 5 (`anomaly-incident-archive-helpers.ts` ? ê·œ + archive ?„ë³´ ?„í„°/?¤í–‰ ë£¨í”„ ë¶„ë¦¬ + `scheduling/service.ts` 4411->4349 ì¶•ì†Œ + `e2e-wi0510` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0511 scheduling anomaly replay helper extraction and line-budget phase 6 (`anomaly-incident-replay-helpers.ts` ? ê·œ + replay ?€?ì„ ???¤í–‰ ë£¨í”„ ë¶„ë¦¬ + `scheduling/service.ts` 4349->4306 ì¶•ì†Œ + `e2e-wi0511` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0512 scheduling anomaly reconcile helper extraction and line-budget phase 7 (`anomaly-incident-reconcile-helpers.ts` ? ê·œ + store/audit ë¹„êµ/ì¹´ìš´??? íƒ ë¡œì§ ë¶„ë¦¬ + `scheduling/service.ts` 4306->4236 ì¶•ì†Œ + `e2e-wi0512` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0513 scheduling anomaly escalation helper extraction and line-budget phase 8 (`anomaly-incident-escalation-helpers.ts` ? ê·œ + escalation cooldown index/?”ì²­ ?¤í–‰ ë£¨í”„ ë¶„ë¦¬ + `scheduling/service.ts` 4236->4172 ì¶•ì†Œ + `e2e-wi0513` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0514 scheduling anomaly incident list helper extraction and line-budget phase 9 (`anomaly-incident-list-helpers.ts` ? ê·œ + incident list filter/slice/clone ì¡°ë¦½ ë¶„ë¦¬ + `scheduling/service.ts` <=4200 ê°€??? ì? + `e2e-wi0514` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0515 scheduling anomaly read helper extraction and line-budget phase 10 (`anomaly-incident-read-helpers.ts` ? ê·œ + incident ì¡°íšŒ/tenant ê²½ê³„ ê²€ì¦?ë¶„ë¦¬ + `scheduling/service.ts` 4172->4165 ì¶•ì†Œ + `e2e-wi0515` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0516 scheduling anomaly auto-action notification helper extraction and line-budget phase 11 (`anomaly-incident-auto-action-helpers.ts`??auto-action ?¤í–‰ ?Œë¦¼/?¤íŒ¨ ê°ì‚¬ ë¶„ê¸° helper ì¶”ê? + `executeScheduleAnomalyIncidentAutoAction` ë³¸ë¬¸ slim??+ `e2e-wi0516` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0517 contract signature execution action policy hardening (`document-action-policy.ts` ? ê·œ + `/admin/contracts` ?íƒœë³??¤í–‰ ê°€???¡ì…˜/?¤ìŒ ?¨ê³„ ê°€?´ë“œ ?ìš© + `/employee/contracts` ?‘ë‹µ ê°€???íƒœ(`SENT`) ?•ì±… ?•ë ¬ + `e2e-wi0517` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0518 contract expiry renewal queue filters (`/admin/contracts` ë¬¸ì„œ ?ì— ë§Œë£Œ ?„ë°• ê¸°ê°„(`ALL/7/14/30`) ?„í„° + ê°±ì‹  ?„ë³´ ?„ìš© ? ê? + ë§Œë£Œ ?„ë°•/ê°±ì‹  ?„ë³´ ì¹´ìš´??ì¶”ê? + `e2e-wi0518` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0519 admin analytics web baseline and csv export (`/admin/analytics` ? ê·œ ?¼ìš°??+ ê´€ë¦¬ì ?¤ë¹„/?¤êµ­???¼ë²¨ ?°ê²° + KPI ê¸°ë°˜ ë¶„ì„ ëª¨ë“œ ?€?´í?/?¤ëª… + ?„ì¬ ë·?CSV ?´ë³´?´ê¸° ?¡ì…˜ + `e2e-wi0519` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0520 admin people history action/field filters (`/admin/people` ?¸ì‚¬ ?´ë ¥ ?¨ë„???¡ì…˜/ë³€ê²½í•„???„í„° ì¶”ê? + visible/total ?´ë ¥ ì¹´ìš´??+ ?„í„° ê¸°ì? ë³€ê²??”ì•½ ë°˜ì˜ + `e2e-wi0520` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0521 mobile employee request API integration with local fallback (ëª¨ë°”???”ì²­ ?œì¶œ/?´ë ¥/?”ë¡œ???”ë©´??API-first ?™ê¸°?”ë¡œ ?„í™˜ + `/api/leave/requests`/`/api/attendance/records` ë§¤í•‘ ë¸Œë¦¬ì§€ + API ?¤íŒ¨ ??local store fallback ? ì? + `e2e-wi0521` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0522 i18n one-shot sweep and ci guard (`docs/codex-guide.md`??one-shot i18n ì¢…ë£Œ ê·œì¹™ ê³ ì • + ko ?µì‹¬ ?”ë©´ mojibake ? í° ê¸ˆì? CI ê°€??+ ìµœê·¼ ë¡œë“œë§?êµ¬ê°„ i18n phase-loop ê¸ˆì? ?Œê? ?ŒìŠ¤??`e2e-wi0522`) ì¶”ê?)
- WI-0523 admin benefits over-limit risk filter and summary (`/admin/benefits` ?¹ì¸ ?ì— ?”ì²­ ?„í—˜ ?„í„°(`?„ì²´/?œë„ ì´ˆê³¼`) ì¶”ê? + ?œë„ ì´ˆê³¼ ?”ì²­ ê±´ìˆ˜ ?”ì•½ + ?”ì²­ë³?ì´ˆê³¼ ë°°ì?/ì´ˆê³¼ ê¸ˆì•¡ ?œì‹œ + `AdminBenefitsWorkspace.tsx` ?¼ì¸?ˆì‚°(<=300) ? ì? + `e2e-wi0523` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0524 admin recruitment stalled risk filter and summary (`/admin/recruitment` ì¶”ì²œ ?ì— ?„í—˜ ?„í„°(`?„ì²´/7???´ìƒ ?•ì²´`) ì¶”ê? + ë¹„ì¢…ê²??¨ê³„ ?•ì²´ ê±´ìˆ˜ ?”ì•½ + ?•ì²´ ?„ë³´ ë°°ì? ?œì‹œ + `AdminRecruitmentWorkspace.tsx` ?¼ì¸?ˆì‚°(<=300) ? ì? + `e2e-wi0524` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0525 employee contracts deadline risk queue (`/employee/contracts` ë°›ì??¨ì— ê¸°í•œ ?„í—˜ ?„í„°(`?„ì²´/?„ë°•(D-3)/ê¸°í•œì´ˆê³¼`) ì¶”ê? + ?„í„°??ë·?ê¸°ì? ?„ë°•/ì´ˆê³¼ ê±´ìˆ˜ ?”ì•½ + ?‘ë‹µ ?ì„¸ ?¨ë„ ë¶„ë¦¬(`EmployeeContractsResponsePanel`)ë¡??¼ì¸?ˆì‚°(<=300) ? ì? + `e2e-wi0525` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0526 korean residual sweep one-shot for withholding/payslip/contracts (?ì²œì§•ìˆ˜/ëª…ì„¸???„ìê³„ì•½???œêµ­???œë©´ ?”ì¡´ ?ì–´ ?„ìˆ˜ ?ê? + ëª…ì„¸??ê·¼íƒœ ?œê°„ ?¨ìœ„ ko ë¡œì????œê¸°(`?œê°„`) ê³ ì • + ë¶„ë¦¬??ê³„ì•½ ?‘ë‹µ ?¨ë„ ê¸°ì? ?Œê? ?ŒìŠ¤???•ë ¬ + `e2e-wi0526` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0527 employee notice read-status filter and line-budget hardening (`/employee/notices` ì¡°íšŒ ?¨ë„???½ìŒ ?íƒœ ?„í„°(`?„ì²´/ë¯¸í™•???•ì¸??) ì¶”ê? + `EmployeeNoticeBoardList`/`employee-notice-board-helpers` ë¶„í•´ë¡?ë³´ë“œ ?¤ì??¤íŠ¸?ˆì´??ì§‘ì¤‘ + ê³µì? copy ???•ì¥ + `e2e-wi0527` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0528 payroll accuracy settlement-recalculation cross-check and mismatch summary (`accuracy-evidence`???•ì‚°/?¬ê³„??ê¸°ì? êµì°¨ê²€ì¦?ì¶”ê? + `/admin/payroll-year-end` ì¦ë¹™ ?¨ë„??ë¶ˆì¼ì¹???ª© ?”ì•½ ?¸ì¶œ + `e2e-wi0528` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0529 payslip detail print verification section (`/employee/payslips` ?ì„¸ ?¨ë„??ì¶œë ¥ ê²€ì¦?ê²€ì¦??¤ìˆ˜??ëª…ì„¸ ?¤ìˆ˜???¼ì¹˜?¬ë?) ?¹ì…˜ ì¶”ê? + locale copy/type ?•ì¥ + `e2e-wi0529` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0530 contract template builder draft validation checklist (`/admin/contracts/builder`??ì´ˆì•ˆ ê²€ì¦?ì²´í¬ë¦¬ìŠ¤???´ë¦„/ì¡°í•­/?„ìˆ˜/ì¤‘ë³µ) ì¶”ê? + ì²´í¬ ë¯¸í†µê³????ì„± ì°¨ë‹¨ + checklist helper ë¶„ë¦¬ + `e2e-wi0530` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0531 employee schedule conflict candidate guidance (`/employee/schedule` ì¡°íšŒ ê²°ê³¼ ê¸°ë°˜ ì¶©ëŒ ?„ë³´ ê±´ìˆ˜ ê³„ì‚° helper ì¶”ê? + ?íƒœ ë©”ì‹œì§€???„ì† ì¶”ì  ?ŒíŠ¸ ?¸ì¶œ + ?¼ì¸?ˆì‚° ? ì? + `e2e-wi0531` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0532 admin analytics focus metric filter and csv alignment (`/admin/analytics` ì§‘ì¤‘ ì§€???„í„°(`all/pending/stalled/attendance/leave/payroll`) ì¶”ê? + ?„ì¬ ?¬ì»¤??ë·?ê¸°ì? CSV export ë°˜ì˜ + line-budget ? ì? + `e2e-wi0532` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0533 scheduling template assignment helper reuse and line-budget recovery (`scheduling/service.ts`???œí”Œë¦?ë²”ìœ„ ?ˆë„??helper ?¬ì‚¬??+ range/rotation assignment???ì„± ë£¨í”„ë¥?`createSchedulesFromGeneratedWindows`ë¡??¼ì›??+ line-budget ì¶•ì†Œ + `e2e-wi0533` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0534 admin notices delivery-risk visibility (`/admin/notices`?ì„œ ê²Œì‹œ ê³µì? ì¤??½ìŒ 0ê±??„ë‹¬?„í—˜ ???”ì•½ ì¶”ê? + ëª©ë¡ ??ª© ?„ë‹¬?•ì¸ ?„ìš” ë°°ì? ?¸ì¶œ + `e2e-wi0534` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0535 employee notices unread-aging guidance (`/employee/notices` ë¯¸í™•??ê³µì? D+ê²½ê³¼???œì‹œ + 3???´ìƒ ì§€??ë°°ì? ì¶”ê? + unread aging helper ë¶„ë¦¬ + `e2e-wi0535` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0536 admin benefits pending-aging risk summary (`/admin/benefits` ?¹ì¸?€ê¸?3???´ìƒ ?”ì²­ ?”ì•½/ë°°ì? ì¶”ê? + ê¸°ì¡´ ?œë„ì´ˆê³¼ ?„í—˜ ?”ì•½ê³?ë³‘í–‰ ?¸ì¶œ + `e2e-wi0536` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0537 employee benefits annual-limit remaining preview (`/employee/benefits` ? íƒ ??ª© ê¸°ì? ?¬ìš©/?€ê¸??©ê³„ ë°?? ì²­ ???ˆìƒ ?”ì—¬ ?œë„ ?„ë¦¬ë·?ì¶”ê? + ì´ˆê³¼ ?ˆìƒ ê²½ê³ ë¬?ì¶”ê? + `e2e-wi0537` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0538 admin recruitment stalled-risk expansion (`/admin/recruitment` ?•ì²´ ?„í—˜ ?„í„°ë¥?7??14?¼ë¡œ ?•ì¥ + 14???´ìƒ ?„ê³„ì¹??”ì•½/ê¸´ê¸‰ ë°°ì? ì¶”ê? + `e2e-wi0538` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0539 employee recruitment stalled-risk self-service filter (`/employee/recruitment` ì¶”ì²œ ?´ë ¥???•ì²´ ?„í—˜ ?„í„°(7??14?? + ?„ê³„ì¹?ì¹´ìš´??ë°°ì? ?¸ì¶œ ì¶”ê? + `e2e-wi0539` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0540 admin contracts SLA risk filter and summary (`/admin/contracts` ë¬¸ì„œ ?ì— SLA ?„í—˜ ?„í„°(`ALL/DUE_SOON/OVERDUE`) + ?„í—˜ ì¹´ìš´???”ì•½ + ???¨ìœ„ SLA ?„ë°•/ì´ˆê³¼ ë°°ì? ì¶”ê? + `e2e-wi0540` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0541 contract template builder baseline diff (`/admin/contracts/builder`??ê¸°ì?ë³?ìº¡ì²˜/ì´ˆê¸°??+ ?ì„± ë³¸ë¬¸ ?¼ì¸ ?¨ìœ„ diff(ì¶”ê?/?? œ/ë¬´ë?ê²? ?¨ë„ ì¶”ê? + diff helper ë¶„ë¦¬ + `e2e-wi0541` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0542 employee contracts risk-priority sort and badge (`/employee/contracts` ë°›ì??¨ì„ SLA ?„í—˜ ?°ì„ (ê¸°í•œì´ˆê³¼?’ì„ë°? ?•ë ¬ + ë¬¸ì„œë³??„í—˜ ë°°ì? ?¸ì¶œ + inbox risk helper ?•ì¥ + `e2e-wi0542` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0543 admin analytics contract SLA overdue metric (`/admin/analytics`??ê³„ì•½ SLA ê¸°í•œì´ˆê³¼ ì§€??ì¶”ê? + ?¬ì»¤???„í„°/ì¹´ë“œ/ì¶”ì„¸??CSV ?¤ëƒ…??ë°˜ì˜ + summary/copy ?•ì¥ + `e2e-wi0543` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0544 admin people history top-change hotspot summary (`/admin/people` ?¸ì‚¬?´ë ¥ ?¨ë„???„ì¬ ?„í„° ê¸°ì? ìµœë‹¤ ë³€ê²??„ë“œ(?«ìŠ¤?? ?”ì•½ ì¶”ê? + line-budget ? ì? + `e2e-wi0544` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0545 contracts risk filter quick toggles (`/admin/contracts` SLA ?„í„° ?í´ë¦?? ê? + `/employee/contracts` ê¸°í•œ ?„í„° ?í´ë¦?? ê? ì¶”ê?ë¡??„í—˜ ???„í™˜ ?ë„ ê°œì„  + `e2e-wi0545` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0546 employee notices unread-aging risk filter and summary (`/employee/notices`???½ìŒ ì§€???„í—˜ ?„í„°(`all/aging_3d`) + 3???´ìƒ ë¯¸í™•???”ì•½ ì¹´ìš´??ì¶”ê? + notice helper??aging risk ?•ê·œ???„í„°ë§?ë¡œì§ ?•ì¥ + `e2e-wi0546` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0547 employee benefits pending-aging risk filter and badge (`/employee/benefits` ? ì²­ ?´ë ¥???¹ì¸?€ê¸??„í—˜ ?„í„°(`all/pending_3d`) + 3???´ìƒ ?€ê¸??”ì•½/??ë°°ì?/D+?¼ìˆ˜ ?œì‹œ + benefits copy/helper ?•ì¥ + `e2e-wi0547` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0548 employee recruitment opening filter and stalled-days visibility (`/employee/recruitment` ì¶”ì²œ ?´ë ¥??ê³µê³  ?„í„°(`all/openingId`) + ê³µê³  ê¸°ì? ?œì‹œ ê±´ìˆ˜ ?”ì•½ + ì¶”ì²œë³??•ì²´ ê²½ê³¼(D+?¼ìˆ˜) ?œì‹œ + `e2e-wi0548` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0549 employee benefits workspace view decomposition and line-budget recovery (`EmployeeBenefitsWorkspace.tsx`ë¥?orchestration ?„ìš©?¼ë¡œ ì¶•ì†Œ + `EmployeeBenefitsWorkspaceView.tsx`/`employee-benefits-helpers.ts` ë¶„ë¦¬ + workspace line-budget <=300 ? ì? + `e2e-wi0549` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0550 employee recruitment workspace view decomposition and line-budget recovery (`EmployeeRecruitmentWorkspace.tsx`ë¥?orchestration ?„ìš©?¼ë¡œ ì¶•ì†Œ + `EmployeeRecruitmentWorkspaceView.tsx`/`employee-recruitment-helpers.ts` ë¶„ë¦¬ + workspace line-budget <=300 ? ì? + `e2e-wi0550` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0551 scheduling rotation fairness selection helper extraction and line-budget recovery (`rotation-fairness-selection-helpers.ts` ? ê·œ + ì¶”ì²œ ? íƒ/advanced summary ì§‘ê³„ helper ë¶„ë¦¬ + `scheduling/service.ts` 4000 ?¼ì¸ ê°€??? ì? + `e2e-wi0551` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0552 payroll year-end filing filtered-empty guidance and transport summary localization (`PayrollYearEndFilingConsole.tsx` ?œì¶œ ëª©ë¡ ?¨ë„???„í„° ê²°ê³¼ 0ê±??„ìš© ?ˆë‚´(`noSubmissionMatchesFilters`) ì¶”ê? + ?„ì†¡ ?”ì•½??`nts_api_mock` ?˜ë“œì½”ë”©??locale copy(`transportShortNtsApiMockLabel`)ë¡?ì¹˜í™˜ + `e2e-wi0552` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0553 withholding receipt document metadata copy action (`WithholdingReceiptPanels.tsx` ë¬¸ì„œ ?”ì•½ ?¨ë„??`ë¬¸ì„œ ë©”í??°ì´??ë³µì‚¬` ?¡ì…˜ ì¶”ê? + `WithholdingReceiptConsole.tsx` clipboard ë³µì‚¬ ?¸ë“¤???°ê²° + copy-runtime ??`actionCopyDocumentMetadata`, `copiedDocumentMetadataStatus`) ?•ì¥ + `e2e-wi0553` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0554 employee payslip receipt status summary and filter helper extraction (`payslip-receipt-filter-helpers.ts` ? ê·œë¡??íƒœ/ê²€???€ê¸°ê±´ ì§‘ê³„ ë¡œì§ ì¶”ì¶œ + `/employee/payslip-receipts` ?íƒœ ?”ì•½(?€ê¸??•ì¸/ë¯¸ë°°?? ?¸ì¶œ + `PayslipReceiptConsole.tsx` <=300 ?¼ì¸ ? ì? + `e2e-wi0554` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0555 admin contracts expiration window quick toggles (`AdminContractsDocumentFilterControls.tsx`??ë§Œë£Œ ?„ë°• ê¸°ê°„ ?í´ë¦?? ê?(`ALL/7/14/30`) ì¶”ê? + ê¸°ì¡´ ?„í„° copy ?¬ì‚¬?©ìœ¼ë¡?i18n ?œë©´ ? ì? + `e2e-wi0555` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0556 admin people history hotspot quick-filter chips (`/admin/people` ?´ë ¥ ë³€ê²??”ì•½ ì¹©ì„ ë²„íŠ¼?”í•˜???´ë¦­ ??`historyFieldFilter` ì¦‰ì‹œ ?ìš© + hotspot ?”ì•½?’ìƒ???„í„° ?„í™˜ ?ë„ ê°œì„  + `e2e-wi0556` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0557 scheduling template-date helper extraction and line-budget recovery (`template-date-helpers.ts` ? ê·œë¡?KST ? ì§œ ?Œì‹±/?”ì¼ ê³„ì‚°/ë²”ìœ„ ?´ê±° ?¬í¼ ì¶”ì¶œ + `scheduling/service.ts` import ?¬ë°°??ë°?<=4000 ?¼ì¸ ê°€??? ì? + `e2e-wi0557` ?Œê? ?ŒìŠ¤??ì¶”ê?)
- WI-0558 payroll year-end filing value helper extraction and line-budget recovery (`value-helpers.ts` extraction for parse/format timeline helpers + `PayrollYearEndFilingConsole.tsx` helper import rewiring + `e2e-wi0558` regression)
- WI-0559 payroll year-end filing submission request helper extraction (`submission-request-helpers.ts` extraction for list-query/submit/ack/resubmit payload builders + `PayrollYearEndFilingConsole.tsx` request payload delegation + `e2e-wi0559` regression)
- WI-0560 payroll year-end filing submission state helper extraction (`submission-state-helpers.ts` extraction for upsert/replace/filter-summary builders + `PayrollYearEndFilingConsole.tsx` state update/active-filter summary delegation + `e2e-wi0560` regression)
- WI-0561 employee contracts response quick comment templates (`EmployeeContractsResponsePanel.tsx` quick comment template actions + `contracts/copy.ts` locale copy extension + `e2e-wi0561` regression)
- WI-0562 admin analytics quick drilldown controls (`AdminKpiSections.tsx` quick metric drilldown button set + `admin-kpi/copy.ts` locale keys extension + line-budget <=300 À¯Áö + `e2e-wi0562` regression)
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
- WI-0590 admin contracts decision queue visibility (/admin/contracts ¹®¼­ ÇÊÅÍ¿¡ Áï½Ã Ã³¸® Å¥(REQUEST_APPROVAL/APPROVE_OR_REJECT/SEND_DOCUMENT) Àü¿ë Åä±Û + °áÁ¤ ´ë±â °Ç¼ö ¿ä¾à Ãß°¡ + e2e-wi0590 È¸±Í Å×½ºÆ®)
- WI-0591 employee contracts action needed queue visibility (/employee/contracts ¹ŞÀºÇÔ¿¡ ction_needed(ÀÓ¹Ú+ÃÊ°ú) ÇÊÅÍ, ºü¸¥ ÀüÈ¯ ¹öÆ°, Á¶Ä¡ ÇÊ¿ä °Ç¼ö ¿ä¾à Ãß°¡ + e2e-wi0591 È¸±Í Å×½ºÆ®)
- WI-0592 admin analytics contract decision queue KPI (/admin/analytics¿¡ °è¾à ÀÇ»ç°áÁ¤ Å¥(REQUEST_APPROVAL/APPROVE_OR_REJECT/SEND) ÁöÇ¥ Ãß°¡ + KPI Ä«µå/ÁıÁßÁöÇ¥/µå¸±´Ù¿î/CSV ½º³À¼¦ ¹İ¿µ + e2e-wi0592 È¸±Í Å×½ºÆ®)
- WI-0593 withholding receipt validation summary (/employee/withholding-receipt ¿µ¼öÁõ ¿ä¾à¿¡ °ËÁõ ¿ä¾à(Â÷´Ü Ç×¸ñ/°¡µå ´©¶ô/Á¶Ä¡ ÇÊ¿ä »óÅÂ) Ãß°¡ + ko/en locale Ä«ÇÇ È®Àå + e2e-wi0593 È¸±Í Å×½ºÆ®)
- WI-0594 admin people org chart staffing summary (/admin/people Á¶Á÷µµ ÆĞ³Î¿¡ Á¶Á÷/ºÎ¼­/È°¼ºµµ ¿ä¾à, ¹ÌÁöÁ¤ Á¶Á÷/ºÎ¼­ Á÷¿ø ¼ö °¡½Ã¼º, ºÎ¼­º° È°¼º/ºñÈ°¼º ÀÎ¿ø ºĞÇØ Ãß°¡ + e2e-wi0594 È¸±Í Å×½ºÆ®)
- WI-0595 admin people org-chart risk focus filters (/admin/people Á¶Á÷µµ ÆĞ³Î¿¡ À§ÇèÁıÁß Åä±Û(ÀüÃ¼/ºñÈ°¼º/¹ÌÁöÁ¤)°ú ¸ğµåº° Ä«¿îÆ® Ãß°¡ + ÇÊÅÍ °á°ú 0°Ç ¾È³» + e2e-wi0595 È¸±Í Å×½ºÆ®)
- WI-0596 korean residual bugpack for withholding/payslips/contracts inbox (¿øÃµÂ¡¼ö ·Î±×/´ë±â ¶óº§ ko Á¤±ÔÈ­ + ÀüÀÚ°è¾àÇÔ »óÅÂ fallback ¶óº§(¾Ë ¼ö ¾ø´Â »óÅÂ/½ÂÀÎ »óÅÂ) Ãß°¡ + ¸í¼¼¼­ ¸ñ·Ï ±¸ºĞÀÚ ·»´õ¸µ ¾ÈÁ¤È­ + e2e-wi0596 È¸±Í Å×½ºÆ®)
- WI-0597 scheduling side-effect helper extraction and contracts status fallback hardening (scheduling/service.ts side-effect+input validation helpers extracted to nomaly-side-effect-helpers.ts and schedule-input-normalization-helpers.ts + /admin/contracts and /employee/contracts status labels now use ko-safe fallback resolvers + e2e-wi0597 regression test)
- WI-0598 scheduling service split phase 2 (extract anomaly actor/permission/tenant context into anomaly-service-context-helpers.ts and replace repeated boilerplate across incident lifecycle/list/sla/escalation/auto-action/archive/replay/reconcile/read/cockpit APIs + scheduling/service.ts 3422->3365 + e2e-wi0598 regression test)
- WI-0599 admin payroll year-end filing failure-action UX hardening (/admin/payroll-year-end-filing failure handling now stores latest failed action context and exposes retry/follow-up actions + request-feedback-helpers extraction for API log/error-message normalization + console line budget <=1300 + e2e-wi0599 regression test)
- WI-0600 admin contracts next-step filter and summary (/admin/contracts ¹®¼­ ÇÊÅÍ¿¡ next-step ±âÁØ ÇÊÅÍ(ALL/request/approve/send/wait/renew/no-action) Ãß°¡ + next-step Å¥ ¿ä¾à/ºü¸¥ Åä±Û Ãß°¡ + °è¾à ¹®¼­ ÇÊÅÍ hook¿¡ nextStepCounts Áı°è È®Àå + e2e-wi0600 È¸±Í Å×½ºÆ®)
- WI-0601 admin payroll year-end filing preflight blocker actions (preflight checklist load + blocker follow-up actions + filing console panel decomposition and line-budget keep <=1300)
- WI-0602 admin payroll year-end filing preflight settlement-hash copy action (clipboard quick-copy + expected-hash guard paste hint in blocker panel)
- WI-0603 admin payroll year-end preflight direct shortcut actions (blocker-key specific direct links to payroll-close and payslip-delivery)
- WI-0604 admin payroll year-end preflight settlement-hash warning action (preflight warning row for settlement_hash_available now provides direct finalization-preview rerun action with localized ko/en labels + e2e-wi0604 regression test)
- WI-0605 admin payroll year-end preflight rejected-submission warning action (new no_rejected_filing_submissions checklist warning + blocker-panel direct action opens rejected submission queue with acknowledged/rejected filter preset + e2e-wi0605 regression test)
