import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Skip the proxy on the Supabase auth callback so the code exchange runs unmodified.
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // 1. Run next-intl first — it produces the response (with locale rewrites/redirects).
  const intlResponse = intlMiddleware(request);

  // If next-intl issued a redirect, propagate it as-is.
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // 2. Refresh the Supabase session on the same response so cookies are kept in sync.
  return updateSupabaseSession(request, intlResponse);
}

export const config = {
  matcher: [
    // Everything except Next internals, static files, and the auth callback.
    "/((?!_next|api|.*\\..*|auth/callback).*)",
  ],
};
