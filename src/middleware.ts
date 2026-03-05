import { NextResponse, type NextRequest } from "next/server";

import { FLOWHR_ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookie";

const PUBLIC_EXACT_PATHS = new Set(["/login", "/signup", "/forgot-password", "/reset-password", "/favicon.ico"]);
const PUBLIC_PREFIX_PATHS = ["/api", "/_next"] as const;
const PROTECTED_PREFIX_PATHS = ["/employee", "/admin", "/ops", "/onboarding"] as const;

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

function buildLoginRedirectUrl(request: NextRequest): URL {
  const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", redirectTo);
  return loginUrl;
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};
