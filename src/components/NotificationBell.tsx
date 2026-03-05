"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

const POLL_INTERVAL_MS = 60_000;

type NotificationBellProps = {
  href: string;
};

export default function NotificationBell({ href }: NotificationBellProps) {
  const { snapshot } = useSupabaseSession();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setCount(typeof data.count === "number" ? data.count : 0);
      }
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  useEffect(() => {
    if (!snapshot) return;

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [snapshot, fetchCount]);

  if (!snapshot) return null;

  return (
    <Link href={href} className="notification-bell" aria-label={`알림${count > 0 ? ` (${count}건)` : ""}`}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 ? <span className="notification-badge">{count > 99 ? "99+" : count}</span> : null}
    </Link>
  );
}
