import type { Session } from "@supabase/supabase-js";

export const FLOWHR_ACCESS_TOKEN_COOKIE = "flowhr-access-token";

function writeCookie(value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = value;
}

export function clearAccessTokenCookie() {
  writeCookie(`${FLOWHR_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
}

export function syncAccessTokenCookie(session: Session | null) {
  if (!session?.access_token) {
    clearAccessTokenCookie();
    return;
  }

  const nowEpochSeconds = Math.floor(Date.now() / 1000);
  const maxAge =
    typeof session.expires_at === "number"
      ? Math.max(0, session.expires_at - nowEpochSeconds)
      : 60 * 60;

  if (maxAge <= 0) {
    clearAccessTokenCookie();
    return;
  }

  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  writeCookie(
    `${FLOWHR_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(
      session.access_token
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`
  );
}
