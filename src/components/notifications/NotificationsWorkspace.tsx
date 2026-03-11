"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { InAppNotificationEntity } from "@/features/shared/data-access";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import {
  formatNotificationTypeLabel,
  formatUserFacingErrorMessage
} from "@/lib/product-language";

type ListNotificationsResponse = {
  notifications?: InAppNotificationEntity[];
  error?: string;
};

type ReadNotificationResponse = {
  notification?: InAppNotificationEntity;
  error?: string;
};

type NotificationsWorkspaceVariant = "admin" | "employee";

type WorkspaceCopy = {
  title: string;
  subtitle: string;
  sourceHint: string;
  overviewTitle: string;
  overviewHelp: string;
  listTitle: string;
  listHelp: string;
  emptyTitle: string;
  emptyHelp: string;
  guidanceTitle: string;
  guidanceBody: string;
  refreshLabel: string;
  backHref: string;
  backLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function toErrorMessage(response: Response, payloadError: string | undefined, fallback: string) {
  if (response.ok) {
    return null;
  }

  return formatUserFacingErrorMessage(payloadError ?? fallback, "ko-KR");
}

function resolveWorkspaceCopy(variant: NotificationsWorkspaceVariant): WorkspaceCopy {
  if (variant === "admin") {
    return {
      title: "관리자 알림",
      subtitle: "운영 흐름, 승인 결과, 시스템 후속 알림을 한곳에서 확인하고 읽음 상태를 관리합니다.",
      sourceHint: "읽지 않은 알림을 먼저 정리한 뒤 관련 워크스페이스로 이동해 후속 작업을 마무리하세요.",
      overviewTitle: "알림 현황",
      overviewHelp: "새로고침과 읽음 처리를 같은 작업면에서 관리합니다.",
      listTitle: "알림 목록",
      listHelp: "중요한 알림부터 읽음 처리하고 상태를 정리하세요.",
      emptyTitle: "도착한 관리자 알림이 없습니다.",
      emptyHelp: "새 운영 알림이 들어오면 이 목록에서 바로 확인할 수 있습니다.",
      guidanceTitle: "운영 팁",
      guidanceBody: "읽지 않은 알림을 우선 처리하고, 필요한 경우 관리자 허브나 해당 업무 워크스페이스로 이동하세요.",
      refreshLabel: "알림 새로고침",
      backHref: "/admin",
      backLabel: "관리자 허브",
      secondaryHref: "/employee/notifications",
      secondaryLabel: "직원 알림 보기"
    };
  }

  return {
    title: "내 알림",
    subtitle: "승인 결과, 근태 안내, 공지 알림을 확인하고 읽음 상태를 관리합니다.",
    sourceHint: "최근 알림을 정리한 뒤 필요한 설정이나 후속 작업 화면으로 이동하세요.",
    overviewTitle: "알림 현황",
    overviewHelp: "읽지 않은 알림과 최근 알림 흐름을 빠르게 확인할 수 있습니다.",
    listTitle: "받은 알림",
    listHelp: "중요한 알림부터 읽음 처리하고 남은 알림을 정리하세요.",
    emptyTitle: "새로 받은 알림이 없습니다.",
    emptyHelp: "공지나 승인 결과가 도착하면 이 목록에 표시됩니다.",
    guidanceTitle: "알림 정리 안내",
    guidanceBody: "읽음 처리를 마친 뒤 알림 설정 화면에서 수신 기준을 조정할 수 있습니다.",
    refreshLabel: "알림 새로고침",
    backHref: "/employee",
    backLabel: "직원 홈",
    secondaryHref: "/employee/notifications/settings",
    secondaryLabel: "알림 설정"
  };
}

export function NotificationsWorkspace({ variant }: { variant: NotificationsWorkspaceVariant }) {
  const { loading, snapshot } = useSupabaseSession();
  const [notifications, setNotifications] = useState<InAppNotificationEntity[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [pendingReadId, setPendingReadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const bearerToken = snapshot?.accessToken?.trim() ?? "";
  const copy = resolveWorkspaceCopy(variant);
  const shellClassName =
    variant === "admin"
      ? "saas-content workspace-shell admin-workspace-shell"
      : "saas-content workspace-shell employee-workspace-shell";
  const headerClassName =
    variant === "admin"
      ? "page-header workspace-page-header"
      : "page-header workspace-page-header employee-workspace-status-header";

  const unreadCount = useMemo(
    () => notifications.filter((row) => !row.isRead).length,
    [notifications]
  );
  const readCount = Math.max(0, notifications.length - unreadCount);
  const recentCount = useMemo(() => {
    const now = Date.now();
    const windowMs = 7 * 24 * 60 * 60 * 1000;
    return notifications.filter((notification) => {
      const parsed = new Date(notification.createdAt).getTime();
      return Number.isFinite(parsed) && now - parsed <= windowMs;
    }).length;
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    if (!snapshot || bearerToken.length === 0) {
      setNotifications([]);
      setErrorMessage(null);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        headers: {
          authorization: `Bearer ${bearerToken}`
        }
      });
      const payload = (await response.json()) as ListNotificationsResponse;
      const requestError = toErrorMessage(
        response,
        payload?.error,
        "알림 목록을 불러오지 못했습니다."
      );
      if (requestError) {
        setErrorMessage(requestError);
        return;
      }

      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "알림 목록을 불러오지 못했습니다.";
      setErrorMessage(formatUserFacingErrorMessage(message, "ko-KR"));
    } finally {
      setIsFetching(false);
    }
  }, [bearerToken, snapshot]);

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      if (bearerToken.length === 0) {
        return;
      }

      setPendingReadId(notificationId);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${bearerToken}`
          }
        });
        const payload = (await response.json()) as ReadNotificationResponse;
        const requestError = toErrorMessage(
          response,
          payload?.error,
          "알림 읽음 처리에 실패했습니다."
        );
        if (requestError) {
          setErrorMessage(requestError);
          return;
        }

        if (payload.notification) {
          const updatedNotification = payload.notification;
          setNotifications((previous) =>
            previous.map((row) => (row.id === updatedNotification.id ? updatedNotification : row))
          );
          setStatusMessage("읽음 처리했습니다.");
          return;
        }

        setNotifications((previous) =>
          previous.map((row) =>
            row.id === notificationId
              ? { ...row, isRead: true, readAt: new Date().toISOString() }
              : row
          )
        );
        setStatusMessage("읽음 처리했습니다.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "알림 읽음 처리에 실패했습니다.";
        setErrorMessage(formatUserFacingErrorMessage(message, "ko-KR"));
      } finally {
        setPendingReadId((current) => (current === notificationId ? null : current));
      }
    },
    [bearerToken]
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    void loadNotifications();
  }, [loading, loadNotifications]);

  if (loading) {
    return null;
  }

  return (
    <main className={shellClassName}>
      <header className={headerClassName}>
        <div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-subtitle">{copy.subtitle}</p>
          <p className="small muted workspace-source-banner">{copy.sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link href={copy.backHref} className="btn btn-secondary">
            {copy.backLabel}
          </Link>
          <Link href={copy.secondaryHref} className="btn btn-secondary">
            {copy.secondaryLabel}
          </Link>
        </div>
      </header>

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <h2>{copy.overviewTitle}</h2>
          <p className="small muted">{copy.overviewHelp}</p>
          <div
            className={
              variant === "admin"
                ? "kpi-strip workspace-summary-strip"
                : "kpi-strip workspace-summary-strip employee-workspace-status-strip"
            }
          >
            <article className="kpi-card workspace-summary-card">
              <p>전체 알림</p>
              <strong>{notifications.length}</strong>
            </article>
            <article className="kpi-card workspace-summary-card">
              <p>읽지 않음</p>
              <strong>{unreadCount}</strong>
            </article>
            <article className="kpi-card workspace-summary-card">
              <p>읽음 완료</p>
              <strong>{readCount}</strong>
            </article>
            <article className="kpi-card workspace-summary-card">
              <p>최근 7일</p>
              <strong>{recentCount}</strong>
            </article>
          </div>
          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void loadNotifications()}
              disabled={isFetching || bearerToken.length === 0}
            >
              {copy.refreshLabel}
            </button>
          </div>
          {!snapshot || bearerToken.length === 0 ? (
            <p className="small fail workspace-inline-status">
              로그인 세션이 필요합니다. <Link href="/login">로그인</Link> 후 다시 시도하세요.
            </p>
          ) : null}
          {errorMessage ? <p className="small fail workspace-inline-status">{errorMessage}</p> : null}
          {statusMessage ? <p className="small ok workspace-inline-status">{statusMessage}</p> : null}
          {isFetching ? <p className="small muted">알림을 불러오는 중입니다...</p> : null}
          {!isFetching && snapshot && notifications.length === 0 ? (
            <div>
              <p className="small">
                <strong>{copy.emptyTitle}</strong>
              </p>
              <p className="small muted">{copy.emptyHelp}</p>
            </div>
          ) : null}
        </article>

        <article className="panel workspace-section-card workspace-note-card">
          <h2>{copy.listTitle}</h2>
          <p className="small muted">{copy.listHelp}</p>
          {notifications.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {notifications.map((notification) => {
                const isPending = pendingReadId === notification.id;
                const statusLabel = notification.isRead ? "읽음" : "읽지 않음";

                return (
                  <li
                    key={notification.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 16,
                      padding: 16,
                      background: notification.isRead ? "var(--panel)" : "var(--surface-elevated)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                        <p className="small muted" style={{ marginBottom: 6 }}>
                          유형: {formatNotificationTypeLabel(notification.type, "ko-KR")}
                        </p>
                        <p style={{ marginTop: 0, marginBottom: 6, fontWeight: 700 }}>
                          {notification.title}
                        </p>
                        <p style={{ marginTop: 0, marginBottom: 10 }}>{notification.body}</p>
                        <p className="small muted" style={{ marginBottom: 4 }}>
                          수신 시각: {formatDateTime(notification.createdAt)}
                        </p>
                        <p className="small muted" style={{ marginBottom: 0 }}>
                          상태: {statusLabel}
                          {notification.readAt
                            ? ` (읽은 시각: ${formatDateTime(notification.readAt)})`
                            : ""}
                        </p>
                      </div>
                      <div className="actions" style={{ marginLeft: "auto" }}>
                        <button
                          type="button"
                          onClick={() => void handleMarkAsRead(notification.id)}
                          disabled={notification.isRead || isPending}
                          className={`btn ${notification.isRead ? "btn-secondary" : "btn-primary"}`}
                        >
                          {notification.isRead
                            ? "읽음 완료"
                            : isPending
                              ? "처리 중..."
                              : "읽음 처리"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div>
              <p className="small">
                <strong>{copy.guidanceTitle}</strong>
              </p>
              <p className="small muted">{copy.guidanceBody}</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
