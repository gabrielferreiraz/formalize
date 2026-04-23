import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "./admin/components/AdminHeader";
import { FormProvider } from "@/context/FormContext";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ARTIST_ADMIN") {
    redirect("/login");
  }

  const artist = session.user.artistId
    ? await prisma.artist.findUnique({
        where: { id: session.user.artistId },
        select: {
          name: true,
          logoUrl: true,
          primaryColor: true,
          orcamentoFontScale: true,
          contratoFontScale: true,
          orcamentoLogoScale: true,
          contratoLogoScale: true,
        },
      })
    : null;

  const initialArtist = artist
    ? {
        name: artist.name,
        orcamentoFontScale: artist.orcamentoFontScale,
        contratoFontScale: artist.contratoFontScale,
        orcamentoLogoScale: artist.orcamentoLogoScale,
        contratoLogoScale: artist.contratoLogoScale,
      }
    : null;

  return (
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
      <footer className="hidden md:block text-center text-xs text-gray-600 py-6">
        {artist?.name ?? "Formalize"} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
