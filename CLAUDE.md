# Claude Code Memory System (File-based v3)

## 통합 우선순위 (FlowHR 루트 + FlowConsult 규칙)

- 1순위: 이 문서(현재 기준) 내에서 같은 주제의 최신 규칙.
- 2순위: 아래 통합 섹션에 병합된 FlowConsult 규칙.
- 3순위: 실행 중 환경에서 참조되는 외부 설정/규칙.

## 통합 규칙: FlowConsult (코드 아키텍처/품질)

### Session Start Protocol (강제)
- 작업 시작 시 `/mem:load`를 우선 수행한다.
- Commit 접두사는 `<type>: <한글 설명>` 형식을 기본 사용한다.
- Epic > Phase > Task 계층을 따른다.
- Phase 종료 시 DocOps 단계 정리 후 다음 단계로 이동한다.

### 코드 구조 규칙
- Boundary: `module/index.ts` + `module/internal/` 구조를 기본으로 유지한다.
- Module 캡슐화: 외부 노출은 `index.ts`(public API)로 제한하고 내부는 `internal/*`로 제한한다.
- 컴포넌트 재사용: 기존 컴포넌트/스타일은 공유 모듈(`shared/`, `common/`)에서 우선 재사용한다.
- 하드코딩 금지: 문자열, URL, 상수는 `constants/` 또는 전용 설정 파일에 분리한다.
- UTF-8: 모든 코드/문서 기본 인코딩을 UTF-8로 유지한다.

### PR/리뷰 체크리스트
- Boundary 준수
- `internal` import 규칙 준수
- API contract 일치
- UI/컴포넌트 재사용 준수
- 하드코딩/상수 누락 점검

### Drift 체크 (옵션)
- `git diff` 기반 변경 추적, 마지막 리뷰 커밋 기록을 `_index.md` 또는 관련 문서에 남긴다.

## System Version
- **Type**: File-based (no external MCP required)
- **Namespace**: `/mem:*` commands
- **Location**: `~/.claude/commands/mem/`
- **Isolation**: Project-local storage

## Core Principles
- **Auto-compact is OFF**: Session changes only happen explicitly via /mem:save
- **Disk over RAM**: Important decisions are written to files, not kept in memory
- **Task-based checkpoints**: Save at Task/Phase completion, not arbitrary context %
- **Project Local**: Project memory lives with the project

## Git Commit Convention
- **Title**: English prefix + Korean description (e.g., `feat: 인증 시스템 추가`)
- **Body**: Write in Korean for user readability
- **Prefixes**:
  - `feat`: New feature
  - `fix`: Bug fix
  - `docs`: Documentation
  - `style`: Code formatting
  - `refactor`: Refactoring
  - `test`: Tests
  - `chore`: Build/config changes
- **Example**:
  ```
  feat: 메모리 시스템 v3.2 추가

  - DocOps 통합으로 코드-문서 자동 동기화
  - Phase 완료 시 스펙 문서 자동 생성
  - 설치 가이드 및 템플릿 추가
  ```

## Memory Files Location (v3.2)
```
~/.claude/memory/
└── MEMORY.md                           ← Global only (preferences, lessons)

{project-root}/.claude/
└── memory/
    ├── MEMORY.md                       ← Project-specific (decisions, epics)
    └── logs/
        └── YYYY-MM-DD.md               ← Daily logs (2 day retention)

~/.claude/projects/{project-encoded}/
└── {sessionId}.jsonl                   ← Full conversation (user + assistant)
```

**Benefits of v3.2**:
- No path sanitization needed
- Project memory travels with the project
- Team can share decisions via git (optional)
- Clean deletion: project gone = memory gone
- **NEW**: Bidirectional conversation from session JSONL (user + Claude responses)

## Behavior Rules

### On Session Start (MANDATORY - 강제)
**첫 번째 액션: 반드시 `/mem:load` 실행**

> ⚠️ 이 규칙은 스킵 불가. 세션 시작 시 다른 작업 전에 반드시 실행.

1. Load Global MEMORY.md (user preferences, lessons)
2. Load Project MEMORY.md from `{cwd}/.claude/memory/`
3. Load project's daily logs (today + yesterday)
4. Load specs from `{cwd}/.claude/specs/` (DocOps)
5. Load conversation from `~/.claude/projects/{project-encoded}/` (bidirectional, last 10 exchanges)
6. Announce last work status and offer to resume

