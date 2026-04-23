import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

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

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
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
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = "unknown";
        const ipKey = `ip:${ip}`;
        const emailKey = `email:${credentials.email}`;

        if (!checkRateLimit(ipKey) || !checkRateLimit(emailKey)) {
          throw new Error("Muitas tentativas. Tente novamente em 15 minutos.");
        }

        // Busca o usuário pelo e-mail
        const user = await prisma.user.findFirst({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const passwordMatch = await compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        // Verifica se o artista vinculado está ativo (somente para ARTIST_ADMIN)
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
