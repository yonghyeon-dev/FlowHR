import { NextResponse, type NextRequest } from "next/server";

import { FLOWHR_ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookie";

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

async function hasValidSupabaseSession(request: NextRequest): Promise<boolean> {
  const accessToken = readAccessToken(request);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const userEndpoint = getSupabaseUserEndpoint();

  if (!accessToken || !anonKey || !userEndpoint) {
    return false;
  }

  try {
    const response = await fetch(userEndpoint, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    });
    return response.ok;
  } catch {
    return false;
  }
}

function buildLoginRedirectUrl(request: NextRequest): URL {
  const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", redirectTo);
  return loginUrl;
}

export async function middleware(request: NextRequest) {
  const hasSession = await hasValidSupabaseSession(request);
  if (hasSession) {
    return NextResponse.next();
  }

  return NextResponse.redirect(buildLoginRedirectUrl(request));
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*"]
};
