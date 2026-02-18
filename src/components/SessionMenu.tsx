"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { getSupabaseClient } from "@/lib/supabase/client";

type SessionMenuProps = {
  className?: string;
};

export default function SessionMenu({ className }: SessionMenuProps) {
  const router = useRouter();
  const { snapshot, error } = useSupabaseSession();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className ?? "session-menu"} aria-label="세션 메뉴">
      {snapshot ? (
        <>
          <div className="session-meta">
            <div className="session-id">
              <strong>{snapshot.email ?? snapshot.userId}</strong>
              <span className="session-pill">{snapshot.role ?? "unknown"}</span>
            </div>
            <div className="session-sub">
              org <code>{snapshot.organizationId ?? "-"}</code>
            </div>
          </div>
          <button className="btn btn-secondary btn-small" onClick={() => void signOut()} disabled={pending}>
            로그아웃
          </button>
        </>
      ) : (
        <>
          <div className="session-meta">
            <div className="session-id">
              <strong>로그인 필요</strong>
            </div>
            <div className="session-sub muted">세션이 없습니다.</div>
          </div>
          <Link className="btn btn-secondary btn-small" href="/login">
            로그인
          </Link>
        </>
      )}
      {error ? <div className="session-error">세션 오류: {error}</div> : null}
    </div>
  );
}

