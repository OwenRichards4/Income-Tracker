import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes usable while signed out. Everything else requires a session, since
// every page in this app reads/writes the signed-in user's own data — there
// is nothing for a signed-out visitor to do on them anyway.
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Refreshes the Supabase session cookie on every request, and — this being
// an optimistic, cookie-only check — redirects signed-out visitors to
// /login before they hit a page that would just fail to load their data.
// Real authorization still happens per-request in the Server Actions/DAL,
// not here; see the Next.js auth guide's "Optimistic checks with Proxy".
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
