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

export default function EmployeeNotificationsPage() {
  const { loading, snapshot } = useSupabaseSession();
  const [notifications, setNotifications] = useState<InAppNotificationEntity[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [pendingReadId, setPendingReadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
    setStatusMessage(null);
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        headers: {
          authorization: `Bearer ${bearerToken}`
        }
      });
      const payload = (await response.json()) as ListNotificationsResponse;
      const requestError = toErrorMessage(response, payload?.error, "알림 목록을 불러오지 못했습니다.");
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

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
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
      const requestError = toErrorMessage(response, payload?.error, "알림 읽음 처리에 실패했습니다.");
      if (requestError) {
        setErrorMessage(requestError);
        return;
      }

      if (payload.notification) {
        const updatedNotification = payload.notification;
        setNotifications((previous) =>
          previous.map((row) => (row.id === updatedNotification.id ? updatedNotification : row))
        );
        setStatusMessage("읽음 처리되었습니다.");
        return;
      }

      setNotifications((previous) =>
        previous.map((row) =>
          row.id === notificationId ? { ...row, isRead: true, readAt: new Date().toISOString() } : row
        )
      );
      setStatusMessage("읽음 처리되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "알림 읽음 처리에 실패했습니다.";
      setErrorMessage(formatUserFacingErrorMessage(message, "ko-KR"));
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
        <h1>내 알림</h1>
        <p className="hero-copy">직원 계정으로 받은 알림을 확인하고 읽음 처리할 수 있습니다.</p>
        <div className="hero-meta">
          <span>전체 {notifications.length}건</span>
          <span>읽지 않음 {unreadCount}건</span>
          <Link href="/employee/notifications/settings" className="btn btn-secondary">
            알림 설정
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>알림 목록</h2>
          <p className="small">읽지 않은 알림은 버튼을 눌러 읽음 처리할 수 있습니다.</p>
          {errorMessage ? (
            <p className="small" style={{ color: "var(--danger)", marginTop: 10 }}>
              {errorMessage}
            </p>
          ) : null}
          {statusMessage ? (
            <p className="small" style={{ color: "var(--ok)", marginTop: 10 }}>
              {statusMessage}
            </p>
          ) : null}

          {isFetching ? <p className="small">알림을 불러오는 중입니다...</p> : null}
          {!isFetching && !snapshot ? <p className="small">로그인이 필요합니다.</p> : null}
          {!isFetching && snapshot && notifications.length === 0 ? <p className="small">수신한 알림이 없습니다.</p> : null}

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
                      유형: {formatNotificationTypeLabel(notification.type, "ko-KR")}
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
