import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "formalize.com.br";

export default withAuth(
  function middleware(req) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") ?? "";
    const token = req.nextauth?.token;

    // Remove port for local development (e.g. localhost:3000 → localhost)
    const host = hostname.replace(`:${process.env.PORT ?? 3000}`, "");

    // ------------------------------------------------------------------
    // Resolve tenant from subdomain (e.g. givago.formalize.com.br)
    // ------------------------------------------------------------------
    const isRootDomain =
      host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`;

    const subdomain = isRootDomain
      ? null
      : host.endsWith(`.${ROOT_DOMAIN}`)
        ? host.replace(`.${ROOT_DOMAIN}`, "")
        : null;

    // ------------------------------------------------------------------
    // /super-admin → only SUPER_ADMIN, no tenant required
    // ------------------------------------------------------------------
    if (url.pathname.startsWith("/super-admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.next();
    }

    // ------------------------------------------------------------------
    // /admin → ARTIST_ADMIN with valid artistId
    // ------------------------------------------------------------------
    if (url.pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role !== "ARTIST_ADMIN" || !token.artistId) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Inject tenant headers so server components can access them
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-artist-id", token.artistId as string);
      if (subdomain) {
        requestHeaders.set("x-subdomain", subdomain);
      }

      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // withAuth calls this first — return true to let the middleware
      // function above handle the authorization logic itself.
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*"],
};
