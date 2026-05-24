import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const url = req.nextUrl;
    const token = req.nextauth?.token;

    // Every request gets a unique trace ID for log correlation
    const requestId = crypto.randomUUID();

    // ── /super-admin → apenas SUPER_ADMIN ────────────────────────────────────
    if (url.pathname.startsWith("/super-admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      const res = NextResponse.next();
      res.headers.set("x-request-id", requestId);
      return res;
    }

    // ── /admin → apenas ARTIST_ADMIN com artistId válido ─────────────────────
    if (url.pathname.startsWith("/admin")) {
      if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", url.pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (token.role !== "ARTIST_ADMIN" || !token.artistId || token.artistId === "") {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Injeta headers para Server Components e rastreio de logs
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-artist-id", token.artistId as string);
      requestHeaders.set("x-pathname", url.pathname);
      requestHeaders.set("x-request-id", requestId);

      const res = NextResponse.next({ request: { headers: requestHeaders } });
      res.headers.set("x-request-id", requestId);
      return res;
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Deixa a função acima tratar a autorização completa
      authorized: () => true,
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: ["/admin", "/admin/:path*", "/super-admin", "/super-admin/:path*"],
};
