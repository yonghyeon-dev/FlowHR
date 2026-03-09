# WI-1050: 공지 생성 API 400 오류 수정 — publishAt datetime 포맷

## Background and Problem

공지(Notice) 생성 UI에서 저장 버튼 클릭 시 API가 400 에러를 반환한다.

**근본 원인**: `src/features/notices/schemas.ts`의 `createNoticeSchema`에서 `publishAt: z.string().datetime()` 유효성 검사가 프론트엔드의 `new Date(publishAt).toISOString()` 출력을 거부한다.

- 프론트엔드 전송: `"2026-03-08T14:30:00.000Z"`
- Zod `.datetime()` 기본: offset 없는 형식만 허용 (`"2026-03-08T14:30:00Z"`)
- 밀리초 포함 형식이 거부됨

## Scope

### In Scope
- `src/features/notices/schemas.ts` — `publishAt` 필드의 datetime 검증 완화
- `updateNoticeSchema`의 동일 필드도 함께 수정

### Out of Scope
- 프론트엔드 수정
- 다른 스키마 파일
- codex_test/ 폴더 수정 절대 금지

## Implementation

`src/features/notices/schemas.ts` 수정:

**Before** (line 22):
```typescript
publishAt: z.string().datetime().nullable().optional()
```

**After**:
```typescript
publishAt: z.string().datetime({ offset: true }).nullable().optional()
```

`updateNoticeSchema`도 동일하게 수정 (line 35):
```typescript
publishAt: z.string().datetime({ offset: true }).nullable().optional()
```

`{ offset: true }` 옵션은 Zod에서 UTC `Z` 접미사와 `+09:00` 등의 오프셋 형식, 밀리초를 모두 허용한다.

## Test Plan
- `npm run build` 성공
- 기존 테스트 통과
- **codex_test/ 폴더 절대 수정 금지**

## ADR
- Zod의 `{ offset: true }` 옵션이 가장 단순한 해결책
- 프론트엔드의 `toISOString()` 출력과 호환
- 커스텀 regex보다 Zod 내장 옵션 사용이 유지보수에 유리
## Progress

- Confirmed the schema-side `publishAt` offset handling is already present in `src/features/notices/schemas.ts`.
- Removed the compose-form default `publishAt` value from:
  - `src/components/notices/AdminNoticeWorkspace.tsx`
- Added explicit scheduling guidance to:
  - `src/components/notices/copy.ts`
  - `src/components/notices/AdminNoticeWorkspaceView.tsx`
- Resulting behavior:
  - creating a notice now defaults to draft when the schedule field is left empty
  - scheduled publishing is opt-in
  - immediate publishing stays on the dedicated `Publish now` action
- Local verification:
  - `npm run typecheck`
