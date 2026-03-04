import { NextResponse, type NextRequest } from "next/server";

import { FLOWHR_ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookie";

type SupabaseUser = {
  app_metadata?: {
    role?: unknown;
    organization_id?: unknown;
    organizationId?: unknown;
  };
};

type SessionValidationResult =
  | { ok: true; accessToken: string; user: SupabaseUser }
  | { ok: false };

function readAccessToken(request: NextRequest): string | null {
  const raw = request.cookies.get(FLOWHR_ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
  if (!raw) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return raw.length > 0 ? raw : null;
  }
}

function getSupabaseUserEndpoint(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseRole(user: SupabaseUser): string | null {
  return readString(user.app_metadata?.role);
}

function parseOrganizationId(user: SupabaseUser): string | null {
  return readString(user.app_metadata?.organization_id) ?? readString(user.app_metadata?.organizationId);
}

function createAbsoluteUrl(request: NextRequest, pathname: string): string {
  return new URL(pathname, request.url).toString();
}

function isOnboardingPath(request: NextRequest): boolean {
  return request.nextUrl.pathname === "/onboarding";
}

async function validateSupabaseSession(request: NextRequest): Promise<SessionValidationResult> {
  const accessToken = readAccessToken(request);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const userEndpoint = getSupabaseUserEndpoint();

  if (!accessToken || !anonKey || !userEndpoint) {
    return { ok: false };
  }

  try {
    const response = await fetch(userEndpoint, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    });
    if (!response.ok) {
      return { ok: false };
    }

    const payload = (await response.json()) as SupabaseUser;
    return {
      ok: true,
      accessToken,
      user: payload
    };
  } catch {
    return { ok: false };
  }
}

function buildLoginRedirectUrl(request: NextRequest): URL {
  const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", redirectTo);
  return loginUrl;
}

async function readOrganizationOnboardingStatus(input: {
  request: NextRequest;
  accessToken: string;
  organizationId: string;
}): Promise<boolean | null> {
  try {
    const response = await fetch(
      createAbsoluteUrl(input.request, `/api/people/organizations/${input.organizationId}`),
      {
        headers: {
          authorization: `Bearer ${input.accessToken}`
        },
        cache: "no-store"
      }
    );
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as {
      organization?: { isOnboardingComplete?: unknown };
    };
    return payload.organization?.isOnboardingComplete === true;
  } catch {
    return null;
  }
}

function buildRedirectUrl(request: NextRequest, pathname: string): URL {
  return new URL(pathname, request.url);
}

export async function middleware(request: NextRequest) {
  const session = await validateSupabaseSession(request);
  if (!session.ok) {
    return NextResponse.redirect(buildLoginRedirectUrl(request));
  }

  const role = parseRole(session.user);
  const organizationId = parseOrganizationId(session.user);
  const onOnboardingPage = isOnboardingPath(request);

  if (role === "admin" && organizationId) {
    const isOnboardingComplete = await readOrganizationOnboardingStatus({
      request,
      accessToken: session.accessToken,
      organizationId
    });
    if (isOnboardingComplete === false && !onOnboardingPage) {
      return NextResponse.redirect(buildRedirectUrl(request, "/onboarding"));
    }
    if (isOnboardingComplete === true && onOnboardingPage) {
      return NextResponse.redirect(buildRedirectUrl(request, "/admin"));
    }
    return NextResponse.next();
  }

  if (onOnboardingPage) {
    const fallbackPath = role === "manager" || role === "payroll_operator" ? "/admin" : "/employee";
    return NextResponse.redirect(buildRedirectUrl(request, fallbackPath));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/onboarding"]
};
