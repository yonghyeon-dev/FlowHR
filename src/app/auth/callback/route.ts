import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { FLOWHR_ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookie";
import { getPublicEnv } from "@/lib/env";

const metadataRoles = ["admin", "manager", "employee", "payroll_operator"] as const;
type MetadataRole = (typeof metadataRoles)[number];
const otpTypes = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

function readAppMetadataString(app: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = app[key];
    if (typeof value !== "string") {
      continue;
    }
    const normalized = value.trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return null;
}

function normalizeMetadataRole(value: unknown): MetadataRole | null {
  if (typeof value !== "string") {
    return null;
  }
  return (metadataRoles as readonly string[]).includes(value) ? (value as MetadataRole) : null;
}

function normalizeEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if ((otpTypes as readonly string[]).includes(normalized)) {
    return normalized as EmailOtpType;
  }
  return null;
}

async function resolveSuccessRedirect(role: MetadataRole | null, organizationId: string | null): Promise<string> {
  if (role !== "admin") {
    return "/employee";
  }

  if (!organizationId) {
    return "/onboarding";
  }

  try {
    const organization = await getRuntimeDataAccess().organizations.findById(organizationId);
    if (organization?.isOnboardingComplete) {
      return "/employee";
    }
  } catch {
    // Ignore lookup failures and keep onboarding as safe default for admins.
  }

  return "/onboarding";
}

function setFlowHrAccessTokenCookie(
  response: NextResponse,
  request: NextRequest,
  accessToken: string,
  expiresAt: number | null
) {
  const nowEpochSeconds = Math.floor(Date.now() / 1000);
  const maxAge = typeof expiresAt === "number" ? Math.max(0, expiresAt - nowEpochSeconds) : 60 * 60;

  if (maxAge <= 0) {
    response.cookies.delete(FLOWHR_ACCESS_TOKEN_COOKIE);
    return;
  }

  response.cookies.set({
    name: FLOWHR_ACCESS_TOKEN_COOKIE,
    value: encodeURIComponent(accessToken),
    path: "/",
    maxAge,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:"
  });
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code")?.trim() ?? "";
  const tokenHash = requestUrl.searchParams.get("token_hash")?.trim() ?? "";
  const otpType = normalizeEmailOtpType(requestUrl.searchParams.get("type"));
  if (!code && (!tokenHash || !otpType)) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const response = NextResponse.redirect(new URL("/onboarding", requestUrl.origin));

  try {
    const env = getPublicEnv();
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        }
      }
    });

    const authResult = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          type: otpType as EmailOtpType,
          token_hash: tokenHash
        });

    if (authResult.error || !authResult.data.session?.access_token || !authResult.data.session.user) {
      throw authResult.error ?? new Error("Auth callback exchange failed");
    }

    const { session } = authResult.data;
    setFlowHrAccessTokenCookie(
      response,
      request,
      session.access_token,
      typeof session.expires_at === "number" ? session.expires_at : null
    );

    const appMetadata = (session.user.app_metadata ?? {}) as Record<string, unknown>;
    const userMetadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
    const role = normalizeMetadataRole(appMetadata.role) ?? normalizeMetadataRole(userMetadata.role);
    const organizationId =
      readAppMetadataString(appMetadata, "organization_id", "organizationId") ??
      readAppMetadataString(userMetadata, "organization_id", "organizationId");
    const redirectPath = await resolveSuccessRedirect(role, organizationId);

    // Supabase Dashboard > Authentication > URL Configuration:
    // add your production callback URL (for example, https://your-domain.com/auth/callback)
    // to the Redirect URLs allow-list.
    response.headers.set("Location", new URL(redirectPath, requestUrl.origin).toString());
    return response;
  } catch {
    response.cookies.delete(FLOWHR_ACCESS_TOKEN_COOKIE);
    response.headers.set("Location", new URL("/login?error=auth_callback_failed", requestUrl.origin).toString());
    return response;
  }
}
