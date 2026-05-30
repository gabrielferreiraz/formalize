import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import NavLink from "./super-admin/components/NavLink";
import SignOutButton from "./super-admin/components/SignOutButton";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="min-h-screen bg-stage-900 text-gray-100 font-body">
      <header className="bg-stage-800/80 backdrop-blur border-b border-stage-600 px-4 h-14 flex items-center sticky top-0 z-40">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Image
              src="/icon-512.png"
              alt="Formalize"
              width={32}
              height={32}
              style={{ width: 32, height: 32, borderRadius: 8 }}
            />
            <nav className="flex items-center gap-1">
              <NavLink href="/super-admin">Dashboard</NavLink>
              <NavLink href="/super-admin/artistas">Artistas</NavLink>
              <NavLink href="/super-admin/solicitacoes">Solicitações</NavLink>
              <NavLink href="/super-admin/pdf-templates">Templates PDF</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">
              {session.user.name ?? "Admin"}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
