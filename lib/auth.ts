import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "formalize.com.br";

// Rate limiting — simple in-memory store (replace with Redis in production)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 10) return false;

  entry.count += 1;
  return true;
}

/** Resolve the Artist from the request host header. */
async function resolveArtistFromHost(host: string) {
  const cleanHost = host.replace(`:${process.env.PORT ?? 3000}`, "");

  const isRootDomain =
    cleanHost === ROOT_DOMAIN || cleanHost === `www.${ROOT_DOMAIN}`;

  if (isRootDomain) return null;

  // Custom domain (e.g. meudocumento.com.br)
  if (!cleanHost.endsWith(`.${ROOT_DOMAIN}`)) {
    return prisma.artist.findUnique({
      where: { customDomain: cleanHost },
      select: { id: true, status: true },
    });
  }

  // Subdomain (e.g. givago.formalize.com.br)
  const subdomain = cleanHost.replace(`.${ROOT_DOMAIN}`, "");
  return prisma.artist.findUnique({
    where: { subdomain },
    select: { id: true, status: true },
  });
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        host: { label: "Host", type: "text" }, // injected by login form
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = "unknown"; // In production, extract from request headers
        const ipKey = `ip:${ip}`;
        const emailKey = `email:${credentials.email}`;

        if (!checkRateLimit(ipKey) || !checkRateLimit(emailKey)) {
          throw new Error("Muitas tentativas. Tente novamente em 15 minutos.");
        }

        const host = credentials.host ?? "";

        // ------------------------------------------------------------------
        // Detect SUPER_ADMIN login (from root domain or /super-admin path)
        // ------------------------------------------------------------------
        const cleanHost = host.replace(`:${process.env.PORT ?? 3000}`, "");
        const isLocalhost = cleanHost === "localhost";
        const isProdRoot = cleanHost === ROOT_DOMAIN || cleanHost === `www.${ROOT_DOMAIN}`;
        const isRootLike = isLocalhost || isProdRoot;

        if (isRootLike) {
          // Produção: só SUPER_ADMIN pode entrar pelo domínio raiz.
          // Localhost: qualquer role é permitido (dev/teste).
          const user = await prisma.user.findFirst({
            where: isProdRoot
              ? { email: credentials.email, role: "SUPER_ADMIN" }
              : { email: credentials.email },
          });

          if (!user) return null;

          const passwordMatch = await compare(credentials.password, user.password);
          if (!passwordMatch) return null;

          // ARTIST_ADMIN no localhost: verifica se o artista está ativo
          if (user.role === "ARTIST_ADMIN" && user.artistId) {
            const artist = await prisma.artist.findUnique({
              where: { id: user.artistId },
              select: { status: true },
            });
            if (artist?.status !== "ACTIVE") {
              throw new Error("Esta conta está suspensa ou cancelada.");
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? "",
            role: user.role,
            artistId: user.artistId ?? null,
          };
        }

        // ------------------------------------------------------------------
        // ARTIST_ADMIN login (from subdomain or custom domain)
        // ------------------------------------------------------------------
        const artist = await resolveArtistFromHost(host);

        if (!artist) return null;
        if (artist.status !== "ACTIVE") {
          throw new Error("Esta conta está suspensa ou cancelada.");
        }

        const user = await prisma.user.findFirst({
          where: { email: credentials.email, artistId: artist.id },
        });

        if (!user) return null;

        const passwordMatch = await compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          role: user.role,
          artistId: user.artistId ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) return false;

        const dbUser = await prisma.user.findFirst({
          where: { email },
          include: { artist: { select: { status: true } } },
        });

        if (!dbUser) return "/login?error=not_registered";
        if (dbUser.artist && dbUser.artist.status !== "ACTIVE") return "/login?error=suspended";

        return true;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // Credentials sign-in — user já vem com role e artistId
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.role = user.role;
        token.artistId = user.artistId ?? null;
        return token;
      }

      // Google sign-in — busca o usuário no banco pelo email
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.artistId = dbUser.artistId ?? null;
        }
        return token;
      }

      // Renovação de token — mantém os campos já existentes
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.artistId = (token.artistId as string) ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

// ------------------------------------------------------------------
// Augment next-auth types
// ------------------------------------------------------------------
declare module "next-auth" {
  interface User {
    role: string;
    artistId: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      artistId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    artistId: string | null;
  }
}
