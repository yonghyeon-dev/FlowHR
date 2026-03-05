import { NextResponse, type NextRequest } from "next/server";

import { FLOWHR_ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookie";

const PUBLIC_EXACT_PATHS = new Set(["/login", "/signup", "/forgot-password", "/reset-password", "/favicon.ico"]);
const PUBLIC_PREFIX_PATHS = ["/api", "/_next"] as const;
const PROTECTED_PREFIX_PATHS = ["/employee", "/admin", "/ops", "/onboarding"] as const;
const ADMIN_ALLOWED_ROLES = new Set(["admin", "manager", "payroll_operator"]);

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

function startsWithPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIX_PATHS.some((prefix) => startsWithPath(pathname, prefix));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIX_PATHS.some((prefix) => startsWithPath(pathname, prefix));
}

function isAdminPath(pathname: string): boolean {
  return startsWithPath(pathname, "/admin");
}

function isEmployeePath(pathname: string): boolean {
  return startsWithPath(pathname, "/employee");
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const normalized = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payloadJson = atob(padded);
    const payload = JSON.parse(payloadJson) as unknown;
    if (!payload || typeof payload !== "object") {
      return null;
    }
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readRoleFromAccessToken(accessToken: string): string | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return null;
  }

  const appMetadata = payload.app_metadata;
  if (!appMetadata || typeof appMetadata !== "object") {
    return null;
  }

  const role = (appMetadata as Record<string, unknown>).role;
  if (typeof role !== "string") {
    return null;
  }

  const normalized = role.trim();
  return normalized.length > 0 ? normalized : null;
}

function buildLoginRedirectUrl(request: NextRequest): URL {
  const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", redirectTo);
  return loginUrl;
}

function buildEmployeeRedirectUrl(request: NextRequest): URL {
  return new URL("/employee", request.url);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = readAccessToken(request);
  if (!accessToken) {
    return NextResponse.redirect(buildLoginRedirectUrl(request));
  }

  const role = readRoleFromAccessToken(accessToken);
  if (isEmployeePath(pathname) && !role) {
    return NextResponse.redirect(buildLoginRedirectUrl(request));
  }

  if (isAdminPath(pathname) && (!role || !ADMIN_ALLOWED_ROLES.has(role))) {
    return NextResponse.redirect(buildEmployeeRedirectUrl(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};
