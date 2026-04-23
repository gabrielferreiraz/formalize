import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const url = req.nextUrl;
    const token = req.nextauth?.token;

    // ── /super-admin → apenas SUPER_ADMIN ────────────────────────────────────
    if (url.pathname.startsWith("/super-admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.next();
    }

    // ── /admin → apenas ARTIST_ADMIN com artistId válido ─────────────────────
    if (url.pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role !== "ARTIST_ADMIN" || !token.artistId) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Injeta o artistId nos headers para que Server Components possam lê-lo
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-artist-id", token.artistId as string);

      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Deixa a função acima tratar a autorização completa
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*"],
};
