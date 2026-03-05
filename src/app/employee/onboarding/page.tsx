"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type OnboardingTask = {
  id: string;
  employeeId: string;
  title: string;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
};

type OnboardingTaskListPayload = {
  tasks?: OnboardingTask[];
  error?: string;
};

type OnboardingTaskPatchPayload = {
  task?: OnboardingTask;
  error?: string;
};

function buildAuthHeaders(accessToken: string, employeeId: string): Record<string, string> {
  if (accessToken.trim().length > 0) {
    return { authorization: `Bearer ${accessToken}` };
  }
  return {
    "x-actor-role": "employee",
    "x-actor-id": employeeId
  };
}

export default function EmployeeOnboardingChecklistPage() {
  const { snapshot, error: sessionError, loading: supabaseSessionLoading } = useSupabaseSession();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const employeeId = (snapshot?.actorId ?? snapshot?.userId ?? "").trim();
  const accessToken = (snapshot?.accessToken ?? "").trim();
  const requiresLoginSession = !supabaseSessionLoading && isProductionRuntime && accessToken.length === 0;

  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "COMPLETED").length,
    [tasks]
  );
  const progressPercent = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }
    return Math.round((completedCount / tasks.length) * 100);
  }, [completedCount, tasks.length]);

  const loadTasks = useCallback(async () => {
    if (requiresLoginSession) {
      setLoading(false);
      setPageError("프로덕션에서는 로그인 세션이 필요합니다. /login에서 다시 로그인해 주세요.");
      return;
    }

    if (!employeeId) {
      setLoading(false);
      setPageError("세션에서 직원 ID를 확인할 수 없습니다. /login에서 다시 로그인해 주세요.");
      return;
    }

    setLoading(true);
    setPageError(null);
    try {
      const response = await fetch(
        `/api/admin/onboarding/tasks?employeeId=${encodeURIComponent(employeeId)}`,
        {
          method: "GET",
          headers: buildAuthHeaders(accessToken, employeeId),
          cache: "no-store"
        }
      );
      const payload = (await response.json()) as OnboardingTaskListPayload;
      if (!response.ok) {
        throw new Error(payload.error ?? "온보딩 체크리스트를 불러오지 못했습니다.");
      }
      setTasks(Array.isArray(payload.tasks) ? payload.tasks : []);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "온보딩 체크리스트를 불러오지 못했습니다."
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, employeeId, requiresLoginSession]);

  useEffect(() => {
    if (supabaseSessionLoading) {
      return;
    }
    void loadTasks();
  }, [loadTasks, supabaseSessionLoading]);

  async function completeTask(taskId: string) {
    if (!employeeId) {
      return;
    }
    setPendingTaskId(taskId);
    setPageError(null);
    try {
      const response = await fetch(`/api/admin/onboarding/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        headers: {
          ...buildAuthHeaders(accessToken, employeeId),
          "content-type": "application/json"
        },
        body: JSON.stringify({ status: "COMPLETED" })
      });
      const payload = (await response.json()) as OnboardingTaskPatchPayload;
      if (!response.ok || !payload.task) {
        throw new Error(payload.error ?? "체크리스트 완료 처리에 실패했습니다.");
      }
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? { ...task, status: "COMPLETED" } : task))
      );
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "체크리스트 완료 처리에 실패했습니다."
      );
    } finally {
      setPendingTaskId(null);
    }
  }

  if (supabaseSessionLoading) {
    return null;
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">내 온보딩 체크리스트</h1>
          <p className="page-subtitle">
            입사 초기 필수 태스크를 확인하고 완료 체크를 진행하세요.
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => void loadTasks()}>
            새로고침
          </button>
        </div>
      </header>

      <section className="panel">
        <h2>진행률</h2>
        <p className="small">
          {completedCount} / {tasks.length} 완료 ({progressPercent}%)
        </p>
        <span className="progress-track" aria-hidden>
          <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </span>
        {sessionError ? <p className="small fail">{sessionError}</p> : null}
        {pageError ? <p className="small fail">{pageError}</p> : null}
      </section>

      <section className="panel">
        <h2>태스크 목록</h2>
        {loading ? <p className="small muted">체크리스트를 불러오는 중입니다.</p> : null}
        {!loading && tasks.length === 0 ? (
          <p className="small muted">표시할 온보딩 태스크가 없습니다.</p>
        ) : null}
        {!loading && tasks.length > 0 ? (
          <ul className="simple-list">
            {tasks.map((task) => {
              const isCompleted = task.status === "COMPLETED";
              const isPending = pendingTaskId === task.id;
              return (
                <li key={task.id}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "var(--ink)",
                      fontSize: "0.86rem"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={isCompleted || isPending}
                      onChange={(event) => {
                        if (event.target.checked) {
                          void completeTask(task.id);
                        }
                      }}
                    />
                    <span style={{ textDecoration: isCompleted ? "line-through" : "none" }}>
                      {task.title}
                    </span>
                  </label>
                  <span className={`state-chip ${isCompleted ? "state-approved" : "state-pending"}`}>
                    {isPending ? "처리 중" : isCompleted ? "완료" : "대기"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