**예외 없음**: 사용자가 바로 작업 요청해도 먼저 `/mem:load` 실행

### During Work
1. Track Epic > Phase > Task hierarchy
2. Record important decisions immediately to daily log
3. Project decisions → `/mem:note` (saves to project .claude/memory/)
4. Global lessons → `/mem:note --global` (saves to ~/.claude/memory/)

### On Task/Phase Completion
1. Summarize completed work
2. Create handoff document for next session
3. Suggest `/mem:save` if moving to next major unit

### On /mem:save
1. Extract key information from current session
2. Update project daily log with progress
3. Add important decisions to appropriate MEMORY.md
4. Generate handoff document
5. Present summary and instruct user to run `/clear`
6. User runs `/clear` → new session starts → run `/mem:load`

> **Note**: Claude는 `/clear`를 자동 실행할 수 없음. 사용자가 직접 입력 필요.

## Memory Recording Guidelines

### What goes in Global MEMORY.md (~/.claude/memory/)
- User preferences (coding style, tools)
- Lessons learned (mistakes to avoid - applies everywhere)
- Global patterns (cross-project knowledge)

### What goes in Project MEMORY.md ({project}/.claude/memory/)
- Architectural decisions and reasons
- Project patterns and conventions
- Active Epics and their status
- Important project-specific context

### What goes in daily logs (Temporary - 2 days)
- Current task progress
- Session-specific context
- Work-in-progress details
- Handoff information

### Conversation History (Session JSONL - v3.2 Bidirectional)
**Location**: `~/.claude/projects/{project-encoded}/{sessionId}.jsonl`

