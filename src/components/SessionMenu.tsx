"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { getSupabaseClient } from "@/lib/supabase/client";

type SessionMenuProps = {
  className?: string;
};

export default function SessionMenu({ className }: SessionMenuProps) {
  const router = useRouter();
  const { snapshot, error, loading } = useSupabaseSession();
  const { t } = useI18n();
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
    <div className={className ?? "session-menu"} aria-label={t("sessionMenu.aria")}>
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
            {t("sessionMenu.signOut")}
          </button>
        </>
      ) : loading ? (
        <div className="session-meta">
          <div className="session-id">
            <strong>{t("admin.onboarding.loading")}</strong>
          </div>
        </div>
      ) : (
        <>
          <div className="session-meta">
            <div className="session-id">
              <strong>{t("sessionMenu.loginRequired")}</strong>
            </div>
            <div className="session-sub muted">{t("sessionMenu.noSession")}</div>
          </div>
          <Link className="btn btn-secondary btn-small" href="/login">
            {t("sessionMenu.signIn")}
          </Link>
        </>
      )}
      {error ? <div className="session-error">{t("sessionMenu.errorPrefix")}: {error}</div> : null}
    </div>
  );
}
