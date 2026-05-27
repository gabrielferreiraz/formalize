import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Rate limiting — simple in-memory store (replace with Redis when scaling horizontally)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Purge expired entries every 30 minutes to prevent unbounded memory growth.
// In serverless environments each instance is short-lived so this rarely fires,
// but in long-running Node processes it prevents the map from growing forever.
setInterval(() => {
  const now = Date.now();
  loginAttempts.forEach((entry, key) => {
    if (entry.resetAt < now) loginAttempts.delete(key);
  });
}, 30 * 60 * 1000);

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

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },

  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const fwd = (req as any)?.headers?.["x-forwarded-for"];
        const ip = (typeof fwd === "string" ? fwd.split(",")[0]?.trim() : null) ?? "unknown";
        const ipKey = `ip:${ip}`;
        const emailKey = `email:${credentials.email}`;

        if (!checkRateLimit(ipKey) || !checkRateLimit(emailKey)) {
          logger.warn({ ip, action: "auth.login" }, "login rate limit exceeded");
          throw new Error("Muitas tentativas. Tente novamente em 15 minutos.");
        }

        const user = await prisma.user.findFirst({
          where: { email: credentials.email },
        });

        if (!user) {
          logger.info({ ip, action: "auth.login" }, "login failed — user not found");
          return null;
        }

        const passwordMatch = await compare(credentials.password, user.password);
        if (!passwordMatch) {
          logger.info({ ip, userId: user.id, action: "auth.login" }, "login failed — wrong password");
          return null;
        }

        if (!user.active) {
          logger.warn({ userId: user.id, action: "auth.login" }, "login rejected — account deactivated");
          throw new Error("Esta conta foi desativada.");
        }

        if (user.role === "ARTIST_ADMIN" && user.artistId) {
          const artist = await prisma.artist.findUnique({
            where: { id: user.artistId },
            select: { status: true },
          });
          if (artist?.status !== "ACTIVE") {
            logger.warn({ userId: user.id, artistId: user.artistId, artistStatus: artist?.status, action: "auth.login" }, "login rejected — artist suspended");
            throw new Error("Esta conta está suspensa ou cancelada.");
          }
        }

        logger.info({ userId: user.id, role: user.role, artistId: user.artistId, action: "auth.login" }, "login successful");

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          role: user.role,
          artistId: user.artistId ?? null,
          forcePasswordChange: user.forcePasswordChange,
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
      // Login via credentials — user já vem com role e artistId
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.role = user.role;
        token.artistId = user.artistId ?? null;
        token.forcePasswordChange = (user as any).forcePasswordChange ?? false;
        token.active = true;
        token.validatedAt = Date.now();
        return token;
      }

      // Login via Google — busca o usuário no banco pelo email
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.artistId = dbUser.artistId ?? null;
          token.active = true;
          token.validatedAt = Date.now();
        }
        return token;
      }

      // Renovação de token — re-valida conta no banco a cada 5 minutos.
      // jwt callback tem write access ao token; session callback não.
      const validatedAt = token.validatedAt ?? 0;
      if (token.id && Date.now() - validatedAt > 5 * 60 * 1000) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { active: true },
          });
          if (!dbUser || !dbUser.active) {
            token.active = false;
            token.artistId = null;
            token.validatedAt = Date.now();
            return token;
          }
          if (token.artistId) {
            const artist = await prisma.artist.findUnique({
              where: { id: token.artistId as string },
              select: { status: true },
            });
            if (artist?.status !== "ACTIVE") {
              token.active = false;
              token.artistId = null;
              token.validatedAt = Date.now();
              return token;
            }
          }
          token.active = true;
          token.validatedAt = Date.now();
        } catch {
          // On transient DB error, fail open — don't lock out users due to infrastructure issues
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.artistId = (token.artistId as string) ?? null;
        session.user.forcePasswordChange = (token.forcePasswordChange as boolean) ?? false;
        session.user.active = (token.active as boolean) ?? true;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// ── Augment next-auth types ──────────────────────────────────────────────────
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
      forcePasswordChange: boolean;
      active: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    artistId: string | null;
    forcePasswordChange: boolean;
    active: boolean;
    validatedAt?: number;
  }
}
