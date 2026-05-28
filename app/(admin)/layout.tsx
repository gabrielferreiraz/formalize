import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "./admin/components/AdminHeader";
import { FormProvider } from "@/context/FormContext";
import { PwaInstallBanner } from "@/components/ui/PwaInstallBanner";
import { SessionWrapper } from "./SessionWrapper";
import { ForceRedirect } from "./ForceRedirect";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  logger.info(
    { hasSession: !!session, role: session?.user.role, userId: session?.user.id, artistId: session?.user.artistId, forcePasswordChange: session?.user.forcePasswordChange, active: session?.user.active, action: "admin.layout" },
    "[DEBUG] admin layout — session check"
  );

  if (!session || session.user.role !== "ARTIST_ADMIN") {
    logger.info({ hasSession: !!session, role: session?.user.role, action: "admin.layout" }, "[DEBUG] admin layout — redirecting to /login (no session or wrong role)");
    redirect("/login");
  }

  if (session.user.active === false) {
    logger.info({ userId: session.user.id, action: "admin.layout" }, "[DEBUG] admin layout — redirecting to /login?error=conta_suspensa (inactive)");
    redirect("/login?error=conta_suspensa");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const requestId = headersList.get("x-request-id") || undefined;

  logger.info({ pathname, requestId, userId: session.user.id, action: "admin.layout" }, "[DEBUG] admin layout — pathname from header");

  const artist = session.user.artistId
    ? await prisma.artist
        .findUnique({
          where: { id: session.user.artistId },
          select: {
            name: true,
            logoUrl: true,
            primaryColor: true,
            orcamentoFontScale: true,
            contratoFontScale: true,
            orcamentoLogoScale: true,
            contratoLogoScale: true,
            onboardingDone: true,
            categoria: true,
          },
        })
        .catch((err: unknown) => {
          logger.error(
            { err, requestId, artistId: session.user.artistId, action: "layout.fetchArtist" },
            "failed to fetch artist in admin layout"
          );
          return null;
        })
    : null;

  logger.info(
    { artistFound: !!artist, artistId: session.user.artistId, onboardingDone: artist?.onboardingDone, action: "admin.layout" },
    "[DEBUG] admin layout — artist fetch result"
  );

  // Force password change — naked shell, no chrome, SessionProvider needed for useSession()
  if (session.user.forcePasswordChange) {
    // Only redirect if we HAVE a pathname and we KNOW it's not the right page.
    // This prevents infinite loops if the header is missing or delayed.
    if (pathname && !pathname.startsWith("/admin/trocar-senha")) {
      logger.info({ userId: session.user.id, pathname, action: "admin.layout" }, "[DEBUG] admin layout — forcePasswordChange: ForceRedirect to /admin/trocar-senha");
      // ForceRedirect uses window.location.replace (hard navigation) to bypass Next.js router
      // soft-navigation redirect loop — redirect() from Server Component causes router to loop
      // on history.replaceState without ever mounting the target page.
      return <ForceRedirect to="/admin/trocar-senha" />;
    }
    logger.info({ userId: session.user.id, pathname, action: "admin.layout" }, "[DEBUG] admin layout — forcePasswordChange: rendering trocar-senha (or already on it)");
    return <SessionWrapper>{children}</SessionWrapper>;
  }

  // First-time onboarding — full-screen takeover, no chrome needed
  if (artist && !artist.onboardingDone) {
    if (pathname && !pathname.startsWith("/admin/onboarding")) {
      logger.info({ userId: session.user.id, artistId: session.user.artistId, pathname, onboardingDone: artist.onboardingDone, action: "admin.layout" }, "[DEBUG] admin layout — onboarding not done: ForceRedirect to /admin/onboarding");
      // ForceRedirect uses window.location.replace (hard navigation) to bypass Next.js router
      // soft-navigation redirect loop — redirect() from Server Component causes router to loop
      // on history.replaceState without ever mounting the target page.
      return <ForceRedirect to="/admin/onboarding" />;
    }
    logger.info({ userId: session.user.id, artistId: session.user.artistId, pathname, action: "admin.layout" }, "[DEBUG] admin layout — onboarding not done: rendering onboarding page");
    return <SessionWrapper>{children}</SessionWrapper>;
  }

  logger.info({ userId: session.user.id, artistId: session.user.artistId, onboardingDone: artist?.onboardingDone, pathname, action: "admin.layout" }, "[DEBUG] admin layout — normal render with full chrome");

  const initialArtist = artist
    ? {
        name: artist.name,
        orcamentoFontScale: artist.orcamentoFontScale,
        contratoFontScale: artist.contratoFontScale,
        orcamentoLogoScale: artist.orcamentoLogoScale,
        contratoLogoScale: artist.contratoLogoScale,
        categoria: artist.categoria ?? null,
      }
    : null;

  return (
    <SessionWrapper>
      <div className="min-h-screen bg-stage-900 text-gray-100 font-body" style={{ overflowX: "clip" }}>
        <AdminHeader
          artistName={artist?.name ?? session.user.name ?? "Artista"}
          logoUrl={artist?.logoUrl ?? null}
        />
        <FormProvider initialArtist={initialArtist}>
          <main
            className="mx-auto px-4 py-6 pb-28 md:pb-10 md:max-w-4xl animate-fade-in"
            style={{ width: "100%", boxSizing: "border-box", overflowX: "clip" }}
          >
            {children}
          </main>
        </FormProvider>
        <footer className="hidden md:flex items-center justify-center gap-4 text-xs text-gray-600 py-6">
          <span>{artist?.name ?? "Formalize"} &copy; {new Date().getFullYear()}</span>
          {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP && (
            <>
              <span className="text-gray-800">·</span>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Preciso de ajuda com o Formalize.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-400 transition-colors"
              >
                Suporte
              </a>
            </>
          )}
        </footer>
      </div>
      <PwaInstallBanner />
    </SessionWrapper>
  );
}
