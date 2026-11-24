import { NextResponse, type NextRequest } from "next/server";

const COOKIE = process.env.NODE_ENV === "production" ? "__Host-inda_admin" : "inda_admin";

/**
 * Cheap gate in front of the admin: no session cookie, no admin pages.
 * The real session + 2FA check happens on the server in every admin page and action.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!req.cookies.get(COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