**Project path encoding**:
- `C:\Team-jane\a` → `C--Team-jane-a` (replace `:` and `\` with `-`)

**CRITICAL: Windows UTF-8 설정 (필수)**
- Python 실행 시 반드시 `PYTHONUTF8=1` 환경변수 설정
- 또는 스크립트 내에서 `sys.stdout.reconfigure(encoding='utf-8')` 호출
- 설정 없이 실행하면 cp949 인코딩으로 한글이 깨짐

**CRITICAL: 토큰 효율성 규칙**
- 마지막 **10개 교환**만 추출 (user + assistant 포함)
- 메시지당 **150자** 제한
- tool_use/tool_result 블록은 스킵
- skill definition (`# /` 시작)은 스킵하되, `ARGUMENTS:` 이후 텍스트는 추출

**출력 형식**:
```
[user]   "왜 누락되었는지 확인하고 개선을 한 뒤에..."
[claude] "_index.md 확인 및 개선을 진행하겠습니다."
[user]   "/clear"
```

**Why v3.2?**:
- v3.1 `history.jsonl`: 사용자 입력만 저장 (Claude 응답 없음)
- v3.2 `session JSONL`: 양방향 대화 전체 저장 → 맥락 파악 용이

## Commands

### Memory Commands
- `/mem:save` - Save current state and start new session
- `/mem:load` - Load memory (run at session start)
- `/mem:resume` - Show detailed last work status and continue
- `/mem:note [note]` - Add note to project MEMORY.md
- `/mem:note --global [note]` - Add note to global MEMORY.md

### DocOps Commands
- `/doc:check` - 코드-문서 동기화 검사 (수동)
- `/doc:check [path]` - 특정 경로만 검사

## Templates Location
스펙 문서 템플릿: `~/.claude/templates/specs/`
- `_index.md` - 전체 스펙 인덱스
- `epic-readme.md` - Epic 개요 템플릿
- `phase-spec.md` - Phase 스펙 템플릿
- `decision.md` - Decision 문서 템플릿

## Work Hierarchy
```
Epic (Large Feature)
  └── Phase (Logical Stage)
        └── Task (Execution Unit) ← Default session boundary
              └── Subtask (For large tasks)
```

## Ad-hoc 작업 처리 (Epic 없는 경우)
모든 작업이 Epic 구조를 필요로 하진 않음:

| 작업 유형 | Epic 필요 | 스펙 문서 | 예시 |
|-----------|-----------|-----------|------|
| 대규모 기능 | 필수 | 필수 | 인증 시스템, 결제 연동 |
| 중규모 기능 | 권장 | 권장 | API 엔드포인트 추가 |
| 버그 수정 | Ad-hoc | 선택 | 로그인 오류 수정 |
| 설정 변경 | Ad-hoc | 선택 | 환경변수 추가 |
| 문서 작업 | Ad-hoc | 불필요 | README 업데이트 |

### Ad-hoc 작업 플로우
```
Ad-hoc 작업 시작
    ↓
1. Daily log에만 기록 (스펙 문서 생략)
2. /mem:save 시 간소화된 저장
3. 반복되면 Epic으로 승격 제안
```

### Epic 생성 트리거
다음 조건 중 하나라도 해당 시 Epic 생성 권장:
- 예상 작업 시간 > 1시간
- 관련 파일 > 5개
- Phase 구분이 필요한 복잡도
- 중요한 아키텍처 결정 포함

## Integration with Plan Mode
- Plan Mode = Design phase (what to do, how to do it)
- Memory System = Execution tracking (progress, state)
- After Plan approval → Auto-convert to Epic/Phase/Task structure
- Plan changes → Re-enter Plan Mode (don't edit Memory directly)

---

# Mandatory Phase Boundary Rules (강제)

> **CRITICAL**: 이 규칙들은 드리프트 방지를 위해 반드시 준수해야 함

## Phase 완료 감지 조건
다음 중 하나라도 해당되면 Phase 완료로 간주:
1. 사용자가 "Phase N 완료", "페이즈 완료" 언급
2. 해당 Phase의 모든 Task 완료 확인됨
3. 사용자가 "다음 Phase로", "다음 단계로" 요청
4. `/mem:save` 실행 시

## Phase 완료 시 필수 행동 (스킵 불가)
```
Phase 완료 감지
    ↓
┌─────────────────────────────────────┐
│ 1. 완료 Task 목록 정리              │
│ 2. 변경 파일 목록 작성              │
│ 3. DocOps: 스펙 문서 생성/업데이트   │ ← 필수
│ 4. DocOps: 코드-문서 동기화 체크     │ ← 필수
│ 5. Handoff 문서 생성                │
│ 6. `/mem:save` 실행 제안            │
└─────────────────────────────────────┘
```

## 스킵 금지 규칙
- **Phase 경계에서 저장 없이 다음 Phase 진행 금지**
- 사용자가 스킵 요청해도 최소한 스펙 문서는 생성
- "나중에 하자"는 허용하지 않음 (드리프트 원인)

---

# DocOps: 코드-문서 동기화 시스템

## 스펙 문서 구조
```
{project}/.claude/
└── specs/
    ├── _index.md                      # 전체 스펙 목록
    └── {epic-slug}/                   # Epic별 폴더
        ├── README.md                  # Epic 개요
        ├── {NN}-{phase-slug}.md       # Phase별 스펙
        └── decisions/                 # 결정 기록
            └── {YYYY-MM-DD}-{topic}.md
```

## 코드-문서 매핑 규칙
| 코드 변경 패턴 | 관련 문서 | 동기화 레벨 |
|----------------|-----------|-------------|
| `src/api/**` | `docs/API.md` | 필수 |
| `*.config.*` | `README.md#설정` | 권장 |
| `src/components/**` | `docs/components/` | 선택 |
| `package.json` deps | `README.md#설치` | 권장 |
| 새 함수/클래스 추가 | 해당 파일 JSDoc | 필수 |

## 동기화 레벨 정의
- **필수**: Phase 완료 시 반드시 확인, 불일치 시 업데이트
- **권장**: 알림 표시, 사용자 선택 가능
- **선택**: 명시적 요청 시만 처리

## DocOps 자동 트리거 시점
1. `/mem:save` 실행 시 (Phase 완료)
2. 사용자가 `/doc:check` 실행 시 (수동)
3. Epic 완료 시 (전체 문서 검토)

## 스펙 문서 파일명 규칙
- Epic 폴더: `kebab-case` (예: `auth-system`, `payment-flow`)
- Phase 파일: `{NN}-{slug}.md` (예: `01-oauth-setup.md`)
- Decision 파일: `{YYYY-MM-DD}-{topic}.md`

## Epic 완료 시 _index.md 업데이트 (필수)

Epic의 모든 Phase가 완료되면 반드시 `_index.md` 업데이트:

```
Epic 완료 감지
    ↓
┌─────────────────────────────────────┐
│ 1. Active Epics에서 해당 행 제거     │
│ 2. Completed Epics에 추가:          │
│    - Epic 이름 (링크 유지)          │
│    - 완료일                         │
│    - Phase 수                       │
│ 3. Epic README.md 상태 → "완료"     │
│ 4. MEMORY.md도 동일하게 업데이트     │
└─────────────────────────────────────┘
```

**_index.md 예시**:
```markdown
## Active Epics
| Epic | 상태 | Phase 진행 | 마지막 업데이트 |
|------|------|------------|-----------------|
| [new-feature](./new-feature/README.md) | 진행중 | Phase 2/4 | 2026-01-29 |

## Completed Epics
| Epic | 완료일 | Phase 수 |
|------|--------|----------|
| [auth-system](./auth-system/README.md) | 2026-01-28 | 5 |
```

**스킵 금지**: Epic 완료 시 _index.md 이동 없이 다음 작업 진행 금지

## 스펙 문서 필수 포함 항목

Phase 스펙 문서는 반드시 다음을 포함해야 함:

| 항목 | 필수 | 설명 |
|------|------|------|
| 핵심 코드 블록 | **필수** | 주요 함수/컴포넌트 전체 코드 |
| 스키마/타입 정의 | **필수** | DB 스키마, API 인터페이스, TypeScript 타입 |
| 설정 파일 내용 | 권장 | config 파일 핵심 부분 |
| API 시그니처 | **필수** | 엔드포인트, 파라미터, 응답 형식 |
| 변경 파일 목록 | **필수** | 경로 + 변경 유형 |

**나쁜 예** (빈약함):
```markdown
### Task 3.1: Prisma 스키마
- 8개 모델 정의함
```

**좋은 예** (충분함):
```markdown
### Task 3.1: Prisma 스키마

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  points    Int      @default(0)
  createdAt DateTime @default(now())
  // ... 전체 스키마
}
```

---

# 드리프트 감지 및 수정 (git diff 기반)

## 드리프트 정의
- 코드가 변경되었으나 스펙 문서에 반영되지 않은 상태
- 스펙 문서와 실제 코드가 불일치하는 상태

## _index.md 드리프트 추적 필드

```markdown
## Drift Tracking
- Last Reviewed Commit: `abc1234`
- Last Review Date: 2026-01-29
```

## 드리프트 감지 플로우

```
/doc:check 또는 Phase 완료 시
    ↓
┌─────────────────────────────────────────────────┐
│ 1. _index.md에서 Last Reviewed Commit 읽기      │
│ 2. git diff {commit}..HEAD --name-only 실행    │
│ 3. 변경 파일 목록 추출                          │
│ 4. 각 파일이 스펙에 반영되었는지 확인            │
│ 5. 결과 출력                                    │
└─────────────────────────────────────────────────┘
```

## 드리프트 감지 명령

```bash
# 마지막 검토 이후 변경된 파일
git diff {last_reviewed_commit}..HEAD --name-only

# 또는 최근 N 커밋 변경 파일
git diff HEAD~5 --name-only --diff-filter=ACMR
```

## 감지 결과 분류

| 상태 | 의미 | 조치 |
|------|------|------|
| ✓ 반영됨 | 변경 파일이 스펙에 있음 | 없음 |
| ⚠️ 드리프트 | 변경됐는데 스펙 없음 | 스펙 업데이트 필요 |
| ❓ 고아 | 스펙에 있는데 파일 없음 | 스펙에서 제거 또는 파일 복구 |

## 드리프트 수정 절차

```
드리프트 발견
    ↓
┌─────────────────────────────────────────────────┐
│ 1. 불일치 파일 목록 표시                         │
│ 2. 각 파일별 판단:                              │
│    A. 코드가 최신 → 스펙 업데이트               │
│    B. 스펙이 맞음 → 코드 수정                   │
│    C. 판단 보류 → [DRIFT] 태그 추가             │
│ 3. 수정 완료 후:                                │
│    - _index.md의 Last Reviewed Commit 업데이트  │
│    - Last Review Date 업데이트                  │
│ 4. 재검증                                       │
└─────────────────────────────────────────────────┘
```

## [DRIFT] 태그

판단 어려운 경우 스펙에 태그 추가:
```markdown
<!-- [DRIFT] 2026-01-29: src/auth.ts 시그니처 변경 - 확인 필요 -->
```

`/mem:load` 시 [DRIFT] 태그 있으면 경고 표시.

## 드리프트 체크 트리거

| 시점 | 자동/수동 | 범위 |
|------|-----------|------|
| `/doc:check` | 수동 | 전체 |
| `/mem:save` | 자동 | 현재 Phase |
| Phase 완료 | 자동 | 해당 Phase |
| Epic 완료 | 자동 | 전체 Epic |
