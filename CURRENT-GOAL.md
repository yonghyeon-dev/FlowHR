# Current Goal

FlowHR의 현재 목표는 `테스트 통과`가 아니라 `실제 프로덕션 운영 가능한 HR SaaS`로 전환하는 것입니다.

항상 먼저 볼 문서:

- [docs/production-operating-plan.md](docs/production-operating-plan.md)
- [docs/production-operating-progress.md](docs/production-operating-progress.md)
- [docs/production-gap-inventory.md](docs/production-gap-inventory.md)

현재 실행 루프:

1. 운영 전환 우선순위를 Work Item으로 분해한다.
2. `feature/WI-xxxx-*` 브랜치에서 구현한다.
3. PR을 생성하고 CI를 통과시킨다.
4. `main` 머지 후 배포한다.
5. 실제 배포 환경에서 재검증한다.
6. 결과를 진행 문서에 즉시 반영한다.

현재 집중 영역:

- 사용자 표면의 개발자 흔적 제거
- admin/employee 핵심 업무 플로우 신뢰성 복구
- 운영 설정 UI 제품화
- 정보구조/딥링크/내비게이션 정리

문서 운영 원칙:

- `.claude/memory/*`는 클로드 전용으로 유지하고 여기서 정리하지 않는다.
- `codex_test/results/prod-*` 리포트는 증적이다.
- 현재 계획과 진행상황의 단일 기준은 위 두 문서다.
