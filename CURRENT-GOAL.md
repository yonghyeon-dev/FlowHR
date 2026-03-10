# Current Goal

FlowHR의 현재 목표는 `테스트 통과`가 아니라 `실제 프로덕션 운영이 가능한 HR SaaS`로 수렴하는 것입니다.

우선 참조 문서:

- [docs/production-operating-plan.md](docs/production-operating-plan.md)
- [docs/production-operating-progress.md](docs/production-operating-progress.md)
- [docs/production-gap-inventory.md](docs/production-gap-inventory.md)

현재 실행 루프:

1. 운영 전환 우선순위를 Work Item으로 분해합니다.
2. `feature/WI-xxxx-*` 브랜치에서 구현합니다.
3. PR을 생성하고 CI를 통과시킵니다.
4. `main`에 머지하고 배포합니다.
5. 실제 배포 환경에서 검증합니다.
6. 결과를 기준 문서에 즉시 반영합니다.

현재 집중 영역:

- 사용자 표면의 개발자 흔적 제거
- admin/employee 핵심 여정 안정화
- 운영 설정 UI 제품화
- 정보구조/네비게이션 정리
- UI/UX 완성도와 로컬라이징 상향

문서 운영 원칙:

- `.claude/memory/*`는 Claude 전용으로 유지하고 여기서 정리하지 않습니다.
- `codex_test/results/prod-*`는 증적 저장소입니다.
- 현재 계획과 진행상황의 기준 문서는 위 세 문서입니다.
