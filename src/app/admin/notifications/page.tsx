"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { InAppNotificationEntity } from "@/features/shared/data-access";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type ListNotificationsResponse = {
  notifications?: InAppNotificationEntity[];
};

type ReadNotificationResponse = {
  notification?: InAppNotificationEntity;
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

function toErrorMessage(response: Response, fallback: string) {
  if (!response.ok) {
    return fallback;
  }

  return null;
}

export default function AdminNotificationsPage() {
  const { loading, snapshot } = useSupabaseSession();
  const [notifications, setNotifications] = useState<InAppNotificationEntity[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [pendingReadId, setPendingReadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bearerToken = snapshot?.accessToken?.trim() ?? "";

  const unreadCount = useMemo(() => notifications.filter((row) => !row.isRead).length, [notifications]);

  const loadNotifications = useCallback(async () => {
    if (!snapshot || bearerToken.length === 0) {
      setNotifications([]);
      setErrorMessage(null);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        headers: {
          authorization: `Bearer ${bearerToken}`
        }
      });
      const requestError = toErrorMessage(response, "알림 목록을 불러오지 못했습니다.");
      if (requestError) {
        setErrorMessage(requestError);
        return;
      }

      const payload = (await response.json()) as ListNotificationsResponse;
      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
    } catch {
      setErrorMessage("알림 목록을 불러오지 못했습니다.");
    } finally {
      setIsFetching(false);
    }
  }, [bearerToken, snapshot]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (bearerToken.length === 0) {
      return;
    }

    setPendingReadId(notificationId);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${bearerToken}`
        }
      });
      const requestError = toErrorMessage(response, "알림 읽음 처리를 하지 못했습니다.");
      if (requestError) {
        setErrorMessage(requestError);
        return;
      }

      const payload = (await response.json()) as ReadNotificationResponse;
      if (payload.notification) {
        const updatedNotification = payload.notification;
        setNotifications((previous) =>
          previous.map((row) => (row.id === updatedNotification.id ? updatedNotification : row))
        );
        return;
      }

      setNotifications((previous) =>
        previous.map((row) =>
          row.id === notificationId ? { ...row, isRead: true, readAt: new Date().toISOString() } : row
        )
      );
    } catch {
      setErrorMessage("알림 읽음 처리를 하지 못했습니다.");
    } finally {
      setPendingReadId((current) => (current === notificationId ? null : current));
    }
  }, [bearerToken]);

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
    <main className="saas-content">
      <section className="hero-panel">
        <p className="eyebrow">알림</p>
        <h1>관리자 알림</h1>
        <p className="hero-copy">관리자 계정으로 수신한 인앱 알림을 확인하고 읽음 처리할 수 있습니다.</p>
        <div className="hero-meta">
          <span>전체 {notifications.length}건</span>
          <span>읽지 않음 {unreadCount}건</span>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>알림 목록</h2>
          <p className="small">읽지 않은 알림의 읽음 처리 버튼을 클릭하면 상태가 변경됩니다.</p>
          {errorMessage ? (
            <p className="small" style={{ color: "var(--danger)", marginTop: 10 }}>
              {errorMessage}
            </p>
          ) : null}

          {isFetching ? <p className="small">알림을 불러오는 중입니다...</p> : null}

          {!isFetching && !snapshot ? <p className="small">로그인이 필요합니다.</p> : null}

          {!isFetching && snapshot && notifications.length === 0 ? (
            <p className="small">수신된 알림이 없습니다.</p>
          ) : null}

          {!isFetching && notifications.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {notifications.map((notification) => {
                const isPending = pendingReadId === notification.id;
                const statusLabel = notification.isRead ? "읽음" : "읽지 않음";
                return (
                  <li
                    key={notification.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: 12,
                      background: notification.isRead ? "var(--panel)" : "#f8fafc"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => void handleMarkAsRead(notification.id)}
                      disabled={notification.isRead || isPending}
                      className={`btn ${notification.isRead ? "btn-secondary" : "btn-primary"}`}
                      style={{ marginBottom: 8 }}
                    >
                      {notification.isRead ? "읽음 완료" : isPending ? "처리 중..." : "읽음 처리"}
                    </button>
                    <p className="small" style={{ marginBottom: 6 }}>
                      유형: {notification.type}
                    </p>
                    <p style={{ marginTop: 0, marginBottom: 4, fontWeight: 600 }}>{notification.title}</p>
                    <p style={{ marginTop: 0, marginBottom: 8 }}>{notification.body}</p>
                    <p className="small" style={{ marginBottom: 4 }}>
                      수신 시각: {formatDateTime(notification.createdAt)}
                    </p>
                    <p className="small" style={{ marginBottom: 0 }}>
                      상태: {statusLabel}
                      {notification.readAt ? ` (읽은 시각: ${formatDateTime(notification.readAt)})` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </article>
      </section>
    </main>
  );
}
